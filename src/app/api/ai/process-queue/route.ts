import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { triggerNewMessage, triggerTyping, triggerMessageRead } from "@/lib/pusher";
import {
  generateAiResponse,
  parsePersonality,
  ConversationContext,
  makeMediaDecision,
  CreatorAiMediaSettings,
  MediaDecision,
} from "@/lib/ai-girlfriend";
import {
  checkForToneSwitch,
  checkForLanguageSwitch,
  switchPersonality,
  selectPersonalityForConversation,
} from "@/lib/ai-personality-selector";
import { detectLanguageFromMessages } from "@/lib/language-detection";
import { shouldHandoff, createHandoff } from "@/lib/handoff-manager";
import { detectObjection, handleObjection } from "@/lib/objection-handler";
import { getLeadScore } from "@/lib/lead-scoring";
import { formatMemoriesForPrompt, extractMemories } from "@/lib/memory-extractor";
import { updatePersonalNote, extractFactsFromMessage } from "@/lib/ai/memory";
import { isAiOnlyFan, updateFanQualification } from "@/lib/fan-qualifier";
import { selectModel, type LLMContext } from "@/lib/llm-router";
import { hasAiChatCredits, chargeAiChatCredit } from "@/lib/credits";
import { type AiProvider } from "@/lib/ai-providers";
import {
  matchScript,
  buildMatchedScriptPrompt,
  getTopScriptsForIntent,
  buildScriptReferencePrompt,
} from "@/lib/scripts/script-matcher";

// This endpoint should be called by a cron job every 30 seconds
// or can be triggered manually for testing

export async function GET(request: NextRequest) {
  try {
    // Optional: Add a secret key check for cron jobs
    const cronSecret = request.headers.get("x-cron-secret");
    const expectedSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is set, verify it
    if (expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Find pending responses that are ready to be sent
    const pendingResponses = await prisma.aiResponseQueue.findMany({
      where: {
        status: "PENDING",
        scheduledAt: { lte: now },
      },
      take: 10, // Process max 10 at a time
      orderBy: { scheduledAt: "asc" },
    });

    if (pendingResponses.length === 0) {
      return NextResponse.json({ processed: 0, message: "No pending responses" });
    }

    const results: { id: string; status: string; error?: string }[] = [];

    for (const queueItem of pendingResponses) {
      try {
        // Mark as processing
        await prisma.aiResponseQueue.update({
          where: { id: queueItem.id },
          data: { status: "PROCESSING", attempts: { increment: 1 } },
        });

        // Get the original message
        const originalMessage = await prisma.message.findUnique({
          where: { id: queueItem.messageId },
          include: {
            sender: { select: { id: true, name: true } },
          },
        });

        if (!originalMessage) {
          throw new Error("Original message not found");
        }

        const fanUserId = originalMessage.senderId;

        // ===== CHECK HANDOFF THRESHOLD =====
        // Before generating AI response, check if fan should be handed off to human
        const handoffResult = await shouldHandoff(
          queueItem.conversationId,
          originalMessage.text || ""
        );

        if (handoffResult.shouldHandoff) {
          console.log(`[AI] Handoff triggered for ${queueItem.conversationId}: ${handoffResult.trigger}`);

          // Create handoff to human chatter
          await createHandoff(
            queueItem.conversationId,
            handoffResult.trigger || "spending_threshold",
            handoffResult.triggerValue
          );

          // Mark queue as skipped (handoff)
          await prisma.aiResponseQueue.update({
            where: { id: queueItem.id },
            data: {
              status: "FAILED",
              error: `Handoff triggered: ${handoffResult.trigger}`,
              processedAt: new Date(),
            },
          });

          results.push({ id: queueItem.id, status: "HANDOFF", error: handoffResult.trigger });
          continue;
        }

        // ===== CHECK GIVE-UP ON NON-PAYING FANS =====
        // Get the AI personality settings to check give-up configuration
        const personalityForGiveUp = await prisma.creatorAiPersonality.findFirst({
          where: { creatorSlug: queueItem.creatorSlug, isActive: true },
          orderBy: { trafficShare: "desc" },
          select: {
            giveUpOnNonPaying: true,
            giveUpMessageThreshold: true,
            giveUpAction: true,
          },
        });

        if (personalityForGiveUp?.giveUpOnNonPaying) {
          // Check fan profile for spending and message count
          const fanProfileForGiveUp = await prisma.fanProfile.findUnique({
            where: {
              fanUserId_creatorSlug: { fanUserId, creatorSlug: queueItem.creatorSlug },
            },
            select: { totalSpent: true, totalMessages: true },
          });

          const totalSpent = fanProfileForGiveUp?.totalSpent || 0;
          const totalMessages = fanProfileForGiveUp?.totalMessages || 0;
          const threshold = personalityForGiveUp.giveUpMessageThreshold || 20;
          const action = personalityForGiveUp.giveUpAction || "stop";

          if (totalSpent === 0 && totalMessages >= threshold) {
            console.log(`[AI] Give-up triggered for ${queueItem.conversationId}: ${totalMessages} messages, €0 spent (threshold: ${threshold})`);

            if (action === "stop") {
              // Stop responding entirely
              await prisma.aiResponseQueue.update({
                where: { id: queueItem.id },
                data: {
                  status: "FAILED",
                  error: `Give-up: Non-paying fan (${totalMessages} msgs, €0 spent)`,
                  processedAt: new Date(),
                },
              });

              results.push({ id: queueItem.id, status: "GIVE_UP", error: "Non-paying fan" });
              continue;
            } else if (action === "minimal") {
              // For "minimal" mode, we'll only respond to 1 in 5 messages (20% chance)
              const shouldRespond = Math.random() < 0.2;
              if (!shouldRespond) {
                console.log(`[AI] Minimal mode - skipping response for non-paying fan`);
                await prisma.aiResponseQueue.update({
                  where: { id: queueItem.id },
                  data: {
                    status: "FAILED",
                    error: `Give-up (minimal): Skipped response`,
                    processedAt: new Date(),
                  },
                });

                results.push({ id: queueItem.id, status: "GIVE_UP_MINIMAL", error: "Skipped (minimal mode)" });
                continue;
              }
              console.log(`[AI] Minimal mode - responding to non-paying fan (lucky roll)`);
            }
          }
        }

        // ===== CHECK IF CREATOR USES CUSTOM API KEY =====
        // First, get creator's API key settings to determine if we need to check credits
        const creatorKeySettings = await prisma.creator.findUnique({
          where: { slug: queueItem.creatorSlug },
          select: { aiUseCustomKey: true, aiApiKey: true },
        });
        const usingCustomKey = creatorKeySettings?.aiUseCustomKey && creatorKeySettings?.aiApiKey;

        // ===== CHECK AI CREDITS (1 credit per response) - SKIP IF USING CUSTOM KEY =====
        if (!usingCustomKey) {
          const creditCheck = await hasAiChatCredits(queueItem.creatorSlug);
          if (!creditCheck.hasCredits) {
            console.log(`[AI] No credits for ${queueItem.creatorSlug} (balance: ${creditCheck.balance}) - skipping AI response`);

            await prisma.aiResponseQueue.update({
              where: { id: queueItem.id },
              data: {
                status: "FAILED",
                error: "Insufficient AI credits",
                processedAt: new Date(),
              },
            });

            results.push({ id: queueItem.id, status: "NO_CREDITS", error: "Insufficient AI credits" });
            continue;
          }
        } else {
          console.log(`[AI] Creator ${queueItem.creatorSlug} using custom API key - no credits needed`);
        }

        // ===== GET LEAD SCORE FOR LLM SELECTION =====
        const leadScore = await getLeadScore(fanUserId, queueItem.creatorSlug);
        const fanProfile = await prisma.fanProfile.findUnique({
          where: {
            fanUserId_creatorSlug: { fanUserId, creatorSlug: queueItem.creatorSlug },
          },
        });

        // ===== CHECK IF FAN IS AI-ONLY (time waster) =====
        if (fanProfile?.aiOnlyMode) {
          console.log(`[AI] Fan ${fanUserId} is AI-only mode - using shorter responses`);
        }

        // Get conversation with AI personality assignment (including media settings)
        let conversation = await prisma.conversation.findUnique({
          where: { id: queueItem.conversationId },
          select: {
            id: true,
            aiPersonalityId: true,
            autoToneSwitch: true,
            aiMode: true,
            assignedChatterId: true,
            aiPersonality: {
              select: {
                id: true,
                name: true,
                personality: true,
                primaryLanguage: true, // Language for AI and scripts
                // Media settings from personality
                aiMediaEnabled: true,
                aiMediaFrequency: true,
                aiPPVRatio: true,
                aiTeasingEnabled: true,
              },
            },
          },
        });

        if (!conversation) {
          throw new Error("Conversation not found");
        }

        // Check if AI is disabled for this conversation
        if (conversation.aiMode === "disabled") {
          console.log(`[AI] AI disabled for conversation ${queueItem.conversationId}`);
          await prisma.aiResponseQueue.update({
            where: { id: queueItem.id },
            data: {
              status: "FAILED",
              error: "AI disabled for this conversation",
              processedAt: new Date(),
            },
          });
          results.push({ id: queueItem.id, status: "SKIPPED", error: "AI disabled" });
          continue;
        }

        // Check if AI personality is assigned, auto-assign if not
        if (!conversation.aiPersonalityId) {
          console.log(`[AI] No personality assigned to conversation ${queueItem.conversationId} - attempting auto-assignment`);

          // Try to auto-assign a personality
          const autoPersonalityId = await selectPersonalityForConversation(queueItem.creatorSlug);

          if (autoPersonalityId) {
            // Assign the personality to the conversation
            await prisma.conversation.update({
              where: { id: queueItem.conversationId },
              data: { aiPersonalityId: autoPersonalityId },
            });

            console.log(`[AI] Auto-assigned personality ${autoPersonalityId} to conversation ${queueItem.conversationId}`);

            // Refresh conversation data with the new personality
            const updatedConversation = await prisma.conversation.findUnique({
              where: { id: queueItem.conversationId },
              select: {
                id: true,
                aiPersonalityId: true,
                autoToneSwitch: true,
                aiMode: true,
                assignedChatterId: true,
                aiPersonality: {
                  select: {
                    id: true,
                    name: true,
                    personality: true,
                    primaryLanguage: true,
                    aiMediaEnabled: true,
                    aiMediaFrequency: true,
                    aiPPVRatio: true,
                    aiTeasingEnabled: true,
                  },
                },
              },
            });

            if (updatedConversation) {
              conversation = updatedConversation;
            }
          } else {
            // No personality available for this creator
            console.log(`[AI] No active personality found for creator ${queueItem.creatorSlug} - AI disabled`);
            await prisma.aiResponseQueue.update({
              where: { id: queueItem.id },
              data: {
                status: "FAILED",
                error: "AI disabled - no personality available for creator",
                processedAt: new Date(),
              },
            });
            results.push({ id: queueItem.id, status: "SKIPPED", error: "No personality available" });
            continue;
          }
        }

        // Check if mode is "assisted" - create suggestion instead of sending directly
        const isAssistedMode = conversation.aiMode === "assisted";

        // Get conversation context (last 20 messages for better coherence)
        const conversationMessages = await prisma.message.findMany({
          where: {
            conversationId: queueItem.conversationId,
            isDeleted: false,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            sender: { select: { id: true, isCreator: true } },
          },
        });

        // Check for auto tone switch
        if (conversation.autoToneSwitch) {
          const messagesForTone = conversationMessages.map((m) => ({
            text: m.text,
            senderId: m.senderId,
          }));
          const newPersonalityId = await checkForToneSwitch(
            queueItem.conversationId,
            messagesForTone,
            originalMessage.senderId
          );

          if (newPersonalityId && newPersonalityId !== conversation.aiPersonalityId) {
            console.log(`[AI] Auto-switching personality from ${conversation.aiPersonalityId} to ${newPersonalityId}`);
            await switchPersonality(
              queueItem.conversationId,
              newPersonalityId,
              "auto_tone",
              { detectedTone: conversation.aiPersonality?.name }
            );
            // Refresh conversation personality (including media settings)
            const updatedConv = await prisma.conversation.findUnique({
              where: { id: queueItem.conversationId },
              select: {
                aiPersonality: {
                  select: {
                    id: true,
                    name: true,
                    personality: true,
                    primaryLanguage: true,
                    aiMediaEnabled: true,
                    aiMediaFrequency: true,
                    aiPPVRatio: true,
                    aiTeasingEnabled: true,
                  },
                },
              },
            });
            if (updatedConv?.aiPersonality) {
              conversation.aiPersonality = updatedConv.aiPersonality;
            }
          }
        }

        // Check for auto language switch (language-based persona routing)
        const messagesForLanguage = conversationMessages.map((m) => ({
          text: m.text,
          senderId: m.senderId,
        }));
        const languagePersonalityId = await checkForLanguageSwitch(
          queueItem.conversationId,
          messagesForLanguage,
          originalMessage.senderId
        );

        if (languagePersonalityId && languagePersonalityId !== conversation.aiPersonalityId) {
          // Detect language for logging
          const fanMessagesText = conversationMessages
            .filter((m) => m.senderId === originalMessage.senderId && m.text)
            .slice(-5)
            .map((m) => m.text!);
          const detectedLang = detectLanguageFromMessages(fanMessagesText);

          console.log(`[AI] Auto-switching personality for language: ${detectedLang} (${conversation.aiPersonalityId} -> ${languagePersonalityId})`);
          await switchPersonality(
            queueItem.conversationId,
            languagePersonalityId,
            "auto_language",
            { detectedLanguage: detectedLang || undefined }
          );
          // Refresh conversation personality
          const updatedConv = await prisma.conversation.findUnique({
            where: { id: queueItem.conversationId },
            select: {
              aiPersonality: {
                select: {
                  id: true,
                  name: true,
                  personality: true,
                  primaryLanguage: true,
                  aiMediaEnabled: true,
                  aiMediaFrequency: true,
                  aiPPVRatio: true,
                  aiTeasingEnabled: true,
                },
              },
            },
          });
          if (updatedConv?.aiPersonality) {
            conversation.aiPersonality = updatedConv.aiPersonality;
          }
        }

        // Get creator info including AI provider settings
        const creator = await prisma.creator.findUnique({
          where: { slug: queueItem.creatorSlug },
          select: {
            userId: true,
            displayName: true,
            // AI Provider Settings
            aiProvider: true,
            aiModel: true,
            aiApiKey: true,
            aiUseCustomKey: true,
          },
        });

        if (!creator || !creator.userId) {
          throw new Error("Creator not found or has no user account");
        }

        // Parse personality from CreatorAiPersonality (with primaryLanguage from DB)
        const personality = parsePersonality(
          conversation.aiPersonality?.personality || null,
          conversation.aiPersonality?.primaryLanguage
        );
        console.log(`[AI] Using personality: ${conversation.aiPersonality?.name || "default"} (lang: ${personality.language})`);

        // Deep character data (placeholder for future use)
        const deepCharacter = undefined;

        // Build AI media settings from personality (with fallback defaults)
        const aiPersonality = conversation.aiPersonality;
        const mediaSettings: CreatorAiMediaSettings = {
          aiMediaEnabled: aiPersonality?.aiMediaEnabled ?? true,
          aiMediaFrequency: aiPersonality?.aiMediaFrequency ?? 4,
          aiPPVRatio: aiPersonality?.aiPPVRatio ?? 30,
          aiTeasingEnabled: aiPersonality?.aiTeasingEnabled ?? true,
        };
        console.log(`[AI] Media settings for ${conversation.aiPersonality?.name}:`, mediaSettings);

        // Build conversation context for AI
        const context: ConversationContext = {
          messages: conversationMessages
            .reverse()
            .map((msg) => ({
              role: msg.sender.isCreator ? "assistant" : "user",
              content: msg.text || "[media]",
            })) as ConversationContext["messages"],
          userName: originalMessage.sender.name || undefined,
        };

        // Make intelligent media decision
        const mediaDecision: MediaDecision = await makeMediaDecision(
          queueItem.creatorSlug,
          creator.userId,
          queueItem.conversationId,
          originalMessage.text || "",
          mediaSettings,
          personality
        );

        console.log(`[AI] Media decision for ${queueItem.messageId}:`, {
          shouldSend: mediaDecision.shouldSend,
          type: mediaDecision.type,
          mediaId: mediaDecision.media?.id,
        });

        // Build media context for AI response generation
        let suggestedMediaForAI = null;
        if (mediaDecision.shouldSend && mediaDecision.media && mediaDecision.type !== "TEASE") {
          // For FREE and PPV, pass media info to AI
          suggestedMediaForAI = {
            id: mediaDecision.media.id,
            title: mediaDecision.media.title,
            type: mediaDecision.media.type,
            price: mediaDecision.media.ppvPriceCredits ? mediaDecision.media.ppvPriceCredits / 100 : null,
            thumbnailUrl: mediaDecision.media.thumbnailUrl,
            tagPPV: mediaDecision.media.tagPPV,
            ppvPriceCredits: mediaDecision.media.ppvPriceCredits,
          };
        }

        // ===== OBJECTION DETECTION =====
        // Check if fan is expressing objection (too expensive, maybe later, etc.)
        const objectionResult = detectObjection(originalMessage.text || "", personality.language);

        let responseText: string | null = "";
        let priceDiscountApplied = false;
        let discountedPpvPrice: number | null = null;

        if (objectionResult && objectionResult.strategy === "discount_offer") {
          console.log(`[AI] Price objection detected: ${objectionResult.patternName}`);

          // Apply 20% discount directly to the PPV price
          if (mediaDecision.type === "PPV" && mediaDecision.media?.ppvPriceCredits) {
            const originalPrice = mediaDecision.media.ppvPriceCredits;
            const discountPercent = 20;
            discountedPpvPrice = Math.floor(originalPrice * (1 - discountPercent / 100));
            priceDiscountApplied = true;

            console.log(`[AI] Applying ${discountPercent}% discount: ${originalPrice} -> ${discountedPpvPrice} credits`);

            // Update the media info for AI context
            if (suggestedMediaForAI) {
              suggestedMediaForAI.ppvPriceCredits = discountedPpvPrice;
              suggestedMediaForAI.price = discountedPpvPrice / 100;
            }
          }

          // Generate response with discount context
          const discountResponses: Record<string, string[]> = {
            fr: [
              "Bon ok... juste parce que c'est toi 💋",
              "Allez, comme tu me plais je te fais un prix 😘",
              "Ok spécialement pour toi mon cœur 💕",
              "Mmh d'accord, mais c'est bien parce que t'es mignon 😏",
            ],
            en: [
              "Okay fine... just because it's you 💋",
              "Alright, since I like you I'll give you a deal 😘",
              "Ok specially for you babe 💕",
              "Mmh alright, but only because you're cute 😏",
            ],
          };

          const lang = personality.language || "en";
          const responses = discountResponses[lang as keyof typeof discountResponses] || discountResponses["en"];
          responseText = responses[Math.floor(Math.random() * responses.length)];

          // Record objection handling
          await prisma.objectionHandling.create({
            data: {
              conversationId: queueItem.conversationId,
              messageId: queueItem.messageId,
              patternId: objectionResult.patternId,
              strategy: objectionResult.strategy,
              // No discount code - direct price reduction
            },
          });

        } else if (objectionResult) {
          // Other objection types (not price) - use original handling
          console.log(`[AI] Non-price objection: ${objectionResult.patternName} (${objectionResult.strategy})`);

          const objectionResponse = await handleObjection(
            queueItem.conversationId,
            queueItem.messageId,
            originalMessage.text || "",
            {
              creatorSlug: queueItem.creatorSlug,
              fanUserId,
              language: personality.language,
            }
          );

          if (objectionResponse) {
            responseText = objectionResponse.text;
          }
        }

        if (!responseText) {
          if (mediaDecision.type === "TEASE" && mediaDecision.teaseText) {
            // For teasing, generate a response that incorporates the tease
            responseText = mediaDecision.teaseText;
          } else {
            // ===== GET FAN MEMORIES FOR PERSONALIZATION =====
          const memoriesPrompt = await formatMemoriesForPrompt(fanUserId, queueItem.creatorSlug);
          if (memoriesPrompt) {
            console.log(`[AI] Injecting fan memories: ${memoriesPrompt.substring(0, 100)}...`);
          }

          // ===== SCRIPT MATCHING =====
          // Try to find a matching script for this conversation context
          let scriptPrompt = "";
          try {
            // Get creator's agency ID for script matching
            const creatorForAgency = await prisma.creator.findUnique({
              where: { slug: queueItem.creatorSlug },
              select: { agencyId: true },
            });

            if (creatorForAgency?.agencyId) {
              // Determine fan stage from profile
              const fanStage = fanProfile?.spendingTier === "whale" ? "vip"
                : fanProfile?.totalMessages && fanProfile.totalMessages > 10 ? "engaged"
                : "new";

              // Try to match a script (use detected fan language, fallback to persona language)
              const detectedFanLang = detectLanguageFromMessages([originalMessage.text || ""]);
              const scriptLanguage = detectedFanLang || personality.language || "fr";

              const matchedScript = await matchScript({
                message: originalMessage.text || "",
                creatorSlug: queueItem.creatorSlug,
                agencyId: creatorForAgency.agencyId,
                fanName: originalMessage.sender.name || undefined,
                fanStage: fanStage as "new" | "engaged" | "vip" | "cooling_off",
                creatorName: creator.displayName || undefined,
                language: scriptLanguage,
                conversationHistory: context.messages,
              });

              if (matchedScript) {
                console.log(`[AI] Script matched: "${matchedScript.script.name}" (${matchedScript.confidence.toFixed(2)} confidence, strategy: ${matchedScript.strategy})`);

                // Build prompt based on strategy
                // Note: Scripts are always in English, so we need AI for translation unless target is English
                const needsTranslation = personality.language !== "en";

                if (matchedScript.strategy === "SCRIPT_ONLY" && matchedScript.confidence >= 0.85 && !needsTranslation) {
                  // Very high confidence AND target is English - use script verbatim
                  responseText = matchedScript.parsedContent;
                  console.log(`[AI] Using script verbatim (English): "${responseText.substring(0, 50)}..."`);
                } else {
                  // Need AI to translate/adapt script to target language
                  scriptPrompt = buildMatchedScriptPrompt(matchedScript, personality.language);
                  console.log(`[AI] Adding script reference to prompt (lang: ${personality.language}, translate: ${needsTranslation})`);
                }
              }
              // Note: If matchedScript is null, no script reference is added
            }
          } catch (scriptError) {
            console.error(`[AI] Script matching error (non-fatal):`, scriptError);
            // Continue without script - this is a non-fatal error
          }

          // If we already have responseText from SCRIPT_ONLY strategy, skip AI generation
          if (!responseText) {
            // ===== SELECT LLM MODEL BASED ON CONTEXT =====
            const llmContext: LLMContext = {
              conversationType: objectionResult ? "closing" : "normal",
              fanSpendingTier: "regular",
              leadScore: leadScore?.overall,
              isObjectionHandling: !!objectionResult,
            };
            const selectedModel = selectModel(llmContext);
            console.log(`[AI] Selected model: ${selectedModel} for fan ${fanUserId || "unknown"}`);

            // Generate AI response with memories and script context
            responseText = await generateAiResponse(
              context,
              personality,
              suggestedMediaForAI,
              {
                fanMemories: memoriesPrompt || undefined,
                isAiOnlyFan: fanProfile?.aiOnlyMode || false,
                scriptReference: scriptPrompt || undefined,
                // Multi-provider AI settings
                provider: (creator.aiProvider as AiProvider) || "openrouter",
                model: creator.aiModel || "mistralai/mistral-small-creative",
                apiKey: creator.aiUseCustomKey ? creator.aiApiKey : null,
                // Deep character data
                deepCharacter,
              }
            );
          }
          }
        }

        // ===== SKIP IF NO RESPONSE GENERATED (no fallback) =====
        if (!responseText) {
          console.log(`[AI] No response generated for message ${queueItem.messageId}, skipping (no fallback)`);
          await prisma.aiResponseQueue.update({
            where: { id: queueItem.id },
            data: { status: "SKIPPED", processedAt: new Date() },
          });
          results.push({ id: queueItem.id, status: "SKIPPED_NO_RESPONSE" });
          continue;
        }

        // ===== EXTRACT MEMORIES FROM FAN MESSAGE (async, non-blocking) =====
        // Schedule memory extraction in background
        extractMemories(
          queueItem.conversationId,
          fanUserId,
          queueItem.creatorSlug,
          { sourceMessageId: queueItem.messageId, useLLM: false } // Quick extraction only
        ).catch((err) => console.error("[AI] Memory extraction error:", err));

        // ===== UPDATE PERSONAL NOTE FROM FAN MESSAGE (async, non-blocking) =====
        // Extract facts like name, age, job, location and save to personal note
        const extractedFacts = extractFactsFromMessage(originalMessage.text || "");
        if (extractedFacts.length > 0) {
          console.log(`[AI] Extracted ${extractedFacts.length} facts from fan message:`, extractedFacts);
          updatePersonalNote(fanUserId, queueItem.creatorSlug, extractedFacts, "ai")
            .catch((err) => console.error("[AI] Personal note update error:", err));
        }

        // ===== UPDATE FAN QUALIFICATION (async, non-blocking) =====
        updateFanQualification(fanUserId, queueItem.creatorSlug).catch((err) =>
          console.error("[AI] Qualification update error:", err)
        );

        // Determine if this message should be PPV and the price
        const shouldBePPV = mediaDecision.type === "PPV" && mediaDecision.media !== null;
        // ppvPrice is stored in credits - use discounted price if objection handling applied one
        const ppvPrice = shouldBePPV && mediaDecision.media?.ppvPriceCredits
          ? (priceDiscountApplied && discountedPpvPrice ? discountedPpvPrice : mediaDecision.media.ppvPriceCredits)
          : null;

        // ===== ASSISTED MODE: Create suggestion instead of sending =====
        if (isAssistedMode) {
          // Create an AI suggestion that waits for chatter approval
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes

          await prisma.aiSuggestion.create({
            data: {
              conversationId: queueItem.conversationId,
              content: responseText,
              mediaDecision: mediaDecision.type,
              mediaId: mediaDecision.media?.id || null,
              personalityId: conversation.aiPersonalityId!,
              status: "pending",
              expiresAt,
            },
          });

          // Mark queue as completed (suggestion created)
          await prisma.aiResponseQueue.update({
            where: { id: queueItem.id },
            data: {
              status: "COMPLETED",
              response: responseText,
              mediaId: mediaDecision.media?.id || null,
              shouldSendMedia: mediaDecision.shouldSend,
              mediaDecision: mediaDecision.type,
              teaseText: mediaDecision.teaseText,
              processedAt: new Date(),
            },
          });

          results.push({ id: queueItem.id, status: "SUGGESTION_CREATED" });
          console.log(`[AI] Created suggestion for message ${queueItem.messageId} (assisted mode)`);
          continue;
        }

        // ===== AUTO MODE: Send message directly =====

        // ===== SIMULATE REALISTIC HUMAN BEHAVIOR =====
        // 1. Simulate reading the message (1-3 seconds)
        const readDelay = 1000 + Math.random() * 2000;
        await new Promise(resolve => setTimeout(resolve, readDelay));

        // 2. Mark fan's message as "read" (double blue check)
        await triggerMessageRead(queueItem.conversationId, creator.userId);
        // Also mark in DB
        await prisma.message.updateMany({
          where: {
            conversationId: queueItem.conversationId,
            receiverId: creator.userId,
            isRead: false,
          },
          data: { isRead: true, readAt: new Date() },
        });

        // 3. Simulate thinking before typing (1-3 seconds)
        const thinkDelay = 1000 + Math.random() * 2000;
        await new Promise(resolve => setTimeout(resolve, thinkDelay));

        // 4. Show typing indicator
        await triggerTyping(queueItem.conversationId, creator.userId, true);

        // 5. Simulate typing time based on response length (2-6 seconds)
        // Longer responses = more typing time
        const baseTypingTime = 2000;
        const charsPerSecond = 30; // ~30 chars per second typing speed
        const typingTime = Math.min(
          baseTypingTime + (responseText.length / charsPerSecond) * 1000,
          6000 // Max 6 seconds
        );
        await new Promise(resolve => setTimeout(resolve, typingTime));

        // 6. Stop typing indicator
        await triggerTyping(queueItem.conversationId, creator.userId, false);

        // Calculate response time in seconds
        const responseTimeSeconds = Math.round(
          (Date.now() - new Date(originalMessage.createdAt).getTime()) / 1000
        );

        // Create the response message as the creator
        const aiMessage = await prisma.message.create({
          data: {
            conversationId: queueItem.conversationId,
            senderId: creator.userId,
            receiverId: originalMessage.senderId,
            text: responseText,
            // AI personality attribution
            aiPersonalityId: conversation.aiPersonalityId,
            isAiGenerated: true,
            // Track response time for analytics
            responseTimeSeconds,
            // Only set PPV for actual PPV media, not for free or tease
            isPPV: shouldBePPV,
            ppvPrice: ppvPrice,
            ppvUnlockedBy: "[]",
            // Attach media for FREE and PPV (not TEASE)
            media: (mediaDecision.type === "FREE" || mediaDecision.type === "PPV") && mediaDecision.media
              ? {
                  create: {
                    type: mediaDecision.media.type,
                    url: shouldBePPV
                      ? (mediaDecision.media.previewUrl || mediaDecision.media.thumbnailUrl || "/placeholder-ppv.jpg")
                      : mediaDecision.media.contentUrl,
                    previewUrl: mediaDecision.media.previewUrl || mediaDecision.media.thumbnailUrl,
                    mediaId: mediaDecision.media.id,
                  },
                }
              : undefined,
          },
          include: {
            media: true,
            sender: {
              select: { id: true, name: true, image: true },
            },
          },
        });

        // Update conversation timestamp
        await prisma.conversation.update({
          where: { id: queueItem.conversationId },
          data: { updatedAt: new Date() },
        });

        // Update creator's last active time
        await prisma.creator.update({
          where: { slug: queueItem.creatorSlug },
          data: { aiLastActive: new Date() },
        });

        // Trigger real-time notification
        const transformedMessage = {
          id: aiMessage.id,
          text: aiMessage.text,
          senderId: aiMessage.senderId,
          receiverId: aiMessage.receiverId,
          isPPV: aiMessage.isPPV,
          ppvPrice: aiMessage.ppvPrice ? Number(aiMessage.ppvPrice) : null,
          isUnlocked: false,
          ppvUnlockedBy: [],
          totalTips: 0,
          isRead: false,
          media: aiMessage.media.map((m) => ({
            id: m.id,
            type: m.type,
            url: m.url,
            previewUrl: m.previewUrl,
          })),
          createdAt: aiMessage.createdAt,
        };

        await triggerNewMessage(queueItem.conversationId, transformedMessage);

        // Mark as completed with media decision info
        await prisma.aiResponseQueue.update({
          where: { id: queueItem.id },
          data: {
            status: "COMPLETED",
            response: responseText,
            mediaId: mediaDecision.media?.id || null,
            shouldSendMedia: mediaDecision.shouldSend,
            mediaDecision: mediaDecision.type,
            teaseText: mediaDecision.teaseText,
            processedAt: new Date(),
          },
        });

        // ===== CHARGE 1 CREDIT FOR AI RESPONSE (SKIP IF CUSTOM KEY) =====
        if (!usingCustomKey) {
          const chargeResult = await chargeAiChatCredit(queueItem.creatorSlug, {
            messageId: aiMessage.id,
            conversationId: queueItem.conversationId,
          });

          if (chargeResult.charged) {
            console.log(`[AI] Charged 1 credit to ${chargeResult.chargedUserId} (new balance: ${chargeResult.newBalance})`);
          } else {
            console.warn(`[AI] Failed to charge credit: ${chargeResult.error}`);
          }
        } else {
          console.log(`[AI] Using custom API key - no credit charged for ${queueItem.creatorSlug}`);
        }

        results.push({ id: queueItem.id, status: "COMPLETED" });
        console.log(`[AI] Sent response for message ${queueItem.messageId}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`[AI] Error processing queue item ${queueItem.id}:`, error);

        // Check if we should retry or fail
        const shouldRetry = queueItem.attempts < queueItem.maxAttempts;

        await prisma.aiResponseQueue.update({
          where: { id: queueItem.id },
          data: {
            status: shouldRetry ? "PENDING" : "FAILED",
            error: errorMessage,
            // If retrying, schedule for 1 minute later
            scheduledAt: shouldRetry ? new Date(Date.now() + 60000) : undefined,
          },
        });

        results.push({
          id: queueItem.id,
          status: shouldRetry ? "RETRY" : "FAILED",
          error: errorMessage,
        });
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("[AI] Queue processing error:", error);
    return NextResponse.json(
      { error: "Failed to process queue" },
      { status: 500 }
    );
  }
}

// POST endpoint for testing with a specific message
export async function POST(request: NextRequest) {
  try {
    const { messageId, creatorSlug, conversationId } = await request.json();

    if (!messageId || !creatorSlug || !conversationId) {
      return NextResponse.json(
        { error: "messageId, creatorSlug, and conversationId are required" },
        { status: 400 }
      );
    }

    // Create a queue entry with immediate execution
    await prisma.aiResponseQueue.create({
      data: {
        messageId,
        conversationId,
        creatorSlug,
        scheduledAt: new Date(), // Execute immediately
        status: "PENDING",
      },
    });

    // Process immediately
    const result = await fetch(request.url, { method: "GET" });
    return result;
  } catch (error) {
    console.error("[AI] Test trigger error:", error);
    return NextResponse.json(
      { error: "Failed to trigger test" },
      { status: 500 }
    );
  }
}
