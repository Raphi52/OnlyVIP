"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Inbox,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Calendar,
  FileText,
  Eye,
  X,
  AlertTriangle,
  RefreshCw,
  Crown,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Application {
  id: string;
  userId: string;
  displayName: string;
  slug: string | null;
  bio: string | null;
  documentUrl: string;
  documentType: string;
  status: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    createdAt: string;
  };
}

type FilterStatus = "PENDING" | "APPROVED" | "REJECTED" | "ALL";

export default function AdminCreatorApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("PENDING");
  const [pendingCount, setPendingCount] = useState(0);

  // Modal state
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isViewingDocument, setIsViewingDocument] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Auto-accept toggle
  const [autoAccept, setAutoAccept] = useState(false);
  const [isTogglingAutoAccept, setIsTogglingAutoAccept] = useState(false);

  const fetchAutoAcceptSetting = async () => {
    try {
      const res = await fetch("/api/admin/settings/auto-accept");
      if (res.ok) {
        const data = await res.json();
        setAutoAccept(data.autoAcceptCreators || false);
      }
    } catch (error) {
      console.error("Error fetching auto-accept setting:", error);
    }
  };

  const toggleAutoAccept = async () => {
    setIsTogglingAutoAccept(true);
    try {
      const res = await fetch("/api/admin/settings/auto-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoAcceptCreators: !autoAccept }),
      });
      if (res.ok) {
        setAutoAccept(!autoAccept);
      }
    } catch (error) {
      console.error("Error toggling auto-accept:", error);
    } finally {
      setIsTogglingAutoAccept(false);
    }
  };

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/creator-applications?status=${filterStatus}`);
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
        setPendingCount(data.pendingCount || 0);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [filterStatus]);

  useEffect(() => {
    fetchAutoAcceptSetting();
  }, []);

  const handleApprove = async (app: Application) => {
    if (!confirm(`Approuver la candidature de ${app.displayName} ?`)) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/creator-applications/${app.id}/approve`, {
        method: "POST",
      });

      if (res.ok) {
        fetchApplications();
        setSelectedApp(null);
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de l'approbation");
      }
    } catch (error) {
      console.error("Error approving application:", error);
      alert("Erreur lors de l'approbation");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/creator-applications/${selectedApp.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (res.ok) {
        fetchApplications();
        setSelectedApp(null);
        setShowRejectModal(false);
        setRejectReason("");
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors du rejet");
      }
    } catch (error) {
      console.error("Error rejecting application:", error);
      alert("Erreur lors du rejet");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded-full">
            <Clock className="w-3 h-3" />
            En attente
          </span>
        );
      case "APPROVED":
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Approuvee
          </span>
        );
      case "REJECTED":
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">
            <XCircle className="w-3 h-3" />
            Rejetee
          </span>
        );
      default:
        return null;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "ID_CARD":
        return "Carte d'identite";
      case "PASSPORT":
        return "Passeport";
      case "DRIVERS_LICENSE":
        return "Permis de conduire";
      default:
        return type;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
              <Inbox className="w-5 h-5 text-black" />
            </div>
            Candidatures Createur
          </h1>
          <p className="text-gray-400 mt-1">
            {pendingCount} candidature{pendingCount !== 1 ? "s" : ""} en attente
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto-accept Toggle */}
          <button
            onClick={toggleAutoAccept}
            disabled={isTogglingAutoAccept}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all",
              autoAccept
                ? "bg-green-500/20 border-green-500/50 text-green-400"
                : "bg-white/5 border-gray-700 text-gray-400 hover:border-gray-600"
            )}
          >
            {isTogglingAutoAccept ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : autoAccept ? (
              <ToggleRight className="w-5 h-5" />
            ) : (
              <ToggleLeft className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">Auto-accept</span>
          </button>

          <Button
            onClick={fetchApplications}
            variant="outline"
            className="border-gray-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["PENDING", "APPROVED", "REJECTED", "ALL"] as FilterStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              filterStatus === status
                ? "bg-yellow-500 text-black"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
            )}
          >
            {status === "PENDING" && `En attente (${pendingCount})`}
            {status === "APPROVED" && "Approuvees"}
            {status === "REJECTED" && "Rejetees"}
            {status === "ALL" && "Toutes"}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
        </div>
      ) : applications.length === 0 ? (
        <Card className="p-12 text-center">
          <Inbox className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucune candidature</h3>
          <p className="text-gray-400">
            {filterStatus === "PENDING"
              ? "Aucune candidature en attente"
              : "Aucune candidature trouvee"}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {applications.map((app) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-4 hover:border-yellow-500/30 transition-colors">
                <div className="flex items-start gap-4">
                  {/* User Avatar */}
                  <div className="relative">
                    {app.user.image ? (
                      <Image
                        src={app.user.image}
                        alt=""
                        width={56}
                        height={56}
                        className="w-14 h-14 rounded-full object-cover border-2 border-yellow-500/30"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
                        <span className="text-black font-bold text-xl">
                          {app.displayName[0] || "?"}
                        </span>
                      </div>
                    )}
                    {app.status === "PENDING" && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-500 border-2 border-[#1a1a2e]" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white">{app.displayName}</h3>
                      {getStatusBadge(app.status)}
                    </div>

                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {app.user.name || "Anonyme"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {app.user.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(app.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <FileText className="w-3 h-3" />
                      {getDocumentTypeLabel(app.documentType)}
                    </div>

                    {app.bio && (
                      <p className="text-sm text-gray-400 mt-2 line-clamp-2">{app.bio}</p>
                    )}

                    {app.rejectionReason && (
                      <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                        <p className="text-sm text-red-400">
                          <strong>Raison du rejet:</strong> {app.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedApp(app);
                        setIsViewingDocument(true);
                      }}
                      className="border-gray-700"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Document
                    </Button>

                    {app.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(app)}
                          disabled={isProcessing}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedApp(app);
                            setShowRejectModal(true);
                          }}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rejeter
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {isViewingDocument && selectedApp && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setIsViewingDocument(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 sm:inset-8 md:inset-16 lg:inset-24 bg-[#1a1a2e] rounded-2xl border border-yellow-500/20 z-50 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div>
                  <h3 className="font-semibold text-white">Document d&apos;identite</h3>
                  <p className="text-sm text-gray-400">
                    {selectedApp.displayName} - {getDocumentTypeLabel(selectedApp.documentType)}
                  </p>
                </div>
                <button
                  onClick={() => setIsViewingDocument(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Document Image */}
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/50">
                <img
                  src={selectedApp.documentUrl}
                  alt="Document d'identite"
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>

              {/* Actions */}
              {selectedApp.status === "PENDING" && (
                <div className="flex items-center justify-end gap-3 p-4 border-t border-white/10">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsViewingDocument(false);
                      setShowRejectModal(true);
                    }}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeter
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedApp)}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Approuver cette candidature
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && selectedApp && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => {
                setShowRejectModal(false);
                setRejectReason("");
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#1a1a2e] rounded-2xl border border-red-500/20 p-6 z-50"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Rejeter la candidature</h3>
                  <p className="text-sm text-gray-400">{selectedApp.displayName}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Raison du rejet (optionnel)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ex: Document illisible, informations manquantes..."
                  rows={3}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-red-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason("");
                  }}
                  className="flex-1 border-gray-700"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Rejeter
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
