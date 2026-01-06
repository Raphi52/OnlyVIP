"use client";

import { useState, useEffect, useCallback } from "react";
import {
  PanelLeftClose,
  PanelRightClose,
  PanelLeft,
  PanelRight,
  Sparkles,
  FileText,
  User,
  Send,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Components
import AiCopilotPanel from "./ai-copilot/AiCopilotPanel";
import ScriptSidebar from "./scripts/ScriptSidebar";
import ScriptPopup from "./scripts/ScriptPopup";
import FanContextPanel from "./fan-context/FanContextPanel";
import { PPVHistoryPanel } from "@/components/chat/PPVHistoryPanel";
import { useBillingStatus } from "./ai-copilot/CreditIndicator";

interface Message {
  id: string;
  text: string | null;
  senderId: string;
  isFromCreator: boolean;
  isAiGenerated?: boolean;
  createdAt: string;
  media?: {
    id: string;
    type: string;
    thumbnailUrl: string | null;
    contentUrl: string;
  } | null;
}

interface Participant {
  userId: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface ConversationData {
  id: string;
  creatorSlug: string;
  creatorName: string;
  creatorAvatar: string | null;
  participants: Participant[];
  messages: Message[];
  aiMode: string;
}

interface ChatterWorkspaceProps {
  conversationId: string;
  conversationData: ConversationData;
  onSendMessage: (text: string, scriptId?: string) => Promise<void>;
  onRefresh: () => void;
  className?: string;
}

export default function ChatterWorkspace({
  conversationId,
  conversationData,
  onSendMessage,
  onRefresh,
  className,
}: ChatterWorkspaceProps) {
  // Panel visibility states
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [rightTab, setRightTab] = useState<"fan" | "scripts">("fan");

  // AI Copilot state
  const [showAiCopilot, setShowAiCopilot] = useState(false);

  // Message input state
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);

  // Script popup state
  const [lastFanMessage, setLastFanMessage] = useState("");
  const [detectedIntent, setDetectedIntent] = useState<string | null>(null);

  // Billing status
  const { billing } = useBillingStatus(conversationData.creatorSlug);

  // Get fan participant
  const fanParticipant = conversationData.participants.find(
    (p) => p.userId !== conversationData.creatorSlug
  );

  // Track last fan message for script suggestions
  useEffect(() => {
    const lastFan = conversationData.messages
      .filter((m) => !m.isFromCreator && m.text)
      .slice(-1)[0];

    if (lastFan?.text && lastFan.text !== lastFanMessage) {
      setLastFanMessage(lastFan.text);
    }
  }, [conversationData.messages, lastFanMessage]);

  // Handle send message
  const handleSend = async (scriptId?: string) => {
    if (!inputText.trim() || sending) return;

    setSending(true);
    try {
      await onSendMessage(inputText.trim(), scriptId);
      setInputText("");
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  // Handle AI suggestion selection
  const handleAiSuggestion = (text: string) => {
    setInputText(text);
    setShowAiCopilot(false);
  };

  // Handle script selection
  const handleScriptSelect = (content: string, scriptId: string) => {
    setInputText(content);
  };

  // Handle script send
  const handleScriptSend = async (content: string, scriptId: string) => {
    setInputText(content);
    await handleSend(scriptId);
  };

  return (
    <div className={cn("flex h-full bg-[--background]", className)}>
      {/* Left Panel - Conversation List (placeholder for now) */}
      {showLeftPanel && (
        <div className="w-72 border-r border-[--border] flex flex-col bg-[--surface-elevated]">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[--border]">
            <h3 className="font-semibold text-white">Conversations</h3>
            <button
              onClick={() => setShowLeftPanel(false)}
              className="p-1 rounded hover:bg-white/10 text-gray-400"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>

          {/* Conversation list would go here */}
          <div className="flex-1 overflow-y-auto p-2">
            <p className="text-sm text-gray-500 text-center py-4">
              Conversation list
            </p>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[--border] bg-[--surface-elevated]">
          <div className="flex items-center gap-3">
            {/* Toggle left panel */}
            {!showLeftPanel && (
              <button
                onClick={() => setShowLeftPanel(true)}
                className="p-1 rounded hover:bg-white/10 text-gray-400"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            )}

            {/* Fan info */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                {fanParticipant?.user.name?.[0] || "?"}
              </div>
              <div>
                <p className="font-medium text-white">
                  {fanParticipant?.user.name || "Fan"}
                </p>
                <p className="text-xs text-gray-400">
                  via @{conversationData.creatorSlug}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle right panel */}
            {!showRightPanel && (
              <button
                onClick={() => setShowRightPanel(true)}
                className="p-1 rounded hover:bg-white/10 text-gray-400"
              >
                <PanelRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {conversationData.messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.isFromCreator ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[70%] rounded-2xl px-4 py-2",
                  message.isFromCreator
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    : "bg-[--surface-elevated] text-gray-200"
                )}
              >
                {message.text && <p className="text-sm">{message.text}</p>}
                {message.isAiGenerated && (
                  <p className="text-xs opacity-60 mt-1">AI generated</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Script Popup */}
        {lastFanMessage && (
          <ScriptPopup
            conversationId={conversationId}
            message={lastFanMessage}
            fanName={fanParticipant?.user.name || undefined}
            onInsert={handleScriptSelect}
            onSend={handleScriptSend}
            onDismiss={() => setLastFanMessage("")}
          />
        )}

        {/* Input Area */}
        <div className="px-4 py-3 border-t border-[--border] bg-[--surface-elevated]">
          {/* Quick actions */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setShowAiCopilot(true)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors",
                showAiCopilot
                  ? "bg-purple-600 text-white"
                  : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
              )}
            >
              <Sparkles className="w-3 h-3" />
              AI Suggest
            </button>
            <button
              onClick={() => {
                setShowRightPanel(true);
                setRightTab("scripts");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-[--background] text-gray-400 hover:text-white transition-colors"
            >
              <FileText className="w-3 h-3" />
              Scripts
            </button>
          </div>

          {/* Input */}
          <div className="flex items-end gap-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 px-4 py-2 rounded-xl bg-[--background] border border-[--border] text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              style={{
                minHeight: "44px",
                maxHeight: "120px",
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() || sending}
              className={cn(
                "p-3 rounded-xl transition-colors",
                inputText.trim() && !sending
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  : "bg-[--background] text-gray-500 cursor-not-allowed"
              )}
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* AI Copilot Panel (floating) */}
        {showAiCopilot && (
          <AiCopilotPanel
            conversationId={conversationId}
            creatorSlug={conversationData.creatorSlug}
            onSuggestionSelect={handleAiSuggestion}
            onClose={() => setShowAiCopilot(false)}
          />
        )}
      </div>

      {/* Right Panel - Fan Context / Scripts */}
      {showRightPanel && (
        <div className="w-80 border-l border-[--border] flex flex-col bg-[--surface-elevated]">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[--border]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRightTab("fan")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  rightTab === "fan"
                    ? "bg-purple-600 text-white"
                    : "text-gray-400 hover:text-white"
                )}
              >
                <User className="w-4 h-4 inline mr-1" />
                Fan
              </button>
              <button
                onClick={() => setRightTab("scripts")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  rightTab === "scripts"
                    ? "bg-purple-600 text-white"
                    : "text-gray-400 hover:text-white"
                )}
              >
                <FileText className="w-4 h-4 inline mr-1" />
                Scripts
              </button>
            </div>
            <button
              onClick={() => setShowRightPanel(false)}
              className="p-1 rounded hover:bg-white/10 text-gray-400"
            >
              <PanelRightClose className="w-5 h-5" />
            </button>
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto">
            {rightTab === "fan" ? (
              <div className="flex flex-col">
                <FanContextPanel conversationId={conversationId} />
                <PPVHistoryPanel conversationId={conversationId} />
              </div>
            ) : (
              <ScriptSidebar
                creatorSlug={conversationData.creatorSlug}
                currentIntent={detectedIntent}
                fanName={fanParticipant?.user.name || undefined}
                onSelectScript={handleScriptSelect}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
