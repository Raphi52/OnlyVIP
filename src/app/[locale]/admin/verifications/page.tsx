"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Loader2,
  RefreshCw,
  Check,
  X,
  User,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";

interface Verification {
  id: string;
  userId: string;
  documentType: string;
  documentFrontUrl: string;
  documentBackUrl: string | null;
  selfieUrl: string;
  fullName: string;
  dateOfBirth: string;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  verifiedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    createdAt: string;
  };
}

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const fetchVerifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/verifications");
      if (res.ok) {
        const data = await res.json();
        setVerifications(data.verifications);
      }
    } catch (error) {
      console.error("Error fetching verifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleApprove = async (id: string) => {
    if (!confirm("Approve this verification? The identity documents will be permanently deleted after approval.")) {
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationId: id, action: "APPROVE" }),
      });

      if (res.ok) {
        fetchVerifications();
        setSelectedVerification(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to approve");
      }
    } catch (error) {
      console.error("Error approving:", error);
      alert("Failed to approve verification");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId: id,
          action: "REJECT",
          rejectionReason: rejectionReason.trim(),
        }),
      });

      if (res.ok) {
        fetchVerifications();
        setSelectedVerification(null);
        setShowRejectModal(false);
        setRejectionReason("");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to reject");
      }
    } catch (error) {
      console.error("Error rejecting:", error);
      alert("Failed to reject verification");
    } finally {
      setIsProcessing(false);
    }
  };

  const getImageUrl = (path: string) => {
    if (path === "[DELETED]") return null;
    return `/api/admin/verifications/image?path=${encodeURIComponent(path)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendingCount = verifications.filter((v) => v.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-[var(--background)] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
              <Shield className="w-6 h-6 text-[var(--gold)]" />
              Creator Verifications
            </h1>
            <p className="text-[var(--muted)] mt-1">
              Review and approve creator identity verifications
            </p>
          </div>
          <Button variant="outline" onClick={fetchVerifications} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--foreground)]">{pendingCount}</p>
                <p className="text-sm text-[var(--muted)]">Pending</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {verifications.filter((v) => v.status === "APPROVED").length}
                </p>
                <p className="text-sm text-[var(--muted)]">Approved</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {verifications.filter((v) => v.status === "REJECTED").length}
                </p>
                <p className="text-sm text-[var(--muted)]">Rejected</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--foreground)]">{verifications.length}</p>
                <p className="text-sm text-[var(--muted)]">Total</p>
              </div>
            </div>
          </Card>
        </div>

        {/* GDPR Notice */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Trash2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-400">GDPR Compliance</p>
              <p className="text-xs text-gray-400">
                All identity documents are permanently deleted immediately after approval or rejection.
                Only the verification result (date + status) is retained.
              </p>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && verifications.length === 0 && (
          <Card className="p-12 text-center">
            <Shield className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--foreground)]">No verifications yet</h3>
            <p className="text-[var(--muted)]">Creator verification requests will appear here</p>
          </Card>
        )}

        {/* Verifications List */}
        {!isLoading && verifications.length > 0 && (
          <div className="space-y-4">
            {verifications.map((verification) => (
              <motion.div
                key={verification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* User Avatar */}
                      <div className="w-12 h-12 rounded-full bg-[var(--surface)] flex items-center justify-center overflow-hidden">
                        {verification.user.image ? (
                          <img
                            src={verification.user.image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-[var(--muted)]" />
                        )}
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-[var(--foreground)]">
                            {verification.fullName}
                          </h3>
                          <Badge
                            variant={
                              verification.status === "PENDING"
                                ? "warning"
                                : verification.status === "APPROVED"
                                ? "success"
                                : "error"
                            }
                          >
                            {verification.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-[var(--muted)]">{verification.user.email}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-[var(--muted)]">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {verification.documentType.replace("_", " ")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(verification.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {verification.status === "PENDING" && verification.documentFrontUrl !== "[DELETED]" ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedVerification(verification)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                          <Button
                            variant="premium"
                            size="sm"
                            onClick={() => handleApprove(verification.id)}
                            disabled={isProcessing}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              setSelectedVerification(verification);
                              setShowRejectModal(true);
                            }}
                            disabled={isProcessing}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-[var(--muted)]">
                          {verification.status === "APPROVED" && verification.verifiedAt
                            ? `Approved ${formatDate(verification.verifiedAt)}`
                            : verification.status === "REJECTED"
                            ? `Rejected: ${verification.rejectionReason}`
                            : "Documents deleted"}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Review Modal */}
        <AnimatePresence>
          {selectedVerification && !showRejectModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedVerification(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[var(--surface)] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-[var(--foreground)]">
                      Verification Review
                    </h2>
                    <button
                      onClick={() => setSelectedVerification(null)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* User Info */}
                  <div className="bg-white/5 rounded-xl p-4 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-[var(--muted)]">Full Name</p>
                        <p className="font-medium text-[var(--foreground)]">
                          {selectedVerification.fullName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[var(--muted)]">Date of Birth</p>
                        <p className="font-medium text-[var(--foreground)]">
                          {new Date(selectedVerification.dateOfBirth).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[var(--muted)]">Email</p>
                        <p className="font-medium text-[var(--foreground)]">
                          {selectedVerification.user.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[var(--muted)]">Document Type</p>
                        <p className="font-medium text-[var(--foreground)]">
                          {selectedVerification.documentType.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-[var(--muted)] mb-2">Document Front</p>
                      {getImageUrl(selectedVerification.documentFrontUrl) ? (
                        <img
                          src={getImageUrl(selectedVerification.documentFrontUrl)!}
                          alt="Document Front"
                          className="w-full rounded-lg border border-white/10"
                        />
                      ) : (
                        <div className="w-full h-40 bg-white/5 rounded-lg flex items-center justify-center">
                          <p className="text-[var(--muted)]">Deleted</p>
                        </div>
                      )}
                    </div>
                    {selectedVerification.documentBackUrl && (
                      <div>
                        <p className="text-sm text-[var(--muted)] mb-2">Document Back</p>
                        {getImageUrl(selectedVerification.documentBackUrl) ? (
                          <img
                            src={getImageUrl(selectedVerification.documentBackUrl)!}
                            alt="Document Back"
                            className="w-full rounded-lg border border-white/10"
                          />
                        ) : (
                          <div className="w-full h-40 bg-white/5 rounded-lg flex items-center justify-center">
                            <p className="text-[var(--muted)]">Deleted</p>
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-[var(--muted)] mb-2">Selfie with Document</p>
                      {getImageUrl(selectedVerification.selfieUrl) ? (
                        <img
                          src={getImageUrl(selectedVerification.selfieUrl)!}
                          alt="Selfie"
                          className="w-full rounded-lg border border-white/10"
                        />
                      ) : (
                        <div className="w-full h-40 bg-white/5 rounded-lg flex items-center justify-center">
                          <p className="text-[var(--muted)]">Deleted</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-400">Verify carefully</p>
                        <p className="text-xs text-gray-400">
                          Check that the document matches the selfie, the name matches, and the person
                          is at least 18 years old. Documents will be permanently deleted after your decision.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {selectedVerification.status === "PENDING" && (
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedVerification(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => setShowRejectModal(true)}
                        disabled={isProcessing}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        variant="premium"
                        onClick={() => handleApprove(selectedVerification.id)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 mr-2" />
                        )}
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reject Modal */}
        <AnimatePresence>
          {showRejectModal && selectedVerification && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason("");
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[var(--surface)] rounded-2xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
                  Reject Verification
                </h2>
                <p className="text-sm text-[var(--muted)] mb-4">
                  Please provide a reason for rejection. The user will be able to resubmit with
                  better documents.
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Document is blurry, Name doesn't match, Cannot verify age..."
                  className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-[var(--foreground)] placeholder-[var(--muted)] resize-none h-24 mb-4"
                />
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectionReason("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleReject(selectedVerification.id)}
                    disabled={isProcessing || !rejectionReason.trim()}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <X className="w-4 h-4 mr-2" />
                    )}
                    Reject
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
