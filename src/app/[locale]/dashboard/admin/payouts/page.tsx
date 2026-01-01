"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  DollarSign,
  Loader2,
  Copy,
  RefreshCw,
  TrendingUp,
  Users,
  Download,
  Check,
  FileSpreadsheet,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

interface EarningsBreakdown {
  type: string;
  count: number;
  netAmount: number;
  grossAmount: number;
  commission: number;
}

interface Creator {
  id: string;
  slug: string;
  displayName: string;
  avatar: string | null;
  pendingBalance: number;
  totalEarned: number;
  totalPaid: number;
  walletEth: string | null;
  walletBtc: string | null;
  pendingEarningsCount: number;
  earningsBreakdown: EarningsBreakdown[];
}

interface Totals {
  pending: { gross: number; commission: number; net: number };
  paid: { gross: number; commission: number; net: number };
}

export default function AdminPayoutsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payouts");
      if (res.ok) {
        const data = await res.json();
        setCreators(data.creators || []);
        setTotals(data.totals || null);
      }
    } catch (err) {
      console.error("Error fetching payouts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWallet(id);
    setTimeout(() => setCopiedWallet(null), 2000);
  };

  const formatEarningType = (type: string) => {
    const types: Record<string, string> = {
      MEDIA_UNLOCK: "Media",
      TIP: "Tips",
      PPV: "PPV",
      SUBSCRIPTION: "Subs",
    };
    return types[type] || type;
  };

  // Export to CSV
  const exportCSV = () => {
    const headers = ["Creator", "Slug", "Pending (EUR)", "Total Earned (EUR)", "Total Paid (EUR)", "Wallet ETH", "Wallet BTC"];
    const rows = creators.map(c => [
      c.displayName,
      c.slug,
      c.pendingBalance.toFixed(2),
      c.totalEarned.toFixed(2),
      c.totalPaid.toFixed(2),
      c.walletEth || "",
      c.walletBtc || "",
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payouts-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Creator Payouts</h1>
          <p className="text-sm sm:text-base text-white/50">Accounting dashboard</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportCSV}
            disabled={loading || creators.length === 0}
            className="gap-1.5 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
          <Button
            variant="outline"
            onClick={fetchData}
            disabled={loading}
            className="gap-1.5 sm:gap-2 text-xs sm:text-sm"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", loading && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="p-3 sm:p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
        <div className="flex items-start gap-2 sm:gap-3">
          <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm sm:text-base text-blue-400 font-medium">Accounting View Only</p>
            <p className="text-xs sm:text-sm text-blue-400/70">
              View pending balances. Use secure payout service to process.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <Card className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-yellow-500/20 flex items-center justify-center mb-1 sm:mb-0">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-white/50">Pending</p>
                <p className="text-base sm:text-xl font-bold text-yellow-500">
                  {totals.pending.net.toFixed(0)}€
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-green-500/20 flex items-center justify-center mb-1 sm:mb-0">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-white/50">Paid</p>
                <p className="text-base sm:text-xl font-bold text-green-500">
                  {totals.paid.net.toFixed(0)}€
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-500/20 flex items-center justify-center mb-1 sm:mb-0">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-white/50">Commission</p>
                <p className="text-base sm:text-xl font-bold text-purple-500">
                  {(totals.pending.commission + totals.paid.commission).toFixed(0)}€
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-500/20 flex items-center justify-center mb-1 sm:mb-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-white/50">To Pay</p>
                <p className="text-base sm:text-xl font-bold text-white">
                  {creators.filter((c) => c.pendingBalance > 0).length}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Creators List */}
      <Card>
        <div className="p-3 sm:p-4 border-b border-white/10">
          <h2 className="text-base sm:text-lg font-semibold text-white">Creator Balances</h2>
        </div>

        {loading ? (
          <div className="p-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" />
          </div>
        ) : creators.length === 0 ? (
          <div className="p-10 text-center text-white/50 text-sm sm:text-base">
            No creator earnings yet
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="sm:hidden divide-y divide-white/5">
              {creators.map((creator) => (
                <div key={creator.id} className="p-3">
                  {/* Creator header */}
                  <div className="flex items-center gap-3 mb-3">
                    {creator.avatar ? (
                      <img
                        src={creator.avatar}
                        alt={creator.displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gold)] to-amber-600 flex items-center justify-center text-black font-bold text-sm">
                        {creator.displayName.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">{creator.displayName}</p>
                      <p className="text-xs text-white/50">@{creator.slug}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-base font-bold",
                        creator.pendingBalance > 0 ? "text-yellow-500" : "text-white/30"
                      )}>
                        {creator.pendingBalance.toFixed(0)}€
                      </p>
                      <p className="text-[10px] text-white/40">pending</p>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-white/50">Earned: <span className="text-white">{creator.totalEarned.toFixed(0)}€</span></span>
                      <span className="text-white/50">Paid: <span className="text-green-500">{creator.totalPaid.toFixed(0)}€</span></span>
                    </div>
                  </div>

                  {/* Wallets */}
                  {(creator.walletEth || creator.walletBtc) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {creator.walletEth && (
                        <button
                          onClick={() => copyToClipboard(creator.walletEth!, `eth-${creator.id}`)}
                          className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded text-[10px] text-white/70"
                        >
                          ETH: {creator.walletEth.slice(0, 6)}...
                          {copiedWallet === `eth-${creator.id}` ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                      {creator.walletBtc && (
                        <button
                          onClick={() => copyToClipboard(creator.walletBtc!, `btc-${creator.id}`)}
                          className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded text-[10px] text-white/70"
                        >
                          BTC: {creator.walletBtc.slice(0, 6)}...
                          {copiedWallet === `btc-${creator.id}` ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-white/50 font-medium text-sm">Creator</th>
                    <th className="text-right p-4 text-white/50 font-medium text-sm">Pending</th>
                    <th className="text-right p-4 text-white/50 font-medium text-sm">Earned</th>
                    <th className="text-right p-4 text-white/50 font-medium text-sm">Paid</th>
                    <th className="text-left p-4 text-white/50 font-medium text-sm">Wallet ETH</th>
                    <th className="text-left p-4 text-white/50 font-medium text-sm">Wallet BTC</th>
                  </tr>
                </thead>
                <tbody>
                  {creators.map((creator) => (
                    <tr
                      key={creator.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      {/* Creator info */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {creator.avatar ? (
                            <img
                              src={creator.avatar}
                              alt={creator.displayName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gold)] to-amber-600 flex items-center justify-center text-black font-bold">
                              {creator.displayName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-white">{creator.displayName}</p>
                            <p className="text-sm text-white/50">@{creator.slug}</p>
                          </div>
                        </div>
                      </td>

                      {/* Pending */}
                      <td className="p-4 text-right">
                        <span className={cn(
                          "text-lg font-bold",
                          creator.pendingBalance > 0 ? "text-yellow-500" : "text-white/30"
                        )}>
                          {creator.pendingBalance.toFixed(2)}€
                        </span>
                        {creator.pendingEarningsCount > 0 && (
                          <p className="text-xs text-white/40">{creator.pendingEarningsCount} transactions</p>
                        )}
                      </td>

                      {/* Earned */}
                      <td className="p-4 text-right">
                        <span className="text-white font-medium">
                          {creator.totalEarned.toFixed(2)}€
                        </span>
                      </td>

                      {/* Paid */}
                      <td className="p-4 text-right">
                        <span className="text-green-500 font-medium">
                          {creator.totalPaid.toFixed(2)}€
                        </span>
                      </td>

                      {/* Wallet ETH */}
                      <td className="p-4">
                        {creator.walletEth ? (
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-white/70 bg-white/5 px-2 py-1 rounded max-w-[120px] truncate">
                              {creator.walletEth}
                            </code>
                            <button
                              onClick={() => copyToClipboard(creator.walletEth!, `eth-${creator.id}`)}
                              className="p-1.5 rounded hover:bg-white/10 transition-colors"
                            >
                              {copiedWallet === `eth-${creator.id}` ? (
                                <Check className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-white/50" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-white/30 text-sm">-</span>
                        )}
                      </td>

                      {/* Wallet BTC */}
                      <td className="p-4">
                        {creator.walletBtc ? (
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-white/70 bg-white/5 px-2 py-1 rounded max-w-[120px] truncate">
                              {creator.walletBtc}
                            </code>
                            <button
                              onClick={() => copyToClipboard(creator.walletBtc!, `btc-${creator.id}`)}
                              className="p-1.5 rounded hover:bg-white/10 transition-colors"
                            >
                              {copiedWallet === `btc-${creator.id}` ? (
                                <Check className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-white/50" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-white/30 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
