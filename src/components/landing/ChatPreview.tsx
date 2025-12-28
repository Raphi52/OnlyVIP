"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Heart, DollarSign, Lock, Send, Sparkles, Check, Zap, Loader2, Crown, X, Coins } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { Creator } from "@/lib/creators";

interface ChatPreviewProps {
  creator?: Creator;
}

interface VipPlan {
  name: string;
  priceCredits: number;
  features: string[];
}

export function ChatPreview({ creator }: ChatPreviewProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [canMessage, setCanMessage] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [vipPrice, setVipPrice] = useState(5000); // Default 5000 credits = 50€
  const [isPurchasing, setIsPurchasing] = useState(false);

  const creatorSlug = creator?.slug || "miacosta";
  const basePath = `/${creatorSlug}`;
  const creatorName = creator?.displayName || "Mia";

  // Check if user has VIP for this specific creator
  useEffect(() => {
    const checkSubscription = async () => {
      if (!session?.user?.id) return;

      // Admin can always message
      if ((session.user as any).role === "ADMIN") {
        setCanMessage(true);
        return;
      }

      try {
        // Check subscription for this specific creator
        const res = await fetch(`/api/user/subscription?creatorSlug=${creatorSlug}`);
        if (res.ok) {
          const data = await res.json();
          // Check if user has active subscription for THIS creator
          const hasAccess =
            data.subscription?.creatorSlug === creatorSlug &&
            (data.subscription?.status === "ACTIVE" || data.subscription?.status === "TRIALING") &&
            (data.subscription?.plan?.canMessage === true ||
             data.subscription?.plan?.accessTier === "VIP" ||
             data.subscription?.plan?.accessTier === "BASIC");
          setCanMessage(hasAccess);

          // Also get user credits
          if (data.credits !== undefined) {
            setUserCredits(data.credits);
          }
        }

        // Get VIP price for this creator
        const pricingRes = await fetch(`/api/creators/${creatorSlug}/pricing`);
        if (pricingRes.ok) {
          const pricingData = await pricingRes.json();
          const vipPlan = pricingData.plans?.find((p: any) =>
            p.accessTier === "VIP" || p.name?.toLowerCase().includes("vip")
          );
          if (vipPlan?.priceCredits) {
            setVipPrice(vipPlan.priceCredits);
          }
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
      }
    };

    checkSubscription();
  }, [session?.user?.id, creatorSlug]);

  // Handle start chat click
  const handleStartChat = async () => {
    if (!session) {
      router.push("/auth/login");
      return;
    }

    if (!canMessage) {
      // Show VIP purchase modal instead of redirecting
      setShowVipModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/conversations/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorSlug }),
      });

      if (res.ok) {
        router.push("/dashboard/messages");
      } else {
        const error = await res.json();
        console.error("Error:", error);
        setShowVipModal(true);
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      setShowVipModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle VIP purchase with credits
  const handlePurchaseVip = async () => {
    if (userCredits < vipPrice) {
      // Not enough credits - redirect to buy credits
      router.push("/dashboard?tab=credits");
      return;
    }

    setIsPurchasing(true);
    try {
      const res = await fetch("/api/subscription/purchase-with-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorSlug,
          tier: "VIP",
          credits: vipPrice
        }),
      });

      if (res.ok) {
        setCanMessage(true);
        setShowVipModal(false);
        setUserCredits(prev => prev - vipPrice);
        // Start conversation
        const convRes = await fetch("/api/conversations/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creatorSlug }),
        });
        if (convRes.ok) {
          router.push("/dashboard/messages");
        }
      } else {
        const error = await res.json();
        console.error("Purchase error:", error);
        alert(error.error || "Failed to purchase VIP");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert("Failed to purchase VIP");
    } finally {
      setIsPurchasing(false);
    }
  };

  const features = [
    {
      icon: MessageCircle,
      title: "Private Messages",
      description: "Direct conversation, just between us",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Lock,
      title: "PPV Content",
      description: "Unlock exclusive media sent in chat",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Heart,
      title: "Send Tips",
      description: "Show appreciation with instant tips",
      color: "from-red-500 to-orange-500",
    },
    {
      icon: Zap,
      title: "Priority Response",
      description: "VIP members get faster replies",
      color: "from-[var(--gold)] to-yellow-500",
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#080808] to-black" />

      {/* Decorative elements */}
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <motion.span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-medium mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <MessageCircle className="w-4 h-4" />
              Direct Connection
            </motion.span>

            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
              Chat with{" "}
              <span className="gradient-gold-text">Me Directly</span>
            </h2>
            <p className="text-gray-400 text-lg mb-10 leading-relaxed">
              VIP members get exclusive access to direct messaging.
              Receive personalized content, respond to messages, and unlock
              exclusive pay-per-view media sent just for you.
            </p>

            {/* Features grid */}
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center flex-shrink-0`}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
                    <p className="text-sm text-gray-500">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <Button
              variant="premium"
              size="lg"
              className="gap-2"
              onClick={handleStartChat}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <MessageCircle className="w-5 h-5" />
              )}
              {canMessage ? "Start Chatting" : "Get VIP Access"}
            </Button>
          </motion.div>

          {/* Chat Preview - Clickable */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative cursor-pointer group"
            onClick={handleStartChat}
          >
            {/* Glow effect */}
            <div className="absolute -inset-10 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-3xl rounded-full group-hover:from-blue-500/20 group-hover:via-purple-500/20 group-hover:to-pink-500/20 transition-all duration-500" />

            <div className="relative bg-[#111] rounded-3xl border border-white/10 p-6 shadow-2xl max-w-md mx-auto group-hover:border-[var(--gold)]/30 group-hover:scale-[1.02] transition-all duration-300">
              {/* Chat header */}
              <div className="flex items-center gap-4 pb-5 border-b border-white/10">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] overflow-hidden">
                    {creator?.avatar ? (
                      <img
                        src={creator.avatar}
                        alt={creatorName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-black font-bold text-lg">
                        {creatorName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#111]" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{creatorName}</h4>
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Online now
                  </p>
                </div>
                <Badge variant="vip">VIP</Badge>
              </div>

              {/* Messages */}
              <div className="py-6 space-y-4 min-h-[280px]">
                {/* Member message (sent by member) */}
                <motion.div
                  className="flex gap-3 justify-end"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="text-right">
                    <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-blue-600 max-w-[240px]">
                      <p className="text-sm text-white">Hey! Just subscribed, love your content!</p>
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-1.5 mr-1">
                      <p className="text-xs text-gray-500">2:32 PM</p>
                      <Check className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">JM</span>
                  </div>
                </motion.div>

                {/* Creator reply */}
                <motion.div
                  className="flex gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex-shrink-0 overflow-hidden">
                    {creator?.avatar ? (
                      <img
                        src={creator.avatar}
                        alt={creatorName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-black font-bold text-sm">
                        {creatorName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/10 max-w-[240px]">
                      <p className="text-sm text-white">Thanks so much! Here's a welcome gift just for you</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5 ml-1">2:34 PM</p>
                  </div>
                </motion.div>

                {/* PPV Message from creator - more compact */}
                <motion.div
                  className="flex gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex-shrink-0 overflow-hidden">
                    {creator?.avatar ? (
                      <img
                        src={creator.avatar}
                        alt={creatorName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-black font-bold text-sm">
                        {creatorName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="relative rounded-2xl rounded-tl-sm overflow-hidden border border-white/10 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg bg-black/30 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 to-purple-500/30" />
                          <Lock className="w-5 h-5 text-white/80 relative z-10" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white font-medium">Exclusive content</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded-full bg-[var(--gold)] text-black text-xs font-bold">$9.99</span>
                            <span className="text-xs text-gray-400">Tap to unlock</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5 ml-1">2:35 PM</p>
                  </div>
                </motion.div>

                {/* Tip notification */}
                <motion.div
                  className="flex justify-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.9 }}
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                    <DollarSign className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs text-green-400 font-medium">JM sent a $10 tip</span>
                    <Sparkles className="w-3.5 h-3.5 text-green-400" />
                  </div>
                </motion.div>
              </div>

              {/* Input */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <div className="flex-1 px-4 py-3 rounded-full bg-white/5 border border-white/10 text-gray-500 text-sm">
                  Type a message...
                </div>
                <button className="w-11 h-11 rounded-full bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] flex items-center justify-center shadow-lg shadow-[var(--gold)]/30 hover:scale-105 transition-transform">
                  <Send className="w-5 h-5 text-black" />
                </button>
              </div>
            </div>

            {/* Floating notification */}
            <motion.div
              className="absolute -top-4 -right-4 px-4 py-2 rounded-xl bg-[#111] border border-white/10 shadow-xl"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.1 }}
              animate={{ y: [0, -5, 0] }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-white font-medium">New message!</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* VIP Purchase Modal */}
      <AnimatePresence>
        {showVipModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
              onClick={() => setShowVipModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:w-full md:max-w-md z-50"
            >
              <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl">
                {/* Close button */}
                <button
                  onClick={() => setShowVipModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--gold)] via-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[var(--gold)]/30"
                  >
                    <Crown className="w-10 h-10 text-black" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white">Become VIP</h3>
                  <p className="text-sm text-white/50 mt-1">
                    Unlock direct messaging with {creatorName}
                  </p>
                </div>

                {/* Benefits */}
                <div className="space-y-3 mb-6">
                  {[
                    "Direct private messages",
                    "Exclusive PPV content access",
                    "Priority responses",
                    "Send tips & gifts"
                  ].map((benefit, i) => (
                    <motion.div
                      key={benefit}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-[var(--gold)]/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-[var(--gold)]" />
                      </div>
                      <span className="text-white/80">{benefit}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Price */}
                <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/50 text-sm">VIP Access</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Coins className="w-5 h-5 text-[var(--gold)]" />
                        <span className="text-2xl font-bold text-white">{vipPrice.toLocaleString()}</span>
                        <span className="text-white/50">credits</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white/50 text-sm">Your balance</p>
                      <p className={`text-lg font-semibold ${userCredits >= vipPrice ? 'text-green-400' : 'text-red-400'}`}>
                        {userCredits.toLocaleString()} credits
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                {userCredits >= vipPrice ? (
                  <Button
                    variant="premium"
                    className="w-full py-4 text-lg gap-2"
                    onClick={handlePurchaseVip}
                    disabled={isPurchasing}
                  >
                    {isPurchasing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Crown className="w-5 h-5" />
                    )}
                    Unlock VIP Access
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-center text-red-400 text-sm">
                      You need {(vipPrice - userCredits).toLocaleString()} more credits
                    </p>
                    <Button
                      variant="premium"
                      className="w-full py-4 text-lg gap-2"
                      onClick={() => router.push("/dashboard?tab=credits")}
                    >
                      <Coins className="w-5 h-5" />
                      Buy Credits
                    </Button>
                  </div>
                )}

                <button
                  onClick={() => setShowVipModal(false)}
                  className="w-full mt-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-medium transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
