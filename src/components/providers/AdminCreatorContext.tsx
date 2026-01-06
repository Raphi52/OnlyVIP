"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useSession } from "next-auth/react";

export interface Creator {
  id?: string;
  slug: string;
  name: string;
  displayName: string;
  avatar: string | null;
  coverImage: string | null;
  bio?: string | null;
  userId?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };
  theme?: {
    primaryColor?: string;
    accentColor?: string;
  };
  stats?: {
    photos: number;
    videos: number;
    subscribers: number;
  };
  isActive?: boolean;
}

export interface Agency {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

interface AdminCreatorContextType {
  selectedCreator: Creator | null;
  setSelectedCreator: (creator: Creator) => void;
  creators: Creator[];
  isLoading: boolean;
  refreshCreator: () => Promise<void>;
  refreshCreators: () => Promise<void>;
  // Agency support
  agency: Agency | null;
  agencyCreators: Creator[];
  refreshAgency: () => Promise<void>;
}

const AdminCreatorContext = createContext<AdminCreatorContextType | undefined>(undefined);

const SELECTED_CREATOR_KEY = "selectedCreatorSlug";

export function AdminCreatorProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [selectedCreator, setSelectedCreatorState] = useState<Creator | null>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [agencyCreators, setAgencyCreators] = useState<Creator[]>([]);

  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const isCreator = (session?.user as any)?.isCreator === true;
  const isAgencyOwner = (session?.user as any)?.isAgencyOwner === true;

  // Fetch agency data for agency owners
  const fetchAgency = useCallback(async () => {
    if (!session?.user?.id || !isAgencyOwner) {
      setAgency(null);
      setAgencyCreators([]);
      return;
    }

    try {
      const res = await fetch("/api/agency");
      if (res.ok) {
        const data = await res.json();
        if (data.agencies && data.agencies.length > 0) {
          const agencyData = data.agencies[0];
          setAgency({
            id: agencyData.id,
            name: agencyData.name,
            slug: agencyData.slug,
            logo: agencyData.logo || null,
          });
          // Map agency creators to Creator interface
          const agencyCreatorsList = (agencyData.creators || []).map((c: any) => ({
            slug: c.slug,
            name: c.name,
            displayName: c.displayName,
            avatar: c.avatar,
            coverImage: null,
          }));
          setAgencyCreators(agencyCreatorsList);
        }
      }
    } catch (error) {
      console.error("Error fetching agency:", error);
    }
  }, [session?.user?.id, isAgencyOwner]);

  // Fetch creators that belong to the current user (for the selector dropdown)
  // Admins can see all creators in admin pages, but the selector only shows their own
  const fetchCreators = useCallback(async () => {
    if (!session?.user?.id || !isCreator) {
      setCreators([]);
      setSelectedCreatorState(null);
      setIsLoading(false);
      return;
    }

    try {
      // Always fetch only the user's own creators for the selector
      // Admin pages use /api/admin/creators separately to show all creators
      const res = await fetch("/api/creator/my-profiles");

      if (res.ok) {
        const data = await res.json();
        const creatorList = data.creators || [];
        setCreators(creatorList);

        // Try to restore previously selected creator from localStorage
        const savedSlug = localStorage.getItem(SELECTED_CREATOR_KEY);
        const savedCreator = creatorList.find((c: Creator) => c.slug === savedSlug);

        if (savedCreator) {
          setSelectedCreatorState(savedCreator);
        } else if (creatorList.length > 0) {
          // Default to first creator
          setSelectedCreatorState(creatorList[0]);
          localStorage.setItem(SELECTED_CREATOR_KEY, creatorList[0].slug);
        }
      }
    } catch (error) {
      console.error("Error fetching creators:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, isCreator]);

  // Fetch creators when session is ready
  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && isCreator) {
      fetchCreators();
    } else {
      setCreators([]);
      setSelectedCreatorState(null);
      setIsLoading(false);
    }
  }, [status, isCreator, fetchCreators]);

  // Fetch agency data when session is ready
  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && isAgencyOwner) {
      fetchAgency();
    } else if (!isAgencyOwner) {
      // Only clear if user is definitely not an agency owner
      setAgency(null);
      setAgencyCreators([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isAgencyOwner]);

  // Set selected creator and persist to localStorage
  const handleSetCreator = useCallback((newCreator: Creator) => {
    setSelectedCreatorState(newCreator);
    localStorage.setItem(SELECTED_CREATOR_KEY, newCreator.slug);
  }, []);

  // Refresh selected creator's data from API
  const refreshCreator = useCallback(async () => {
    if (!selectedCreator?.slug) return;

    try {
      const res = await fetch(`/api/creators/${selectedCreator.slug}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCreatorState(data);
        // Also update in creators list
        setCreators(prev => prev.map(c => c.slug === data.slug ? data : c));
        // Also update in agencyCreators list if present
        setAgencyCreators(prev => prev.map(c => c.slug === data.slug ? { ...c, avatar: data.avatar, displayName: data.displayName } : c));
      }
    } catch (error) {
      console.error("Error refreshing creator:", error);
    }
  }, [selectedCreator?.slug]);

  return (
    <AdminCreatorContext.Provider
      value={{
        selectedCreator,
        setSelectedCreator: handleSetCreator,
        creators,
        isLoading: isLoading || status === "loading",
        refreshCreator,
        refreshCreators: fetchCreators,
        agency,
        agencyCreators,
        refreshAgency: fetchAgency,
      }}
    >
      {children}
    </AdminCreatorContext.Provider>
  );
}

export function useAdminCreator() {
  const context = useContext(AdminCreatorContext);
  if (!context) {
    throw new Error("useAdminCreator must be used within AdminCreatorProvider");
  }
  return context;
}
