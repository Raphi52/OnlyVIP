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

interface AdminCreatorContextType {
  selectedCreator: Creator | null;
  setSelectedCreator: (creator: Creator) => void;
  creators: Creator[];
  isLoading: boolean;
  refreshCreator: () => Promise<void>;
  refreshCreators: () => Promise<void>;
}

const AdminCreatorContext = createContext<AdminCreatorContextType | undefined>(undefined);

const SELECTED_CREATOR_KEY = "selectedCreatorSlug";

export function AdminCreatorProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [selectedCreator, setSelectedCreatorState] = useState<Creator | null>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const isCreator = (session?.user as any)?.isCreator === true;

  // Fetch all creators for the user
  const fetchCreators = useCallback(async () => {
    if (!session?.user?.id || (!isAdmin && !isCreator)) {
      setCreators([]);
      setSelectedCreatorState(null);
      setIsLoading(false);
      return;
    }

    try {
      // For admin, fetch all creators; for creator, fetch their profiles
      const endpoint = isAdmin ? "/api/admin/creators" : "/api/creator/my-profiles";
      const res = await fetch(endpoint);

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
  }, [session?.user?.id, isAdmin, isCreator]);

  // Fetch creators when session is ready
  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && (isAdmin || isCreator)) {
      fetchCreators();
    } else {
      setCreators([]);
      setSelectedCreatorState(null);
      setIsLoading(false);
    }
  }, [status, isAdmin, isCreator, fetchCreators]);

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
