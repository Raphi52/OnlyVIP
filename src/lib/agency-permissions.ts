import prisma from "@/lib/prisma";

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

/**
 * Get permissions for a creator based on agency management status
 *
 * Permission Matrix:
 * | User Type         | isAgencyManaged | canEdit | canPayout | canSendMsg | canView | canBreakup |
 * |-------------------|-----------------|---------|-----------|------------|---------|------------|
 * | Creator (owner)   | false           | YES     | YES       | YES        | YES     | NO         |
 * | Creator (owner)   | true            | NO      | NO        | NO         | YES     | YES        |
 * | Agency Owner      | true            | YES     | YES       | YES        | YES     | NO         |
 * | Admin             | any             | YES     | YES       | YES        | YES     | NO         |
 */
export async function getCreatorPermissions(
  creatorSlug: string,
  userId: string,
  isAdmin = false
): Promise<CreatorPermissions> {
  const noPermissions: CreatorPermissions = {
    canEdit: false,
    canUploadMedia: false,
    canSendMessages: false,
    canRequestPayout: false,
    canAccessAI: false,
    canAccessScripts: false,
    canViewEarnings: false,
    canViewConversations: false,
    canBreakup: false,
    isAgencyManaged: false,
    agencyId: null,
    agencyName: null,
  };

  const creator = await prisma.creator.findUnique({
    where: { slug: creatorSlug },
    include: {
      agency: { select: { id: true, name: true, ownerId: true } },
    },
  });

  if (!creator) {
    return noPermissions;
  }

  const isOwner = creator.userId === userId;
  const isAgencyOwner = creator.agency?.ownerId === userId;
  const isAgencyManaged = creator.isAgencyManaged === true;

  // Admin has full access (except breakup)
  if (isAdmin) {
    return {
      canEdit: true,
      canUploadMedia: true,
      canSendMessages: true,
      canRequestPayout: true,
      canAccessAI: true,
      canAccessScripts: true,
      canViewEarnings: true,
      canViewConversations: true,
      canBreakup: false, // Admin doesn't breakup on behalf of creator
      isAgencyManaged,
      agencyId: creator.agencyId,
      agencyName: creator.agency?.name || null,
    };
  }

  // If creator is agency-managed
  if (isAgencyManaged && creator.agencyId) {
    if (isOwner) {
      // Creator (original owner) - RESTRICTED mode
      return {
        canEdit: false,
        canUploadMedia: false,
        canSendMessages: false,
        canRequestPayout: false,
        canAccessAI: false,
        canAccessScripts: false,
        canViewEarnings: true, // Read-only
        canViewConversations: true, // Read-only
        canBreakup: true, // Can leave agency
        isAgencyManaged: true,
        agencyId: creator.agencyId,
        agencyName: creator.agency?.name || null,
      };
    } else if (isAgencyOwner) {
      // Agency owner - FULL control
      return {
        canEdit: true,
        canUploadMedia: true,
        canSendMessages: true,
        canRequestPayout: true,
        canAccessAI: true,
        canAccessScripts: true,
        canViewEarnings: true,
        canViewConversations: true,
        canBreakup: false, // Only creator can breakup
        isAgencyManaged: true,
        agencyId: creator.agencyId,
        agencyName: creator.agency?.name || null,
      };
    }
  }

  // Not agency-managed (or in agency but not managed)
  if (isOwner) {
    // Owner has full access
    return {
      canEdit: true,
      canUploadMedia: true,
      canSendMessages: true,
      canRequestPayout: true,
      canAccessAI: true,
      canAccessScripts: true,
      canViewEarnings: true,
      canViewConversations: true,
      canBreakup: false, // Not in managed mode
      isAgencyManaged: false,
      agencyId: creator.agencyId,
      agencyName: creator.agency?.name || null,
    };
  }

  // Agency owner accessing non-managed creator in their agency
  if (isAgencyOwner && creator.agencyId) {
    return {
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
      agencyId: creator.agencyId,
      agencyName: creator.agency?.name || null,
    };
  }

  // No permissions
  return noPermissions;
}

/**
 * Quick check if user can edit a creator
 */
export async function canEditCreator(
  creatorSlug: string,
  userId: string,
  isAdmin = false
): Promise<boolean> {
  const permissions = await getCreatorPermissions(creatorSlug, userId, isAdmin);
  return permissions.canEdit;
}

/**
 * Quick check if user can request payout for a creator
 */
export async function canRequestPayout(
  creatorSlug: string,
  userId: string,
  isAdmin = false
): Promise<boolean> {
  const permissions = await getCreatorPermissions(creatorSlug, userId, isAdmin);
  return permissions.canRequestPayout;
}

/**
 * Quick check if user can send messages for a creator
 */
export async function canSendMessages(
  creatorSlug: string,
  userId: string,
  isAdmin = false
): Promise<boolean> {
  const permissions = await getCreatorPermissions(creatorSlug, userId, isAdmin);
  return permissions.canSendMessages;
}

/**
 * Quick check if creator is agency-managed
 */
export async function isCreatorAgencyManaged(creatorSlug: string): Promise<boolean> {
  const creator = await prisma.creator.findUnique({
    where: { slug: creatorSlug },
    select: { isAgencyManaged: true },
  });
  return creator?.isAgencyManaged === true;
}

/**
 * Check if user can breakup (leave agency)
 */
export async function canBreakup(
  creatorSlug: string,
  userId: string
): Promise<{ canBreakup: boolean; agencyName: string | null }> {
  const permissions = await getCreatorPermissions(creatorSlug, userId);
  return {
    canBreakup: permissions.canBreakup,
    agencyName: permissions.agencyName,
  };
}
