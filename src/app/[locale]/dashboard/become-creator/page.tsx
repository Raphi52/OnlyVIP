"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  User,
  AlertTriangle,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui";

interface Application {
  id: string;
  displayName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export default function BecomeCreatorPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [documentType, setDocumentType] = useState("ID_CARD");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/creator/apply");
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: "error", text: "Format invalide. Utilisez JPG, PNG, WebP ou PDF." });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: "error", text: "Fichier trop grand. Maximum 10MB." });
      return;
    }

    setDocumentFile(file);
    if (file.type.startsWith("image/")) {
      setDocumentPreview(URL.createObjectURL(file));
    } else {
      setDocumentPreview(null);
    }
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      setMessage({ type: "error", text: "Le nom d'affichage est requis" });
      return;
    }

    if (!documentFile) {
      setMessage({ type: "error", text: "Un document d'identite est requis" });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("displayName", displayName.trim());
      formData.append("bio", bio.trim());
      formData.append("documentType", documentType);
      formData.append("document", documentFile);

      const res = await fetch("/api/creator/apply", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la soumission");
      }

      setMessage({ type: "success", text: "Candidature envoyee ! Nous la traiterons sous peu." });

      // Reset form
      setDisplayName("");
      setBio("");
      setDocumentFile(null);
      setDocumentPreview(null);

      // Refresh applications
      fetchApplications();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erreur lors de la soumission",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingApplication = applications.find((a) => a.status === "PENDING");
  const isCreator = (session?.user as any)?.isCreator;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  // Already a creator
  if (isCreator) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-2xl p-8 text-center"
        >
          <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Vous etes deja createur !</h1>
          <p className="text-gray-400 mb-6">
            Vous avez deja acces au dashboard createur.
          </p>
          <Button
            onClick={() => router.push("/dashboard/creator")}
            className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-semibold"
          >
            Aller au Dashboard Createur
          </Button>
        </motion.div>
      </div>
    );
  }

  // Has pending application
  if (pendingApplication) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a2e] border border-yellow-500/30 rounded-2xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Candidature en attente</h1>
              <p className="text-gray-400 text-sm">
                Soumise le {new Date(pendingApplication.createdAt).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>

          <div className="bg-black/30 rounded-xl p-4 mb-6">
            <p className="text-gray-300">
              <span className="text-gray-500">Nom :</span> {pendingApplication.displayName}
            </p>
          </div>

          <div className="flex items-center gap-2 text-yellow-400 bg-yellow-500/10 rounded-lg p-4">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">
              Votre candidature est en cours de verification. Vous recevrez une notification une fois traitee.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Devenir Createur</h1>
          <p className="text-gray-400">
            Remplissez le formulaire ci-dessous pour devenir createur sur notre plateforme.
            Un document d&apos;identite est requis pour la verification.
          </p>
        </div>

        {/* Previous applications */}
        {applications.length > 0 && (
          <div className="mb-6 space-y-3">
            {applications.filter((a) => a.status !== "PENDING").map((app) => (
              <div
                key={app.id}
                className={`p-4 rounded-xl border ${
                  app.status === "APPROVED"
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-red-500/10 border-red-500/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  {app.status === "APPROVED" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span className="font-medium text-white">{app.displayName}</span>
                  <span className="text-sm text-gray-400">
                    - {app.status === "APPROVED" ? "Approuvee" : "Rejetee"}
                  </span>
                </div>
                {app.rejectionReason && (
                  <p className="text-sm text-red-400 mt-2">
                    Raison: {app.rejectionReason}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="bg-[#1a1a2e] rounded-2xl p-6 space-y-6">
          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.type === "success"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Nom d&apos;affichage *
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Le nom qui sera affiche sur votre profil"
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bio (optionnel)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Parlez un peu de vous..."
              rows={3}
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Document Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Type de document
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white focus:border-yellow-500 focus:outline-none transition-colors"
            >
              <option value="ID_CARD">Carte d&apos;identite</option>
              <option value="PASSPORT">Passeport</option>
              <option value="DRIVERS_LICENSE">Permis de conduire</option>
            </select>
          </div>

          {/* Document Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Upload className="w-4 h-4 inline mr-2" />
              Photo du document *
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Prenez une photo claire de votre document d&apos;identite. Les informations doivent etre lisibles.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {documentPreview ? (
              <div className="relative">
                <img
                  src={documentPreview}
                  alt="Document preview"
                  className="w-full max-h-64 object-contain rounded-xl border border-gray-700"
                />
                <button
                  type="button"
                  onClick={() => {
                    setDocumentFile(null);
                    setDocumentPreview(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ) : documentFile ? (
              <div className="flex items-center gap-3 p-4 bg-black/30 rounded-xl border border-gray-700">
                <FileText className="w-8 h-8 text-yellow-400" />
                <div className="flex-1">
                  <p className="text-white text-sm truncate">{documentFile.name}</p>
                  <p className="text-gray-500 text-xs">
                    {(documentFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDocumentFile(null);
                    setDocumentPreview(null);
                  }}
                  className="p-2 text-red-400 hover:text-red-300 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-8 border-2 border-dashed border-gray-700 rounded-xl hover:border-yellow-500/50 transition-colors group"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center group-hover:bg-yellow-500/30 transition-colors">
                    <Upload className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">Cliquez pour uploader</p>
                    <p className="text-gray-500 text-sm">JPG, PNG, WebP ou PDF (max 10MB)</p>
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || !displayName.trim() || !documentFile}
            className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Crown className="w-5 h-5 mr-2" />
                Soumettre ma candidature
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            En soumettant ce formulaire, vous acceptez nos conditions d&apos;utilisation et notre politique de confidentialite.
          </p>
        </form>
      </motion.div>
    </div>
  );
}
