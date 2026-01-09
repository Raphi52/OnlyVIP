"use client";

import { useEffect, useState, useCallback } from "react";

export interface CreatorPermissions {
  canEdit: boolean;
  canUploadMedia: boolean;
  canSendMessages: boolean;
  canRequestPayout: boolean;
  canAccessAI: boolean;
  canAccessScripts: boolean;
  canViewEarnings: boolean;
  canViewConversations: boolean;
  canBreakup: boolean;
  isAgencyManaged: boolean;
  agencyId: string | null;
  agencyName: string | null;
}

const defaultPermissions: CreatorPermissions = {
  canEdit: true,
  canUploadMedia: true,
  canSendMessages: true,
  canRequestPayout: true,
  canAccessAI: true,
  canAccessScripts: true,
  canViewEarnings: true,
  canViewConversations: true,
  canBreakup: false,
  isAgencyManaged: false,
  agencyId: null,
  agencyName: null,
};

interface UseCreatorPermissionsResult {
  permissions: CreatorPermissions;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Cache permissions per creator slug to avoid repeated fetches
const permissionsCache = new Map<string, CreatorPermissions>();

export function useCreatorPermissions(
  creatorSlug: string | null | undefined
): UseCreatorPermissionsResult {
  const [permissions, setPermissions] = useState<CreatorPermissions>(defaultPermissions);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    if (!creatorSlug) {
      setPermissions(defaultPermissions);
      return;
    }

    // Check cache first
    const cached = permissionsCache.get(creatorSlug);
    if (cached) {
      setPermissions(cached);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/creator/permissions?creator=${encodeURIComponent(creatorSlug)}`);

      if (!res.ok) {
        throw new Error("Failed to fetch permissions");
      }

      const data = await res.json();

      // Cache the result
      permissionsCache.set(creatorSlug, data);
      setPermissions(data);
    } catch (err) {
      console.error("[useCreatorPermissions] Error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      // Fall back to default permissions on error
      setPermissions(defaultPermissions);
    } finally {
      setIsLoading(false);
    }
  }, [creatorSlug]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const refetch = useCallback(async () => {
    // Clear cache for this slug to force refetch
    if (creatorSlug) {
      permissionsCache.delete(creatorSlug);
    }
    await fetchPermissions();
  }, [creatorSlug, fetchPermissions]);

  return {
    permissions,
    isLoading,
    error,
    refetch,
  };
}

// Clear all cached permissions (useful when user logs out or changes)
export function clearPermissionsCache() {
  permissionsCache.clear();
}

// Clear specific creator's cached permissions
export function clearCreatorPermissionsCache(creatorSlug: string) {
  permissionsCache.delete(creatorSlug);
}
