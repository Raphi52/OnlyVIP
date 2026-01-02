"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  X,
  Loader2,
  Copy,
  Settings,
  Trash2,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Check,
  Search,
  Sparkles,
  Zap,
  FolderOpen,
  ChevronRight,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Image,
  MoreHorizontal,
  FolderPlus,
  Eye,
  Code,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SCRIPT_VARIABLES,
  CATEGORY_NAMES,
  getVariablesByCategory,
  parseScriptVariables,
  getSampleContext,
  extractVariables,
} from "@/lib/scripts/variables";

interface ScriptMedia {
  id: string;
  media: {
    id: string;
    contentUrl: string;
    type: string;
    thumbnailUrl: string | null;
  };
}

interface Script {
  id: string;
  name: string;
  content: string;
  category: string;
  creatorSlug: string | null;
  folderId: string | null;
  folder: { id: string; name: string; color: string | null; icon: string | null } | null;
  author: { id: string; name: string | null; image: string | null } | null;
  approvedBy: { id: string; name: string | null } | null;
  status: string;
  rejectionReason: string | null;
  hasVariables: boolean;
  variables: string | null;
  mediaItems: ScriptMedia[];
  usageCount: number;
  messagesSent: number;
  salesGenerated: number;
  revenueGenerated: number;
  conversionRate: number;
  isFavorite: boolean;
  isActive: boolean;
  createdAt: string;
}

interface Folder {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  parentId: string | null;
  scriptCount: number;
  children?: Folder[];
}

interface Agency {
  id: string;
  name: string;
  creators: { slug: string; displayName: string }[];
}

const CATEGORIES = [
  { value: "GREETING", label: "Greeting", icon: "👋", color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/30" },
  { value: "PPV_PITCH", label: "PPV Pitch", icon: "💎", color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30" },
  { value: "FOLLOW_UP", label: "Follow Up", icon: "💬", color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30" },
  { value: "CLOSING", label: "Closing", icon: "🎯", color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/30" },
  { value: "CUSTOM", label: "Custom", icon: "✨", color: "text-pink-400", bg: "bg-pink-500/20", border: "border-pink-500/30" },
];

const STATUS_STYLES = {
  APPROVED: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/20" },
  PENDING: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/20" },
  REJECTED: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/20" },
  DRAFT: { icon: AlertCircle, color: "text-gray-400", bg: "bg-gray-500/20" },
};

type TabType = "all" | "pending" | "favorites";

export default function ScriptsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [agency, setAgency] = useState<Agency | null>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [unfolderedCount, setUnfolderedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [showFoldersSidebar, setShowFoldersSidebar] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showVariablesPanel, setShowVariablesPanel] = useState(false);

  // Folder modal
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [folderName, setFolderName] = useState("");
  const [folderColor, setFolderColor] = useState("#8b5cf6");
  const [folderIcon, setFolderIcon] = useState("📁");

  // Form state
  const [formName, setFormName] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState("GREETING");
  const [formCreatorSlug, setFormCreatorSlug] = useState<string | null>(null);
  const [formFolderId, setFormFolderId] = useState<string | null>(null);

  const isAgencyOwner = (session?.user as any)?.isAgencyOwner === true;

  useEffect(() => {
    if (status === "authenticated" && !isAgencyOwner) {
      router.push("/dashboard");
    }
  }, [status, isAgencyOwner, router]);

  const fetchScripts = useCallback(async (agencyId: string) => {
    const params = new URLSearchParams({ agencyId });
    if (activeTab === "pending") params.set("status", "PENDING");
    if (activeTab === "favorites") params.set("favorites", "true");
    if (selectedFolderId) params.set("folderId", selectedFolderId);
    if (filterCategory) params.set("category", filterCategory);
    if (searchQuery) params.set("search", searchQuery);

    const scriptsRes = await fetch(`/api/agency/scripts?${params}`);
    if (scriptsRes.ok) {
      const scriptsData = await scriptsRes.json();
      setScripts(scriptsData.scripts || []);
      setPendingCount(scriptsData.pendingCount || 0);
    }
  }, [activeTab, selectedFolderId, filterCategory, searchQuery]);

  const fetchFolders = useCallback(async (agencyId: string) => {
    const foldersRes = await fetch(`/api/agency/scripts/folders?agencyId=${agencyId}`);
    if (foldersRes.ok) {
      const foldersData = await foldersRes.json();
      setFolders(foldersData.folders || []);
      setUnfolderedCount(foldersData.unfolderedCount || 0);
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const agencyRes = await fetch("/api/agency");
        if (agencyRes.ok) {
          const agencyData = await agencyRes.json();
          if (agencyData.agencies?.[0]) {
            const ag = agencyData.agencies[0];
            setAgency(ag);
            await Promise.all([
              fetchScripts(ag.id),
              fetchFolders(ag.id),
            ]);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (status === "authenticated" && isAgencyOwner) {
      fetchData();
    }
  }, [status, isAgencyOwner, fetchScripts, fetchFolders]);

  // Refetch when filters change
  useEffect(() => {
    if (agency) {
      fetchScripts(agency.id);
    }
  }, [agency, activeTab, selectedFolderId, filterCategory, searchQuery, fetchScripts]);

  const openCreateModal = () => {
    setEditingScript(null);
    setFormName("");
    setFormContent("");
    setFormCategory("GREETING");
    setFormCreatorSlug(null);
    setFormFolderId(selectedFolderId);
    setShowPreview(false);
    setShowVariablesPanel(false);
    setShowModal(true);
  };

  const openEditModal = (script: Script) => {
    setEditingScript(script);
    setFormName(script.name);
    setFormContent(script.content);
    setFormCategory(script.category);
    setFormCreatorSlug(script.creatorSlug);
    setFormFolderId(script.folderId);
    setShowPreview(false);
    setShowVariablesPanel(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!agency) return;

    setIsSaving(true);
    try {
      const payload = {
        agencyId: agency.id,
        name: formName,
        content: formContent,
        category: formCategory,
        creatorSlug: formCreatorSlug,
        folderId: formFolderId,
      };

      if (editingScript) {
        const res = await fetch("/api/agency/scripts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingScript.id, ...payload }),
        });

        if (res.ok) {
          await fetchScripts(agency.id);
          setShowModal(false);
        } else {
          const error = await res.json();
          alert(error.error || "Failed to update script");
        }
      } else {
        const res = await fetch("/api/agency/scripts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          await Promise.all([fetchScripts(agency.id), fetchFolders(agency.id)]);
          setShowModal(false);
        } else {
          const error = await res.json();
          alert(error.error || "Failed to create script");
        }
      }
    } catch (error) {
      console.error("Error saving script:", error);
      alert("Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveReject = async (script: Script, action: "approve" | "reject", reason?: string) => {
    if (!agency) return;

    try {
      const res = await fetch("/api/agency/scripts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: script.id,
          action,
          rejectionReason: reason,
        }),
      });

      if (res.ok) {
        await fetchScripts(agency.id);
      }
    } catch (error) {
      console.error("Error updating script status:", error);
    }
  };

  const toggleFavorite = async (script: Script) => {
    if (!agency) return;

    try {
      await fetch("/api/agency/scripts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: script.id,
          isFavorite: !script.isFavorite,
        }),
      });
      await fetchScripts(agency.id);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const duplicateScript = async (script: Script) => {
    if (!agency) return;

    try {
      const res = await fetch(`/api/agency/scripts/${script.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        await Promise.all([fetchScripts(agency.id), fetchFolders(agency.id)]);
      }
    } catch (error) {
      console.error("Error duplicating script:", error);
    }
  };

  const copyToClipboard = async (script: Script) => {
    // Parse variables before copying
    const parsedContent = parseScriptVariables(script.content, getSampleContext());
    await navigator.clipboard.writeText(parsedContent);
    setCopiedId(script.id);
    setTimeout(() => setCopiedId(null), 2000);

    try {
      await fetch("/api/agency/scripts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: script.id }),
      });
    } catch (error) {
      console.error("Error tracking usage:", error);
    }
  };

  const deleteScript = async (script: Script) => {
    if (!confirm(`Are you sure you want to delete "${script.name}"?`)) return;
    if (!agency) return;

    try {
      const res = await fetch(`/api/agency/scripts?id=${script.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await Promise.all([fetchScripts(agency.id), fetchFolders(agency.id)]);
      }
    } catch (error) {
      console.error("Error deleting script:", error);
    }
  };

  // Folder CRUD
  const handleSaveFolder = async () => {
    if (!agency || !folderName) return;

    try {
      if (editingFolder) {
        await fetch("/api/agency/scripts/folders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingFolder.id,
            name: folderName,
            color: folderColor,
            icon: folderIcon,
          }),
        });
      } else {
        await fetch("/api/agency/scripts/folders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agencyId: agency.id,
            name: folderName,
            color: folderColor,
            icon: folderIcon,
          }),
        });
      }

      await fetchFolders(agency.id);
      setShowFolderModal(false);
      setEditingFolder(null);
      setFolderName("");
    } catch (error) {
      console.error("Error saving folder:", error);
    }
  };

  const deleteFolder = async (folder: Folder) => {
    if (!confirm(`Delete folder "${folder.name}"? Scripts will be moved out.`)) return;
    if (!agency) return;

    try {
      await fetch(`/api/agency/scripts/folders?id=${folder.id}`, {
        method: "DELETE",
      });
      await Promise.all([fetchScripts(agency.id), fetchFolders(agency.id)]);
      if (selectedFolderId === folder.id) {
        setSelectedFolderId(null);
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
    }
  };

  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[4];
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById("script-content") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = formContent.substring(0, start) + variable + formContent.substring(end);
      setFormContent(newContent);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      setFormContent(formContent + variable);
    }
  };

  // Get parsed preview
  const getPreviewContent = () => {
    return parseScriptVariables(formContent, getSampleContext());
  };

  // Extract used variables
  const usedVariables = extractVariables(formContent);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="p-3 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8 pb-24 pb-safe overflow-x-hidden max-w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 mb-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                Scripts Library
              </h1>
            </div>
            <p className="text-sm text-gray-400">
              {scripts.length} scripts • {folders.length} folders
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setEditingFolder(null);
                setFolderName("");
                setFolderColor("#8b5cf6");
                setFolderIcon("📁");
                setShowFolderModal(true);
              }}
              className="hidden sm:flex w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-gray-400 items-center justify-center hover:bg-white/10 transition-colors"
            >
              <FolderPlus className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openCreateModal}
              className="w-11 h-11 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 touch-manipulation active:shadow-none"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Script</span>
            </motion.button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 -mx-3 px-3 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-[1px] whitespace-nowrap flex-shrink-0",
              activeTab === "all"
                ? "border-purple-500 text-white"
                : "border-transparent text-gray-400 hover:text-gray-300"
            )}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={cn(
              "px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-[1px] flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0",
              activeTab === "pending"
                ? "border-yellow-500 text-white"
                : "border-transparent text-gray-400 hover:text-gray-300"
            )}
          >
            <span className="hidden sm:inline">Pending</span>
            <span className="sm:hidden">Review</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("favorites")}
            className={cn(
              "px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-[1px] flex items-center gap-1.5 whitespace-nowrap flex-shrink-0",
              activeTab === "favorites"
                ? "border-pink-500 text-white"
                : "border-transparent text-gray-400 hover:text-gray-300"
            )}
          >
            <Star className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Favorites</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search scripts..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide snap-x snap-mandatory touch-pan-x">
          <button
            onClick={() => setFilterCategory(null)}
            className={cn(
              "px-3.5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 snap-start touch-manipulation",
              !filterCategory
                ? "bg-white text-black shadow-lg"
                : "bg-white/5 text-gray-400 hover:bg-white/10 active:bg-white/15"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(cat.value)}
              className={cn(
                "px-3.5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 snap-start touch-manipulation",
                filterCategory === cat.value
                  ? `${cat.bg} ${cat.color} ${cat.border} border`
                  : "bg-white/5 text-gray-400 hover:bg-white/10 active:bg-white/15"
              )}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex gap-4 sm:gap-6 min-w-0 overflow-hidden">
        {/* Folders Sidebar - Desktop */}
        {showFoldersSidebar && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block w-64 flex-shrink-0"
          >
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sticky top-24">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Folders</h3>
                <button
                  onClick={() => {
                    setEditingFolder(null);
                    setFolderName("");
                    setFolderColor("#8b5cf6");
                    setFolderIcon("📁");
                    setShowFolderModal(true);
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                {/* All scripts */}
                <button
                  onClick={() => setSelectedFolderId(null)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all",
                    selectedFolderId === null
                      ? "bg-purple-500/20 text-purple-400"
                      : "text-gray-400 hover:bg-white/5"
                  )}
                >
                  <FolderOpen className="w-4 h-4" />
                  <span className="flex-1 text-left">All Scripts</span>
                  <span className="text-xs text-gray-500">{scripts.length + unfolderedCount}</span>
                </button>

                {/* Unfoldered */}
                <button
                  onClick={() => setSelectedFolderId("null")}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all",
                    selectedFolderId === "null"
                      ? "bg-purple-500/20 text-purple-400"
                      : "text-gray-400 hover:bg-white/5"
                  )}
                >
                  <FileText className="w-4 h-4" />
                  <span className="flex-1 text-left">Unfoldered</span>
                  <span className="text-xs text-gray-500">{unfolderedCount}</span>
                </button>

                {/* Folder list */}
                {folders.map((folder) => (
                  <div key={folder.id} className="group">
                    <button
                      onClick={() => setSelectedFolderId(folder.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all",
                        selectedFolderId === folder.id
                          ? "bg-purple-500/20 text-purple-400"
                          : "text-gray-400 hover:bg-white/5"
                      )}
                    >
                      <span>{folder.icon || "📁"}</span>
                      <span className="flex-1 text-left truncate">{folder.name}</span>
                      <span className="text-xs text-gray-500">{folder.scriptCount}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFolder(folder);
                          setFolderName(folder.name);
                          setFolderColor(folder.color || "#8b5cf6");
                          setFolderIcon(folder.icon || "📁");
                          setShowFolderModal(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-all"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Scripts List */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {scripts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 px-4"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                <FileText className="w-10 h-10 text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2 text-center">
                {activeTab === "pending" ? "No pending scripts" : "No scripts yet"}
              </h2>
              <p className="text-sm text-gray-400 text-center mb-6 max-w-xs">
                {activeTab === "pending"
                  ? "All scripts have been reviewed"
                  : "Create your first script to help chatters respond faster"}
              </p>
              {activeTab === "all" && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={openCreateModal}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium shadow-lg shadow-purple-500/25 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create First Script
                </motion.button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-3 overflow-hidden">
              {scripts.map((script, index) => {
                const catInfo = getCategoryInfo(script.category);
                const isCopied = copiedId === script.id;
                const statusStyle = STATUS_STYLES[script.status as keyof typeof STATUS_STYLES] || STATUS_STYLES.DRAFT;
                const StatusIcon = statusStyle.icon;

                return (
                  <motion.div
                    key={script.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group"
                  >
                    <div className={cn(
                      "relative bg-white/5 backdrop-blur-sm border rounded-2xl p-3 sm:p-4 hover:bg-white/[0.07] transition-all overflow-hidden",
                      script.status === "PENDING" ? "border-yellow-500/30" : "border-white/10 hover:border-white/20"
                    )}>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 sm:gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1.5">
                            <span className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                              catInfo.bg, catInfo.color
                            )}>
                              <span>{catInfo.icon}</span>
                              <span className="hidden sm:inline">{catInfo.label}</span>
                            </span>
                            {script.status !== "APPROVED" && (
                              <span className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                statusStyle.bg, statusStyle.color
                              )}>
                                <StatusIcon className="w-3 h-3" />
                                <span className="hidden sm:inline">{script.status}</span>
                              </span>
                            )}
                            {script.folder && (
                              <span className="hidden sm:flex px-2 py-0.5 rounded-full text-xs bg-white/10 text-gray-400 items-center gap-1">
                                <span>{script.folder.icon || "📁"}</span>
                                {script.folder.name}
                              </span>
                            )}
                            {script.creatorSlug && (
                              <span className="hidden sm:inline px-2 py-0.5 rounded-full text-xs bg-white/10 text-gray-400">
                                @{script.creatorSlug}
                              </span>
                            )}
                            {script.hasVariables && (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400 flex items-center gap-1">
                                <Code className="w-3 h-3" />
                                <span className="hidden sm:inline">Variables</span>
                              </span>
                            )}
                            {script.mediaItems.length > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-pink-500/20 text-pink-400 flex items-center gap-1">
                                <Image className="w-3 h-3" />
                                {script.mediaItems.length}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white truncate text-sm sm:text-base">
                              {script.name}
                            </h3>
                            {script.isFavorite && (
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => toggleFavorite(script)}
                            className={cn(
                              "p-2 rounded-lg transition-colors",
                              script.isFavorite
                                ? "text-yellow-400 hover:bg-yellow-500/10"
                                : "text-gray-400 hover:text-yellow-400 hover:bg-white/10"
                            )}
                          >
                            <Star className={cn("w-4 h-4", script.isFavorite && "fill-current")} />
                          </button>
                          <button
                            onClick={() => openEditModal(script)}
                            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => duplicateScript(script)}
                            className="hidden sm:block p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteScript(script)}
                            className="hidden sm:block p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Content Preview */}
                      <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                        {script.content}
                      </p>

                      {/* Rejection reason */}
                      {script.status === "REJECTED" && script.rejectionReason && (
                        <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                          <p className="text-xs text-red-400">
                            <span className="font-medium">Rejection reason:</span> {script.rejectionReason}
                          </p>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {/* Stats */}
                        <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-500 overflow-x-auto scrollbar-hide">
                          <span className="flex items-center gap-1 flex-shrink-0" title="Usage count">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="text-gray-400">{script.usageCount}</span>
                          </span>
                          <span className="flex items-center gap-1 flex-shrink-0" title="Sales generated">
                            <DollarSign className="w-3.5 h-3.5" />
                            <span className="text-gray-400">{script.salesGenerated}</span>
                          </span>
                          {script.revenueGenerated > 0 && (
                            <span className="flex items-center gap-1 text-emerald-400 flex-shrink-0" title="Revenue">
                              ${script.revenueGenerated.toFixed(0)}
                            </span>
                          )}
                          {script.conversionRate > 0 && (
                            <span className="hidden sm:flex items-center gap-1 flex-shrink-0" title="Conversion rate">
                              <TrendingUp className="w-3.5 h-3.5" />
                              <span className="text-gray-400">{script.conversionRate.toFixed(1)}%</span>
                            </span>
                          )}
                          {script.author && (
                            <span className="hidden sm:inline text-gray-500 flex-shrink-0">
                              by {script.author.name || "Unknown"}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Pending actions */}
                          {script.status === "PENDING" && (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleApproveReject(script, "reject", prompt("Rejection reason (optional):")!)}
                                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                              >
                                <XCircle className="w-4 h-4" />
                                <span className="hidden sm:inline">Reject</span>
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleApproveReject(script, "approve")}
                                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-sm font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Approve</span>
                              </motion.button>
                            </>
                          )}

                          {/* Copy button */}
                          {script.status === "APPROVED" && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => copyToClipboard(script)}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all touch-manipulation",
                                isCopied
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 active:bg-purple-500/40"
                              )}
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-4 h-4" />
                                  <span className="hidden sm:inline">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" />
                                  <span className="hidden sm:inline">Copy</span>
                                </>
                              )}
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Script Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-xl"
            />

            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full sm:max-w-2xl max-h-[90dvh] sm:max-h-[85vh] overflow-hidden"
            >
              <div className="absolute -inset-[1px] rounded-t-3xl sm:rounded-3xl blur-sm bg-gradient-to-b from-purple-500/30 via-pink-500/20 to-transparent" />

              <div className="relative bg-[#0a0a0c]/95 border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden backdrop-blur-2xl">
                <div className="sm:hidden flex justify-center pt-3">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Header */}
                <div className="p-5 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                        {editingScript ? <Settings className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">
                          {editingScript ? "Edit Script" : "New Script"}
                        </h2>
                        <p className="text-xs text-gray-400">
                          {editingScript ? "Update your script" : "Create a reusable message"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        className={cn(
                          "p-2 rounded-xl transition-colors",
                          showPreview ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-gray-400 hover:bg-white/10"
                        )}
                        title="Preview"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setShowVariablesPanel(!showVariablesPanel)}
                        className={cn(
                          "hidden sm:block p-2 rounded-xl transition-colors",
                          showVariablesPanel ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-gray-400 hover:bg-white/10"
                        )}
                        title="Variables"
                      >
                        <Code className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setShowModal(false)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-4 sm:px-5 pb-5 max-h-[50dvh] sm:max-h-[55vh] overflow-y-auto overscroll-contain">
                  <div className="flex gap-4">
                    {/* Main Form */}
                    <div className={cn("space-y-4 transition-all w-full", showVariablesPanel && "sm:flex-1")}>
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Script Name
                        </label>
                        <input
                          type="text"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="Welcome Message"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
                        />
                      </div>

                      {/* Category & Folder */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Category
                          </label>
                          <select
                            value={formCategory}
                            onChange={(e) => setFormCategory(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50 transition-all"
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat.value} value={cat.value}>
                                {cat.icon} {cat.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Folder
                          </label>
                          <select
                            value={formFolderId || ""}
                            onChange={(e) => setFormFolderId(e.target.value || null)}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50 transition-all"
                          >
                            <option value="">No folder</option>
                            {folders.map((folder) => (
                              <option key={folder.id} value={folder.id}>
                                {folder.icon || "📁"} {folder.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Creator */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          For Creator (optional)
                        </label>
                        <select
                          value={formCreatorSlug || ""}
                          onChange={(e) => setFormCreatorSlug(e.target.value || null)}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50 transition-all"
                        >
                          <option value="">Global (all creators)</option>
                          {agency?.creators.map((creator) => (
                            <option key={creator.slug} value={creator.slug}>
                              {creator.displayName} (@{creator.slug})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Content */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Script Content
                        </label>
                        {showPreview ? (
                          <div className="w-full px-4 py-3 rounded-xl bg-white/5 border border-purple-500/30 min-h-[120px]">
                            <p className="text-sm text-gray-300 whitespace-pre-wrap">
                              {getPreviewContent()}
                            </p>
                          </div>
                        ) : (
                          <textarea
                            id="script-content"
                            value={formContent}
                            onChange={(e) => setFormContent(e.target.value)}
                            placeholder="Hey {{fanName}}! Thanks for subscribing..."
                            rows={5}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 transition-all resize-none font-mono text-sm"
                          />
                        )}
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-xs text-gray-500">
                            {formContent.length} characters
                            {usedVariables.length > 0 && (
                              <span className="ml-2 text-blue-400">
                                • {usedVariables.length} variable{usedVariables.length > 1 ? "s" : ""}
                              </span>
                            )}
                          </p>
                          {showPreview && (
                            <p className="text-xs text-purple-400">Preview mode</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Variables Panel - Hidden on mobile */}
                    <AnimatePresence>
                      {showVariablesPanel && (
                        <motion.div
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 240 }}
                          exit={{ opacity: 0, width: 0 }}
                          className="hidden sm:block border-l border-white/10 pl-4 overflow-hidden"
                        >
                          <h4 className="text-sm font-semibold text-white mb-3">Variables</h4>
                          <div className="space-y-4">
                            {Object.entries(getVariablesByCategory()).map(([category, variables]) => (
                              <div key={category}>
                                <h5 className="text-xs font-medium text-gray-500 mb-2">
                                  {CATEGORY_NAMES[category] || category}
                                </h5>
                                <div className="space-y-1">
                                  {variables.map((v) => (
                                    <button
                                      key={v.key}
                                      onClick={() => insertVariable(v.key)}
                                      className="w-full flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left group"
                                    >
                                      <div>
                                        <p className="text-xs font-mono text-purple-400">{v.key}</p>
                                        <p className="text-[10px] text-gray-500">{v.description}</p>
                                      </div>
                                      <Plus className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-5 pt-4 pb-safe border-t border-white/5">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-3.5 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 active:bg-white/10 transition-all font-medium touch-manipulation"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSave}
                      disabled={isSaving || !formName || !formContent}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    >
                      {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          {editingScript ? "Update" : "Create"}
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Folder Modal */}
      <AnimatePresence>
        {showFolderModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowFolderModal(false)}
          >
            <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-xl" />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-[#0a0a0c]/95 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-2xl"
            >
              <div className="p-5">
                <h2 className="text-lg font-bold text-white mb-4">
                  {editingFolder ? "Edit Folder" : "New Folder"}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Folder Name
                    </label>
                    <input
                      type="text"
                      value={folderName}
                      onChange={(e) => setFolderName(e.target.value)}
                      placeholder="PPV Scripts"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Color
                      </label>
                      <input
                        type="color"
                        value={folderColor}
                        onChange={(e) => setFolderColor(e.target.value)}
                        className="w-full h-12 rounded-xl bg-white/5 border border-white/10 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Icon
                      </label>
                      <input
                        type="text"
                        value={folderIcon}
                        onChange={(e) => setFolderIcon(e.target.value)}
                        placeholder="📁"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-center text-xl focus:outline-none focus:border-purple-500/50 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  {editingFolder && (
                    <button
                      onClick={() => {
                        deleteFolder(editingFolder);
                        setShowFolderModal(false);
                      }}
                      className="px-4 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all font-medium"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    onClick={() => setShowFolderModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveFolder}
                    disabled={!folderName}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold disabled:opacity-50"
                  >
                    {editingFolder ? "Update" : "Create"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
