"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MessageCircle, Heart, DollarSign, Lock, Send, Sparkles, Check, Zap, Loader2 } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { Creator } from "@/lib/creators";

interface ChatPreviewProps {
  creator?: Creator;
}

export function ChatPreview({ creator }: ChatPreviewProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [canMessage, setCanMessage] = useState(false);

  const creatorSlug = creator?.slug || "miacosta";
  const basePath = `/${creatorSlug}`;
  const creatorName = creator?.displayName || "Mia";

  // Check if user can message
  useEffect(() => {
    const checkSubscription = async () => {
      if (!session?.user?.id) return;

      // Admin can always message
      if ((session.user as any).role === "ADMIN") {
        setCanMessage(true);
        return;
      }

      try {
        const res = await fetch("/api/user/subscription");
        if (res.ok) {
          const data = await res.json();
          const hasAccess =
            data.subscription?.plan?.canMessage === true ||
            data.subscription?.plan?.accessTier === "VIP";
          setCanMessage(hasAccess);
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
      }
    };

    checkSubscription();
  }, [session?.user?.id]);

  // Handle start chat click
  const handleStartChat = async () => {
    if (!session) {
      router.push("/auth/login");
      return;
    }

    if (!canMessage) {
      router.push(`${basePath}/membership`);
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
        router.push(`${basePath}/membership`);
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      router.push(`${basePath}/membership`);
    } finally {
      setIsLoading(false);
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

          {/* Chat Preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Glow effect */}
            <div className="absolute -inset-10 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-3xl rounded-full" />

            <div className="relative bg-[#111] rounded-3xl border border-white/10 p-6 shadow-2xl max-w-md mx-auto">
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
    </section>
  );
}
