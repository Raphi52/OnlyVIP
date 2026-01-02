"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Shield,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  Camera,
  FileText,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";

interface VerificationStatus {
  status: "NONE" | "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  rejectionReason?: string;
  verifiedAt?: string;
  expiresAt?: string;
}

export default function CreatorVerificationPage() {
  const { data: session } = useSession();
  const [status, setStatus] = useState<VerificationStatus>({ status: "NONE" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [documentType, setDocumentType] = useState<string>("PASSPORT");
  const [documentFront, setDocumentFront] = useState<File | null>(null);
  const [documentBack, setDocumentBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Refs for file inputs
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  // Fetch current verification status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/creator/verification");
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch (err) {
        console.error("Error fetching verification status:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!documentFront || !selfie) {
      setError("Please upload all required documents");
      return;
    }

    if (!agreeTerms) {
      setError("You must agree to the terms and certifications");
      return;
    }

    // Validate age (must be 18+)
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    if (age < 18) {
      setError("You must be at least 18 years old");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("documentType", documentType);
      formData.append("documentFront", documentFront);
      if (documentBack) {
        formData.append("documentBack", documentBack);
      }
      formData.append("selfie", selfie);
      formData.append("fullName", fullName);
      formData.append("dateOfBirth", dateOfBirth);

      const res = await fetch("/api/creator/verification", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit verification");
      }

      setStatus({ status: "PENDING" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFilePreview = (file: File | null) => {
    if (!file) return null;
    return URL.createObjectURL(file);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
      NONE: { bg: "bg-gray-500/20", text: "text-gray-400", icon: FileText },
      PENDING: { bg: "bg-yellow-500/20", text: "text-yellow-400", icon: Clock },
      APPROVED: { bg: "bg-green-500/20", text: "text-green-400", icon: CheckCircle },
      REJECTED: { bg: "bg-red-500/20", text: "text-red-400", icon: XCircle },
      EXPIRED: { bg: "bg-orange-500/20", text: "text-orange-400", icon: AlertTriangle },
    }[status] || { bg: "bg-gray-500/20", text: "text-gray-400", icon: FileText };

    const Icon = styles.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${styles.bg}`}>
        <Icon className={`w-4 h-4 ${styles.text}`} />
        <span className={`text-sm font-medium ${styles.text}`}>
          {status === "NONE" ? "Not Verified" : status}
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-black">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-[var(--gold)]/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-[var(--gold)]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Identity Verification</h1>
                <p className="text-gray-400">Verify your identity to publish content</p>
              </div>
            </div>
            <StatusBadge status={status.status} />
          </div>

          {/* Approved Status */}
          {status.status === "APPROVED" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-green-400 mb-2">
                    Verification Approved
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Your identity has been verified. You can now publish content on VipOnly.
                  </p>
                  {status.verifiedAt && (
                    <p className="text-sm text-gray-400">
                      Verified on: {new Date(status.verifiedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Pending Status */}
          {status.status === "PENDING" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <Clock className="w-8 h-8 text-yellow-400 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                    Verification Pending
                  </h3>
                  <p className="text-gray-300">
                    Your documents are being reviewed. This usually takes 24-48 hours.
                    You will receive an email once the review is complete.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Rejected Status */}
          {status.status === "REJECTED" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-8"
            >
              <div className="flex items-start gap-4">
                <XCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-red-400 mb-2">
                    Verification Rejected
                  </h3>
                  <p className="text-gray-300 mb-2">
                    Unfortunately, your verification was not approved.
                  </p>
                  {status.rejectionReason && (
                    <p className="text-sm text-red-300 bg-red-500/10 px-3 py-2 rounded-lg">
                      Reason: {status.rejectionReason}
                    </p>
                  )}
                  <p className="text-gray-400 mt-4 text-sm">
                    Please submit new documents below.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Verification Form */}
          {(status.status === "NONE" || status.status === "REJECTED" || status.status === "EXPIRED") && (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Why Verification */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Why We Require Verification</h3>
                <ul className="space-y-3 text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[var(--gold)] mt-0.5 flex-shrink-0" />
                    <span>To comply with 18 U.S.C. 2257 record-keeping requirements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[var(--gold)] mt-0.5 flex-shrink-0" />
                    <span>To ensure all creators are at least 18 years old</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[var(--gold)] mt-0.5 flex-shrink-0" />
                    <span>To protect against fraud and identity theft</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[var(--gold)] mt-0.5 flex-shrink-0" />
                    <span>To enable payouts and financial transactions</span>
                  </li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Personal Information */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Legal Name (as shown on ID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-[var(--gold)]/50 focus:outline-none"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-[var(--gold)]/50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Document Type */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Document Type</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "PASSPORT", label: "Passport" },
                    { value: "ID_CARD", label: "ID Card" },
                    { value: "DRIVERS_LICENSE", label: "Driver's License" },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setDocumentType(type.value)}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        documentType === type.value
                          ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]"
                          : "border-white/10 text-gray-400 hover:border-white/30"
                      }`}
                    >
                      <FileText className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Document Upload */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Upload Documents</h3>

                {/* Document Front */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Document Front *
                  </label>
                  <input
                    ref={frontInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setDocumentFront(e.target.files?.[0] || null)}
                  />
                  <button
                    type="button"
                    onClick={() => frontInputRef.current?.click()}
                    className={`w-full p-6 border-2 border-dashed rounded-xl transition-colors ${
                      documentFront
                        ? "border-green-500/50 bg-green-500/10"
                        : "border-white/20 hover:border-white/40"
                    }`}
                  >
                    {documentFront ? (
                      <div className="flex items-center gap-4">
                        <img
                          src={getFilePreview(documentFront)!}
                          alt="Document front"
                          className="w-20 h-14 object-cover rounded-lg"
                        />
                        <div className="text-left">
                          <p className="text-green-400 font-medium">{documentFront.name}</p>
                          <p className="text-sm text-gray-400">Click to change</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-400">Click to upload front of document</p>
                      </div>
                    )}
                  </button>
                </div>

                {/* Document Back (for ID cards) */}
                {documentType !== "PASSPORT" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Document Back
                    </label>
                    <input
                      ref={backInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setDocumentBack(e.target.files?.[0] || null)}
                    />
                    <button
                      type="button"
                      onClick={() => backInputRef.current?.click()}
                      className={`w-full p-6 border-2 border-dashed rounded-xl transition-colors ${
                        documentBack
                          ? "border-green-500/50 bg-green-500/10"
                          : "border-white/20 hover:border-white/40"
                      }`}
                    >
                      {documentBack ? (
                        <div className="flex items-center gap-4">
                          <img
                            src={getFilePreview(documentBack)!}
                            alt="Document back"
                            className="w-20 h-14 object-cover rounded-lg"
                          />
                          <div className="text-left">
                            <p className="text-green-400 font-medium">{documentBack.name}</p>
                            <p className="text-sm text-gray-400">Click to change</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-400">Click to upload back of document</p>
                        </div>
                      )}
                    </button>
                  </div>
                )}

                {/* Selfie */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Selfie Holding Document *
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Take a photo of yourself holding your ID document next to your face
                  </p>
                  <input
                    ref={selfieInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setSelfie(e.target.files?.[0] || null)}
                  />
                  <button
                    type="button"
                    onClick={() => selfieInputRef.current?.click()}
                    className={`w-full p-6 border-2 border-dashed rounded-xl transition-colors ${
                      selfie
                        ? "border-green-500/50 bg-green-500/10"
                        : "border-white/20 hover:border-white/40"
                    }`}
                  >
                    {selfie ? (
                      <div className="flex items-center gap-4">
                        <img
                          src={getFilePreview(selfie)!}
                          alt="Selfie"
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="text-left">
                          <p className="text-green-400 font-medium">{selfie.name}</p>
                          <p className="text-sm text-gray-400">Click to change</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-400">Click to upload selfie with ID</p>
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Certifications */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Certifications</h3>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-white/20 bg-black/50 text-[var(--gold)] focus:ring-[var(--gold)]"
                  />
                  <span className="text-sm text-gray-300">
                    I certify that I am at least 18 years of age, the information provided is accurate,
                    and I am the person depicted in the uploaded documents. I understand that providing
                    false information may result in account termination and legal action.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-8 bg-gradient-to-r from-[var(--gold)] to-[var(--gold-dark)] text-black font-bold rounded-xl hover:shadow-lg hover:shadow-[var(--gold)]/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Submit for Verification
                  </>
                )}
              </button>

              {/* Privacy Note */}
              <p className="text-xs text-gray-500 text-center">
                Your documents are encrypted and stored securely. They will only be used for
                identity verification purposes and will not be shared with third parties.
              </p>
            </motion.form>
          )}
        </div>
      </main>
    </div>
  );
}
