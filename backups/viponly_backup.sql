--
-- PostgreSQL database dump
--

\restrict In9PhhBSXdtjH6BXjrTlOqHG6blBKxPtFGC3vS6rQ1LIwykrZPYBSbQxAkAdnJy

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: viponly
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO viponly;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: viponly
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


ALTER TABLE public."Account" OWNER TO viponly;

--
-- Name: AccountingQueue; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."AccountingQueue" (
    id text NOT NULL,
    payload text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    "maxAttempts" integer DEFAULT 5 NOT NULL,
    "lastError" text,
    "nextRetryAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "processedAt" timestamp(3) without time zone
);


ALTER TABLE public."AccountingQueue" OWNER TO viponly;

--
-- Name: Agency; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."Agency" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    "ownerId" text NOT NULL,
    logo text,
    website text,
    description text,
    "publicVisible" boolean DEFAULT false NOT NULL,
    tagline text,
    services text,
    specialties text,
    "minRevenueShare" integer,
    "maxRevenueShare" integer,
    "socialLinks" text,
    "portfolioImages" text,
    location text,
    languages text,
    "yearsInBusiness" integer,
    "aiEnabled" boolean DEFAULT false NOT NULL,
    "platformFee" double precision DEFAULT 0.10 NOT NULL,
    "aiProvider" text DEFAULT 'anthropic'::text NOT NULL,
    "aiModel" text DEFAULT 'claude-haiku-4-5-20241022'::text NOT NULL,
    "aiApiKey" text,
    "aiApiKeyHash" text,
    "aiUseCustomKey" boolean DEFAULT false NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "pendingBalance" double precision DEFAULT 0 NOT NULL,
    "totalEarned" double precision DEFAULT 0 NOT NULL,
    "totalPaid" double precision DEFAULT 0 NOT NULL,
    "walletEth" text,
    "walletBtc" text,
    "totalRevenue" double precision DEFAULT 0 NOT NULL,
    "averageRating" double precision DEFAULT 0 NOT NULL,
    "reviewCount" integer DEFAULT 0 NOT NULL,
    "isListed" boolean DEFAULT false NOT NULL,
    "listingPriority" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Agency" OWNER TO viponly;

--
-- Name: AgencyAiPersonality; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."AgencyAiPersonality" (
    id text NOT NULL,
    name text NOT NULL,
    "agencyId" text NOT NULL,
    "creatorSlug" text NOT NULL,
    personality text NOT NULL,
    "primaryTone" text,
    "toneKeywords" text,
    "trafficShare" integer DEFAULT 100 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "aiMediaEnabled" boolean DEFAULT true NOT NULL,
    "aiMediaFrequency" integer DEFAULT 4 NOT NULL,
    "aiPPVRatio" integer DEFAULT 30 NOT NULL,
    "aiTeasingEnabled" boolean DEFAULT true NOT NULL,
    "autoHandoffEnabled" boolean DEFAULT true NOT NULL,
    "handoffSpendThreshold" double precision DEFAULT 40 NOT NULL,
    "handoffOnHighIntent" boolean DEFAULT true NOT NULL,
    "handoffKeywords" text,
    "characterAge" integer DEFAULT 24,
    "primaryLanguage" text DEFAULT 'fr'::text,
    background text,
    "coreTraits" text,
    flaws text,
    quirks text,
    "innerVoice" text,
    "writingStyle" text,
    boundaries text,
    "responseRules" text,
    "exampleGoodMessages" text,
    "exampleBadMessages" text,
    "customInstructions" text,
    "totalEarnings" double precision DEFAULT 0 NOT NULL,
    "totalMessages" integer DEFAULT 0 NOT NULL,
    "totalSales" integer DEFAULT 0 NOT NULL,
    "conversionRate" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AgencyAiPersonality" OWNER TO viponly;

--
-- Name: AgencyApplication; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."AgencyApplication" (
    id text NOT NULL,
    "modelListingId" text,
    "agencyListingId" text,
    "agencyId" text NOT NULL,
    "initiatedBy" text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    message text,
    "conversationId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AgencyApplication" OWNER TO viponly;

--
-- Name: AgencyCreatorPayout; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."AgencyCreatorPayout" (
    id text NOT NULL,
    "agencyId" text NOT NULL,
    "creatorSlug" text NOT NULL,
    amount double precision NOT NULL,
    "walletType" text NOT NULL,
    "walletAddress" text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "paidAt" timestamp(3) without time zone,
    "paidBy" text,
    "txHash" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AgencyCreatorPayout" OWNER TO viponly;

--
-- Name: AgencyEarning; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."AgencyEarning" (
    id text NOT NULL,
    "agencyId" text NOT NULL,
    "creatorEarningId" text NOT NULL,
    "grossAmount" double precision NOT NULL,
    "agencyShare" double precision NOT NULL,
    "agencyGross" double precision NOT NULL,
    "chatterAmount" double precision DEFAULT 0 NOT NULL,
    "netAmount" double precision NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "paidAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AgencyEarning" OWNER TO viponly;

--
-- Name: AgencyListing; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."AgencyListing" (
    id text NOT NULL,
    "agencyId" text NOT NULL,
    headline text,
    description text,
    "lookingFor" text,
    "contentTypes" text,
    requirements text,
    "minRevenueShare" integer DEFAULT 50 NOT NULL,
    "maxRevenueShare" integer DEFAULT 70 NOT NULL,
    "providesContent" boolean DEFAULT false NOT NULL,
    "providesChatting" boolean DEFAULT true NOT NULL,
    "providesMarketing" boolean DEFAULT true NOT NULL,
    location text,
    "acceptsRemote" boolean DEFAULT true NOT NULL,
    "averageRating" double precision DEFAULT 0 NOT NULL,
    "reviewCount" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AgencyListing" OWNER TO viponly;

--
-- Name: AgencyPayoutRequest; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."AgencyPayoutRequest" (
    id text NOT NULL,
    "agencyId" text NOT NULL,
    amount double precision NOT NULL,
    "walletType" text NOT NULL,
    "walletAddress" text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "paidAt" timestamp(3) without time zone,
    "paidBy" text,
    "txHash" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AgencyPayoutRequest" OWNER TO viponly;

--
-- Name: AgencyPublicStats; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."AgencyPublicStats" (
    id text NOT NULL,
    "agencyId" text NOT NULL,
    "calculatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "activeCreators" integer DEFAULT 0 NOT NULL,
    "totalCreatorsEver" integer DEFAULT 0 NOT NULL,
    "totalRevenueLast30d" double precision DEFAULT 0 NOT NULL,
    "avgRevenuePerCreator" double precision DEFAULT 0 NOT NULL,
    "revenueGrowth3m" double precision DEFAULT 0 NOT NULL,
    "payoutSuccessRate" double precision DEFAULT 100 NOT NULL,
    "avgPayoutDelayDays" double precision DEFAULT 0 NOT NULL,
    "avgCommissionRate" double precision DEFAULT 0 NOT NULL,
    "minCommissionRate" double precision DEFAULT 0 NOT NULL,
    "maxCommissionRate" double precision DEFAULT 0 NOT NULL,
    "avgCollaborationMonths" double precision DEFAULT 0 NOT NULL,
    retention6m double precision DEFAULT 0 NOT NULL,
    retention12m double precision DEFAULT 0 NOT NULL,
    "avgResponseTimeHours" double precision DEFAULT 0 NOT NULL,
    "monthlyHistory" text,
    badges text DEFAULT '[]'::text NOT NULL,
    "avgRating" double precision DEFAULT 0 NOT NULL,
    "totalReviews" integer DEFAULT 0 NOT NULL,
    "isPublic" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AgencyPublicStats" OWNER TO viponly;

--
-- Name: AgencyReview; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."AgencyReview" (
    id text NOT NULL,
    "reviewerId" text NOT NULL,
    "reviewerType" text NOT NULL,
    "targetId" text NOT NULL,
    "targetType" text NOT NULL,
    rating integer NOT NULL,
    comment text,
    "collaborationStartedAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AgencyReview" OWNER TO viponly;

--
-- Name: AiPerformanceSummary; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."AiPerformanceSummary" (
    id text NOT NULL,
    "creatorSlug" text NOT NULL,
    date date NOT NULL,
    "aiMessages" integer DEFAULT 0 NOT NULL,
    "aiRevenue" double precision DEFAULT 0 NOT NULL,
    "aiConversions" integer DEFAULT 0 NOT NULL,
    "aiAvgResponseTime" double precision DEFAULT 0 NOT NULL,
    "chatterMessages" integer DEFAULT 0 NOT NULL,
    "chatterRevenue" double precision DEFAULT 0 NOT NULL,
    "chatterConversions" integer DEFAULT 0 NOT NULL,
    "chatterAvgResponseTime" double precision DEFAULT 0 NOT NULL,
    "aiRevenuePerMessage" double precision DEFAULT 0 NOT NULL,
    "chatterRevenuePerMessage" double precision DEFAULT 0 NOT NULL,
    "aiConversionRate" double precision DEFAULT 0 NOT NULL,
    "chatterConversionRate" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AiPerformanceSummary" OWNER TO viponly;

--
-- Name: AiPersonalityEarning; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."AiPersonalityEarning" (
    id text NOT NULL,
    "aiPersonalityId" text NOT NULL,
    "creatorEarningId" text NOT NULL,
    "grossAmount" double precision NOT NULL,
    "attributedMessageId" text,
    type text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AiPersonalityEarning" OWNER TO viponly;

--
-- Name: AiResponseQueue; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."AiResponseQueue" (
    id text NOT NULL,
    "messageId" text NOT NULL,
    "conversationId" text NOT NULL,
    "creatorSlug" text NOT NULL,
    "scheduledAt" timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    response text,
    "mediaId" text,
    attempts integer DEFAULT 0 NOT NULL,
    "maxAttempts" integer DEFAULT 3 NOT NULL,
    error text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "processedAt" timestamp(3) without time zone,
    "shouldSendMedia" boolean DEFAULT false NOT NULL,
    "mediaDecision" text,
    "teaseText" text
);


ALTER TABLE public."AiResponseQueue" OWNER TO viponly;

--
-- Name: AiSuggestion; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."AiSuggestion" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "messageId" text,
    content text NOT NULL,
    "mediaDecision" text,
    "mediaId" text,
    "personalityId" text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "editedContent" text,
    "sentById" text,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "sentAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AiSuggestion" OWNER TO viponly;

--
-- Name: AutoBump; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."AutoBump" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "fanUserId" text NOT NULL,
    "creatorSlug" text NOT NULL,
    "scheduledAt" timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "bumpType" text NOT NULL,
    "personalityId" text,
    message text,
    "sentAt" timestamp(3) without time zone,
    "messageId" text,
    error text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AutoBump" OWNER TO viponly;

--
-- Name: Bundle; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."Bundle" (
    id text NOT NULL,
    "agencyId" text NOT NULL,
    name text NOT NULL,
    description text,
    "coverImage" text,
    "mediaIds" text NOT NULL,
    "originalPrice" double precision NOT NULL,
    "bundlePrice" double precision NOT NULL,
    "discountPercent" integer NOT NULL,
    "availableFor" text,
    "creatorSlug" text,
    "maxPurchases" integer,
    "purchaseCount" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "startsAt" timestamp(3) without time zone,
    "endsAt" timestamp(3) without time zone,
    "totalRevenue" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Bundle" OWNER TO viponly;

--
-- Name: Category; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    "coverImage" text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Category" OWNER TO viponly;

--
-- Name: Chatter; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."Chatter" (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    name text NOT NULL,
    avatar text,
    "agencyId" text NOT NULL,
    "commissionEnabled" boolean DEFAULT false NOT NULL,
    "commissionRate" double precision DEFAULT 0.10 NOT NULL,
    "pendingBalance" double precision DEFAULT 0 NOT NULL,
    "totalPaid" double precision DEFAULT 0 NOT NULL,
    "walletEth" text,
    "walletBtc" text,
    "totalEarnings" double precision DEFAULT 0 NOT NULL,
    "totalMessages" integer DEFAULT 0 NOT NULL,
    "totalSales" integer DEFAULT 0 NOT NULL,
    "messagesOutsideShift" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastActiveAt" timestamp(3) without time zone,
    schedule text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Chatter" OWNER TO viponly;

--
-- Name: ChatterCreatorAssignment; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."ChatterCreatorAssignment" (
    id text NOT NULL,
    "chatterId" text NOT NULL,
    "creatorSlug" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ChatterCreatorAssignment" OWNER TO viponly;

--
-- Name: ChatterEarning; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."ChatterEarning" (
    id text NOT NULL,
    "chatterId" text NOT NULL,
    "creatorEarningId" text NOT NULL,
    "grossAmount" double precision NOT NULL,
    "commissionRate" double precision NOT NULL,
    "commissionAmount" double precision NOT NULL,
    "attributedMessageId" text,
    "delayedAttribution" boolean DEFAULT false NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "paidAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ChatterEarning" OWNER TO viponly;

--
-- Name: ChatterPayoutRequest; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."ChatterPayoutRequest" (
    id text NOT NULL,
    "chatterId" text NOT NULL,
    "agencyId" text NOT NULL,
    amount double precision NOT NULL,
    "walletType" text NOT NULL,
    "walletAddress" text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "paidAt" timestamp(3) without time zone,
    "paidBy" text,
    "txHash" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ChatterPayoutRequest" OWNER TO viponly;

--
-- Name: ChatterScriptFavorite; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."ChatterScriptFavorite" (
    id text NOT NULL,
    "chatterId" text NOT NULL,
    "scriptId" text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ChatterScriptFavorite" OWNER TO viponly;

--
-- Name: Conversation; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."Conversation" (
    id text NOT NULL,
    "creatorSlug" text DEFAULT 'miacosta'::text NOT NULL,
    "aiPersonalityId" text,
    "detectedTone" text,
    "toneConfidence" double precision,
    "lastToneCheck" timestamp(3) without time zone,
    "autoToneSwitch" boolean DEFAULT true NOT NULL,
    "aiMode" text DEFAULT 'auto'::text NOT NULL,
    "assignedChatterId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Conversation" OWNER TO viponly;

--
-- Name: ConversationHandoff; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."ConversationHandoff" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "triggerType" text NOT NULL,
    "triggerValue" text,
    "fromAiPersonalityId" text,
    "toChatterId" text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "notifiedAt" timestamp(3) without time zone,
    "respondedAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ConversationHandoff" OWNER TO viponly;

--
-- Name: ConversationParticipant; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."ConversationParticipant" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "userId" text NOT NULL,
    "lastReadAt" timestamp(3) without time zone,
    "isTyping" boolean DEFAULT false NOT NULL,
    "isPinned" boolean DEFAULT false NOT NULL,
    "isMuted" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."ConversationParticipant" OWNER TO viponly;

--
-- Name: ConversationSummary; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."ConversationSummary" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "summaryDate" timestamp(3) without time zone NOT NULL,
    "messageCount" integer NOT NULL,
    topics text NOT NULL,
    outcome text NOT NULL,
    "keyMoments" text NOT NULL,
    "nextSteps" text,
    "fanMood" text,
    "firstMessageId" text,
    "lastMessageId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ConversationSummary" OWNER TO viponly;

--
-- Name: Creator; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."Creator" (
    id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    "displayName" text NOT NULL,
    avatar text,
    "cardImage" text,
    "coverImage" text,
    bio text,
    "userId" text,
    "agencyId" text,
    "socialLinks" text DEFAULT '{}'::text NOT NULL,
    theme text DEFAULT '{}'::text NOT NULL,
    "walletEth" text,
    "walletBtc" text,
    "photoCount" integer DEFAULT 0 NOT NULL,
    "videoCount" integer DEFAULT 0 NOT NULL,
    "subscriberCount" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    categories text DEFAULT '[]'::text NOT NULL,
    "aiEnabled" boolean DEFAULT false NOT NULL,
    "aiPersonality" text,
    "aiResponseDelay" integer DEFAULT 120 NOT NULL,
    "aiLastActive" timestamp(3) without time zone,
    "aiMediaEnabled" boolean DEFAULT true NOT NULL,
    "aiMediaFrequency" integer DEFAULT 4 NOT NULL,
    "aiPPVRatio" integer DEFAULT 30 NOT NULL,
    "aiTeasingEnabled" boolean DEFAULT true NOT NULL,
    "aiProvider" text DEFAULT 'anthropic'::text NOT NULL,
    "aiModel" text DEFAULT 'claude-haiku-4-5-20241022'::text NOT NULL,
    "aiApiKey" text,
    "aiApiKeyHash" text,
    "aiUseCustomKey" boolean DEFAULT false NOT NULL,
    "pendingBalance" double precision DEFAULT 0 NOT NULL,
    "totalEarned" double precision DEFAULT 0 NOT NULL,
    "totalPaid" double precision DEFAULT 0 NOT NULL,
    "isListed" boolean DEFAULT false NOT NULL,
    "lookingForAgency" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "customInstructions" text,
    "exampleBadMessages" text,
    "exampleGoodMessages" text,
    "responseRules" text
);


ALTER TABLE public."Creator" OWNER TO viponly;

--
-- Name: CreatorEarning; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."CreatorEarning" (
    id text NOT NULL,
    "creatorSlug" text NOT NULL,
    type text NOT NULL,
    "sourceId" text,
    "grossAmount" double precision NOT NULL,
    "commissionRate" double precision NOT NULL,
    "commissionAmount" double precision NOT NULL,
    "netAmount" double precision NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "paidAt" timestamp(3) without time zone,
    "payoutTxId" text,
    "userId" text NOT NULL,
    "chatterId" text,
    "aiPersonalityId" text,
    "attributedMessageId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."CreatorEarning" OWNER TO viponly;

--
-- Name: CreatorMember; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."CreatorMember" (
    id text NOT NULL,
    "creatorSlug" text NOT NULL,
    "userId" text NOT NULL,
    "isVip" boolean DEFAULT false NOT NULL,
    "isBlocked" boolean DEFAULT false NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CreatorMember" OWNER TO viponly;

--
-- Name: CreatorPublicStats; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."CreatorPublicStats" (
    id text NOT NULL,
    "creatorId" text NOT NULL,
    "calculatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "revenueLast30d" double precision DEFAULT 0 NOT NULL,
    "revenueAvg3m" double precision DEFAULT 0 NOT NULL,
    "revenueTrend" double precision DEFAULT 0 NOT NULL,
    "totalRevenueAllTime" double precision DEFAULT 0 NOT NULL,
    "revenueFromSubs" double precision DEFAULT 0 NOT NULL,
    "revenueFromPPV" double precision DEFAULT 0 NOT NULL,
    "revenueFromTips" double precision DEFAULT 0 NOT NULL,
    "revenueFromMessages" double precision DEFAULT 0 NOT NULL,
    "activeSubscribers" integer DEFAULT 0 NOT NULL,
    "subscriberRetention" double precision DEFAULT 0 NOT NULL,
    "avgSubscriptionMonths" double precision DEFAULT 0 NOT NULL,
    "subscriberGrowth30d" double precision DEFAULT 0 NOT NULL,
    "activityRate" double precision DEFAULT 0 NOT NULL,
    "avgResponseMinutes" double precision DEFAULT 0 NOT NULL,
    "lastActiveAt" timestamp(3) without time zone,
    "messageToSaleRate" double precision DEFAULT 0 NOT NULL,
    "ppvUnlockRate" double precision DEFAULT 0 NOT NULL,
    "totalPosts" integer DEFAULT 0 NOT NULL,
    "postsLast30d" integer DEFAULT 0 NOT NULL,
    "avgPostsPerWeek" double precision DEFAULT 0 NOT NULL,
    "totalMedia" integer DEFAULT 0 NOT NULL,
    "avgLikesPerPost" double precision DEFAULT 0 NOT NULL,
    "avgCommentsPerPost" double precision DEFAULT 0 NOT NULL,
    "monthlyHistory" text,
    badges text DEFAULT '[]'::text NOT NULL,
    "avgRating" double precision DEFAULT 0 NOT NULL,
    "totalReviews" integer DEFAULT 0 NOT NULL,
    "showRevenue" boolean DEFAULT true NOT NULL,
    "showSubscribers" boolean DEFAULT true NOT NULL,
    "showActivity" boolean DEFAULT true NOT NULL,
    "isPublic" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CreatorPublicStats" OWNER TO viponly;

--
-- Name: CreatorVerification; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."CreatorVerification" (
    id text NOT NULL,
    "creatorId" text NOT NULL,
    "creatorSlug" text NOT NULL,
    "documentType" text NOT NULL,
    "documentFrontUrl" text NOT NULL,
    "documentBackUrl" text,
    "selfieUrl" text NOT NULL,
    "fullName" text,
    "dateOfBirth" timestamp(3) without time zone,
    nationality text,
    "documentNumber" text,
    "documentExpiry" timestamp(3) without time zone,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "verifiedAt" timestamp(3) without time zone,
    "verifiedBy" text,
    "rejectionReason" text,
    "externalId" text,
    "externalStatus" text,
    "confidenceScore" double precision,
    "expiresAt" timestamp(3) without time zone,
    "reminderSent" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CreatorVerification" OWNER TO viponly;

--
-- Name: CreditTransaction; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."CreditTransaction" (
    id text NOT NULL,
    "userId" text NOT NULL,
    amount integer NOT NULL,
    balance integer NOT NULL,
    type text NOT NULL,
    "creditType" text DEFAULT 'PAID'::text NOT NULL,
    "mediaId" text,
    "messageId" text,
    "subscriptionId" text,
    description text,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."CreditTransaction" OWNER TO viponly;

--
-- Name: DMCANotice; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."DMCANotice" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    company text,
    "contentUrl" text NOT NULL,
    "originalUrl" text NOT NULL,
    description text NOT NULL,
    signature text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    resolution text,
    "resolvedAt" timestamp(3) without time zone,
    "resolvedBy" text,
    "counterNotice" boolean DEFAULT false NOT NULL,
    "counterNoticeAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DMCANotice" OWNER TO viponly;

--
-- Name: DailyStats; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."DailyStats" (
    id text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "totalViews" integer DEFAULT 0 NOT NULL,
    "uniqueVisitors" integer DEFAULT 0 NOT NULL,
    "topPages" text DEFAULT '[]'::text NOT NULL,
    "topReferrers" text DEFAULT '[]'::text NOT NULL,
    "deviceStats" text DEFAULT '{}'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DailyStats" OWNER TO viponly;

--
-- Name: DiscountCode; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."DiscountCode" (
    id text NOT NULL,
    code text NOT NULL,
    "creatorSlug" text NOT NULL,
    "discountType" text NOT NULL,
    "discountValue" double precision NOT NULL,
    "maxDiscount" double precision,
    "minPurchase" double precision,
    "expiresAt" timestamp(3) without time zone,
    "maxUses" integer,
    "currentUses" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "fanUserId" text,
    "conversationId" text,
    "sourceType" text,
    "sourceId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "usedAt" timestamp(3) without time zone
);


ALTER TABLE public."DiscountCode" OWNER TO viponly;

--
-- Name: FanLeadScore; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."FanLeadScore" (
    id text NOT NULL,
    "fanUserId" text NOT NULL,
    "creatorSlug" text NOT NULL,
    score integer DEFAULT 50 NOT NULL,
    "engagementScore" integer DEFAULT 50 NOT NULL,
    "spendingScore" integer DEFAULT 50 NOT NULL,
    "intentScore" integer DEFAULT 50 NOT NULL,
    "recencyScore" integer DEFAULT 50 NOT NULL,
    "predictedLTV" double precision,
    "purchaseProbability" double precision,
    "churnRisk" double precision,
    factors text,
    "lastCalculated" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."FanLeadScore" OWNER TO viponly;

--
-- Name: FanMemory; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."FanMemory" (
    id text NOT NULL,
    "fanUserId" text NOT NULL,
    "creatorSlug" text NOT NULL,
    category text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    confidence double precision DEFAULT 0.8 NOT NULL,
    "sourceMessageId" text,
    "extractedBy" text DEFAULT 'ai'::text NOT NULL,
    "lastConfirmed" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."FanMemory" OWNER TO viponly;

--
-- Name: FanPresence; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."FanPresence" (
    id text NOT NULL,
    "fanUserId" text NOT NULL,
    "creatorSlug" text NOT NULL,
    "isOnline" boolean DEFAULT false NOT NULL,
    "lastSeen" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastBumpedAt" timestamp(3) without time zone,
    "bumpCooldownHours" integer DEFAULT 24 NOT NULL,
    "totalBumps" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."FanPresence" OWNER TO viponly;

--
-- Name: FanProfile; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."FanProfile" (
    id text NOT NULL,
    "fanUserId" text NOT NULL,
    "creatorSlug" text NOT NULL,
    "preferredTone" text,
    "preferredTopics" text[] DEFAULT ARRAY[]::text[],
    "spendingTier" text,
    "activityLevel" text,
    timezone text,
    language text,
    "totalSpent" double precision DEFAULT 0 NOT NULL,
    "totalMessages" integer DEFAULT 0 NOT NULL,
    "lastSeen" timestamp(3) without time zone,
    "firstSeen" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "qualityScore" integer DEFAULT 50 NOT NULL,
    "qualityTier" text DEFAULT 'unknown'::text NOT NULL,
    "messagesWithoutPurchase" integer DEFAULT 0 NOT NULL,
    "freeContentRequests" integer DEFAULT 0 NOT NULL,
    "aiOnlyMode" boolean DEFAULT false NOT NULL,
    "aiOnlyReason" text,
    "relationshipStage" text DEFAULT 'new'::text NOT NULL,
    "sharedMoments" text,
    "lastConversation" timestamp(3) without time zone
);


ALTER TABLE public."FanProfile" OWNER TO viponly;

--
-- Name: FlashSale; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."FlashSale" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "fanUserId" text NOT NULL,
    "creatorSlug" text NOT NULL,
    "bundleId" text,
    "mediaId" text,
    "originalPrice" double precision NOT NULL,
    "salePrice" double precision NOT NULL,
    "discountCode" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "reminderSent" boolean DEFAULT false NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "redeemedAt" timestamp(3) without time zone,
    "triggerType" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."FlashSale" OWNER TO viponly;

--
-- Name: MediaContent; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."MediaContent" (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    description text,
    "creatorSlug" text DEFAULT 'miacosta'::text NOT NULL,
    type text NOT NULL,
    "accessTier" text DEFAULT 'FREE'::text NOT NULL,
    "isPurchaseable" boolean DEFAULT false NOT NULL,
    price double precision,
    "tagGallery" boolean DEFAULT false NOT NULL,
    "tagPPV" boolean DEFAULT false NOT NULL,
    "tagAI" boolean DEFAULT false NOT NULL,
    "tagFree" boolean DEFAULT false NOT NULL,
    "tagVIP" boolean DEFAULT false NOT NULL,
    "ppvPriceCredits" integer,
    "thumbnailUrl" text,
    "previewUrl" text,
    "contentUrl" text NOT NULL,
    "storageKey" text,
    "fileSize" integer,
    duration integer,
    width integer,
    height integer,
    "mimeType" text,
    "categoryId" text,
    tags text DEFAULT '[]'::text NOT NULL,
    "viewCount" integer DEFAULT 0 NOT NULL,
    "purchaseCount" integer DEFAULT 0 NOT NULL,
    "isPublished" boolean DEFAULT false NOT NULL,
    "isFeatured" boolean DEFAULT false NOT NULL,
    "showInGallery" boolean DEFAULT true NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."MediaContent" OWNER TO viponly;

--
-- Name: MediaPurchase; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."MediaPurchase" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "mediaId" text NOT NULL,
    amount double precision NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    provider text NOT NULL,
    "providerTxId" text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "downloadCount" integer DEFAULT 0 NOT NULL,
    "maxDownloads" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."MediaPurchase" OWNER TO viponly;

--
-- Name: Message; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "senderId" text NOT NULL,
    "receiverId" text NOT NULL,
    text text,
    "replyToId" text,
    "isPPV" boolean DEFAULT false NOT NULL,
    "ppvPrice" double precision,
    "ppvUnlockedBy" text DEFAULT '[]'::text NOT NULL,
    "totalTips" double precision DEFAULT 0 NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "isAiGenerated" boolean DEFAULT false NOT NULL,
    "chatterId" text,
    "aiPersonalityId" text,
    "scriptId" text,
    "scriptModified" boolean DEFAULT false NOT NULL,
    "resultedInSale" boolean DEFAULT false NOT NULL,
    "saleAmount" double precision,
    "responseTimeSeconds" integer,
    "fanEngagedAfter" boolean,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Message" OWNER TO viponly;

--
-- Name: MessageMedia; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."MessageMedia" (
    id text NOT NULL,
    "messageId" text NOT NULL,
    "mediaId" text,
    type text NOT NULL,
    url text NOT NULL,
    "previewUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MessageMedia" OWNER TO viponly;

--
-- Name: MessagePayment; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."MessagePayment" (
    id text NOT NULL,
    "messageId" text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    amount double precision NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    provider text NOT NULL,
    "providerTxId" text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MessagePayment" OWNER TO viponly;

--
-- Name: MessageReaction; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."MessageReaction" (
    id text NOT NULL,
    "messageId" text NOT NULL,
    "userId" text NOT NULL,
    emoji text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MessageReaction" OWNER TO viponly;

--
-- Name: ModelListing; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."ModelListing" (
    id text NOT NULL,
    "creatorId" text NOT NULL,
    bio text,
    photos text[],
    "socialLinks" text DEFAULT '{}'::text NOT NULL,
    tags text[],
    "revenueShare" integer DEFAULT 70 NOT NULL,
    "chattingEnabled" boolean DEFAULT true NOT NULL,
    "averageRating" double precision DEFAULT 0 NOT NULL,
    "reviewCount" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ModelListing" OWNER TO viponly;

--
-- Name: ObjectionHandling; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."ObjectionHandling" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "messageId" text NOT NULL,
    "patternId" text NOT NULL,
    "responseMessageId" text,
    strategy text NOT NULL,
    "discountCodeId" text,
    outcome text,
    "outcomeMessageId" text,
    "revenueGenerated" double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "resolvedAt" timestamp(3) without time zone
);


ALTER TABLE public."ObjectionHandling" OWNER TO viponly;

--
-- Name: ObjectionPattern; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."ObjectionPattern" (
    id text NOT NULL,
    "agencyId" text NOT NULL,
    name text NOT NULL,
    patterns text NOT NULL,
    strategy text DEFAULT 'urgency'::text NOT NULL,
    "responseTemplate" text NOT NULL,
    "discountEnabled" boolean DEFAULT false NOT NULL,
    "discountPercent" integer,
    "discountMaxAmount" double precision,
    "discountValidHours" integer DEFAULT 2 NOT NULL,
    language text DEFAULT 'all'::text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "timesTriggered" integer DEFAULT 0 NOT NULL,
    "timesConverted" integer DEFAULT 0 NOT NULL,
    "conversionRate" double precision DEFAULT 0 NOT NULL,
    "totalRevenue" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ObjectionPattern" OWNER TO viponly;

--
-- Name: PageView; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."PageView" (
    id text NOT NULL,
    path text NOT NULL,
    referrer text,
    "visitorId" text NOT NULL,
    "userId" text,
    "userAgent" text,
    device text,
    browser text,
    os text,
    country text,
    "sessionId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PageView" OWNER TO viponly;

--
-- Name: Payment; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "creatorSlug" text DEFAULT 'miacosta'::text NOT NULL,
    amount double precision NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    "platformFee" double precision DEFAULT 0 NOT NULL,
    "netAmount" double precision DEFAULT 0 NOT NULL,
    provider text NOT NULL,
    "providerTxId" text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    type text NOT NULL,
    description text,
    metadata text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Payment" OWNER TO viponly;

--
-- Name: PaymentDispute; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."PaymentDispute" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "transactionId" text,
    "paymentMethod" text NOT NULL,
    amount double precision NOT NULL,
    "transactionHash" text,
    "walletAddress" text,
    "paymentDate" timestamp(3) without time zone NOT NULL,
    "cryptoCurrency" text,
    email text NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    resolution text,
    "creditAmount" integer,
    "resolvedAt" timestamp(3) without time zone,
    "resolvedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PaymentDispute" OWNER TO viponly;

--
-- Name: PayoutRequest; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."PayoutRequest" (
    id text NOT NULL,
    "creatorSlug" text NOT NULL,
    amount double precision NOT NULL,
    "walletType" text NOT NULL,
    "walletAddress" text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "paidAt" timestamp(3) without time zone,
    "paidBy" text,
    "txHash" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PayoutRequest" OWNER TO viponly;

--
-- Name: PersonalitySwitch; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."PersonalitySwitch" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "fromPersonalityId" text,
    "toPersonalityId" text NOT NULL,
    reason text NOT NULL,
    "detectedTone" text,
    "triggeredBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PersonalitySwitch" OWNER TO viponly;

--
-- Name: RetargetingCampaign; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."RetargetingCampaign" (
    id text NOT NULL,
    "fanUserId" text NOT NULL,
    "creatorSlug" text NOT NULL,
    "triggerType" text NOT NULL,
    "triggeredAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    channel text NOT NULL,
    "templateId" text,
    subject text,
    content text NOT NULL,
    "mediaId" text,
    "discountCodeId" text,
    "flashSaleId" text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "sentAt" timestamp(3) without time zone,
    "openedAt" timestamp(3) without time zone,
    "clickedAt" timestamp(3) without time zone,
    "convertedAt" timestamp(3) without time zone,
    error text,
    "revenueGenerated" double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."RetargetingCampaign" OWNER TO viponly;

--
-- Name: Script; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."Script" (
    id text NOT NULL,
    "agencyId" text NOT NULL,
    name text NOT NULL,
    content text NOT NULL,
    category text NOT NULL,
    intent text,
    "triggerKeywords" text,
    "triggerPatterns" text,
    "minConfidence" double precision DEFAULT 0.6 NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    "successScore" double precision DEFAULT 0 NOT NULL,
    "aiInstructions" text,
    "allowAiModify" boolean DEFAULT true NOT NULL,
    "preserveCore" text,
    language text DEFAULT 'fr'::text NOT NULL,
    "folderId" text,
    "creatorSlug" text,
    "authorId" text,
    status text DEFAULT 'APPROVED'::text NOT NULL,
    "approvedById" text,
    "approvedAt" timestamp(3) without time zone,
    "rejectionReason" text,
    "hasVariables" boolean DEFAULT false NOT NULL,
    variables text,
    "sequenceId" text,
    "sequenceOrder" integer,
    "usageCount" integer DEFAULT 0 NOT NULL,
    "messagesSent" integer DEFAULT 0 NOT NULL,
    "salesGenerated" integer DEFAULT 0 NOT NULL,
    "revenueGenerated" double precision DEFAULT 0 NOT NULL,
    "conversionRate" double precision DEFAULT 0 NOT NULL,
    "avgResponseTime" double precision,
    "isActive" boolean DEFAULT true NOT NULL,
    "isFavorite" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Script" OWNER TO viponly;

--
-- Name: ScriptFolder; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."ScriptFolder" (
    id text NOT NULL,
    "agencyId" text NOT NULL,
    name text NOT NULL,
    description text,
    color text,
    icon text,
    "parentId" text,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ScriptFolder" OWNER TO viponly;

--
-- Name: ScriptMedia; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."ScriptMedia" (
    id text NOT NULL,
    "scriptId" text NOT NULL,
    "mediaId" text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ScriptMedia" OWNER TO viponly;

--
-- Name: ScriptSequence; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."ScriptSequence" (
    id text NOT NULL,
    "agencyId" text NOT NULL,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "timesStarted" integer DEFAULT 0 NOT NULL,
    "timesCompleted" integer DEFAULT 0 NOT NULL,
    "totalRevenue" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ScriptSequence" OWNER TO viponly;

--
-- Name: ScriptUsage; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."ScriptUsage" (
    id text NOT NULL,
    "scriptId" text NOT NULL,
    "chatterId" text NOT NULL,
    "conversationId" text NOT NULL,
    "messageId" text,
    "creatorSlug" text NOT NULL,
    "fanUserId" text NOT NULL,
    action text NOT NULL,
    modifications text,
    "resultedInSale" boolean DEFAULT false NOT NULL,
    "saleAmount" double precision,
    "saleType" text,
    "usedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "responseTime" integer
);


ALTER TABLE public."ScriptUsage" OWNER TO viponly;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Session" OWNER TO viponly;

--
-- Name: SiteSettings; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."SiteSettings" (
    id text NOT NULL,
    "creatorSlug" text,
    "siteName" text,
    "siteDescription" text,
    "siteUrl" text,
    "welcomeMessage" text,
    "welcomeMediaId" text,
    "welcomeMediaUrl" text,
    logo text,
    favicon text,
    "primaryColor" text,
    "accentColor" text,
    pricing text DEFAULT '{}'::text NOT NULL,
    "stripeEnabled" boolean DEFAULT true NOT NULL,
    "cryptoEnabled" boolean DEFAULT false NOT NULL,
    "chatEnabled" boolean DEFAULT true NOT NULL,
    "tipsEnabled" boolean DEFAULT true NOT NULL,
    "ppvEnabled" boolean DEFAULT true NOT NULL,
    "maintenanceMode" boolean DEFAULT false NOT NULL,
    "registrationEnabled" boolean DEFAULT true NOT NULL,
    "emailNotifications" boolean DEFAULT true NOT NULL,
    "pushNotifications" boolean DEFAULT false NOT NULL,
    "platformWalletEth" text,
    "platformWalletBtc" text,
    "platformCommission" double precision DEFAULT 0.05 NOT NULL,
    "firstMonthFreeCommission" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SiteSettings" OWNER TO viponly;

--
-- Name: StatsSnapshot; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."StatsSnapshot" (
    id text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    "snapshotAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metrics text NOT NULL
);


ALTER TABLE public."StatsSnapshot" OWNER TO viponly;

--
-- Name: Subscription; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."Subscription" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "planId" text NOT NULL,
    "creatorSlug" text DEFAULT 'miacosta'::text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "paymentProvider" text NOT NULL,
    "stripeSubscriptionId" text,
    "stripeCustomerId" text,
    "billingInterval" text DEFAULT 'MONTHLY'::text NOT NULL,
    "currentPeriodStart" timestamp(3) without time zone NOT NULL,
    "currentPeriodEnd" timestamp(3) without time zone NOT NULL,
    "cancelAtPeriodEnd" boolean DEFAULT false NOT NULL,
    "canceledAt" timestamp(3) without time zone,
    "trialStart" timestamp(3) without time zone,
    "trialEnd" timestamp(3) without time zone,
    "lastCreditGrant" timestamp(3) without time zone,
    "nextCreditGrant" timestamp(3) without time zone,
    metadata text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Subscription" OWNER TO viponly;

--
-- Name: SubscriptionPlan; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."SubscriptionPlan" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    "monthlyPrice" double precision NOT NULL,
    "annualPrice" double precision NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    "stripeProductId" text,
    "stripePriceMonthly" text,
    "stripePriceAnnual" text,
    "accessTier" text NOT NULL,
    "canMessage" boolean DEFAULT false NOT NULL,
    "downloadLimit" integer,
    "initialCredits" integer DEFAULT 0 NOT NULL,
    "recurringCredits" integer DEFAULT 0 NOT NULL,
    "creditIntervalDays" integer DEFAULT 6 NOT NULL,
    features text DEFAULT '[]'::text NOT NULL,
    "isPopular" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SubscriptionPlan" OWNER TO viponly;

--
-- Name: User; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    "passwordHash" text,
    name text,
    image text,
    role text DEFAULT 'USER'::text NOT NULL,
    "isCreator" boolean DEFAULT false NOT NULL,
    "isAgencyOwner" boolean DEFAULT false NOT NULL,
    "creditBalance" integer DEFAULT 0 NOT NULL,
    "paidCredits" integer DEFAULT 0 NOT NULL,
    "bonusCredits" integer DEFAULT 0 NOT NULL,
    "stripeCustomerId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO viponly;

--
-- Name: VerificationToken; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."VerificationToken" (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."VerificationToken" OWNER TO viponly;

--
-- Name: VerifiedReview; Type: TABLE; Schema: public; Owner: viponly
--

CREATE TABLE public."VerifiedReview" (
    id text NOT NULL,
    "reviewerType" text NOT NULL,
    "reviewerId" text NOT NULL,
    "targetType" text NOT NULL,
    "targetId" text NOT NULL,
    rating integer DEFAULT 5 NOT NULL,
    title text,
    content text,
    "communicationRating" integer,
    "professionalismRating" integer,
    "paymentReliabilityRating" integer,
    "contentQualityRating" integer,
    "supportRating" integer,
    "isVerified" boolean DEFAULT false NOT NULL,
    "collaborationId" text,
    "isPublished" boolean DEFAULT true NOT NULL,
    "reportCount" integer DEFAULT 0 NOT NULL,
    "isHidden" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."VerifiedReview" OWNER TO viponly;

--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."Account" (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
\.


--
-- Data for Name: AccountingQueue; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."AccountingQueue" (id, payload, status, attempts, "maxAttempts", "lastError", "nextRetryAt", "createdAt", "updatedAt", "processedAt") FROM stdin;
\.


--
-- Data for Name: Agency; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."Agency" (id, name, slug, "ownerId", logo, website, description, "publicVisible", tagline, services, specialties, "minRevenueShare", "maxRevenueShare", "socialLinks", "portfolioImages", location, languages, "yearsInBusiness", "aiEnabled", "platformFee", "aiProvider", "aiModel", "aiApiKey", "aiApiKeyHash", "aiUseCustomKey", status, "pendingBalance", "totalEarned", "totalPaid", "walletEth", "walletBtc", "totalRevenue", "averageRating", "reviewCount", "isListed", "listingPriority", "createdAt", "updatedAt") FROM stdin;
cmk030e29000gxaefcwlkd3uj	Viral Studio	viral-studio	cmjzuusq60000peus3yh1w5h0	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	0.1	anthropic	claude-haiku-4-5-20241022	\N	\N	f	ACTIVE	0	0	0	\N	\N	0	0	0	f	0	2026-01-04 18:45:13.905	2026-01-04 18:45:13.905
\.


--
-- Data for Name: AgencyAiPersonality; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."AgencyAiPersonality" (id, name, "agencyId", "creatorSlug", personality, "primaryTone", "toneKeywords", "trafficShare", "isActive", "aiMediaEnabled", "aiMediaFrequency", "aiPPVRatio", "aiTeasingEnabled", "autoHandoffEnabled", "handoffSpendThreshold", "handoffOnHighIntent", "handoffKeywords", "characterAge", "primaryLanguage", background, "coreTraits", flaws, quirks, "innerVoice", "writingStyle", boundaries, "responseRules", "exampleGoodMessages", "exampleBadMessages", "customInstructions", "totalEarnings", "totalMessages", "totalSales", "conversionRate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AgencyApplication; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."AgencyApplication" (id, "modelListingId", "agencyListingId", "agencyId", "initiatedBy", status, message, "conversationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AgencyCreatorPayout; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."AgencyCreatorPayout" (id, "agencyId", "creatorSlug", amount, "walletType", "walletAddress", status, "paidAt", "paidBy", "txHash", "createdAt") FROM stdin;
\.


--
-- Data for Name: AgencyEarning; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."AgencyEarning" (id, "agencyId", "creatorEarningId", "grossAmount", "agencyShare", "agencyGross", "chatterAmount", "netAmount", type, status, "paidAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: AgencyListing; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."AgencyListing" (id, "agencyId", headline, description, "lookingFor", "contentTypes", requirements, "minRevenueShare", "maxRevenueShare", "providesContent", "providesChatting", "providesMarketing", location, "acceptsRemote", "averageRating", "reviewCount", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AgencyPayoutRequest; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."AgencyPayoutRequest" (id, "agencyId", amount, "walletType", "walletAddress", status, "paidAt", "paidBy", "txHash", "createdAt") FROM stdin;
\.


--
-- Data for Name: AgencyPublicStats; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."AgencyPublicStats" (id, "agencyId", "calculatedAt", "activeCreators", "totalCreatorsEver", "totalRevenueLast30d", "avgRevenuePerCreator", "revenueGrowth3m", "payoutSuccessRate", "avgPayoutDelayDays", "avgCommissionRate", "minCommissionRate", "maxCommissionRate", "avgCollaborationMonths", retention6m, retention12m, "avgResponseTimeHours", "monthlyHistory", badges, "avgRating", "totalReviews", "isPublic", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AgencyReview; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."AgencyReview" (id, "reviewerId", "reviewerType", "targetId", "targetType", rating, comment, "collaborationStartedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: AiPerformanceSummary; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."AiPerformanceSummary" (id, "creatorSlug", date, "aiMessages", "aiRevenue", "aiConversions", "aiAvgResponseTime", "chatterMessages", "chatterRevenue", "chatterConversions", "chatterAvgResponseTime", "aiRevenuePerMessage", "chatterRevenuePerMessage", "aiConversionRate", "chatterConversionRate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AiPersonalityEarning; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."AiPersonalityEarning" (id, "aiPersonalityId", "creatorEarningId", "grossAmount", "attributedMessageId", type, "createdAt") FROM stdin;
\.


--
-- Data for Name: AiResponseQueue; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."AiResponseQueue" (id, "messageId", "conversationId", "creatorSlug", "scheduledAt", status, response, "mediaId", attempts, "maxAttempts", error, "createdAt", "processedAt", "shouldSendMedia", "mediaDecision", "teaseText") FROM stdin;
\.


--
-- Data for Name: AiSuggestion; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."AiSuggestion" (id, "conversationId", "messageId", content, "mediaDecision", "mediaId", "personalityId", status, "editedContent", "sentById", "expiresAt", "sentAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: AutoBump; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."AutoBump" (id, "conversationId", "fanUserId", "creatorSlug", "scheduledAt", status, "bumpType", "personalityId", message, "sentAt", "messageId", error, "createdAt") FROM stdin;
\.


--
-- Data for Name: Bundle; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."Bundle" (id, "agencyId", name, description, "coverImage", "mediaIds", "originalPrice", "bundlePrice", "discountPercent", "availableFor", "creatorSlug", "maxPurchases", "purchaseCount", "isActive", "startsAt", "endsAt", "totalRevenue", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."Category" (id, name, slug, description, "coverImage", "sortOrder", "isActive", "createdAt", "updatedAt") FROM stdin;
cmjzvj3ga0002s3fihoijuc7q	Photos	photos	Photo collections	\N	1	t	2026-01-04 15:15:49.69	2026-01-04 15:15:49.69
cmjzvj3gj0003s3fixndkbi7u	Videos	videos	Video content	\N	2	t	2026-01-04 15:15:49.699	2026-01-04 15:15:49.699
cmjzvj3gp0004s3fix10pbobi	Exclusive	exclusive	VIP exclusive content	\N	3	t	2026-01-04 15:15:49.705	2026-01-04 15:15:49.705
\.


--
-- Data for Name: Chatter; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."Chatter" (id, email, "passwordHash", name, avatar, "agencyId", "commissionEnabled", "commissionRate", "pendingBalance", "totalPaid", "walletEth", "walletBtc", "totalEarnings", "totalMessages", "totalSales", "messagesOutsideShift", "isActive", "lastActiveAt", schedule, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ChatterCreatorAssignment; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."ChatterCreatorAssignment" (id, "chatterId", "creatorSlug", "createdAt") FROM stdin;
\.


--
-- Data for Name: ChatterEarning; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."ChatterEarning" (id, "chatterId", "creatorEarningId", "grossAmount", "commissionRate", "commissionAmount", "attributedMessageId", "delayedAttribution", type, status, "paidAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: ChatterPayoutRequest; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."ChatterPayoutRequest" (id, "chatterId", "agencyId", amount, "walletType", "walletAddress", status, "paidAt", "paidBy", "txHash", "createdAt") FROM stdin;
\.


--
-- Data for Name: ChatterScriptFavorite; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."ChatterScriptFavorite" (id, "chatterId", "scriptId", "order", "createdAt") FROM stdin;
\.


--
-- Data for Name: Conversation; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."Conversation" (id, "creatorSlug", "aiPersonalityId", "detectedTone", "toneConfidence", "lastToneCheck", "autoToneSwitch", "aiMode", "assignedChatterId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ConversationHandoff; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."ConversationHandoff" (id, "conversationId", "triggerType", "triggerValue", "fromAiPersonalityId", "toChatterId", status, "notifiedAt", "respondedAt", "expiresAt", notes, "createdAt") FROM stdin;
\.


--
-- Data for Name: ConversationParticipant; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."ConversationParticipant" (id, "conversationId", "userId", "lastReadAt", "isTyping", "isPinned", "isMuted") FROM stdin;
\.


--
-- Data for Name: ConversationSummary; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."ConversationSummary" (id, "conversationId", "summaryDate", "messageCount", topics, outcome, "keyMoments", "nextSteps", "fanMood", "firstMessageId", "lastMessageId", "createdAt") FROM stdin;
\.


--
-- Data for Name: Creator; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."Creator" (id, slug, name, "displayName", avatar, "cardImage", "coverImage", bio, "userId", "agencyId", "socialLinks", theme, "walletEth", "walletBtc", "photoCount", "videoCount", "subscriberCount", "isActive", "sortOrder", categories, "aiEnabled", "aiPersonality", "aiResponseDelay", "aiLastActive", "aiMediaEnabled", "aiMediaFrequency", "aiPPVRatio", "aiTeasingEnabled", "aiProvider", "aiModel", "aiApiKey", "aiApiKeyHash", "aiUseCustomKey", "pendingBalance", "totalEarned", "totalPaid", "isListed", "lookingForAgency", "createdAt", "updatedAt", "customInstructions", "exampleBadMessages", "exampleGoodMessages", "responseRules") FROM stdin;
cmjzvmh9b0001w2yvmxhi3y1k	emmarose	Emma Rose	Emma Rose	/uploads/avatar/2c1bdd1822885d29ce3637c4be4dec1f.jpg	/uploads/media/fd3c6c0992c2e84a9a97080eaa0fac2d.jpg	/uploads/media/fe87fdad2e29e2b408a7e4c4540eb320.jpg	Hey loves! I'm Emma, your favorite girl next door. Subscribe for daily exclusive content and personal chats.	cmjzuusq60000peus3yh1w5h0	cmk030e29000gxaefcwlkd3uj	{"instagram":"https://instagram.com/emmarose","twitter":"https://twitter.com/emmarose","tiktok":"https://tiktok.com/@emmarose"}	{}			320	18	1800	t	0	[]	f	\N	120	\N	t	4	30	t	anthropic	claude-haiku-4-5-20241022	\N	\N	f	0	0	0	t	f	2026-01-04 15:18:27.552	2026-01-04 18:46:11.814	\N	\N	\N	\N
11a5d637-50ce-4a2a-a5ae-c104c87f3c72	esmeralda	Esmeralda	Esmeralda	/uploads/media/3098541333274861187_1.jpg	\N	/uploads/media/3139060541796007962_1.jpg	Contenu exclusif et photos sensuelles	cmjzuusq60000peus3yh1w5h0	cmk030e29000gxaefcwlkd3uj	{}	{}	\N	\N	8	123	0	t	0	[]	t	\N	120	\N	t	4	30	t	anthropic	claude-haiku-4-5-20241022	\N	\N	f	0	0	0	t	f	2026-01-04 15:23:32.83	2026-01-04 18:46:09.807	\N	\N	\N	\N
3ddabc13-8eb9-479c-b92a-5c2945f4b358	bold-kira	Kira	Bold Kira	/uploads/avatar/99600d41b28be080dbec39f7ee03d209.jpg	/uploads/media/53db801c7af827d6a7487bd7a0e86f6e.jpg	/uploads/media/6ffefc1edbdd003330b39d5868a62b46.jpg	Contenu exclusif et photos sensuelles	cmjzuusq60000peus3yh1w5h0	cmk030e29000gxaefcwlkd3uj	{"instagram":null,"twitter":null,"tiktok":null}	{}			204	70	0	t	0	[]	t	\N	120	\N	t	4	30	t	anthropic	claude-haiku-4-5-20241022	\N	\N	f	0	0	0	t	f	2026-01-04 15:23:32.83	2026-01-04 18:46:10.489	\N	\N	\N	\N
cmjzvmh8u0000w2yvr1v6joo4	miacosta	Mia Costa	Mia Costa	/uploads/avatar/43bbec049243a195272ab4b77f68acd6.jpg	/uploads/media/a37f8c13f8183ce5ce25eb55abfc1887.jpg	/uploads/media/833de18ce60a3a389a89719b8d4c8814.jpg	Welcome to my exclusive content. Join my VIP for the full experience.	cmjzuusq60000peus3yh1w5h0	cmk030e29000gxaefcwlkd3uj	{"instagram":"https://instagram.com/miacosta","twitter":"https://twitter.com/miacosta","tiktok":null}	{}			127	113	2500	t	0	[]	f	\N	120	\N	t	4	30	t	anthropic	claude-haiku-4-5-20241022	\N	\N	f	0	0	0	t	f	2026-01-04 15:18:27.535	2026-01-04 18:46:11.147	\N	\N	\N	\N
\.


--
-- Data for Name: CreatorEarning; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."CreatorEarning" (id, "creatorSlug", type, "sourceId", "grossAmount", "commissionRate", "commissionAmount", "netAmount", status, "paidAt", "payoutTxId", "userId", "chatterId", "aiPersonalityId", "attributedMessageId", "createdAt") FROM stdin;
\.


--
-- Data for Name: CreatorMember; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."CreatorMember" (id, "creatorSlug", "userId", "isVip", "isBlocked", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CreatorPublicStats; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."CreatorPublicStats" (id, "creatorId", "calculatedAt", "revenueLast30d", "revenueAvg3m", "revenueTrend", "totalRevenueAllTime", "revenueFromSubs", "revenueFromPPV", "revenueFromTips", "revenueFromMessages", "activeSubscribers", "subscriberRetention", "avgSubscriptionMonths", "subscriberGrowth30d", "activityRate", "avgResponseMinutes", "lastActiveAt", "messageToSaleRate", "ppvUnlockRate", "totalPosts", "postsLast30d", "avgPostsPerWeek", "totalMedia", "avgLikesPerPost", "avgCommentsPerPost", "monthlyHistory", badges, "avgRating", "totalReviews", "showRevenue", "showSubscribers", "showActivity", "isPublic", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CreatorVerification; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."CreatorVerification" (id, "creatorId", "creatorSlug", "documentType", "documentFrontUrl", "documentBackUrl", "selfieUrl", "fullName", "dateOfBirth", nationality, "documentNumber", "documentExpiry", status, "verifiedAt", "verifiedBy", "rejectionReason", "externalId", "externalStatus", "confidenceScore", "expiresAt", "reminderSent", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CreditTransaction; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."CreditTransaction" (id, "userId", amount, balance, type, "creditType", "mediaId", "messageId", "subscriptionId", description, "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: DMCANotice; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."DMCANotice" (id, name, email, company, "contentUrl", "originalUrl", description, signature, status, resolution, "resolvedAt", "resolvedBy", "counterNotice", "counterNoticeAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DailyStats; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."DailyStats" (id, date, "totalViews", "uniqueVisitors", "topPages", "topReferrers", "deviceStats", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DiscountCode; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."DiscountCode" (id, code, "creatorSlug", "discountType", "discountValue", "maxDiscount", "minPurchase", "expiresAt", "maxUses", "currentUses", "isActive", "fanUserId", "conversationId", "sourceType", "sourceId", "createdAt", "usedAt") FROM stdin;
\.


--
-- Data for Name: FanLeadScore; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."FanLeadScore" (id, "fanUserId", "creatorSlug", score, "engagementScore", "spendingScore", "intentScore", "recencyScore", "predictedLTV", "purchaseProbability", "churnRisk", factors, "lastCalculated", version, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: FanMemory; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."FanMemory" (id, "fanUserId", "creatorSlug", category, key, value, confidence, "sourceMessageId", "extractedBy", "lastConfirmed", "expiresAt", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: FanPresence; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."FanPresence" (id, "fanUserId", "creatorSlug", "isOnline", "lastSeen", "lastBumpedAt", "bumpCooldownHours", "totalBumps", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: FanProfile; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."FanProfile" (id, "fanUserId", "creatorSlug", "preferredTone", "preferredTopics", "spendingTier", "activityLevel", timezone, language, "totalSpent", "totalMessages", "lastSeen", "firstSeen", notes, "createdAt", "updatedAt", "qualityScore", "qualityTier", "messagesWithoutPurchase", "freeContentRequests", "aiOnlyMode", "aiOnlyReason", "relationshipStage", "sharedMoments", "lastConversation") FROM stdin;
\.


--
-- Data for Name: FlashSale; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."FlashSale" (id, "conversationId", "fanUserId", "creatorSlug", "bundleId", "mediaId", "originalPrice", "salePrice", "discountCode", "expiresAt", "reminderSent", status, "redeemedAt", "triggerType", "createdAt") FROM stdin;
\.


--
-- Data for Name: MediaContent; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."MediaContent" (id, title, slug, description, "creatorSlug", type, "accessTier", "isPurchaseable", price, "tagGallery", "tagPPV", "tagAI", "tagFree", "tagVIP", "ppvPriceCredits", "thumbnailUrl", "previewUrl", "contentUrl", "storageKey", "fileSize", duration, width, height, "mimeType", "categoryId", tags, "viewCount", "purchaseCount", "isPublished", "isFeatured", "showInGallery", "publishedAt", "createdAt", "updatedAt") FROM stdin;
mcmjzwlutnbgkl90cqk	Post 904f9b	miacosta-18041315e666de6f50028a06ce904f9b	\N	miacosta	PHOTO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/18041315e666de6f50028a06ce904f9b.jpg	\N	/uploads/media/18041315e666de6f50028a06ce904f9b.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnzeko0dqtw	Post 818364	miacosta-192f11df1c1980b2c9c0d1157c818364	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/192f11df1c1980b2c9c0d1157c818364.jpg	\N	/uploads/media/192f11df1c1980b2c9c0d1157c818364.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn26iscyr9v	Post 418063	miacosta-2517197253980418063	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/2517197253980418063_1.jpg	\N	/uploads/media/2517197253980418063_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnt9ia634gg	Post 112113	miacosta-2545446868282112113	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	10000	/uploads/media/2545446868282112113_1.jpg	\N	/uploads/media/2545446868282112113_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnmdn8isz1z	Post 567582	miacosta-2552672324991567582	\N	miacosta	PHOTO	BASIC	f	\N	f	t	t	f	f	12000	/uploads/media/2552672324991567582_1.jpg	\N	/uploads/media/2552672324991567582_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnphtw0enlb	Post 288039	miacosta-2717994735623288039	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	6000	/uploads/media/2717994735623288039_1.jpg	\N	/uploads/media/2717994735623288039_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnpu3z12l1g	Post 470044	miacosta-2741838065857470044	\N	miacosta	PHOTO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/2741838065857470044_1.jpg	\N	/uploads/media/2741838065857470044_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn6393h2hb1	Post 580698	miacosta-2742624509601580698	\N	miacosta	PHOTO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/2742624509601580698_1.jpg	\N	/uploads/media/2742624509601580698_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnmksnv7gyp	Post 666662	miacosta-2800579910636666662	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/2800579910636666662_1.jpg	\N	/uploads/media/2800579910636666662_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnvw5ell0oq	Post 070295	miacosta-2833171100456070295	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	5000	/uploads/media/2833171100456070295_1.jpg	\N	/uploads/media/2833171100456070295_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn2ww6xk6uq	Post 863230	miacosta-2860021480380863230	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/2860021480380863230_1.jpg	\N	/uploads/media/2860021480380863230_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnqj7m1a7vk	Post 487894	miacosta-2872307818983487894	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	3000	/uploads/media/2872307818983487894_1.jpg	\N	/uploads/media/2872307818983487894_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn3da81oq0j	Post 834996	miacosta-2885347102581834996	\N	miacosta	PHOTO	BASIC	f	\N	f	t	t	f	f	12000	/uploads/media/2885347102581834996_1.jpg	\N	/uploads/media/2885347102581834996_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnf3rzjfu51	Post 085161	miacosta-2890417024190085161	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	7000	/uploads/media/2890417024190085161_1.jpg	\N	/uploads/media/2890417024190085161_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnb2z1gj5o9	Post 254898	miacosta-2917247876436254898	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/2917247876436254898_1.jpg	\N	/uploads/media/2917247876436254898_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn7gp8nfrpq	Post 789346	miacosta-2922304526016789346	\N	miacosta	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/2922304526016789346_1.jpg	\N	/uploads/media/2922304526016789346_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn3audmlzra	Post 427120	miacosta-2971578964451427120	\N	miacosta	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/2971578964451427120_1.jpg	\N	/uploads/media/2971578964451427120_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn7kh2y45ya	Post 522877	miacosta-2973048796289522877	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/2973048796289522877_1.jpg	\N	/uploads/media/2973048796289522877_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn7y5xbfiax	Post 176846	miacosta-2975918725330176846	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	5000	/uploads/media/2975918725330176846_1.jpg	\N	/uploads/media/2975918725330176846_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn94ur1eo4u	Post 579726	miacosta-2978828947044579726	\N	miacosta	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/2978828947044579726_1.jpg	\N	/uploads/media/2978828947044579726_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnin7oy1cgu	Post 29bf1c	miacosta-2c8dc789a280dc4125722f6adb29bf1c	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/2c8dc789a280dc4125722f6adb29bf1c_thumb.jpg	\N	/uploads/media/2c8dc789a280dc4125722f6adb29bf1c.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnleebbj5da	Post 549406	miacosta-3036738115692549406	\N	miacosta	PHOTO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3036738115692549406_1.jpg	\N	/uploads/media/3036738115692549406_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnimcajcnti	Post 006678	miacosta-3039035234726006678	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	8000	/uploads/media/3039035234726006678_1.jpg	\N	/uploads/media/3039035234726006678_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnji7o5nqzt	Post 194614	miacosta-3041884758637194614	\N	miacosta	PHOTO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/3041884758637194614_1.jpg	\N	/uploads/media/3041884758637194614_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnum75kzn6k	Post 840416	miacosta-3046257787248840416	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	8000	/uploads/media/3046257787248840416_1.jpg	\N	/uploads/media/3046257787248840416_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnb7co5ovoh	Post 152639	miacosta-3059329230991152639	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	8000	/uploads/media/3059329230991152639_1.jpg	\N	/uploads/media/3059329230991152639_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnjn6jpha15	Post 560424	miacosta-3065804027762560424	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3065804027762560424_1.jpg	\N	/uploads/media/3065804027762560424_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn73s7ws6hy	Post 786383	miacosta-3095491095878786383	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	3000	/uploads/media/3095491095878786383_1.jpg	\N	/uploads/media/3095491095878786383_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn1vqm1vrzy	Post 525417	miacosta-3112951719659525417	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	3000	/uploads/media/3112951719659525417_1.jpg	\N	/uploads/media/3112951719659525417_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutngg8iyd7r7	Post 427051	miacosta-3129585053097427051	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3129585053097427051_1.jpg	\N	/uploads/media/3129585053097427051_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn85dua3hvy	Post 173721	miacosta-3141929513890173721	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3141929513890173721_1.jpg	\N	/uploads/media/3141929513890173721_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutne1sq9zs04	Post 243304	miacosta-3147733210008243304	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3147733210008243304_1.jpg	\N	/uploads/media/3147733210008243304_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutng3nlammk1	Post 401018	miacosta-3167267704893401018	\N	miacosta	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3167267704893401018_1.jpg	\N	/uploads/media/3167267704893401018_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnz60vp7is1	Post 709280	miacosta-3191913898835709280	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	5000	/uploads/media/3191913898835709280_1.jpg	\N	/uploads/media/3191913898835709280_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn2f9fis6ti	Post 528296	miacosta-3202059542271528296	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	11000	/uploads/media/3202059542271528296_1.jpg	\N	/uploads/media/3202059542271528296_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnls6eq5buv	Post 685572	miacosta-3208524551520685572	\N	miacosta	PHOTO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3208524551520685572_1.jpg	\N	/uploads/media/3208524551520685572_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnawcfos7b0	Post 647303	miacosta-3212928475446647303	\N	miacosta	PHOTO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3212928475446647303_1.jpg	\N	/uploads/media/3212928475446647303_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnorsdkm17z	Post 210173	miacosta-3223675004944210173	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	10000	/uploads/media/3223675004944210173_1.jpg	\N	/uploads/media/3223675004944210173_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn3dpugtq2o	Post 503409	miacosta-3314423573048503409	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	8000	/uploads/media/3314423573048503409_1.jpg	\N	/uploads/media/3314423573048503409_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutneidx66slf	Post 141110	miacosta-3321634859988141110	\N	miacosta	PHOTO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/3321634859988141110_1.jpg	\N	/uploads/media/3321634859988141110_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn7lw4olsti	Post 340477	miacosta-3323777987794340477	\N	miacosta	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3323777987794340477_1.jpg	\N	/uploads/media/3323777987794340477_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnc04ak8ujj	Post 686660	miacosta-3357863488230686660	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	8000	/uploads/media/3357863488230686660_1.jpg	\N	/uploads/media/3357863488230686660_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn5972ox1fp	Post 469077	miacosta-3361495085018469077	\N	miacosta	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3361495085018469077_1.jpg	\N	/uploads/media/3361495085018469077_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnfbomh1od8	Post 843763	miacosta-3383979505948843763	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3383979505948843763_1.jpg	\N	/uploads/media/3383979505948843763_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutntepoccykx	Post 234407	miacosta-3389612686240234407	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3389612686240234407_1.jpg	\N	/uploads/media/3389612686240234407_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn5duen6vfw	Post 7f655b	miacosta-33a301bbffe003ac75025e1f9b7f655b	\N	miacosta	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/33a301bbffe003ac75025e1f9b7f655b.jpg	\N	/uploads/media/33a301bbffe003ac75025e1f9b7f655b.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutna458u8c9v	Post 672061	miacosta-3421468023146672061	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	8000	/uploads/media/3421468023146672061_1.jpg	\N	/uploads/media/3421468023146672061_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnegz3chau0	Post 020160	miacosta-3422991945256020160	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	4000	/uploads/media/3422991945256020160_1.jpg	\N	/uploads/media/3422991945256020160_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnzxvmkvof6	Post 635486	miacosta-3500654451730635486	\N	miacosta	PHOTO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3500654451730635486_1.jpg	\N	/uploads/media/3500654451730635486_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnyaa4hutik	Post 143489	miacosta-3501163451534143489	\N	miacosta	PHOTO	BASIC	f	\N	f	t	t	f	f	3000	/uploads/media/3501163451534143489_1.jpg	\N	/uploads/media/3501163451534143489_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnimu2yymrz	Post 733273	miacosta-3501887616750733273	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	5000	/uploads/media/3501887616750733273_1_thumb.jpg	\N	/uploads/media/3501887616750733273_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnob9gwnakr	Post 053185	miacosta-3502107454736053185	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3502107454736053185_1.jpg	\N	/uploads/media/3502107454736053185_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnp2k5dqdn6	Post 723287	miacosta-3502675117056723287	\N	miacosta	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3502675117056723287_1.jpg	\N	/uploads/media/3502675117056723287_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutndxu8gbm28	Post 899473	miacosta-3504306849455899473	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3504306849455899473_1_thumb.jpg	\N	/uploads/media/3504306849455899473_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutncy4g2m03o	Post 732772	miacosta-3509940618539732772	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3509940618539732772_1_thumb.jpg	\N	/uploads/media/3509940618539732772_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnz56535b0q	Post 647585	miacosta-3515754153798647585	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3515754153798647585_1_thumb.jpg	\N	/uploads/media/3515754153798647585_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutni2n7okr7n	Post 259773	miacosta-3549268457567259773	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3549268457567259773_1_thumb.jpg	\N	/uploads/media/3549268457567259773_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnrbr38wkh8	Post 935305	miacosta-3550495450148935305	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	12000	/uploads/media/3550495450148935305_1_thumb.jpg	\N	/uploads/media/3550495450148935305_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn49yqjasyz	Post 913769	miacosta-3562204751632913769	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	6000	/uploads/media/3562204751632913769_1.jpg	\N	/uploads/media/3562204751632913769_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutns6jktgoxp	Post 303199	miacosta-3578214522215303199	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	12000	/uploads/media/3578214522215303199_1.jpg	\N	/uploads/media/3578214522215303199_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutncgf9g1l6u	Post 249047	miacosta-3583226058298249047	\N	miacosta	PHOTO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/3583226058298249047_1.jpg	\N	/uploads/media/3583226058298249047_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnk5plu0bd6	Post 921070	miacosta-3583738239019921070	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	9000	/uploads/media/3583738239019921070_1_thumb.jpg	\N	/uploads/media/3583738239019921070_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnnu5jt3o3i	Post 929830	miacosta-3584526699846929830	\N	miacosta	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3584526699846929830_1.jpg	\N	/uploads/media/3584526699846929830_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn5h1k959e2	Post 680560	miacosta-3585923829513680560	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	6000	/uploads/media/3585923829513680560_1_thumb.jpg	\N	/uploads/media/3585923829513680560_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnbrug81q7d	Post 958016	miacosta-3587540459045958016	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	3000	/uploads/media/3587540459045958016_1.jpg	\N	/uploads/media/3587540459045958016_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnb1ui118e3	Post 545119	miacosta-3594027957133545119	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3594027957133545119_1_thumb.jpg	\N	/uploads/media/3594027957133545119_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn84vh8wmdb	Post 033641	miacosta-3596274153735033641	\N	miacosta	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3596274153735033641_1.jpg	\N	/uploads/media/3596274153735033641_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnc2tikik8x	Post 544796	miacosta-3597541945041544796	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3597541945041544796_1_thumb.jpg	\N	/uploads/media/3597541945041544796_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnknu6ibpjs	Post 426330	miacosta-3609101347653426330	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	8000	/uploads/media/3609101347653426330_1.jpg	\N	/uploads/media/3609101347653426330_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutngvc19yrxd	Post 289045	miacosta-3610085180746289045	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3610085180746289045_1_thumb.jpg	\N	/uploads/media/3610085180746289045_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutntze51q33t	Post 316351	miacosta-3612969705478316351	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	11000	/uploads/media/3612969705478316351_1_thumb.jpg	\N	/uploads/media/3612969705478316351_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn724wttfig	Post 755606	miacosta-3654997593429755606	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3654997593429755606_1_thumb.jpg	\N	/uploads/media/3654997593429755606_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnx9u0efkkn	Post 897849	miacosta-3655521302132897849	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3655521302132897849_1_thumb.jpg	\N	/uploads/media/3655521302132897849_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutne8dr36a68	Post 353774	miacosta-3655721940746353774	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3655721940746353774_1_thumb.jpg	\N	/uploads/media/3655721940746353774_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutns1m8545r6	Post 763605	miacosta-3656252478212763605	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3656252478212763605_1_thumb.jpg	\N	/uploads/media/3656252478212763605_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn435fve814	Post 066239	miacosta-3656506477785066239	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	10000	/uploads/media/3656506477785066239_1.jpg	\N	/uploads/media/3656506477785066239_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnywl9too8l	Post 354582	miacosta-3656991515847354582	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	10000	/uploads/media/3656991515847354582_1_thumb.jpg	\N	/uploads/media/3656991515847354582_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn027qxfctt	Post 964134	miacosta-3657730853270964134	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	6000	/uploads/media/3657730853270964134_1_thumb.jpg	\N	/uploads/media/3657730853270964134_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnbrw63ajkx	Post 571136	miacosta-3658548082006571136	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3658548082006571136_1_thumb.jpg	\N	/uploads/media/3658548082006571136_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnl7yohbaxf	Post 962705	miacosta-3659345277103962705	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	3000	/uploads/media/3659345277103962705_1_thumb.jpg	\N	/uploads/media/3659345277103962705_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnl11tb2hbm	Post 198374	miacosta-3662898638368198374	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3662898638368198374_1_thumb.jpg	\N	/uploads/media/3662898638368198374_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutneexm9x41i	Post 559076	miacosta-3663475499004559076	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3663475499004559076_1_thumb.jpg	\N	/uploads/media/3663475499004559076_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn47k1423aw	Post 195192	miacosta-3665084250539195192	\N	miacosta	VIDEO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/3665084250539195192_1_thumb.jpg	\N	/uploads/media/3665084250539195192_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnmqc040nay	Post 336001	miacosta-3665862018181336001	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3665862018181336001_1_thumb.jpg	\N	/uploads/media/3665862018181336001_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnde7ce020q	Post 725939	miacosta-3667154096402725939	\N	miacosta	VIDEO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3667154096402725939_1_thumb.jpg	\N	/uploads/media/3667154096402725939_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutngxtdwlvbx	Post 419755	miacosta-3668037092900419755	\N	miacosta	PHOTO	BASIC	f	\N	f	t	t	f	f	12000	/uploads/media/3668037092900419755_1.jpg	\N	/uploads/media/3668037092900419755_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnjsx6rncoh	Post 118514	miacosta-3670060057182118514	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3670060057182118514_1_thumb.jpg	\N	/uploads/media/3670060057182118514_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnjkr6f8w3s	Post 100998	miacosta-3670769911249100998	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	10000	/uploads/media/3670769911249100998_1.jpg	\N	/uploads/media/3670769911249100998_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnyqfohjwqg	Post 054283	miacosta-3671457474486054283	\N	miacosta	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3671457474486054283_1.jpg	\N	/uploads/media/3671457474486054283_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnfigd867bd	Post 346666	miacosta-3674392712539346666	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	12000	/uploads/media/3674392712539346666_1.jpg	\N	/uploads/media/3674392712539346666_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutndu90dndy4	Post 515276	miacosta-3675234677620515276	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	6000	/uploads/media/3675234677620515276_1_thumb.jpg	\N	/uploads/media/3675234677620515276_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn7irn0asn9	Post 513178	miacosta-3675912010965513178	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3675912010965513178_1_thumb.jpg	\N	/uploads/media/3675912010965513178_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnlfsjn6t61	Post 319374	miacosta-3681129820689319374	\N	miacosta	PHOTO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3681129820689319374_1.jpg	\N	/uploads/media/3681129820689319374_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnw6r5si3ix	Post 479485	miacosta-3686001442674479485	\N	miacosta	VIDEO	BASIC	f	\N	f	t	t	f	f	12000	/uploads/media/3686001442674479485_1_thumb.jpg	\N	/uploads/media/3686001442674479485_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnkcqps641w	Post 198692	miacosta-3690337240228198692	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	5000	/uploads/media/3690337240228198692_1_thumb.jpg	\N	/uploads/media/3690337240228198692_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnhp2z09963	Post 623055	miacosta-3691141589363623055	\N	miacosta	VIDEO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3691141589363623055_1_thumb.jpg	\N	/uploads/media/3691141589363623055_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn8w6ici9nz	Post 710410	miacosta-3692011998310710410	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3692011998310710410_1_thumb.jpg	\N	/uploads/media/3692011998310710410_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnav2eb56qd	Post 875515	miacosta-3698290062894875515	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3698290062894875515_1_thumb.jpg	\N	/uploads/media/3698290062894875515_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn8omk2mj0q	Post 554846	miacosta-3702105517469554846	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3702105517469554846_1_thumb.jpg	\N	/uploads/media/3702105517469554846_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnglhkadgjc	Post 745391	miacosta-3702650626043745391	\N	miacosta	VIDEO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3702650626043745391_1_thumb.jpg	\N	/uploads/media/3702650626043745391_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnnlevfc5u6	Post 191335	miacosta-3704811306705191335	\N	miacosta	VIDEO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3704811306705191335_1_thumb.jpg	\N	/uploads/media/3704811306705191335_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnohiv1200z	Post 051964	miacosta-3710826540189051964	\N	miacosta	VIDEO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/3710826540189051964_1_thumb.jpg	\N	/uploads/media/3710826540189051964_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn33jon0oix	Post 685634	miacosta-3711531149362685634	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3711531149362685634_1_thumb.jpg	\N	/uploads/media/3711531149362685634_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnz1taraaar	Post 039936	miacosta-3712068330023039936	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3712068330023039936_1.jpg	\N	/uploads/media/3712068330023039936_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnljl7d36vd	Post 210354	miacosta-3718563967384210354	\N	miacosta	VIDEO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3718563967384210354_1_thumb.jpg	\N	/uploads/media/3718563967384210354_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnhhgbatd6k	Post 326496	miacosta-3720132888067326496	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	5000	/uploads/media/3720132888067326496_1_thumb.jpg	\N	/uploads/media/3720132888067326496_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnpub3lrhqt	Post 486160	miacosta-3720848016513486160	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3720848016513486160_1_thumb.jpg	\N	/uploads/media/3720848016513486160_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnsw18gn7hg	Post 334289	miacosta-3721520024813334289	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3721520024813334289_1_thumb.jpg	\N	/uploads/media/3721520024813334289_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnrnfi2wx32	Post 492437	miacosta-3723158522625492437	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3723158522625492437_1_thumb.jpg	\N	/uploads/media/3723158522625492437_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnn7dqx6vf4	Post 779859	miacosta-3726680129552779859	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	8000	/uploads/media/3726680129552779859_1_thumb.jpg	\N	/uploads/media/3726680129552779859_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnp0gu6vzm9	Post 001354	miacosta-3727428973920001354	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3727428973920001354_1_thumb.jpg	\N	/uploads/media/3727428973920001354_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnbr98ydxre	Post 789514	miacosta-3741938120501789514	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3741938120501789514_1_thumb.jpg	\N	/uploads/media/3741938120501789514_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnbf4j3f32n	Post 288984	miacosta-3743951211519288984	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3743951211519288984_1_thumb.jpg	\N	/uploads/media/3743951211519288984_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn0c4qq453z	Post 325682	miacosta-3749758451740325682	\N	miacosta	VIDEO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3749758451740325682_1_thumb.jpg	\N	/uploads/media/3749758451740325682_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn6xvm09y7x	Post 154580	miacosta-3751371965736154580	\N	miacosta	VIDEO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3751371965736154580_1_thumb.jpg	\N	/uploads/media/3751371965736154580_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnpx579v3sv	Post 186321	miacosta-3756407756941186321	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3756407756941186321_1_thumb.jpg	\N	/uploads/media/3756407756941186321_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnqg85oysml	Post 456248	miacosta-3757038150061456248	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3757038150061456248_1_thumb.jpg	\N	/uploads/media/3757038150061456248_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnwb4iii3co	Post 050216	miacosta-3762291528011050216	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3762291528011050216_1_thumb.jpg	\N	/uploads/media/3762291528011050216_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn0zzdfmm46	Post 048418	miacosta-3765789427952048418	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3765789427952048418_1_thumb.jpg	\N	/uploads/media/3765789427952048418_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutno9867jqew	Post 215856	miacosta-3766572980948215856	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3766572980948215856_1.jpg	\N	/uploads/media/3766572980948215856_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn7h1d1e43e	Post 495308	miacosta-3767174493869495308	\N	miacosta	VIDEO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3767174493869495308_1_thumb.jpg	\N	/uploads/media/3767174493869495308_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn26efjv5lq	Post 223583	miacosta-3768612561235223583	\N	miacosta	PHOTO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3768612561235223583_1.jpg	\N	/uploads/media/3768612561235223583_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn2bi36ccen	Post 728276	miacosta-3769410319835728276	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3769410319835728276_1_thumb.jpg	\N	/uploads/media/3769410319835728276_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnu681v1x6g	Post ac07e0	miacosta-3a5b5e58da8b74f90deed1642fac07e0	\N	miacosta	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3a5b5e58da8b74f90deed1642fac07e0.jpg	\N	/uploads/media/3a5b5e58da8b74f90deed1642fac07e0.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnj642i47s9	Post cc668b	miacosta-45f9db97d7e6b3724442ffd0fdcc668b	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/45f9db97d7e6b3724442ffd0fdcc668b_thumb.jpg	\N	/uploads/media/45f9db97d7e6b3724442ffd0fdcc668b.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnal7yt40uw	Post a77add	miacosta-4f79f3bd197d3eeaadff1c77e1a77add	\N	miacosta	PHOTO	BASIC	f	\N	f	t	t	f	f	11000	/uploads/media/4f79f3bd197d3eeaadff1c77e1a77add.jpg	\N	/uploads/media/4f79f3bd197d3eeaadff1c77e1a77add.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnbvx3xfanc	Post 8206ce	miacosta-5689bec45de27a48db7e997e3b8206ce	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/5689bec45de27a48db7e997e3b8206ce.png	\N	/uploads/media/5689bec45de27a48db7e997e3b8206ce.png	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn9uxoo335v	Post 3eb04c	miacosta-5b700f6dfa8c681574ca10945f3eb04c	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	6000	/uploads/media/5b700f6dfa8c681574ca10945f3eb04c.jpg	\N	/uploads/media/5b700f6dfa8c681574ca10945f3eb04c.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnqchfvr2w1	Post ae419e	miacosta-5dc299a51f92a5d171b9f43651ae419e	\N	miacosta	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/5dc299a51f92a5d171b9f43651ae419e.jpg	\N	/uploads/media/5dc299a51f92a5d171b9f43651ae419e.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnxarjcqfhr	Post 089860	miacosta-678a8bd636ad7a745b3d591833089860	\N	miacosta	VIDEO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/678a8bd636ad7a745b3d591833089860_thumb.jpg	\N	/uploads/media/678a8bd636ad7a745b3d591833089860.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnbnju767w0	Post 35b2cc	miacosta-6a10b441c2640e1d91b008249c35b2cc	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	10000	/uploads/media/6a10b441c2640e1d91b008249c35b2cc.png	\N	/uploads/media/6a10b441c2640e1d91b008249c35b2cc.png	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnv3fmr0aw6	Post edea17	miacosta-6c7a188709ea2765bd3eab7340edea17	\N	miacosta	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/6c7a188709ea2765bd3eab7340edea17.jpg	\N	/uploads/media/6c7a188709ea2765bd3eab7340edea17.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutns5o9piurb	Post be44a5	miacosta-6dba00445dcc3c5bec1897e871be44a5	\N	miacosta	PHOTO	BASIC	f	\N	f	t	t	f	f	7000	/uploads/media/6dba00445dcc3c5bec1897e871be44a5.png	\N	/uploads/media/6dba00445dcc3c5bec1897e871be44a5.png	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnt5bdjpk0e	Post 9278c5	miacosta-7004327c9d2e2d8e49da76f5c89278c5	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/7004327c9d2e2d8e49da76f5c89278c5.png	\N	/uploads/media/7004327c9d2e2d8e49da76f5c89278c5.png	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnas3ye4b5u	Post cc8035	miacosta-73b962b1768b83dde8da72176bcc8035	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/73b962b1768b83dde8da72176bcc8035.jpg	\N	/uploads/media/73b962b1768b83dde8da72176bcc8035.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn1uxd61gv2	Post d861de	miacosta-77ebaef7c47e1f858ca0fdc6d5d861de	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/77ebaef7c47e1f858ca0fdc6d5d861de.jpg	\N	/uploads/media/77ebaef7c47e1f858ca0fdc6d5d861de.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnlqm3fzmgs	Post 255677	miacosta-88db6aad66e7ba26f0308c0df8255677	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/88db6aad66e7ba26f0308c0df8255677_thumb.jpg	\N	/uploads/media/88db6aad66e7ba26f0308c0df8255677.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnq2dadrhkm	Post 25fb64	miacosta-8fa079f3b95b422c8c37a9f54725fb64	\N	miacosta	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/8fa079f3b95b422c8c37a9f54725fb64.jpg	\N	/uploads/media/8fa079f3b95b422c8c37a9f54725fb64.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutnwkvil90sz	Post c40eba	miacosta-9ad10918948e398b6b184738d0c40eba	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	4000	/uploads/media/9ad10918948e398b6b184738d0c40eba.jpg	\N	/uploads/media/9ad10918948e398b6b184738d0c40eba.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutn1iz20j7xo	Post 11f0c1	miacosta-a74e94648c53e6f11a86bf2c7111f0c1	\N	miacosta	PHOTO	BASIC	f	\N	f	t	t	f	f	5000	/uploads/media/a74e94648c53e6f11a86bf2c7111f0c1.jpg	\N	/uploads/media/a74e94648c53e6f11a86bf2c7111f0c1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutonzyzmh9ys	Post nWAijA	miacosta-CA6QnWAijA	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	7000	/uploads/media/C-A6QnWAijA_01.jpg	\N	/uploads/media/C-A6QnWAijA_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutonwj6v94z8	Post f9c824	miacosta-c25fd9090e8bf6d65cd05e5e82f9c824	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/c25fd9090e8bf6d65cd05e5e82f9c824_thumb.jpg	\N	/uploads/media/c25fd9090e8bf6d65cd05e5e82f9c824.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwluto1recnbhan	Post hCvop9	miacosta-C4gbnhCvop9	\N	miacosta	PHOTO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/C4gbnhCvop9_01.jpg	\N	/uploads/media/C4gbnhCvop9_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutoo8g9eimv0	Post 57SF7z	miacosta-C72T257SF7z	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	6000	/uploads/media/C72T257SF7z_thumb.jpg	\N	/uploads/media/C72T257SF7z.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutoi00xh50kd	Post cyl_8m	miacosta-CbdqJcyl8m	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/CbdqJcyl_8m_01.jpg	\N	/uploads/media/CbdqJcyl_8m_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutokyoisrcd2	Post rmliyX	miacosta-CdRchrmliyX	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	12000	/uploads/media/CdRchrmliyX_01.jpg	\N	/uploads/media/CdRchrmliyX_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutobvl6nah3z	Post IkFpL-	miacosta-Cew1mIkFpL	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/Cew1mIkFpL-.jpg	\N	/uploads/media/Cew1mIkFpL-.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutoelz46h1r9	Post 5EFnmW	miacosta-CfcfL5EFnmW	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/CfcfL5EFnmW_01.jpg	\N	/uploads/media/CfcfL5EFnmW_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutodlu0v7rnv	Post grl3gp	miacosta-Cgc0vgrl3gp	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/Cgc0vgrl3gp_01.jpg	\N	/uploads/media/Cgc0vgrl3gp_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwluto804aazjqc	Post cPF8T0	miacosta-CgKzcPF8T0	\N	miacosta	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/CgKz-cPF8T0_01.jpg	\N	/uploads/media/CgKz-cPF8T0_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutobmnizr053	Post zEvuCy	miacosta-Ch8JXzEvuCy	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/Ch8JXzEvuCy.jpg	\N	/uploads/media/Ch8JXzEvuCy.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutovxzi8a842	Post L2JoMw	miacosta-Ck9K1L2JoMw	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/Ck9K1L2JoMw.jpg	\N	/uploads/media/Ck9K1L2JoMw.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutofztyy05m7	Post BHvQtO	miacosta-ClMllBHvQtO	\N	miacosta	PHOTO	BASIC	f	\N	f	t	t	f	f	7000	/uploads/media/ClMllBHvQtO_01.jpg	\N	/uploads/media/ClMllBHvQtO_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutozlqes4v6t	Post DZF3AP	miacosta-CLu4ZDZF3AP	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/CLu4ZDZF3AP_01.jpg	\N	/uploads/media/CLu4ZDZF3AP_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutofqqz15ahp	Post UTPjmO	miacosta-ClW7SUTPjmO	\N	miacosta	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/ClW7SUTPjmO_01.jpg	\N	/uploads/media/ClW7SUTPjmO_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwluto3077k8t6m	Post R3F8be	miacosta-CNs6fR3F8be	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/CNs6fR3F8be_01.jpg	\N	/uploads/media/CNs6fR3F8be_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutod0zg3e0rx	Post C6lfhx	miacosta-CNTPnC6lfhx	\N	miacosta	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/CNTPnC6lfhx_01.jpg	\N	/uploads/media/CNTPnC6lfhx_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwluto829rve5s6	Post JGPq12	miacosta-Co28hJGPq12	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	8000	/uploads/media/Co28hJGPq12.jpg	\N	/uploads/media/Co28hJGPq12.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutof09bmpqtc	Post HJvU-W	miacosta-Cos0nHJvUW	\N	miacosta	PHOTO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/Cos0nHJvU-W_01.jpg	\N	/uploads/media/Cos0nHJvU-W_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutoefcd12hfy	Post oAMlX_	miacosta-Cp067oAMlX	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/Cp067oAMlX__01.jpg	\N	/uploads/media/Cp067oAMlX__01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwluto95he6r4zr	Post UZv82o	miacosta-CqL7IUZv82o	\N	miacosta	PHOTO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/CqL7IUZv82o.jpg	\N	/uploads/media/CqL7IUZv82o.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutohfwt603yq	Post iNP1Up	miacosta-CszbRiNP1Up	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/CszbRiNP1Up_01.jpg	\N	/uploads/media/CszbRiNP1Up_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutor3ghduhrf	Post ZIPoBr	miacosta-CtuhQZIPoBr	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/CtuhQZIPoBr_01.jpg	\N	/uploads/media/CtuhQZIPoBr_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutoe0bvxt0wb	Post JavOe6	miacosta-Cv0ZTJavOe6	\N	miacosta	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/Cv0ZTJavOe6_01.jpg	\N	/uploads/media/Cv0ZTJavOe6_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutoll7l5fgl9	Post --NTTn	miacosta-CW4QcNTTn	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/CW4Qc--NTTn_01.jpg	\N	/uploads/media/CW4Qc--NTTn_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutoglhpyw17w	Post nIxrbZ	miacosta-CwQbpnIxrbZ	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	9000	/uploads/media/CwQbpnIxrbZ.jpg	\N	/uploads/media/CwQbpnIxrbZ.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutogc4dy6p46	Post eNvA1g	miacosta-CxL9MeNvA1g	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	4000	/uploads/media/CxL9MeNvA1g_01.jpg	\N	/uploads/media/CxL9MeNvA1g_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwluto0ucn479lk	Post 92RHyT	miacosta-CxOsK92RHyT	\N	miacosta	VIDEO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/CxOsK92RHyT_thumb.jpg	\N	/uploads/media/CxOsK92RHyT.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutone5qhobl1	Post A-vo1o	miacosta-CxwADAvo1o	\N	miacosta	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/CxwADA-vo1o_01.jpg	\N	/uploads/media/CxwADA-vo1o_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutoy7730j36h	Post ZVAVj9	miacosta-Cy8y1ZVAVj9	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	5000	/uploads/media/Cy8y1ZVAVj9_01.jpg	\N	/uploads/media/Cy8y1ZVAVj9_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutoqba1mx5fq	Post SCgo4E	miacosta-CyGBSCgo4E	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	7000	/uploads/media/CyG-BSCgo4E_01.jpg	\N	/uploads/media/CyG-BSCgo4E_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutola60s7pej	Post GrFB5c	miacosta-CYM9zGrFB5c	\N	miacosta	PHOTO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/CYM9zGrFB5c_01.jpg	\N	/uploads/media/CYM9zGrFB5c_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutoodflepje0	Post zzvBoH	miacosta-CyWnWzzvBoH	\N	miacosta	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/CyWnWzzvBoH_01.jpg	\N	/uploads/media/CyWnWzzvBoH_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwluto66evi88q6	Post 0f49a1	miacosta-da85a7c94c45ba4f2503497d470f49a1	\N	miacosta	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/da85a7c94c45ba4f2503497d470f49a1.png	\N	/uploads/media/da85a7c94c45ba4f2503497d470f49a1.png	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwluto3hqi52nbx	Post Vmxo8k	miacosta-DC10GVmxo8k	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/DC10GVmxo8k_thumb.jpg	\N	/uploads/media/DC10GVmxo8k.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutoz4msmxot3	Post YDxAlX	miacosta-DCcAHYDxAlX	\N	miacosta	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/DCcAHYDxAlX_01.jpg	\N	/uploads/media/DCcAHYDxAlX_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutojgdiyoz28	Post NRyYNR	miacosta-DChzINRyYNR	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/DChzINRyYNR_thumb.jpg	\N	/uploads/media/DChzINRyYNR.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutoyy8xbycrb	Post vPxEfZ	miacosta-DCZNDvPxEfZ	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/DCZNDvPxEfZ_thumb.jpg	\N	/uploads/media/DCZNDvPxEfZ.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutoqxhnf69l7	Post zUyjPB	miacosta-DCZCzUyjPB	\N	miacosta	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/DCZ_CzUyjPB.jpg	\N	/uploads/media/DCZ_CzUyjPB.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutonx8v2mgiu	Post aOxb8h	miacosta-DDKd8aOxb8h	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/DDKd8aOxb8h_thumb.jpg	\N	/uploads/media/DDKd8aOxb8h.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutos6kdkvrvf	Post fab522	miacosta-df36a08001e1af7249566f1e29fab522	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	5000	/uploads/media/df36a08001e1af7249566f1e29fab522.jpg	\N	/uploads/media/df36a08001e1af7249566f1e29fab522.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutoyy8fg4w81	Post t5y4x9	miacosta-DFBiNt5y4x9	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/DFBiNt5y4x9_thumb.jpg	\N	/uploads/media/DFBiNt5y4x9.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutoachif74aq	Post zyxJaJ	miacosta-DFF5MzyxJaJ	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	11000	/uploads/media/DFF5MzyxJaJ_thumb.jpg	\N	/uploads/media/DFF5MzyxJaJ.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwluto6a6hmxcsq	Post kmSdVp	miacosta-DFvflkmSdVp	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/DFvflkmSdVp_01.jpg	\N	/uploads/media/DFvflkmSdVp_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwluto1le77cy0c	Post DgxC6u	miacosta-DG7vDgxC6u	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	9000	/uploads/media/DG7_vDgxC6u_thumb.jpg	\N	/uploads/media/DG7_vDgxC6u.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutocd2cm1pt2	Post ZWyYgf	miacosta-DGoXyZWyYgf	\N	miacosta	PHOTO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/DGoXyZWyYgf_01.jpg	\N	/uploads/media/DGoXyZWyYgf_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutoyn2k8lj08	Post lRxXaw	miacosta-DHDwrlRxXaw	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/DHDwrlRxXaw_thumb.jpg	\N	/uploads/media/DHDwrlRxXaw.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutoywq67999k	Post KRxI6f	miacosta-DHgjWKRxI6f	\N	miacosta	VIDEO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/DHgjWKRxI6f_thumb.jpg	\N	/uploads/media/DHgjWKRxI6f.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutomphluercz	Post n4S5Mp	miacosta-DHoiEn4S5Mp	\N	miacosta	PHOTO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/DHoiEn4S5Mp_01.jpg	\N	/uploads/media/DHoiEn4S5Mp_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwluto8dl4593n1	Post aixOZc	miacosta-DHtCVaixOZc	\N	miacosta	VIDEO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/DHtCVaixOZc_thumb.jpg	\N	/uploads/media/DHtCVaixOZc.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwluto9bgaowu4m	Post 4HSGE_	miacosta-DIj2M4HSGE	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/DIj2M4HSGE__thumb.jpg	\N	/uploads/media/DIj2M4HSGE_.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutoyadn662gc	Post 3JRBya	miacosta-DIWGo3JRBya	\N	miacosta	PHOTO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/DIWGo3JRBya_01.jpg	\N	/uploads/media/DIWGo3JRBya_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutoxt3n3t8au	Post hHSM-V	miacosta-DIZmVhHSMV	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	10000	/uploads/media/DIZmVhHSM-V_thumb.jpg	\N	/uploads/media/DIZmVhHSM-V.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutok1nj9buzi	Post S_Syr_	miacosta-DKhUSSyr	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/DK-hUS_Syr__01.jpg	\N	/uploads/media/DK-hUS_Syr__01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutoauqs3iggy	Post I7ScbW	miacosta-DK5KPI7ScbW	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/DK5KPI7ScbW_thumb.jpg	\N	/uploads/media/DK5KPI7ScbW.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwluto9nyjbgnuy	Post GqgTg5	miacosta-DK7BUGqgTg5	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/DK7BUGqgTg5_thumb.jpg	\N	/uploads/media/DK7BUGqgTg5.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutoxun50irfc	Post x7ybxu	miacosta-DK7u7x7ybxu	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/DK7u7x7ybxu_thumb.jpg	\N	/uploads/media/DK7u7x7ybxu.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwluto0yhwsypf0	Post HdA2_V	miacosta-DK9nkHdA2V	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/DK9nkHdA2_V_thumb.jpg	\N	/uploads/media/DK9nkHdA2_V.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutodkk1880pk	Post RMMRbq	miacosta-DLELRMMRbq	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/DL-ELRMMRbq_01.jpg	\N	/uploads/media/DL-ELRMMRbq_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwluto0qnplzr8l	Post h4sujW	miacosta-DLAPmh4sujW	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/DLAPmh4sujW_thumb.jpg	\N	/uploads/media/DLAPmh4sujW.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutocufwx7pye	Post ThM8em	miacosta-DLC3tThM8em	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/DLC3tThM8em_thumb.jpg	\N	/uploads/media/DLC3tThM8em.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutopvr0p7uzg	Post UZRHs4	miacosta-DLcrUZRHs4	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/DLc_rUZRHs4_thumb.jpg	\N	/uploads/media/DLc_rUZRHs4.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutosv9qf143v	Post U9S4vB	miacosta-DLfwhU9S4vB	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/DLfwhU9S4vB_thumb.jpg	\N	/uploads/media/DLfwhU9S4vB.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwluto85wxkhng5	Post jFsDiA	miacosta-DLFxhjFsDiA	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/DLFxhjFsDiA_thumb.jpg	\N	/uploads/media/DLFxhjFsDiA.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutppnrbqa1yj	Post Q4SPpR	miacosta-DLImyQ4SPpR	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/DLImyQ4SPpR_thumb.jpg	\N	/uploads/media/DLImyQ4SPpR.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutp3ceavvds3	Post iks_wz	miacosta-DLkWTikswz	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	4000	/uploads/media/DLkWTiks_wz_thumb.jpg	\N	/uploads/media/DLkWTiks_wz.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutpw0rzymig2	Post 1csKJy	miacosta-DLurC1csKJy	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	6000	/uploads/media/DLurC1csKJy_thumb.jpg	\N	/uploads/media/DLurC1csKJy.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutp6wg13qavq	Post ecMs7m	miacosta-DLVOuecMs7m	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/DLVOuecMs7m_thumb.jpg	\N	/uploads/media/DLVOuecMs7m.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutpooe7qqapw	Post kkMeDG	miacosta-DLxMckkMeDG	\N	miacosta	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/DLxMckkMeDG_01.jpg	\N	/uploads/media/DLxMckkMeDG_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutpefbsslvzn	Post 5xg37k	miacosta-DLXR45xg37k	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	6000	/uploads/media/DLXR45xg37k_thumb.jpg	\N	/uploads/media/DLXR45xg37k.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutpiuoh6xhnr	Post rxMnkk	miacosta-DM2tirxMnkk	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	4000	/uploads/media/DM2tirxMnkk_thumb.jpg	\N	/uploads/media/DM2tirxMnkk.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutpa90ja0o65	Post gRsISP	miacosta-DM5kbgRsISP	\N	miacosta	VIDEO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/DM5kbgRsISP_thumb.jpg	\N	/uploads/media/DM5kbgRsISP.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutpky308tu1e	Post nxyjyK	miacosta-DM8qVnxyjyK	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	4000	/uploads/media/DM8qVnxyjyK_thumb.jpg	\N	/uploads/media/DM8qVnxyjyK.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutpjj4zq2vve	Post eRxKHM	miacosta-DMBDneRxKHM	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/DMBDneRxKHM_thumb.jpg	\N	/uploads/media/DMBDneRxKHM.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutp3wiq5zu9g	Post -HMPPa	miacosta-DMDdnHMPPa	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	9000	/uploads/media/DMDdn-HMPPa_thumb.jpg	\N	/uploads/media/DMDdn-HMPPa.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutpytekt8swo	Post hoMJF9	miacosta-DMnTshoMJF9	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/DMnTshoMJF9_thumb.jpg	\N	/uploads/media/DMnTshoMJF9.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutptw25k8d78	Post GGSMXO	miacosta-DMWABGGSMXO	\N	miacosta	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/DMWABGGSMXO_01.jpg	\N	/uploads/media/DMWABGGSMXO_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutpol67o827u	Post qByVie	miacosta-DNghVqByVie	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	3000	/uploads/media/DNghVqByVie_thumb.jpg	\N	/uploads/media/DNghVqByVie.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutpz88i1gb4m	Post B8txRv	miacosta-DNidSB8txRv	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/DNidSB8txRv_thumb.jpg	\N	/uploads/media/DNidSB8txRv.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutp0hf8ltgb2	Post EoA4Gn	miacosta-DNqIkEoA4Gn	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	11000	/uploads/media/DNqIkEoA4Gn_thumb.jpg	\N	/uploads/media/DNqIkEoA4Gn.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutp4766jmiwl	Post fDNMN7	miacosta-DNS9zfDNMN7	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/DNS9zfDNMN7_thumb.jpg	\N	/uploads/media/DNS9zfDNMN7.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutp95wjykev7	Post PXD2w8	miacosta-DNgRPXD2w8	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/DN_gRPXD2w8_thumb.jpg	\N	/uploads/media/DN_gRPXD2w8.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutptmzq7x7aq	Post VBgApT	miacosta-DO309VBgApT	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/DO309VBgApT_thumb.jpg	\N	/uploads/media/DO309VBgApT.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutp0rykriyq9	Post csAB1K	miacosta-DO6fOcsAB1K	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	7000	/uploads/media/DO6fOcsAB1K_thumb.jpg	\N	/uploads/media/DO6fOcsAB1K.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutpbqe7f234p	Post j2gLnH	miacosta-DO8mtj2gLnH	\N	miacosta	PHOTO	BASIC	f	\N	f	t	t	f	f	12000	/uploads/media/DO8mtj2gLnH_01.jpg	\N	/uploads/media/DO8mtj2gLnH_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutp7vll8ae13	Post n-gMuy	miacosta-DOajngMuy	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/DOa_jn-gMuy_thumb.jpg	\N	/uploads/media/DOa_jn-gMuy.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutpaqpjt83ex	Post pyj2bC	miacosta-DOCAepyj2bC	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/DOCAepyj2bC_thumb.jpg	\N	/uploads/media/DOCAepyj2bC.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutpdvfj0eewg	Post qRADPA	miacosta-DOD6nqRADPA	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	9000	/uploads/media/DOD6nqRADPA_01.jpg	\N	/uploads/media/DOD6nqRADPA_01.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutpzmqzwvc4o	Post tCgP-Q	miacosta-DOdvQtCgPQ	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	9000	/uploads/media/DOdvQtCgP-Q_thumb.jpg	\N	/uploads/media/DOdvQtCgP-Q.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutpi6mf0tlne	Post bOgEIg	miacosta-DOgkSbOgEIg	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/DOgkSbOgEIg_thumb.jpg	\N	/uploads/media/DOgkSbOgEIg.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutpt3das2js4	Post 6fgM1Q	miacosta-DOjG46fgM1Q	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	9000	/uploads/media/DOjG46fgM1Q_thumb.jpg	\N	/uploads/media/DOjG46fgM1Q.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutp1hupd7m2f	Post 6_gG8R	miacosta-DOlfr6gG8R	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/DOlfr6_gG8R_thumb.jpg	\N	/uploads/media/DOlfr6_gG8R.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutpxt23wqneb	Post VZAPci	miacosta-DOoCCVZAPci	\N	miacosta	VIDEO	BASIC	f	\N	t	t	t	f	f	3000	/uploads/media/DOoCCVZAPci_thumb.jpg	\N	/uploads/media/DOoCCVZAPci.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutpiv7woyiws	Post M_j4XV	miacosta-DOrUPMj4XV	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/DOrUPM_j4XV_thumb.jpg	\N	/uploads/media/DOrUPM_j4XV.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutpnn9ywy90y	Post QIgMf8	miacosta-DOtMtQIgMf8	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/DOtMtQIgMf8_thumb.jpg	\N	/uploads/media/DOtMtQIgMf8.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutp1o006dstm	Post tDAKyb	miacosta-DOyWFtDAKyb	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/DOyWFtDAKyb_thumb.jpg	\N	/uploads/media/DOyWFtDAKyb.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutp2uyqg3a8y	Post oIj6VH	miacosta-DPmlvoIj6VH	\N	miacosta	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/DPmlvoIj6VH_thumb.jpg	\N	/uploads/media/DPmlvoIj6VH.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutp3aknzg9g5	Post UcAINK	miacosta-DPuCOUcAINK	\N	miacosta	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/DPuCOUcAINK_thumb.jpg	\N	/uploads/media/DPuCOUcAINK.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutpf2k3g9gqh	Post 76c7ad	miacosta-e4fc30ad5a727a3bb34917c75876c7ad	\N	miacosta	PHOTO	BASIC	f	\N	t	t	t	f	f	12000	/uploads/media/e4fc30ad5a727a3bb34917c75876c7ad.jpg	\N	/uploads/media/e4fc30ad5a727a3bb34917c75876c7ad.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
mcmjzwlutpvclwqs5hl	Post 5b73ff	miacosta-ebc2a651b8aa9bca7a04b49ce55b73ff	\N	miacosta	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/ebc2a651b8aa9bca7a04b49ce55b73ff.jpg	\N	/uploads/media/ebc2a651b8aa9bca7a04b49ce55b73ff.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	f	f	t	\N	2026-01-04 15:45:58.543	2026-01-04 15:45:58.543
cmjzvty0w0000ixwcpnrxx972	Post 339384	esmeralda-3097736382105339384	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	6000	/uploads/media/3097736382105339384_1_thumb.jpg	\N	/uploads/media/3097736382105339384_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:15.872	2026-01-04 15:24:15.872
cmjzvty160001ixwcro843uri	Post 861187	esmeralda-3098541333274861187	\N	esmeralda	PHOTO	BASIC	f	\N	t	t	t	f	f	5000	/uploads/media/3098541333274861187_1.jpg	\N	/uploads/media/3098541333274861187_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:15.882	2026-01-04 15:24:15.882
cmjzvty1d0002ixwckqhfvgpf	Post 662429	esmeralda-3115007734125662429	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3115007734125662429_1_thumb.jpg	\N	/uploads/media/3115007734125662429_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:15.89	2026-01-04 15:24:15.89
cmjzvty1l0003ixwcflesshge	Post 385744	esmeralda-3123657913142385744	\N	esmeralda	VIDEO	BASIC	f	\N	f	t	t	f	f	9000	/uploads/media/3123657913142385744_1_thumb.jpg	\N	/uploads/media/3123657913142385744_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:15.897	2026-01-04 15:24:15.897
cmjzvty1s0004ixwcqqkoxbgq	Post 007962	esmeralda-3139060541796007962	\N	esmeralda	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3139060541796007962_1.jpg	\N	/uploads/media/3139060541796007962_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:15.905	2026-01-04 15:24:15.905
cmjzvty200005ixwc6k9infnl	Post 534143	esmeralda-3139541835571534143	\N	esmeralda	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3139541835571534143_1.jpg	\N	/uploads/media/3139541835571534143_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:15.912	2026-01-04 15:24:15.912
cmjzvty270006ixwcwubvkk8k	Post 875066	esmeralda-3139899248698875066	\N	esmeralda	PHOTO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3139899248698875066_1.jpg	\N	/uploads/media/3139899248698875066_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:15.92	2026-01-04 15:24:15.92
cmjzvty2e0007ixwc4yourz8u	Post 470237	esmeralda-3164516572936470237	\N	esmeralda	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3164516572936470237_1_thumb.jpg	\N	/uploads/media/3164516572936470237_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:15.927	2026-01-04 15:24:15.927
cmjzvty2m0008ixwc8zrr9we9	Post 503802	esmeralda-3168900648296503802	\N	esmeralda	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3168900648296503802_1_thumb.jpg	\N	/uploads/media/3168900648296503802_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:15.934	2026-01-04 15:24:15.934
cmjzvty2t0009ixwczm0zem7c	Post 639696	esmeralda-3168909825282639696	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3168909825282639696_1_thumb.jpg	\N	/uploads/media/3168909825282639696_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:15.941	2026-01-04 15:24:15.941
cmjzvty30000aixwcu6mqxr0x	Post 628603	esmeralda-3178107729699628603	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3178107729699628603_1_thumb.jpg	\N	/uploads/media/3178107729699628603_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:15.948	2026-01-04 15:24:15.948
cmjzvty36000bixwckj6be24d	Post 765087	esmeralda-3197083076466765087	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3197083076466765087_1_thumb.jpg	\N	/uploads/media/3197083076466765087_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:15.955	2026-01-04 15:24:15.955
cmjzvty3c000cixwcgyvwwthu	Post 721306	esmeralda-3239128163966721306	\N	esmeralda	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3239128163966721306_1_thumb.jpg	\N	/uploads/media/3239128163966721306_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:15.961	2026-01-04 15:24:15.961
cmjzvty3i000dixwcw3r8c1qf	Post 873222	esmeralda-3239638918365873222	\N	esmeralda	VIDEO	BASIC	f	\N	f	t	t	f	f	10000	/uploads/media/3239638918365873222_1_thumb.jpg	\N	/uploads/media/3239638918365873222_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:15.967	2026-01-04 15:24:15.967
cmjzvty3p000eixwcv4ybrdz2	Post 200551	esmeralda-3239639490821200551	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3239639490821200551_1_thumb.jpg	\N	/uploads/media/3239639490821200551_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:15.973	2026-01-04 15:24:15.973
cmjzvty3v000fixwcwwcpj6l4	Post 130172	esmeralda-3239699195606130172	\N	esmeralda	PHOTO	BASIC	f	\N	t	t	t	f	f	4000	/uploads/media/3239699195606130172_1.jpg	\N	/uploads/media/3239699195606130172_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:15.98	2026-01-04 15:24:15.98
cmjzvty41000gixwc4z8t73vv	Post 470230	esmeralda-3239703286755470230	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3239703286755470230_1_thumb.jpg	\N	/uploads/media/3239703286755470230_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:15.985	2026-01-04 15:24:15.985
cmjzvty47000hixwckkyaa9fu	Post 720498	esmeralda-3240304546264720498	\N	esmeralda	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3240304546264720498_1_thumb.jpg	\N	/uploads/media/3240304546264720498_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:15.991	2026-01-04 15:24:15.991
cmjzvty4d000iixwc2o5md19o	Post 672578	esmeralda-3240706507841672578	\N	esmeralda	VIDEO	BASIC	f	\N	f	t	t	f	f	4000	/uploads/media/3240706507841672578_1_thumb.jpg	\N	/uploads/media/3240706507841672578_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:15.997	2026-01-04 15:24:15.997
cmjzvty4i000jixwcdj7bchor	Post 992576	esmeralda-3240709070594992576	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	12000	/uploads/media/3240709070594992576_1_thumb.jpg	\N	/uploads/media/3240709070594992576_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.003	2026-01-04 15:24:16.003
cmjzvty4p000kixwcfsu0wdta	Post 125671	esmeralda-3253435569719125671	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	7000	/uploads/media/3253435569719125671_1_thumb.jpg	\N	/uploads/media/3253435569719125671_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.009	2026-01-04 15:24:16.009
cmjzvty4v000lixwc7tclto3t	Post 446221	esmeralda-3253456724991446221	\N	esmeralda	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3253456724991446221_1_thumb.jpg	\N	/uploads/media/3253456724991446221_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.015	2026-01-04 15:24:16.015
cmjzvty51000mixwcb0khs2i0	Post 041554	esmeralda-3254346109555041554	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3254346109555041554_1_thumb.jpg	\N	/uploads/media/3254346109555041554_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.021	2026-01-04 15:24:16.021
cmjzvty57000nixwct0r5ylk3	Post 596602	esmeralda-3307212755130596602	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3307212755130596602_1_thumb.jpg	\N	/uploads/media/3307212755130596602_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.027	2026-01-04 15:24:16.027
cmjzvty5c000oixwcnfhsn3ry	Post 936392	esmeralda-3310688638969936392	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3310688638969936392_1_thumb.jpg	\N	/uploads/media/3310688638969936392_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.033	2026-01-04 15:24:16.033
cmjzvty5i000pixwcil1sy7s1	Post 316712	esmeralda-3344704195461316712	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	6000	/uploads/media/3344704195461316712_6_thumb.jpg	\N	/uploads/media/3344704195461316712_6.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.038	2026-01-04 15:24:16.038
cmjzvty5n000qixwc41s87mrv	Post 460437	esmeralda-3345626504338460437	\N	esmeralda	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3345626504338460437_1_thumb.jpg	\N	/uploads/media/3345626504338460437_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.044	2026-01-04 15:24:16.044
cmjzvty5u000rixwcymm40oqb	Post 297749	esmeralda-3351466962549297749	\N	esmeralda	VIDEO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/3351466962549297749_1_thumb.jpg	\N	/uploads/media/3351466962549297749_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.05	2026-01-04 15:24:16.05
cmjzvty60000sixwcfaublb3m	Post 232327	esmeralda-3386052445187232327	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	8000	/uploads/media/3386052445187232327_1_thumb.jpg	\N	/uploads/media/3386052445187232327_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.056	2026-01-04 15:24:16.056
cmjzvty66000tixwcthegugfc	Post 054445	esmeralda-3415106358403054445	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	9000	/uploads/media/3415106358403054445_1_thumb.jpg	\N	/uploads/media/3415106358403054445_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.063	2026-01-04 15:24:16.063
cmjzvty6d000uixwc2ffm1n6e	Post 564209	esmeralda-3418818524581564209	\N	esmeralda	VIDEO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/3418818524581564209_1_thumb.jpg	\N	/uploads/media/3418818524581564209_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.069	2026-01-04 15:24:16.069
cmjzvty6k000vixwcovr4ovdn	Post 344762	esmeralda-3432418676517344762	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	4000	/uploads/media/3432418676517344762_1_thumb.jpg	\N	/uploads/media/3432418676517344762_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.076	2026-01-04 15:24:16.076
cmjzvty6r000wixwcjt18ivph	Post 635872	esmeralda-3437473173875635872	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	9000	/uploads/media/3437473173875635872_1_thumb.jpg	\N	/uploads/media/3437473173875635872_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.083	2026-01-04 15:24:16.083
cmjzvty6y000xixwc7kyd33xt	Post 153693	esmeralda-3452752882897153693	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3452752882897153693_1_thumb.jpg	\N	/uploads/media/3452752882897153693_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.09	2026-01-04 15:24:16.09
cmjzvty75000yixwcc3r2s39g	Post 427661	esmeralda-3453432506249427661	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	11000	/uploads/media/3453432506249427661_1_thumb.jpg	\N	/uploads/media/3453432506249427661_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.097	2026-01-04 15:24:16.097
cmjzvty7b000zixwctrmm0twi	Post 932284	esmeralda-3454163007968932284	\N	esmeralda	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3454163007968932284_1_thumb.jpg	\N	/uploads/media/3454163007968932284_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.104	2026-01-04 15:24:16.104
cmjzvty7h0010ixwcxbzi9prd	Post 882381	esmeralda-3457774159059882381	\N	esmeralda	VIDEO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3457774159059882381_1_thumb.jpg	\N	/uploads/media/3457774159059882381_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.11	2026-01-04 15:24:16.11
cmjzvty7o0011ixwcplje88k7	Post 534290	esmeralda-3468659326842534290	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	8000	/uploads/media/3468659326842534290_1_thumb.jpg	\N	/uploads/media/3468659326842534290_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.116	2026-01-04 15:24:16.116
cmjzvty7u0012ixwcvcrdcs7z	Post 991482	esmeralda-3469346783694991482	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3469346783694991482_1_thumb.jpg	\N	/uploads/media/3469346783694991482_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.123	2026-01-04 15:24:16.123
cmjzvty820013ixwcc4q4y6qz	Post 061691	esmeralda-3471558908027061691	\N	esmeralda	VIDEO	BASIC	f	\N	f	t	t	f	f	8000	/uploads/media/3471558908027061691_1_thumb.jpg	\N	/uploads/media/3471558908027061691_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.13	2026-01-04 15:24:16.13
cmjzvty8g0014ixwcg4ojj6fs	Post 724463	esmeralda-3471788560456724463	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3471788560456724463_1_thumb.jpg	\N	/uploads/media/3471788560456724463_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.144	2026-01-04 15:24:16.144
cmjzvty8o0015ixwczfoqdmd7	Post 008202	esmeralda-3472241974475008202	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	3000	/uploads/media/3472241974475008202_1_thumb.jpg	\N	/uploads/media/3472241974475008202_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.152	2026-01-04 15:24:16.152
cmjzvty8v0016ixwcl4n669xt	Post 632377	esmeralda-3473792177090632377	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3473792177090632377_1_thumb.jpg	\N	/uploads/media/3473792177090632377_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.159	2026-01-04 15:24:16.159
cmjzvty920017ixwc3pjbyru0	Post 621845	esmeralda-3474447116997621845	\N	esmeralda	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3474447116997621845_1_thumb.jpg	\N	/uploads/media/3474447116997621845_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.166	2026-01-04 15:24:16.166
cmjzvty980018ixwczasrjux4	Post 722376	esmeralda-3476146901693722376	\N	esmeralda	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3476146901693722376_1_thumb.jpg	\N	/uploads/media/3476146901693722376_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.172	2026-01-04 15:24:16.172
cmjzvty9e0019ixwc6vcggz0i	Post 774943	esmeralda-3476619707626774943	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	10000	/uploads/media/3476619707626774943_1_thumb.jpg	\N	/uploads/media/3476619707626774943_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.178	2026-01-04 15:24:16.178
cmjzvty9k001aixwchazwln4f	Post 463913	esmeralda-3477353218395463913	\N	esmeralda	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3477353218395463913_1_thumb.jpg	\N	/uploads/media/3477353218395463913_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.184	2026-01-04 15:24:16.184
cmjzvty9q001bixwc0xpeithh	Post 980913	esmeralda-3478091413902980913	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3478091413902980913_1_thumb.jpg	\N	/uploads/media/3478091413902980913_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.19	2026-01-04 15:24:16.19
cmjzvty9v001cixwcwl8ce6pr	Post 005358	esmeralda-3478800256203005358	\N	esmeralda	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3478800256203005358_1_thumb.jpg	\N	/uploads/media/3478800256203005358_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.196	2026-01-04 15:24:16.196
cmjzvtya1001dixwcw77xioew	Post 711603	esmeralda-3479548581533711603	\N	esmeralda	VIDEO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3479548581533711603_1_thumb.jpg	\N	/uploads/media/3479548581533711603_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.201	2026-01-04 15:24:16.201
cmjzvtya7001eixwchv5ti1rg	Post 550851	esmeralda-3481074118134550851	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3481074118134550851_1_thumb.jpg	\N	/uploads/media/3481074118134550851_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.207	2026-01-04 15:24:16.207
cmjzvtyad001fixwcm5fccdid	Post 699014	esmeralda-3481465367064699014	\N	esmeralda	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3481465367064699014_1_thumb.jpg	\N	/uploads/media/3481465367064699014_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.213	2026-01-04 15:24:16.213
cmjzvtyaj001gixwce73m1b8t	Post 572958	esmeralda-3487666587459572958	\N	esmeralda	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3487666587459572958_1_thumb.jpg	\N	/uploads/media/3487666587459572958_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.219	2026-01-04 15:24:16.219
cmjzvtyaq001hixwc9ivvlnma	Post 595859	esmeralda-3488223021062595859	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3488223021062595859_1_thumb.jpg	\N	/uploads/media/3488223021062595859_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.226	2026-01-04 15:24:16.226
cmjzvtyax001iixwcqywlj5km	Post 013338	esmeralda-3488395836290013338	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3488395836290013338_1_thumb.jpg	\N	/uploads/media/3488395836290013338_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.233	2026-01-04 15:24:16.233
cmjzvtyb3001jixwcgoudugjb	Post 384590	esmeralda-3489130291338384590	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3489130291338384590_1_thumb.jpg	\N	/uploads/media/3489130291338384590_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.239	2026-01-04 15:24:16.239
cmjzvtyb9001kixwc3p7mr5on	Post 598154	esmeralda-3492568224359598154	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3492568224359598154_1_thumb.jpg	\N	/uploads/media/3492568224359598154_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.245	2026-01-04 15:24:16.245
cmjzvtybf001lixwc8zbw83yt	Post 941016	esmeralda-3492760966842941016	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3492760966842941016_1_thumb.jpg	\N	/uploads/media/3492760966842941016_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.251	2026-01-04 15:24:16.251
cmjzvtybl001mixwc312f4cj0	Post 671421	esmeralda-3493292767667671421	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3493292767667671421_1_thumb.jpg	\N	/uploads/media/3493292767667671421_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.258	2026-01-04 15:24:16.258
cmjzvtybs001nixwchptfqhof	Post 375466	esmeralda-3499290053814375466	\N	esmeralda	VIDEO	BASIC	f	\N	f	t	t	f	f	10000	/uploads/media/3499290053814375466_1_thumb.jpg	\N	/uploads/media/3499290053814375466_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.264	2026-01-04 15:24:16.264
cmjzvtybx001oixwc90wim53a	Post 972183	esmeralda-3499848429922972183	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3499848429922972183_1_thumb.jpg	\N	/uploads/media/3499848429922972183_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.27	2026-01-04 15:24:16.27
cmjzvtyc3001pixwcswgnrmry	Post 558599	esmeralda-3500028162325558599	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3500028162325558599_1_thumb.jpg	\N	/uploads/media/3500028162325558599_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.275	2026-01-04 15:24:16.275
cmjzvtyc9001qixwctme8xact	Post 221016	esmeralda-3500564315961221016	\N	esmeralda	VIDEO	BASIC	f	\N	f	t	t	f	f	12000	/uploads/media/3500564315961221016_1_thumb.jpg	\N	/uploads/media/3500564315961221016_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.281	2026-01-04 15:24:16.281
cmjzvtycf001rixwcnle29kr9	Post 418766	esmeralda-3501454658143418766	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	12000	/uploads/media/3501454658143418766_1_thumb.jpg	\N	/uploads/media/3501454658143418766_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.287	2026-01-04 15:24:16.287
cmjzvtycl001sixwcyamz9vvz	Post 972049	esmeralda-3502222124800972049	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3502222124800972049_1_thumb.jpg	\N	/uploads/media/3502222124800972049_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.293	2026-01-04 15:24:16.293
cmjzvtycs001tixwc056gwpu2	Post 014078	esmeralda-3502722059187014078	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	10000	/uploads/media/3502722059187014078_1_thumb.jpg	\N	/uploads/media/3502722059187014078_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.3	2026-01-04 15:24:16.3
cmjzvtycy001uixwc7nloqgwl	Post 347809	esmeralda-3504184766478347809	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3504184766478347809_1_thumb.jpg	\N	/uploads/media/3504184766478347809_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.307	2026-01-04 15:24:16.307
cmjzvtyd4001vixwcrhhgpsk8	Post 160611	esmeralda-3504386130735160611	\N	esmeralda	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3504386130735160611_1_thumb.jpg	\N	/uploads/media/3504386130735160611_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.312	2026-01-04 15:24:16.312
cmjzvtyda001wixwcn9ta9nqh	Post 494217	esmeralda-3504902735659494217	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	8000	/uploads/media/3504902735659494217_1_thumb.jpg	\N	/uploads/media/3504902735659494217_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.318	2026-01-04 15:24:16.318
cmjzvtydf001xixwc4q3lirvm	Post 846736	esmeralda-3506322847771846736	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3506322847771846736_1_thumb.jpg	\N	/uploads/media/3506322847771846736_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.324	2026-01-04 15:24:16.324
cmjzvtydl001yixwcs715vbc7	Post 500714	esmeralda-3507266099664500714	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	6000	/uploads/media/3507266099664500714_1_thumb.jpg	\N	/uploads/media/3507266099664500714_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.329	2026-01-04 15:24:16.329
cmjzvtydr001zixwc3zt6xrl6	Post 092402	esmeralda-3508499126944092402	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3508499126944092402_1_thumb.jpg	\N	/uploads/media/3508499126944092402_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.335	2026-01-04 15:24:16.335
cmjzvtydx0020ixwcpc16bg4k	Post 973851	esmeralda-3509230736177973851	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3509230736177973851_1_thumb.jpg	\N	/uploads/media/3509230736177973851_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.341	2026-01-04 15:24:16.341
cmjzvtye40021ixwcr2mjt6jw	Post 828324	esmeralda-3510872328571828324	\N	esmeralda	VIDEO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/3510872328571828324_1_thumb.jpg	\N	/uploads/media/3510872328571828324_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.348	2026-01-04 15:24:16.348
cmjzvtye90022ixwcpegyotwe	Post 199767	esmeralda-3513584815956199767	\N	esmeralda	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3513584815956199767_1_thumb.jpg	\N	/uploads/media/3513584815956199767_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.354	2026-01-04 15:24:16.354
cmjzvtyef0023ixwcw51uh5t2	Post 104134	esmeralda-3515053574940104134	\N	esmeralda	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3515053574940104134_1_thumb.jpg	\N	/uploads/media/3515053574940104134_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.359	2026-01-04 15:24:16.359
cmjzvtyem0024ixwc29j4mmsc	Post 206647	esmeralda-3515220367621206647	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	8000	/uploads/media/3515220367621206647_1_thumb.jpg	\N	/uploads/media/3515220367621206647_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.366	2026-01-04 15:24:16.366
cmjzvtyer0025ixwc37kkik7m	Post 240145	esmeralda-3515784466562240145	\N	esmeralda	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3515784466562240145_1.jpg	\N	/uploads/media/3515784466562240145_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.371	2026-01-04 15:24:16.371
cmjzvtyew0026ixwc1pm6nw0h	Post 357205	esmeralda-3515957258448357205	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	10000	/uploads/media/3515957258448357205_1_thumb.jpg	\N	/uploads/media/3515957258448357205_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.376	2026-01-04 15:24:16.376
cmjzvtyf20027ixwc1u3bzuhc	Post 614488	esmeralda-3516479269897614488	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	6000	/uploads/media/3516479269897614488_1_thumb.jpg	\N	/uploads/media/3516479269897614488_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.382	2026-01-04 15:24:16.382
cmjzvtyf80028ixwcrr7godk1	Post 477810	esmeralda-3517953347200477810	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3517953347200477810_1_thumb.jpg	\N	/uploads/media/3517953347200477810_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.388	2026-01-04 15:24:16.388
cmjzvtyfe0029ixwc98s8jr8h	Post 447176	esmeralda-3520123827076447176	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3520123827076447176_1_thumb.jpg	\N	/uploads/media/3520123827076447176_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.394	2026-01-04 15:24:16.394
cmjzvtyfn002aixwcxobk8kf6	Post 190248	esmeralda-3525224128842190248	\N	esmeralda	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3525224128842190248_1_thumb.jpg	\N	/uploads/media/3525224128842190248_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.403	2026-01-04 15:24:16.403
cmjzvtyfu002bixwcr7132hq7	Post 301948	esmeralda-3525914197865301948	\N	esmeralda	VIDEO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3525914197865301948_1_thumb.jpg	\N	/uploads/media/3525914197865301948_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.411	2026-01-04 15:24:16.411
cmjzvtyg1002cixwcreq8bmyt	Post 374068	esmeralda-3527573271279374068	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3527573271279374068_1_thumb.jpg	\N	/uploads/media/3527573271279374068_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.417	2026-01-04 15:24:16.417
cmjzvtyg7002dixwcd6hvtf0l	Post 872030	esmeralda-3528816526553872030	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3528816526553872030_1_thumb.jpg	\N	/uploads/media/3528816526553872030_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.424	2026-01-04 15:24:16.424
cmjzvtygd002eixwckr470zy9	Post 777798	esmeralda-3530268910949777798	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	10000	/uploads/media/3530268910949777798_1_thumb.jpg	\N	/uploads/media/3530268910949777798_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.429	2026-01-04 15:24:16.429
cmjzvtygi002fixwco060lvg0	Post 498095	esmeralda-3532006509712498095	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	11000	/uploads/media/3532006509712498095_1_thumb.jpg	\N	/uploads/media/3532006509712498095_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.435	2026-01-04 15:24:16.435
cmjzvtygo002gixwcwu5ipd8e	Post 757344	esmeralda-3532455426119757344	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	4000	/uploads/media/3532455426119757344_1_thumb.jpg	\N	/uploads/media/3532455426119757344_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.441	2026-01-04 15:24:16.441
cmjzvtygv002hixwc7dom1kxf	Post 640543	esmeralda-3533883179918640543	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3533883179918640543_1_thumb.jpg	\N	/uploads/media/3533883179918640543_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.447	2026-01-04 15:24:16.447
cmjzvtyh1002iixwc3r274fyl	Post 142203	esmeralda-3536792375252142203	\N	esmeralda	VIDEO	BASIC	f	\N	f	t	t	f	f	12000	/uploads/media/3536792375252142203_1_thumb.jpg	\N	/uploads/media/3536792375252142203_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.453	2026-01-04 15:24:16.453
cmjzvtyh8002jixwckmz5b5hv	Post 571129	esmeralda-3541164180217571129	\N	esmeralda	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3541164180217571129_1_thumb.jpg	\N	/uploads/media/3541164180217571129_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.46	2026-01-04 15:24:16.46
cmjzvtyhd002kixwc71f7kazu	Post 308656	esmeralda-3541324258926308656	\N	esmeralda	VIDEO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3541324258926308656_1_thumb.jpg	\N	/uploads/media/3541324258926308656_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.465	2026-01-04 15:24:16.465
cmjzvtyhi002lixwcv5zoi7vm	Post 610442	esmeralda-3541865515704610442	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3541865515704610442_1_thumb.jpg	\N	/uploads/media/3541865515704610442_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.47	2026-01-04 15:24:16.47
cmjzvtyhn002mixwc4owipj9a	Post 697319	esmeralda-3546289777374697319	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3546289777374697319_1_thumb.jpg	\N	/uploads/media/3546289777374697319_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.475	2026-01-04 15:24:16.475
cmjzvtyhs002nixwcove9vu1d	Post 284108	esmeralda-3546404504218284108	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	5000	/uploads/media/3546404504218284108_1_thumb.jpg	\N	/uploads/media/3546404504218284108_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.48	2026-01-04 15:24:16.48
cmjzvtyhx002oixwcsqidq8hv	Post 489236	esmeralda-3547152642734489236	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3547152642734489236_1_thumb.jpg	\N	/uploads/media/3547152642734489236_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.486	2026-01-04 15:24:16.486
cmjzvtyi4002pixwclrd77rse	Post 529546	esmeralda-3547648953493529546	\N	esmeralda	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3547648953493529546_1_thumb.jpg	\N	/uploads/media/3547648953493529546_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.492	2026-01-04 15:24:16.492
cmjzvtyi9002qixwcrx3sse6v	Post 688900	esmeralda-3557298994990688900	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3557298994990688900_1_thumb.jpg	\N	/uploads/media/3557298994990688900_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.497	2026-01-04 15:24:16.497
cmjzvtyie002rixwc1oagelfc	Post 121983	esmeralda-3560888589372121983	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	8000	/uploads/media/3560888589372121983_1_thumb.jpg	\N	/uploads/media/3560888589372121983_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.503	2026-01-04 15:24:16.503
cmjzvtyik002sixwclc3wo8nc	Post 451802	esmeralda-3561435063235451802	\N	esmeralda	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3561435063235451802_1_thumb.jpg	\N	/uploads/media/3561435063235451802_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.508	2026-01-04 15:24:16.508
cmjzvtyip002tixwcd6ejba8j	Post 127682	esmeralda-3561618386457127682	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3561618386457127682_1_thumb.jpg	\N	/uploads/media/3561618386457127682_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.513	2026-01-04 15:24:16.513
cmjzvtyiu002uixwcabqxy300	Post 703676	esmeralda-3572313398555703676	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3572313398555703676_1_thumb.jpg	\N	/uploads/media/3572313398555703676_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.519	2026-01-04 15:24:16.519
cmjzvtyj0002vixwc31g74lkd	Post 385547	esmeralda-3581733903746385547	\N	esmeralda	VIDEO	BASIC	f	\N	f	t	t	f	f	6000	/uploads/media/3581733903746385547_1_thumb.jpg	\N	/uploads/media/3581733903746385547_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.524	2026-01-04 15:24:16.524
cmjzvtyj5002wixwcqp6rq588	Post 116537	esmeralda-3582655336752116537	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3582655336752116537_1_thumb.jpg	\N	/uploads/media/3582655336752116537_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.529	2026-01-04 15:24:16.529
cmjzvtyja002xixwc0ywhq0eh	Post 681997	esmeralda-3588268509454681997	\N	esmeralda	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3588268509454681997_1_thumb.jpg	\N	/uploads/media/3588268509454681997_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.534	2026-01-04 15:24:16.534
cmjzvtyjf002yixwcgyt4lgj1	Post 589407	esmeralda-3600776913687589407	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3600776913687589407_1_thumb.jpg	\N	/uploads/media/3600776913687589407_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.539	2026-01-04 15:24:16.539
cmjzvtyjk002zixwc66yz6gzr	Post 640613	esmeralda-3601537139038640613	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3601537139038640613_1_thumb.jpg	\N	/uploads/media/3601537139038640613_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.544	2026-01-04 15:24:16.544
cmjzvtyjp0030ixwcpfg8fboj	Post 644143	esmeralda-3609340495882644143	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	8000	/uploads/media/3609340495882644143_1_thumb.jpg	\N	/uploads/media/3609340495882644143_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.549	2026-01-04 15:24:16.549
cmjzvtyju0031ixwc5wmiev65	Post 985732	esmeralda-3644773959154985732	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3644773959154985732_1_thumb.jpg	\N	/uploads/media/3644773959154985732_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.555	2026-01-04 15:24:16.555
cmjzvtyk00032ixwcilz1ju36	Post 069213	esmeralda-3654176205651069213	\N	esmeralda	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3654176205651069213_1.jpg	\N	/uploads/media/3654176205651069213_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.56	2026-01-04 15:24:16.56
cmjzvtyk50033ixwcoht2bci1	Post 828566	esmeralda-3662113110128828566	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3662113110128828566_1_thumb.jpg	\N	/uploads/media/3662113110128828566_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.566	2026-01-04 15:24:16.566
cmjzvtykb0034ixwc74k0l5i8	Post 122314	esmeralda-3672595525003122314	\N	esmeralda	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3672595525003122314_1_thumb.jpg	\N	/uploads/media/3672595525003122314_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.571	2026-01-04 15:24:16.571
cmjzvtykh0035ixwcehwapn5g	Post 292319	esmeralda-3677398623534292319	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3677398623534292319_1_thumb.jpg	\N	/uploads/media/3677398623534292319_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.577	2026-01-04 15:24:16.577
cmjzvtykn0036ixwcir3hz4de	Post 615529	esmeralda-3677596564148615529	\N	esmeralda	VIDEO	BASIC	f	\N	f	t	t	f	f	5000	/uploads/media/3677596564148615529_1_thumb.jpg	\N	/uploads/media/3677596564148615529_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.583	2026-01-04 15:24:16.583
cmjzvtykt0037ixwcnsb25s87	Post 954943	esmeralda-3678311648587954943	\N	esmeralda	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3678311648587954943_1_thumb.jpg	\N	/uploads/media/3678311648587954943_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.59	2026-01-04 15:24:16.59
cmjzvtykz0038ixwck7nt87hq	Post 969232	esmeralda-3678833468516969232	\N	esmeralda	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3678833468516969232_1_thumb.jpg	\N	/uploads/media/3678833468516969232_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.595	2026-01-04 15:24:16.595
cmjzvtyl50039ixwc77s3gb85	Post 528329	esmeralda-3679574998764528329	\N	esmeralda	VIDEO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3679574998764528329_1_thumb.jpg	\N	/uploads/media/3679574998764528329_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.601	2026-01-04 15:24:16.601
cmjzvtylb003aixwc89k7iz57	Post 231112	esmeralda-3680292326561231112	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	9000	/uploads/media/3680292326561231112_1_thumb.jpg	\N	/uploads/media/3680292326561231112_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.607	2026-01-04 15:24:16.607
cmjzvtylh003bixwcadu4l2sv	Post 422504	esmeralda-3683375356643422504	\N	esmeralda	VIDEO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3683375356643422504_1_thumb.jpg	\N	/uploads/media/3683375356643422504_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.613	2026-01-04 15:24:16.613
cmjzvtylm003cixwc9fg1u2if	Post 224006	esmeralda-3687737103200224006	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	6000	/uploads/media/3687737103200224006_1_thumb.jpg	\N	/uploads/media/3687737103200224006_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.619	2026-01-04 15:24:16.619
cmjzvtyls003dixwc5r6q18qg	Post 160685	esmeralda-3731033203487160685	\N	esmeralda	VIDEO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3731033203487160685_1_thumb.jpg	\N	/uploads/media/3731033203487160685_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.625	2026-01-04 15:24:16.625
cmjzvtym0003eixwc7di7opxx	Post 157788	esmeralda-3757109147842157788	\N	esmeralda	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3757109147842157788_1.jpg	\N	/uploads/media/3757109147842157788_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.633	2026-01-04 15:24:16.633
cmjzvtym9003fixwc6sv8mqyk	Post 383776	esmeralda-3758568581689383776	\N	esmeralda	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3758568581689383776_1_thumb.jpg	\N	/uploads/media/3758568581689383776_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.641	2026-01-04 15:24:16.641
cmjzvtymk003gixwc4xkjqhci	Post 564961	esmeralda-3759468595869564961	\N	esmeralda	VIDEO	BASIC	f	\N	f	t	t	f	f	8000	/uploads/media/3759468595869564961_1_thumb.jpg	\N	/uploads/media/3759468595869564961_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.652	2026-01-04 15:24:16.652
cmjzvtymq003hixwcat92s65u	Post 307822	esmeralda-3769442135209307822	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3769442135209307822_1_thumb.jpg	\N	/uploads/media/3769442135209307822_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.659	2026-01-04 15:24:16.659
cmjzvtymw003iixwcdshsrkn8	Post 802331	esmeralda-3770895639685802331	\N	esmeralda	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3770895639685802331_1_thumb.jpg	\N	/uploads/media/3770895639685802331_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.664	2026-01-04 15:24:16.664
cmjzvtyn1003jixwc0ylih9tj	Post 023608	esmeralda-3771065317964023608	\N	esmeralda	VIDEO	BASIC	f	\N	t	t	t	f	f	10000	/uploads/media/3771065317964023608_1_thumb.jpg	\N	/uploads/media/3771065317964023608_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.67	2026-01-04 15:24:16.67
cmjzvtyn7003kixwcq74awiqw	Post 505471	esmeralda-3771771701160505471	\N	esmeralda	VIDEO	BASIC	f	\N	f	t	t	f	f	10000	/uploads/media/3771771701160505471_1_thumb.jpg	\N	/uploads/media/3771771701160505471_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.675	2026-01-04 15:24:16.675
cmjzvtync003lixwcj3cdry40	Post 630244	esmeralda-3772349077187630244	\N	esmeralda	VIDEO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/3772349077187630244_1_thumb.jpg	\N	/uploads/media/3772349077187630244_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.68	2026-01-04 15:24:16.68
cmjzvtynh003mixwcrij6n5bl	Post 511376	esmeralda-3772516034419511376	\N	esmeralda	VIDEO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/3772516034419511376_1_thumb.jpg	\N	/uploads/media/3772516034419511376_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.685	2026-01-04 15:24:16.685
cmjzvtynq003nixwcywzna0hu	Post 451509	bold-kira-2774261741962451509	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/2774261741962451509_1.jpg	\N	/uploads/media/2774261741962451509_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.694	2026-01-04 15:24:16.694
cmjzvtynv003oixwc3z8ri9rc	Post 921822	bold-kira-2774357678621921822	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	10000	/uploads/media/2774357678621921822_1.jpg	\N	/uploads/media/2774357678621921822_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.7	2026-01-04 15:24:16.7
cmjzvtyo0003pixwc84o2vmt1	Post 750569	bold-kira-2774357995442750569	\N	bold-kira	VIDEO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/2774357995442750569_1_thumb.jpg	\N	/uploads/media/2774357995442750569_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.705	2026-01-04 15:24:16.705
cmjzvtyo2003qixwcfgowlnjd	Post 210368	bold-kira-2826406752384210368	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/2826406752384210368_1.jpg	\N	/uploads/media/2826406752384210368_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.707	2026-01-04 15:24:16.707
cmjzvtyo7003rixwcneclfsv2	Post 870880	bold-kira-2831675277306870880	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/2831675277306870880_1.jpg	\N	/uploads/media/2831675277306870880_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.711	2026-01-04 15:24:16.711
cmjzvtyoc003sixwc35nqwtgm	Post 957720	bold-kira-2860964575054957720	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/2860964575054957720_1.jpg	\N	/uploads/media/2860964575054957720_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.716	2026-01-04 15:24:16.716
cmjzvtyoh003tixwcu9tpgvuw	Post 311132	bold-kira-2864249651784311132	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/2864249651784311132_1.jpg	\N	/uploads/media/2864249651784311132_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.721	2026-01-04 15:24:16.721
cmjzvtyom003uixwchw04uciq	Post 916340	bold-kira-2864341165633916340	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/2864341165633916340_1.jpg	\N	/uploads/media/2864341165633916340_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.726	2026-01-04 15:24:16.726
cmjzvtyoq003vixwcge47wouw	Post 961091	bold-kira-2867188802535961091	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	6000	/uploads/media/2867188802535961091_1.jpg	\N	/uploads/media/2867188802535961091_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.731	2026-01-04 15:24:16.731
cmjzvtyov003wixwcemryce6x	Post 394299	bold-kira-2875190315166394299	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/2875190315166394299_1.jpg	\N	/uploads/media/2875190315166394299_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.736	2026-01-04 15:24:16.736
cmjzvtyp0003xixwc0tq4bwty	Post 196860	bold-kira-2875924544674196860	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	10000	/uploads/media/2875924544674196860_1.jpg	\N	/uploads/media/2875924544674196860_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.741	2026-01-04 15:24:16.741
cmjzvtyp5003yixwcosevato3	Post 321263	bold-kira-2876975593451321263	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/2876975593451321263_1.jpg	\N	/uploads/media/2876975593451321263_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.745	2026-01-04 15:24:16.745
cmjzvtypa003zixwctq5slmnk	Post 170714	bold-kira-2885417002395170714	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/2885417002395170714_1.jpg	\N	/uploads/media/2885417002395170714_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.751	2026-01-04 15:24:16.751
cmjzvtypg0040ixwc2fc0h5xv	Post 620023	bold-kira-2887214336250620023	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/2887214336250620023_1.jpg	\N	/uploads/media/2887214336250620023_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.756	2026-01-04 15:24:16.756
cmjzvtypm0041ixwc8t5c91ui	Post 539134	bold-kira-2893314745956539134	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/2893314745956539134_1.jpg	\N	/uploads/media/2893314745956539134_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.762	2026-01-04 15:24:16.762
cmjzvtyps0042ixwcvfnz8s4v	Post 507106	bold-kira-2893887784385507106	\N	bold-kira	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/2893887784385507106_1_thumb.jpg	\N	/uploads/media/2893887784385507106_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.768	2026-01-04 15:24:16.768
cmjzvtypx0043ixwcsfkma8v8	Post 040937	bold-kira-2896484223289040937	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/2896484223289040937_1.jpg	\N	/uploads/media/2896484223289040937_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.774	2026-01-04 15:24:16.774
cmjzvtyq30044ixwccttqvq7e	Post 774111	bold-kira-2900950834817774111	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/2900950834817774111_1.jpg	\N	/uploads/media/2900950834817774111_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.78	2026-01-04 15:24:16.78
cmjzvtyq90045ixwcmppsafzt	Post 215883	bold-kira-2900994144924215883	\N	bold-kira	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/2900994144924215883_1_thumb.jpg	\N	/uploads/media/2900994144924215883_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.786	2026-01-04 15:24:16.786
cmjzvtyqf0046ixwcerxjy1kn	Post 054290	bold-kira-2901248971558054290	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/2901248971558054290_1.jpg	\N	/uploads/media/2901248971558054290_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.791	2026-01-04 15:24:16.791
cmjzvtyql0047ixwcsal7u6g5	Post 417574	bold-kira-2901941556190417574	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/2901941556190417574_1.jpg	\N	/uploads/media/2901941556190417574_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.797	2026-01-04 15:24:16.797
cmjzvtyqq0048ixwc9vtv59y8	Post 400106	bold-kira-2909265800251400106	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	11000	/uploads/media/2909265800251400106_1.jpg	\N	/uploads/media/2909265800251400106_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.803	2026-01-04 15:24:16.803
cmjzvtyqw0049ixwcuq74qox0	Post 662899	bold-kira-2911024797010662899	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	3000	/uploads/media/2911024797010662899_1.jpg	\N	/uploads/media/2911024797010662899_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.808	2026-01-04 15:24:16.808
cmjzvtyr3004aixwcmj6j9w71	Post 168910	bold-kira-2918380576575168910	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	8000	/uploads/media/2918380576575168910_1.jpg	\N	/uploads/media/2918380576575168910_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.815	2026-01-04 15:24:16.815
cmjzvtyr9004bixwcx2qg5hda	Post 257604	bold-kira-2928116952971257604	\N	bold-kira	VIDEO	BASIC	f	\N	t	t	t	f	f	9000	/uploads/media/2928116952971257604_1_thumb.jpg	\N	/uploads/media/2928116952971257604_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.821	2026-01-04 15:24:16.821
cmjzvtyre004cixwcgkwtxrzr	Post 176495	bold-kira-2929534189184176495	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/2929534189184176495_1.jpg	\N	/uploads/media/2929534189184176495_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.827	2026-01-04 15:24:16.827
cmjzvtyrk004dixwcwmcn5m4r	Post 726427	bold-kira-2930621218512726427	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	10000	/uploads/media/2930621218512726427_1.jpg	\N	/uploads/media/2930621218512726427_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.833	2026-01-04 15:24:16.833
cmjzvtyrq004eixwcuvr5c53c	Post 357733	bold-kira-2942610706625357733	\N	bold-kira	PHOTO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/2942610706625357733_1.jpg	\N	/uploads/media/2942610706625357733_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.839	2026-01-04 15:24:16.839
cmjzvtyrw004fixwcz3jtdknv	Post 899496	bold-kira-2943779257595899496	\N	bold-kira	PHOTO	BASIC	f	\N	f	t	t	f	f	8000	/uploads/media/2943779257595899496_1.jpg	\N	/uploads/media/2943779257595899496_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.844	2026-01-04 15:24:16.844
cmjzvtys2004gixwcyzasjq1h	Post 590769	bold-kira-2945120709286590769	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/2945120709286590769_1.jpg	\N	/uploads/media/2945120709286590769_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.85	2026-01-04 15:24:16.85
cmjzvtys8004hixwcu4p8gh6q	Post 062119	bold-kira-2945239107056062119	\N	bold-kira	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/2945239107056062119_1_thumb.jpg	\N	/uploads/media/2945239107056062119_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.856	2026-01-04 15:24:16.856
cmjzvtyse004iixwco03fwjfk	Post 562401	bold-kira-2948268231022562401	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/2948268231022562401_1.jpg	\N	/uploads/media/2948268231022562401_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.863	2026-01-04 15:24:16.863
cmjzvtysk004jixwcitipxdoj	Post 413994	bold-kira-2949804165157413994	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	5000	/uploads/media/2949804165157413994_1.jpg	\N	/uploads/media/2949804165157413994_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.868	2026-01-04 15:24:16.868
cmjzvtysq004kixwc2kwvdh93	Post 481085	bold-kira-2956704438769481085	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/2956704438769481085_1.jpg	\N	/uploads/media/2956704438769481085_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.874	2026-01-04 15:24:16.874
cmjzvtysv004lixwc8b6d0s0x	Post 279236	bold-kira-2958883781176279236	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/2958883781176279236_1.jpg	\N	/uploads/media/2958883781176279236_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.88	2026-01-04 15:24:16.88
cmjzvtyt1004mixwcnla3082g	Post 810790	bold-kira-2960818177193810790	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/2960818177193810790_1.jpg	\N	/uploads/media/2960818177193810790_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.885	2026-01-04 15:24:16.885
cmjzvtyt7004nixwcp6n65kee	Post 571373	bold-kira-2962804662878571373	\N	bold-kira	VIDEO	BASIC	f	\N	t	t	t	f	f	7000	/uploads/media/2962804662878571373_1_thumb.jpg	\N	/uploads/media/2962804662878571373_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.892	2026-01-04 15:24:16.892
cmjzvtytd004oixwcpcf53z4x	Post 608572	bold-kira-2963337798786608572	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/2963337798786608572_1.jpg	\N	/uploads/media/2963337798786608572_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.897	2026-01-04 15:24:16.897
cmjzvtytj004pixwcr5snhsua	Post 819317	bold-kira-2964876312258819317	\N	bold-kira	PHOTO	BASIC	f	\N	f	t	t	f	f	3000	/uploads/media/2964876312258819317_1.jpg	\N	/uploads/media/2964876312258819317_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.903	2026-01-04 15:24:16.903
cmjzvtyto004qixwcvmxi901h	Post 037153	bold-kira-2965554238101037153	\N	bold-kira	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/2965554238101037153_1_thumb.jpg	\N	/uploads/media/2965554238101037153_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.909	2026-01-04 15:24:16.909
cmjzvtytu004rixwc2qbyfbjf	Post 660649	bold-kira-2966264526999660649	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/2966264526999660649_1.jpg	\N	/uploads/media/2966264526999660649_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.914	2026-01-04 15:24:16.914
cmjzvtyu0004sixwchlyn97ew	Post 602504	bold-kira-2968783980568602504	\N	bold-kira	PHOTO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/2968783980568602504_1.jpg	\N	/uploads/media/2968783980568602504_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.921	2026-01-04 15:24:16.921
cmjzvtyu7004tixwcbhtppmla	Post 593477	bold-kira-2969474896094593477	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/2969474896094593477_1.jpg	\N	/uploads/media/2969474896094593477_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.927	2026-01-04 15:24:16.927
cmjzvtyuc004uixwcupwf2cqi	Post 742544	bold-kira-2970695776040742544	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/2970695776040742544_1.jpg	\N	/uploads/media/2970695776040742544_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.933	2026-01-04 15:24:16.933
cmjzvtyui004vixwc1341xuyc	Post 456357	bold-kira-2983998847831456357	\N	bold-kira	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/2983998847831456357_1_thumb.jpg	\N	/uploads/media/2983998847831456357_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.939	2026-01-04 15:24:16.939
cmjzvtyuo004wixwcr3xnr52u	Post 208393	bold-kira-2984711798645208393	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/2984711798645208393_1.jpg	\N	/uploads/media/2984711798645208393_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.944	2026-01-04 15:24:16.944
cmjzvtyuu004xixwchpuluvlw	Post 311347	bold-kira-2991027148731311347	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	7000	/uploads/media/2991027148731311347_1.jpg	\N	/uploads/media/2991027148731311347_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.95	2026-01-04 15:24:16.95
cmjzvtyv0004yixwc73cwm2yr	Post 218399	bold-kira-2991692118460218399	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/2991692118460218399_1.jpg	\N	/uploads/media/2991692118460218399_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.956	2026-01-04 15:24:16.956
cmjzvtyv6004zixwcuo8hvite	Post 105902	bold-kira-2995507224957105902	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/2995507224957105902_1.jpg	\N	/uploads/media/2995507224957105902_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.962	2026-01-04 15:24:16.962
cmjzvtyvd0050ixwcgdyoql8l	Post 331874	bold-kira-2999771432133331874	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/2999771432133331874_1.jpg	\N	/uploads/media/2999771432133331874_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.969	2026-01-04 15:24:16.969
cmjzvtyvk0051ixwcrcqvngyc	Post 333497	bold-kira-3002690678597333497	\N	bold-kira	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3002690678597333497_1_thumb.jpg	\N	/uploads/media/3002690678597333497_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.976	2026-01-04 15:24:16.976
cmjzvtyvr0052ixwcvk2ckbe4	Post 264925	bold-kira-3006108193067264925	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3006108193067264925_1.jpg	\N	/uploads/media/3006108193067264925_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.983	2026-01-04 15:24:16.983
cmjzvtyvx0053ixwcdluqvxfz	Post 726103	bold-kira-3006990601656726103	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3006990601656726103_1.jpg	\N	/uploads/media/3006990601656726103_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.989	2026-01-04 15:24:16.989
cmjzvtyw20054ixwcwbeltp1y	Post 516746	bold-kira-3010068122245516746	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3010068122245516746_1.jpg	\N	/uploads/media/3010068122245516746_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:16.995	2026-01-04 15:24:16.995
cmjzvtyw80055ixwcp2kyktfp	Post 526406	bold-kira-3020031310009526406	\N	bold-kira	PHOTO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3020031310009526406_1.jpg	\N	/uploads/media/3020031310009526406_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.001	2026-01-04 15:24:17.001
cmjzvtywf0056ixwc3ujepyjn	Post 024198	bold-kira-3025747004672024198	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3025747004672024198_1.jpg	\N	/uploads/media/3025747004672024198_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.007	2026-01-04 15:24:17.007
cmjzvtywk0057ixwcr19ipxsv	Post 532700	bold-kira-3025987694060532700	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3025987694060532700_1.jpg	\N	/uploads/media/3025987694060532700_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.013	2026-01-04 15:24:17.013
cmjzvtywq0058ixwc319q825c	Post 924662	bold-kira-3027073008597924662	\N	bold-kira	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3027073008597924662_1_thumb.jpg	\N	/uploads/media/3027073008597924662_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.018	2026-01-04 15:24:17.018
cmjzvtywv0059ixwciyj02pes	Post 907572	bold-kira-3031024883504907572	\N	bold-kira	PHOTO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3031024883504907572_1.jpg	\N	/uploads/media/3031024883504907572_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.024	2026-01-04 15:24:17.024
cmjzvtyx2005aixwcn90tocp6	Post 929753	bold-kira-3032348707055929753	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	11000	/uploads/media/3032348707055929753_1.jpg	\N	/uploads/media/3032348707055929753_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.03	2026-01-04 15:24:17.03
cmjzvtyx8005bixwc043wvcc7	Post 277145	bold-kira-3033758062305277145	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3033758062305277145_1.jpg	\N	/uploads/media/3033758062305277145_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.036	2026-01-04 15:24:17.036
cmjzvtyxe005cixwcwedob4l1	Post 671984	bold-kira-3039645286460671984	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3039645286460671984_1.jpg	\N	/uploads/media/3039645286460671984_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.042	2026-01-04 15:24:17.042
cmjzvtyxk005dixwcn4r3957s	Post 892714	bold-kira-3039732991127892714	\N	bold-kira	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3039732991127892714_1_thumb.jpg	\N	/uploads/media/3039732991127892714_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.048	2026-01-04 15:24:17.048
cmjzvtyxq005eixwcc9igq8im	Post 537686	bold-kira-3040535059861537686	\N	bold-kira	PHOTO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/3040535059861537686_1.jpg	\N	/uploads/media/3040535059861537686_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.055	2026-01-04 15:24:17.055
cmjzvtyxw005fixwcu09vym6x	Post 776259	bold-kira-3041113384539776259	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3041113384539776259_1.jpg	\N	/uploads/media/3041113384539776259_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.06	2026-01-04 15:24:17.06
cmjzvtyy2005gixwcck7kfcxz	Post 258749	bold-kira-3052087776828258749	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3052087776828258749_1.jpg	\N	/uploads/media/3052087776828258749_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.066	2026-01-04 15:24:17.066
cmjzvtyy8005hixwc2vxig8iy	Post 007337	bold-kira-3055715724731007337	\N	bold-kira	PHOTO	BASIC	f	\N	f	t	t	f	f	10000	/uploads/media/3055715724731007337_1.jpg	\N	/uploads/media/3055715724731007337_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.072	2026-01-04 15:24:17.072
cmjzvtyyd005iixwchmgkzamw	Post 982822	bold-kira-3060575063429982822	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3060575063429982822_1.jpg	\N	/uploads/media/3060575063429982822_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.078	2026-01-04 15:24:17.078
cmjzvtyyj005jixwcfymv27lk	Post 140548	bold-kira-3072300659039140548	\N	bold-kira	VIDEO	BASIC	f	\N	f	t	t	f	f	4000	/uploads/media/3072300659039140548_1_thumb.jpg	\N	/uploads/media/3072300659039140548_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.083	2026-01-04 15:24:17.083
cmjzvtyyp005kixwc5pekjvbw	Post 504215	bold-kira-3083780613009504215	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3083780613009504215_1.jpg	\N	/uploads/media/3083780613009504215_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.089	2026-01-04 15:24:17.089
cmjzvtyyw005lixwceg71t2om	Post 174659	bold-kira-3085326928509174659	\N	bold-kira	VIDEO	BASIC	f	\N	t	t	t	f	f	12000	/uploads/media/3085326928509174659_1_thumb.jpg	\N	/uploads/media/3085326928509174659_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.097	2026-01-04 15:24:17.097
cmjzvtyz2005mixwc3io5yjax	Post 984431	bold-kira-3094586967923984431	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3094586967923984431_1.jpg	\N	/uploads/media/3094586967923984431_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.102	2026-01-04 15:24:17.102
cmjzvtyz8005nixwc27fhgkku	Post 727140	bold-kira-3101183341293727140	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3101183341293727140_1.jpg	\N	/uploads/media/3101183341293727140_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.108	2026-01-04 15:24:17.108
cmjzvtyzd005oixwc0b5qdbt0	Post 461244	bold-kira-3109104333999461244	\N	bold-kira	PHOTO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3109104333999461244_1.jpg	\N	/uploads/media/3109104333999461244_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.114	2026-01-04 15:24:17.114
cmjzvtyzj005pixwcccagki9f	Post 553931	bold-kira-3116835049713553931	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3116835049713553931_1.jpg	\N	/uploads/media/3116835049713553931_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.12	2026-01-04 15:24:17.12
cmjzvtyzp005qixwchzgbnxj3	Post 868963	bold-kira-3116905617007868963	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3116905617007868963_1.jpg	\N	/uploads/media/3116905617007868963_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.125	2026-01-04 15:24:17.125
cmjzvtyzu005rixwcv0ld45zl	Post 552325	bold-kira-3117989498922552325	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	4000	/uploads/media/3117989498922552325_1.jpg	\N	/uploads/media/3117989498922552325_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.131	2026-01-04 15:24:17.131
cmjzvtz00005sixwcfvh9nfbf	Post 404413	bold-kira-3121424215751404413	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3121424215751404413_1.jpg	\N	/uploads/media/3121424215751404413_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.136	2026-01-04 15:24:17.136
cmjzvtz07005tixwcp6kr42bf	Post 177186	bold-kira-3125112150137177186	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3125112150137177186_1.jpg	\N	/uploads/media/3125112150137177186_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.143	2026-01-04 15:24:17.143
cmjzvtz0c005uixwcrnxzxqi6	Post 493999	bold-kira-3135784070377493999	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3135784070377493999_1.jpg	\N	/uploads/media/3135784070377493999_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.149	2026-01-04 15:24:17.149
cmjzvtz0j005vixwcjjek0fss	Post 021066	bold-kira-3142516406390021066	\N	bold-kira	PHOTO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/3142516406390021066_1.jpg	\N	/uploads/media/3142516406390021066_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.155	2026-01-04 15:24:17.155
cmjzvtz0q005wixwcu8nwrp4y	Post 584403	bold-kira-3143039254661584403	\N	bold-kira	VIDEO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3143039254661584403_1_thumb.jpg	\N	/uploads/media/3143039254661584403_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.162	2026-01-04 15:24:17.162
cmjzvtz0w005xixwcclk2fvck	Post 679781	bold-kira-3146112128967679781	\N	bold-kira	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3146112128967679781_1_thumb.jpg	\N	/uploads/media/3146112128967679781_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.168	2026-01-04 15:24:17.168
cmjzvtz12005yixwcoivv8btv	Post 859683	bold-kira-3153216380030859683	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	4000	/uploads/media/3153216380030859683_1.jpg	\N	/uploads/media/3153216380030859683_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.174	2026-01-04 15:24:17.174
cmjzvtz1a005zixwcxhbyfm4s	Post 631426	bold-kira-3159132371742631426	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3159132371742631426_1.jpg	\N	/uploads/media/3159132371742631426_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.182	2026-01-04 15:24:17.182
cmjzvtz1i0060ixwc50v4yc0f	Post 758749	bold-kira-3167028753178758749	\N	bold-kira	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3167028753178758749_1_thumb.jpg	\N	/uploads/media/3167028753178758749_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.191	2026-01-04 15:24:17.191
cmjzvtz1p0061ixwc0j3ezo8d	Post 462438	bold-kira-3169395800294462438	\N	bold-kira	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3169395800294462438_1_thumb.jpg	\N	/uploads/media/3169395800294462438_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.197	2026-01-04 15:24:17.197
cmjzvtz1v0062ixwc46uvwutj	Post 034613	bold-kira-3176630707442034613	\N	bold-kira	PHOTO	BASIC	f	\N	f	t	t	f	f	8000	/uploads/media/3176630707442034613_1.jpg	\N	/uploads/media/3176630707442034613_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.204	2026-01-04 15:24:17.204
cmjzvtz210063ixwc3322btrz	Post 953695	bold-kira-3180291319543953695	\N	bold-kira	PHOTO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/3180291319543953695_1.jpg	\N	/uploads/media/3180291319543953695_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.21	2026-01-04 15:24:17.21
cmjzvtz280064ixwcjfq4s19p	Post 686964	bold-kira-3184725958085686964	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3184725958085686964_1.jpg	\N	/uploads/media/3184725958085686964_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.216	2026-01-04 15:24:17.216
cmjzvtz2e0065ixwcsw2f25em	Post 025666	bold-kira-3188788826733025666	\N	bold-kira	VIDEO	BASIC	f	\N	t	t	t	f	f	9000	/uploads/media/3188788826733025666_1_thumb.jpg	\N	/uploads/media/3188788826733025666_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.222	2026-01-04 15:24:17.222
cmjzvtz2k0066ixwcavzix5ma	Post 828542	bold-kira-3188868960353828542	\N	bold-kira	PHOTO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3188868960353828542_1.jpg	\N	/uploads/media/3188868960353828542_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.228	2026-01-04 15:24:17.228
cmjzvtz2q0067ixwcmx331i6i	Post 677903	bold-kira-3190391265089677903	\N	bold-kira	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3190391265089677903_1_thumb.jpg	\N	/uploads/media/3190391265089677903_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.234	2026-01-04 15:24:17.234
cmjzvtz2w0068ixwcmetf63el	Post 728251	bold-kira-3201046416812728251	\N	bold-kira	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3201046416812728251_1_thumb.jpg	\N	/uploads/media/3201046416812728251_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.24	2026-01-04 15:24:17.24
cmjzvtz330069ixwcz6w7kh40	Post 804967	bold-kira-3203308524027804967	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	11000	/uploads/media/3203308524027804967_1.jpg	\N	/uploads/media/3203308524027804967_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.247	2026-01-04 15:24:17.247
cmjzvtz3a006aixwco7xlu8nr	Post 912871	bold-kira-3211880641887912871	\N	bold-kira	PHOTO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/3211880641887912871_1.jpg	\N	/uploads/media/3211880641887912871_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.255	2026-01-04 15:24:17.255
cmjzvtz3g006bixwconduytvb	Post 265049	bold-kira-3217685314490265049	\N	bold-kira	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3217685314490265049_1_thumb.jpg	\N	/uploads/media/3217685314490265049_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.26	2026-01-04 15:24:17.26
cmjzvtz3m006cixwckn9dvvxj	Post 284123	bold-kira-3254854757129284123	\N	bold-kira	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3254854757129284123_1_thumb.jpg	\N	/uploads/media/3254854757129284123_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.266	2026-01-04 15:24:17.266
cmjzvtz3s006dixwcnsb5n7gv	Post 331255	bold-kira-3258970410891331255	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3258970410891331255_1.jpg	\N	/uploads/media/3258970410891331255_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.272	2026-01-04 15:24:17.272
cmjzvtz3y006eixwcbgruykeu	Post 837933	bold-kira-3261363059719837933	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	12000	/uploads/media/3261363059719837933_1.jpg	\N	/uploads/media/3261363059719837933_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.278	2026-01-04 15:24:17.278
cmjzvtz45006fixwcx9d2ml4g	Post 254435	bold-kira-3268638224216254435	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3268638224216254435_1.jpg	\N	/uploads/media/3268638224216254435_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.285	2026-01-04 15:24:17.285
cmjzvtz4b006gixwc68tw582n	Post 604880	bold-kira-3293402021082604880	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3293402021082604880_1.jpg	\N	/uploads/media/3293402021082604880_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.291	2026-01-04 15:24:17.291
cmjzvtz4h006hixwci0jxaqwx	Post 228816	bold-kira-3299634585126228816	\N	bold-kira	PHOTO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3299634585126228816_1.jpg	\N	/uploads/media/3299634585126228816_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.297	2026-01-04 15:24:17.297
cmjzvtz4n006iixwce7msxx6w	Post 080760	bold-kira-3301131478738080760	\N	bold-kira	PHOTO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/3301131478738080760_1.jpg	\N	/uploads/media/3301131478738080760_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.303	2026-01-04 15:24:17.303
cmjzvtz4t006jixwcl8jvn38n	Post 072046	bold-kira-3301196007803072046	\N	bold-kira	VIDEO	BASIC	f	\N	f	t	t	f	f	3000	/uploads/media/3301196007803072046_1_thumb.jpg	\N	/uploads/media/3301196007803072046_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.309	2026-01-04 15:24:17.309
cmjzvtz4z006kixwc79hdzi29	Post 955859	bold-kira-3304954103878955859	\N	bold-kira	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3304954103878955859_1_thumb.jpg	\N	/uploads/media/3304954103878955859_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.315	2026-01-04 15:24:17.315
cmjzvtz55006lixwc6a6xmorz	Post 111001	bold-kira-3309868671711111001	\N	bold-kira	VIDEO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3309868671711111001_1_thumb.jpg	\N	/uploads/media/3309868671711111001_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.321	2026-01-04 15:24:17.321
cmjzvtz5a006mixwck3lhyqs1	Post 128491	bold-kira-3312227054110128491	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	12000	/uploads/media/3312227054110128491_1.jpg	\N	/uploads/media/3312227054110128491_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.326	2026-01-04 15:24:17.326
cmjzvtz5g006nixwcfd7u4a29	Post 985826	bold-kira-3320942037706985826	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3320942037706985826_1.jpg	\N	/uploads/media/3320942037706985826_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.332	2026-01-04 15:24:17.332
cmjzvtz5n006oixwcc8swi4rf	Post 683215	bold-kira-3337585035047683215	\N	bold-kira	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3337585035047683215_1_thumb.jpg	\N	/uploads/media/3337585035047683215_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.34	2026-01-04 15:24:17.34
cmjzvtz5u006pixwcslywbo3k	Post 880213	bold-kira-3338773687217880213	\N	bold-kira	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3338773687217880213_1_thumb.jpg	\N	/uploads/media/3338773687217880213_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.346	2026-01-04 15:24:17.346
cmjzvtz5z006qixwc1in4ney0	Post 811970	bold-kira-3338866558377811970	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3338866558377811970_1.jpg	\N	/uploads/media/3338866558377811970_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.352	2026-01-04 15:24:17.352
cmjzvtz65006rixwcmu0w11l6	Post 650801	bold-kira-3341926435679650801	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3341926435679650801_1.jpg	\N	/uploads/media/3341926435679650801_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.357	2026-01-04 15:24:17.357
cmjzvtz6a006sixwcrfgzmk7t	Post 152531	bold-kira-3343372404877152531	\N	bold-kira	PHOTO	BASIC	f	\N	f	t	t	f	f	4000	/uploads/media/3343372404877152531_1.jpg	\N	/uploads/media/3343372404877152531_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.362	2026-01-04 15:24:17.362
cmjzvtz6f006tixwc7cdmd6rm	Post 073419	bold-kira-3343764784994073419	\N	bold-kira	VIDEO	BASIC	f	\N	f	t	t	f	f	10000	/uploads/media/3343764784994073419_1_thumb.jpg	\N	/uploads/media/3343764784994073419_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.367	2026-01-04 15:24:17.367
cmjzvtz6k006uixwczdjw41sn	Post 120611	bold-kira-3348723097188120611	\N	bold-kira	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3348723097188120611_1_thumb.jpg	\N	/uploads/media/3348723097188120611_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.373	2026-01-04 15:24:17.373
cmjzvtz6q006vixwctfzphsez	Post 163439	bold-kira-3353536881411163439	\N	bold-kira	VIDEO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/3353536881411163439_1_thumb.jpg	\N	/uploads/media/3353536881411163439_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.378	2026-01-04 15:24:17.378
cmjzvtz6v006wixwcqawd1llq	Post 773659	bold-kira-3361805286024773659	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3361805286024773659_1.jpg	\N	/uploads/media/3361805286024773659_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.383	2026-01-04 15:24:17.383
cmjzvtz70006xixwclu44yrw5	Post 625638	bold-kira-3396925147654625638	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3396925147654625638_1.jpg	\N	/uploads/media/3396925147654625638_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.389	2026-01-04 15:24:17.389
cmjzvtz77006yixwckycbyctz	Post 593001	bold-kira-3411495327902593001	\N	bold-kira	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3411495327902593001_1_thumb.jpg	\N	/uploads/media/3411495327902593001_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.395	2026-01-04 15:24:17.395
cmjzvtz7d006zixwcta7gz0qh	Post 064973	bold-kira-3415036310007064973	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3415036310007064973_1.jpg	\N	/uploads/media/3415036310007064973_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.402	2026-01-04 15:24:17.402
cmjzvtz7j0070ixwctxm6yt9l	Post 766048	bold-kira-3430749092509766048	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3430749092509766048_1.jpg	\N	/uploads/media/3430749092509766048_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.408	2026-01-04 15:24:17.408
cmjzvtz7p0071ixwc5eqwk2kq	Post 772365	bold-kira-3435333019463772365	\N	bold-kira	PHOTO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/3435333019463772365_1.jpg	\N	/uploads/media/3435333019463772365_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.414	2026-01-04 15:24:17.414
cmjzvtz7v0072ixwc9zz0hmvt	Post 226988	bold-kira-3438082442929226988	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	5000	/uploads/media/3438082442929226988_1.jpg	\N	/uploads/media/3438082442929226988_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.419	2026-01-04 15:24:17.419
cmjzvtz810073ixwcm78s9qre	Post 713529	bold-kira-3439182060873713529	\N	bold-kira	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3439182060873713529_1_thumb.jpg	\N	/uploads/media/3439182060873713529_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.426	2026-01-04 15:24:17.426
cmjzvtz870074ixwcee7njb76	Post 309669	bold-kira-3439474720700309669	\N	bold-kira	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3439474720700309669_1_thumb.jpg	\N	/uploads/media/3439474720700309669_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.431	2026-01-04 15:24:17.431
cmjzvtz8e0075ixwcjx7hgrwc	Post 987640	bold-kira-3440105529022987640	\N	bold-kira	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3440105529022987640_1_thumb.jpg	\N	/uploads/media/3440105529022987640_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.438	2026-01-04 15:24:17.438
cmjzvtz8k0076ixwcpkbe2c51	Post 874253	bold-kira-3440321153326874253	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	10000	/uploads/media/3440321153326874253_1.jpg	\N	/uploads/media/3440321153326874253_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.445	2026-01-04 15:24:17.445
cmjzvtz8q0077ixwcyajq1umb	Post 232568	bold-kira-3440969191523232568	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	4000	/uploads/media/3440969191523232568_1.jpg	\N	/uploads/media/3440969191523232568_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.451	2026-01-04 15:24:17.451
cmjzvtz8w0078ixwcu3r94rpc	Post 917484	bold-kira-3442488222981917484	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3442488222981917484_1.jpg	\N	/uploads/media/3442488222981917484_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.456	2026-01-04 15:24:17.456
cmjzvtz910079ixwcbx032yl2	Post 581234	bold-kira-3443029302995581234	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3443029302995581234_1.jpg	\N	/uploads/media/3443029302995581234_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.462	2026-01-04 15:24:17.462
cmjzvtz98007aixwc97j08nk9	Post 862010	bold-kira-3446585125809862010	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3446585125809862010_1.jpg	\N	/uploads/media/3446585125809862010_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.468	2026-01-04 15:24:17.468
cmjzvtz9d007bixwcxo9j9eio	Post 509146	bold-kira-3446719213363509146	\N	bold-kira	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3446719213363509146_1_thumb.jpg	\N	/uploads/media/3446719213363509146_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.474	2026-01-04 15:24:17.474
cmjzvtz9j007cixwcz9fwzc3w	Post 553869	bold-kira-3447376646775553869	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3447376646775553869_1.jpg	\N	/uploads/media/3447376646775553869_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.479	2026-01-04 15:24:17.479
cmjzvtz9q007dixwcvzrbtutq	Post 556635	bold-kira-3448074855537556635	\N	bold-kira	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3448074855537556635_1_thumb.jpg	\N	/uploads/media/3448074855537556635_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.486	2026-01-04 15:24:17.486
cmjzvtz9w007eixwcjhl6ukd3	Post 093958	bold-kira-3448749461857093958	\N	bold-kira	PHOTO	BASIC	f	\N	f	t	t	f	f	12000	/uploads/media/3448749461857093958_1.jpg	\N	/uploads/media/3448749461857093958_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.493	2026-01-04 15:24:17.493
cmjzvtza3007fixwcf9l7b2e5	Post 378799	bold-kira-3449665997039378799	\N	bold-kira	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3449665997039378799_1_thumb.jpg	\N	/uploads/media/3449665997039378799_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.499	2026-01-04 15:24:17.499
cmjzvtza9007gixwcnimkebwr	Post 265122	bold-kira-3449794825045265122	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3449794825045265122_1.jpg	\N	/uploads/media/3449794825045265122_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.505	2026-01-04 15:24:17.505
cmjzvtzae007hixwc8gjvwkvm	Post 318459	bold-kira-3450382686056318459	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	7000	/uploads/media/3450382686056318459_1.jpg	\N	/uploads/media/3450382686056318459_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.511	2026-01-04 15:24:17.511
cmjzvtzak007iixwc4c6hcbbg	Post 156457	bold-kira-3451083422285156457	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	11000	/uploads/media/3451083422285156457_1.jpg	\N	/uploads/media/3451083422285156457_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.517	2026-01-04 15:24:17.517
cmjzvtzaq007jixwctc1t6368	Post 979589	bold-kira-3451769197850979589	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3451769197850979589_1.jpg	\N	/uploads/media/3451769197850979589_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.522	2026-01-04 15:24:17.522
cmjzvtzaw007kixwckpp73rea	Post 965219	bold-kira-3453211804258965219	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3453211804258965219_1.jpg	\N	/uploads/media/3453211804258965219_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.528	2026-01-04 15:24:17.528
cmjzvtzb1007lixwcoi4eg9s8	Post 386983	bold-kira-3454109291937386983	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3454109291937386983_1.jpg	\N	/uploads/media/3454109291937386983_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.534	2026-01-04 15:24:17.534
cmjzvtzb7007mixwcdlozoz3w	Post 497762	bold-kira-3456762324655497762	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	5000	/uploads/media/3456762324655497762_1.jpg	\N	/uploads/media/3456762324655497762_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.539	2026-01-04 15:24:17.539
cmjzvtzbd007nixwczu0hlvm0	Post 263546	bold-kira-3458967008942263546	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3458967008942263546_1.jpg	\N	/uploads/media/3458967008942263546_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.545	2026-01-04 15:24:17.545
cmjzvtzbi007oixwc276wqi1h	Post 232380	bold-kira-3459686463565232380	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3459686463565232380_1.jpg	\N	/uploads/media/3459686463565232380_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.55	2026-01-04 15:24:17.55
cmjzvtzbn007pixwc7v2crz9l	Post 506205	bold-kira-3461074601399506205	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	12000	/uploads/media/3461074601399506205_1.jpg	\N	/uploads/media/3461074601399506205_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.556	2026-01-04 15:24:17.556
cmjzvtzbt007qixwcsrho3hz5	Post 354524	bold-kira-3464116866120354524	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3464116866120354524_1.jpg	\N	/uploads/media/3464116866120354524_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.561	2026-01-04 15:24:17.561
cmjzvtzbz007rixwc789kllnx	Post 849820	bold-kira-3465514182693849820	\N	bold-kira	PHOTO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3465514182693849820_1.jpg	\N	/uploads/media/3465514182693849820_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.567	2026-01-04 15:24:17.567
cmjzvtzc5007sixwc3g2483dv	Post 002250	bold-kira-3466403518159002250	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	7000	/uploads/media/3466403518159002250_1.jpg	\N	/uploads/media/3466403518159002250_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.573	2026-01-04 15:24:17.573
cmjzvtzcb007tixwchr3ulctt	Post 982327	bold-kira-3469270096097982327	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3469270096097982327_1.jpg	\N	/uploads/media/3469270096097982327_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.579	2026-01-04 15:24:17.579
cmjzvtzci007uixwcyhy2tc0w	Post 306016	bold-kira-3469354809277306016	\N	bold-kira	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3469354809277306016_1_thumb.jpg	\N	/uploads/media/3469354809277306016_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.586	2026-01-04 15:24:17.586
cmjzvtzcq007vixwcnf2z5md9	Post 759010	bold-kira-3471392087587759010	\N	bold-kira	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3471392087587759010_1_thumb.jpg	\N	/uploads/media/3471392087587759010_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.595	2026-01-04 15:24:17.595
cmjzvtzcw007wixwcpvrgf224	Post 312119	bold-kira-3471938563246312119	\N	bold-kira	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3471938563246312119_1_thumb.jpg	\N	/uploads/media/3471938563246312119_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.6	2026-01-04 15:24:17.6
cmjzvtzd1007xixwcmraln7kl	Post 545207	bold-kira-3474055048253545207	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3474055048253545207_1.jpg	\N	/uploads/media/3474055048253545207_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.606	2026-01-04 15:24:17.606
cmjzvtzd6007yixwcw901g99z	Post 071533	bold-kira-3475642782097071533	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	11000	/uploads/media/3475642782097071533_1.jpg	\N	/uploads/media/3475642782097071533_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.611	2026-01-04 15:24:17.611
cmjzvtzdc007zixwc6w7jl11x	Post 546297	bold-kira-3478645882923546297	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3478645882923546297_1.jpg	\N	/uploads/media/3478645882923546297_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.616	2026-01-04 15:24:17.616
cmjzvtzdh0080ixwco6gbjudm	Post 324836	bold-kira-3484238105862324836	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	12000	/uploads/media/3484238105862324836_1.jpg	\N	/uploads/media/3484238105862324836_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.621	2026-01-04 15:24:17.621
cmjzvtzdo0081ixwcd75xkffl	Post 968021	bold-kira-3487114174847968021	\N	bold-kira	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3487114174847968021_1_thumb.jpg	\N	/uploads/media/3487114174847968021_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.628	2026-01-04 15:24:17.628
cmjzvtzdt0082ixwca0dpytca	Post 628450	bold-kira-3488201768570628450	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3488201768570628450_1.jpg	\N	/uploads/media/3488201768570628450_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.634	2026-01-04 15:24:17.634
cmjzvtzdz0083ixwct42xksmx	Post 505988	bold-kira-3489565887601505988	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	9000	/uploads/media/3489565887601505988_1.jpg	\N	/uploads/media/3489565887601505988_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.639	2026-01-04 15:24:17.639
cmjzvtze50084ixwc95wg2u5r	Post 926931	bold-kira-3492978426598926931	\N	bold-kira	PHOTO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3492978426598926931_1.jpg	\N	/uploads/media/3492978426598926931_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.645	2026-01-04 15:24:17.645
cmjzvtzeb0085ixwcgx4awblf	Post 302287	bold-kira-3494680465981302287	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3494680465981302287_1.jpg	\N	/uploads/media/3494680465981302287_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.651	2026-01-04 15:24:17.651
cmjzvtzeh0086ixwczf164ebt	Post 342949	bold-kira-3496181892104342949	\N	bold-kira	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3496181892104342949_1_thumb.jpg	\N	/uploads/media/3496181892104342949_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.657	2026-01-04 15:24:17.657
cmjzvtzem0087ixwcnvicuauu	Post 475977	bold-kira-3496804820722475977	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3496804820722475977_1.jpg	\N	/uploads/media/3496804820722475977_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.663	2026-01-04 15:24:17.663
cmjzvtzes0088ixwc44d247m4	Post 543807	bold-kira-3498868825024543807	\N	bold-kira	VIDEO	BASIC	f	\N	t	t	t	f	f	4000	/uploads/media/3498868825024543807_1_thumb.jpg	\N	/uploads/media/3498868825024543807_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.668	2026-01-04 15:24:17.668
cmjzvtzex0089ixwc0qg5cwrd	Post 057372	bold-kira-3498982818079057372	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	7000	/uploads/media/3498982818079057372_1.jpg	\N	/uploads/media/3498982818079057372_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.674	2026-01-04 15:24:17.674
cmjzvtzf3008aixwc1b2y7wex	Post 507973	bold-kira-3499782100000507973	\N	bold-kira	PHOTO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/3499782100000507973_1.jpg	\N	/uploads/media/3499782100000507973_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.679	2026-01-04 15:24:17.679
cmjzvtzf9008bixwc2psg4kdi	Post 665381	bold-kira-3500921574742665381	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3500921574742665381_1.jpg	\N	/uploads/media/3500921574742665381_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.685	2026-01-04 15:24:17.685
cmjzvtzff008cixwcy6omf30n	Post 930100	bold-kira-3502468956382930100	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3502468956382930100_1.jpg	\N	/uploads/media/3502468956382930100_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.691	2026-01-04 15:24:17.691
cmjzvtzfk008dixwcyd2fk5lp	Post 395391	bold-kira-3503182560627395391	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	3000	/uploads/media/3503182560627395391_1.jpg	\N	/uploads/media/3503182560627395391_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.696	2026-01-04 15:24:17.696
cmjzvtzfq008eixwcankuaqz1	Post 839425	bold-kira-3503864214257839425	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3503864214257839425_1.jpg	\N	/uploads/media/3503864214257839425_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.702	2026-01-04 15:24:17.702
cmjzvtzfw008fixwcxb1h58v1	Post 057367	bold-kira-3504856122019057367	\N	bold-kira	PHOTO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/3504856122019057367_1.jpg	\N	/uploads/media/3504856122019057367_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.708	2026-01-04 15:24:17.708
cmjzvtzg2008gixwcnxlsk1sy	Post 180651	bold-kira-3508456161035180651	\N	bold-kira	PHOTO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/3508456161035180651_1.jpg	\N	/uploads/media/3508456161035180651_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.714	2026-01-04 15:24:17.714
cmjzvtzgb008hixwc955xk4iq	Post 817747	bold-kira-3509867350562817747	\N	bold-kira	VIDEO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3509867350562817747_1_thumb.jpg	\N	/uploads/media/3509867350562817747_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.724	2026-01-04 15:24:17.724
cmjzvtzgj008iixwcqfxclxv0	Post 765287	bold-kira-3514192965671765287	\N	bold-kira	PHOTO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/3514192965671765287_1.jpg	\N	/uploads/media/3514192965671765287_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.731	2026-01-04 15:24:17.731
cmjzvtzgp008jixwcuhg7qfim	Post 254364	bold-kira-3518591804109254364	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3518591804109254364_1.jpg	\N	/uploads/media/3518591804109254364_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.738	2026-01-04 15:24:17.738
cmjzvtzgw008kixwc8q782yix	Post 168453	bold-kira-3523676895584168453	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3523676895584168453_1.jpg	\N	/uploads/media/3523676895584168453_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.744	2026-01-04 15:24:17.744
cmjzvtzh2008lixwcy8g4v2q0	Post 801213	bold-kira-3526237109847801213	\N	bold-kira	VIDEO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3526237109847801213_1_thumb.jpg	\N	/uploads/media/3526237109847801213_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.75	2026-01-04 15:24:17.75
cmjzvtzh8008mixwcx6560e0v	Post 905492	bold-kira-3528573164535905492	\N	bold-kira	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3528573164535905492_1_thumb.jpg	\N	/uploads/media/3528573164535905492_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.756	2026-01-04 15:24:17.756
cmjzvtzhe008nixwcplkibmcv	Post 141097	bold-kira-3529215388999141097	\N	bold-kira	VIDEO	BASIC	f	\N	t	t	t	f	f	4000	/uploads/media/3529215388999141097_1_thumb.jpg	\N	/uploads/media/3529215388999141097_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.762	2026-01-04 15:24:17.762
cmjzvtzhk008oixwcfwxjcajk	Post 474886	bold-kira-3530016051601474886	\N	bold-kira	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3530016051601474886_1_thumb.jpg	\N	/uploads/media/3530016051601474886_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.768	2026-01-04 15:24:17.768
cmjzvtzhp008pixwcgguarfec	Post 666454	bold-kira-3530886082480666454	\N	bold-kira	VIDEO	BASIC	f	\N	f	t	t	f	f	7000	/uploads/media/3530886082480666454_1_thumb.jpg	\N	/uploads/media/3530886082480666454_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.774	2026-01-04 15:24:17.774
cmjzvtzhw008qixwcrugraid7	Post 108174	bold-kira-3531670532412108174	\N	bold-kira	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3531670532412108174_1_thumb.jpg	\N	/uploads/media/3531670532412108174_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.78	2026-01-04 15:24:17.78
cmjzvtzi2008rixwc9teco85z	Post 900230	bold-kira-3537917949276900230	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	5000	/uploads/media/3537917949276900230_1.jpg	\N	/uploads/media/3537917949276900230_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.787	2026-01-04 15:24:17.787
cmjzvtzi8008sixwca26zu5we	Post 875962	bold-kira-3543155462899875962	\N	bold-kira	VIDEO	BASIC	f	\N	t	t	t	f	f	4000	/uploads/media/3543155462899875962_1_thumb.jpg	\N	/uploads/media/3543155462899875962_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.792	2026-01-04 15:24:17.792
cmjzvtzie008tixwcnylop6oz	Post 637461	bold-kira-3544523419848637461	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	8000	/uploads/media/3544523419848637461_1.jpg	\N	/uploads/media/3544523419848637461_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.798	2026-01-04 15:24:17.798
cmjzvtzij008uixwc2f645zz3	Post 877851	bold-kira-3548784480902877851	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	6000	/uploads/media/3548784480902877851_1.jpg	\N	/uploads/media/3548784480902877851_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.804	2026-01-04 15:24:17.804
cmjzvtzip008vixwc58gey0fe	Post 503420	bold-kira-3550948138677503420	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3550948138677503420_1.jpg	\N	/uploads/media/3550948138677503420_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.81	2026-01-04 15:24:17.81
cmjzvtziv008wixwckmtyk7pc	Post 672993	bold-kira-3556155910447672993	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3556155910447672993_1.jpg	\N	/uploads/media/3556155910447672993_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.816	2026-01-04 15:24:17.816
cmjzvtzj1008xixwcdqyb1dym	Post 387354	bold-kira-3557585154300387354	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	11000	/uploads/media/3557585154300387354_1.jpg	\N	/uploads/media/3557585154300387354_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.821	2026-01-04 15:24:17.821
cmjzvtzj8008yixwc08zfq7uk	Post 835041	bold-kira-3560658722697835041	\N	bold-kira	PHOTO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3560658722697835041_1.jpg	\N	/uploads/media/3560658722697835041_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.828	2026-01-04 15:24:17.828
cmjzvtzje008zixwcrf2u3pyg	Post 868318	bold-kira-3564691068326868318	\N	bold-kira	VIDEO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/3564691068326868318_1_thumb.jpg	\N	/uploads/media/3564691068326868318_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.835	2026-01-04 15:24:17.835
cmjzvtzjl0090ixwcmibm6jeb	Post 236263	bold-kira-3566467336005236263	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	10000	/uploads/media/3566467336005236263_1.jpg	\N	/uploads/media/3566467336005236263_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.841	2026-01-04 15:24:17.841
cmjzvtzjq0091ixwctjghdjya	Post 529562	bold-kira-3567022810772529562	\N	bold-kira	VIDEO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3567022810772529562_1_thumb.jpg	\N	/uploads/media/3567022810772529562_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.847	2026-01-04 15:24:17.847
cmjzvtzjw0092ixwcjx075va1	Post 273117	bold-kira-3567079694896273117	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3567079694896273117_1.jpg	\N	/uploads/media/3567079694896273117_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.852	2026-01-04 15:24:17.852
cmjzvtzk20093ixwcq9lctfef	Post 970579	bold-kira-3567521020678970579	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3567521020678970579_1.jpg	\N	/uploads/media/3567521020678970579_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.858	2026-01-04 15:24:17.858
cmjzvtzk80094ixwc3r3udd72	Post 150451	bold-kira-3570723897519150451	\N	bold-kira	PHOTO	BASIC	f	\N	f	t	t	f	f	12000	/uploads/media/3570723897519150451_1.jpg	\N	/uploads/media/3570723897519150451_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.864	2026-01-04 15:24:17.864
cmjzvtzke0095ixwc8acifjts	Post 608685	bold-kira-3571239231349608685	\N	bold-kira	VIDEO	BASIC	f	\N	t	t	t	f	f	3000	/uploads/media/3571239231349608685_1_thumb.jpg	\N	/uploads/media/3571239231349608685_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.87	2026-01-04 15:24:17.87
cmjzvtzkm0096ixwc5mk89qdx	Post 909757	bold-kira-3572975212423909757	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3572975212423909757_1.jpg	\N	/uploads/media/3572975212423909757_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.879	2026-01-04 15:24:17.879
cmjzvtzks0097ixwckuxm5uh9	Post 037681	bold-kira-3584535520108037681	\N	bold-kira	PHOTO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/3584535520108037681_1.jpg	\N	/uploads/media/3584535520108037681_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.885	2026-01-04 15:24:17.885
cmjzvtzky0098ixwc5ychx0e2	Post 438310	bold-kira-3585776167087438310	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3585776167087438310_1.jpg	\N	/uploads/media/3585776167087438310_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.891	2026-01-04 15:24:17.891
cmjzvtzl50099ixwclqeuihkz	Post 205469	bold-kira-3587169293811205469	\N	bold-kira	PHOTO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/3587169293811205469_1.jpg	\N	/uploads/media/3587169293811205469_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.897	2026-01-04 15:24:17.897
cmjzvtzlb009aixwcy40tmx6x	Post 941180	bold-kira-3588857905543941180	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3588857905543941180_1.jpg	\N	/uploads/media/3588857905543941180_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.903	2026-01-04 15:24:17.903
cmjzvtzli009bixwcaq753hzl	Post 380175	bold-kira-3590256982324380175	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	12000	/uploads/media/3590256982324380175_1.jpg	\N	/uploads/media/3590256982324380175_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.91	2026-01-04 15:24:17.91
cmjzvtzlo009cixwcnqbuz5pv	Post 266945	bold-kira-3591854054924266945	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3591854054924266945_1.jpg	\N	/uploads/media/3591854054924266945_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.916	2026-01-04 15:24:17.916
cmjzvtzlu009dixwcjayiijm8	Post 057668	bold-kira-3596171254422057668	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3596171254422057668_1.jpg	\N	/uploads/media/3596171254422057668_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.922	2026-01-04 15:24:17.922
cmjzvtzm0009eixwccicabb3h	Post 730832	bold-kira-3596593625104730832	\N	bold-kira	PHOTO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3596593625104730832_1.jpg	\N	/uploads/media/3596593625104730832_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.928	2026-01-04 15:24:17.928
cmjzvtzm6009fixwc79yb3ovz	Post 128984	bold-kira-3601592492695128984	\N	bold-kira	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3601592492695128984_1_thumb.jpg	\N	/uploads/media/3601592492695128984_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.934	2026-01-04 15:24:17.934
cmjzvtzmc009gixwcm7xmck0t	Post 619159	bold-kira-3602380567778619159	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	3000	/uploads/media/3602380567778619159_1.jpg	\N	/uploads/media/3602380567778619159_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.94	2026-01-04 15:24:17.94
cmjzvtzmi009hixwci3uid693	Post 156255	bold-kira-3604626255240156255	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3604626255240156255_1.jpg	\N	/uploads/media/3604626255240156255_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.947	2026-01-04 15:24:17.947
cmjzvtzmo009iixwcegkg5ky3	Post 143533	bold-kira-3606163762141143533	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3606163762141143533_1.jpg	\N	/uploads/media/3606163762141143533_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.953	2026-01-04 15:24:17.953
cmjzvtzmu009jixwcoz8dqo8r	Post 714955	bold-kira-3612027421295714955	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	11000	/uploads/media/3612027421295714955_1.jpg	\N	/uploads/media/3612027421295714955_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.958	2026-01-04 15:24:17.958
cmjzvtzmz009kixwc4q7p1sl9	Post 101471	bold-kira-3613591812273101471	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3613591812273101471_1.jpg	\N	/uploads/media/3613591812273101471_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.964	2026-01-04 15:24:17.964
cmjzvtzn6009lixwcuzzgtl0d	Post 430035	bold-kira-3614717728652430035	\N	bold-kira	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3614717728652430035_1_thumb.jpg	\N	/uploads/media/3614717728652430035_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.971	2026-01-04 15:24:17.971
cmjzvtznd009mixwc4a7gf0hh	Post 344939	bold-kira-3615009373566344939	\N	bold-kira	VIDEO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3615009373566344939_1_thumb.jpg	\N	/uploads/media/3615009373566344939_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.977	2026-01-04 15:24:17.977
cmjzvtznj009nixwcaaptb80c	Post 777822	bold-kira-3615649956823777822	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3615649956823777822_1.jpg	\N	/uploads/media/3615649956823777822_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.984	2026-01-04 15:24:17.984
cmjzvtznp009oixwcqk62kng0	Post 948600	bold-kira-3616502583815948600	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	6000	/uploads/media/3616502583815948600_1.jpg	\N	/uploads/media/3616502583815948600_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.99	2026-01-04 15:24:17.99
cmjzvtznv009pixwc24wougog	Post 993686	bold-kira-3617851421854993686	\N	bold-kira	VIDEO	BASIC	f	\N	t	t	t	f	f	10000	/uploads/media/3617851421854993686_1_thumb.jpg	\N	/uploads/media/3617851421854993686_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:17.995	2026-01-04 15:24:17.995
cmjzvtzo1009qixwc76k9g7uz	Post 561641	bold-kira-3622958280036561641	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3622958280036561641_1.jpg	\N	/uploads/media/3622958280036561641_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.001	2026-01-04 15:24:18.001
cmjzvtzo7009rixwcj34w983b	Post 279242	bold-kira-3624444820386279242	\N	bold-kira	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3624444820386279242_1_thumb.jpg	\N	/uploads/media/3624444820386279242_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.007	2026-01-04 15:24:18.007
cmjzvtzod009sixwct7vv3kf1	Post 200275	bold-kira-3626598191931200275	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3626598191931200275_1.jpg	\N	/uploads/media/3626598191931200275_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.013	2026-01-04 15:24:18.013
cmjzvtzoj009tixwcjvlbw6qf	Post 808605	bold-kira-3630110034410808605	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	10000	/uploads/media/3630110034410808605_1.jpg	\N	/uploads/media/3630110034410808605_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.019	2026-01-04 15:24:18.019
cmjzvtzor009uixwcevljviyk	Post 239782	bold-kira-3633831960006239782	\N	bold-kira	PHOTO	BASIC	f	\N	f	t	t	f	f	5000	/uploads/media/3633831960006239782_1.jpg	\N	/uploads/media/3633831960006239782_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.027	2026-01-04 15:24:18.027
cmjzvtzox009vixwc9ev285pb	Post 814655	bold-kira-3639401338993814655	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3639401338993814655_1.jpg	\N	/uploads/media/3639401338993814655_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.033	2026-01-04 15:24:18.033
cmjzvtzp3009wixwc6f5v6v5s	Post 879482	bold-kira-3642530500180879482	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3642530500180879482_1.jpg	\N	/uploads/media/3642530500180879482_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.039	2026-01-04 15:24:18.039
cmjzvtzp9009xixwcjzy0apfo	Post 857802	bold-kira-3643940276873857802	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3643940276873857802_1.jpg	\N	/uploads/media/3643940276873857802_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.045	2026-01-04 15:24:18.045
cmjzvtzpf009yixwctju9tl9u	Post 753659	bold-kira-3646527748304753659	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3646527748304753659_1.jpg	\N	/uploads/media/3646527748304753659_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.051	2026-01-04 15:24:18.051
cmjzvtzpl009zixwcivkzwqb8	Post 532888	bold-kira-3650361402877532888	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	12000	/uploads/media/3650361402877532888_1.jpg	\N	/uploads/media/3650361402877532888_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.057	2026-01-04 15:24:18.057
cmjzvtzpr00a0ixwcmbofv5sr	Post 752419	bold-kira-3651230776282752419	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3651230776282752419_1.jpg	\N	/uploads/media/3651230776282752419_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.063	2026-01-04 15:24:18.063
cmjzvtzpx00a1ixwcafm4lqtl	Post 333042	bold-kira-3653376862338333042	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3653376862338333042_1.jpg	\N	/uploads/media/3653376862338333042_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.069	2026-01-04 15:24:18.069
cmjzvtzq400a2ixwccqytjn5q	Post 664496	bold-kira-3654593618075664496	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3654593618075664496_1.jpg	\N	/uploads/media/3654593618075664496_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.076	2026-01-04 15:24:18.076
cmjzvtzqa00a3ixwc32pl0u35	Post 312971	bold-kira-3657118932362312971	\N	bold-kira	VIDEO	BASIC	f	\N	t	t	t	f	f	5000	/uploads/media/3657118932362312971_1_thumb.jpg	\N	/uploads/media/3657118932362312971_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.083	2026-01-04 15:24:18.083
cmjzvtzqi00a4ixwcfcscqn9m	Post 562505	bold-kira-3658412025170562505	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	4000	/uploads/media/3658412025170562505_1.jpg	\N	/uploads/media/3658412025170562505_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.091	2026-01-04 15:24:18.091
cmjzvtzqp00a5ixwcvc67c28r	Post 442411	bold-kira-3661228404852442411	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	9000	/uploads/media/3661228404852442411_1.jpg	\N	/uploads/media/3661228404852442411_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.098	2026-01-04 15:24:18.098
cmjzvtzqv00a6ixwczwh5qmo1	Post 380353	bold-kira-3663366676718380353	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3663366676718380353_1.jpg	\N	/uploads/media/3663366676718380353_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.103	2026-01-04 15:24:18.103
cmjzvtzr100a7ixwc3p9puotb	Post 169599	bold-kira-3666916298267169599	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3666916298267169599_1.jpg	\N	/uploads/media/3666916298267169599_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.11	2026-01-04 15:24:18.11
cmjzvtzr700a8ixwce77bgwk5	Post 022236	bold-kira-3669281789117022236	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3669281789117022236_1.jpg	\N	/uploads/media/3669281789117022236_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.116	2026-01-04 15:24:18.116
cmjzvtzrd00a9ixwc2os7brbf	Post 843757	bold-kira-3672658538318843757	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3672658538318843757_1.jpg	\N	/uploads/media/3672658538318843757_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.122	2026-01-04 15:24:18.122
cmjzvtzrm00aaixwclevhjxes	Post 648641	bold-kira-3680148174512648641	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3680148174512648641_1.jpg	\N	/uploads/media/3680148174512648641_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.13	2026-01-04 15:24:18.13
cmjzvtzru00abixwchzu4wsd8	Post 690523	bold-kira-3680239722604690523	\N	bold-kira	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3680239722604690523_1_thumb.jpg	\N	/uploads/media/3680239722604690523_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.138	2026-01-04 15:24:18.138
cmjzvtzs600acixwcmjn7u0ha	Post 932498	bold-kira-3682102124294932498	\N	bold-kira	PHOTO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3682102124294932498_1.jpg	\N	/uploads/media/3682102124294932498_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.15	2026-01-04 15:24:18.15
cmjzvtzsh00adixwcrlms3hga	Post 522297	bold-kira-3682905444500522297	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	11000	/uploads/media/3682905444500522297_1.jpg	\N	/uploads/media/3682905444500522297_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.161	2026-01-04 15:24:18.161
cmjzvtzsr00aeixwckj74czop	Post 673558	bold-kira-3684564311143673558	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3684564311143673558_1.jpg	\N	/uploads/media/3684564311143673558_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.171	2026-01-04 15:24:18.171
cmjzvtzsy00afixwcikkvnj6l	Post 106690	bold-kira-3685683165727106690	\N	bold-kira	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3685683165727106690_1_thumb.jpg	\N	/uploads/media/3685683165727106690_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.179	2026-01-04 15:24:18.179
cmjzvtzt400agixwcgjfbh8ii	Post 394891	bold-kira-3687924119087394891	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	8000	/uploads/media/3687924119087394891_1.jpg	\N	/uploads/media/3687924119087394891_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.185	2026-01-04 15:24:18.185
cmjzvtzta00ahixwc9i6ygy5v	Post 249474	bold-kira-3689542161068249474	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3689542161068249474_1.jpg	\N	/uploads/media/3689542161068249474_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.191	2026-01-04 15:24:18.191
cmjzvtztg00aiixwcybwuugrf	Post 914001	bold-kira-3692512996573914001	\N	bold-kira	VIDEO	BASIC	f	\N	t	t	t	f	f	6000	/uploads/media/3692512996573914001_1_thumb.jpg	\N	/uploads/media/3692512996573914001_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.197	2026-01-04 15:24:18.197
cmjzvtztn00ajixwc9ifc8nun	Post 877948	bold-kira-3693797302952877948	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3693797302952877948_1.jpg	\N	/uploads/media/3693797302952877948_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.203	2026-01-04 15:24:18.203
cmjzvtztt00akixwcs7re0ivw	Post 086246	bold-kira-3701173649083086246	\N	bold-kira	VIDEO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3701173649083086246_1_thumb.jpg	\N	/uploads/media/3701173649083086246_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.209	2026-01-04 15:24:18.209
cmjzvtztz00alixwcw9gni9m3	Post 577101	bold-kira-3701307097508577101	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	10000	/uploads/media/3701307097508577101_1.jpg	\N	/uploads/media/3701307097508577101_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.215	2026-01-04 15:24:18.215
cmjzvtzu500amixwcglvhkl50	Post 606160	bold-kira-3708569299595606160	\N	bold-kira	PHOTO	BASIC	f	\N	f	t	t	f	f	4000	/uploads/media/3708569299595606160_1.jpg	\N	/uploads/media/3708569299595606160_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.221	2026-01-04 15:24:18.221
cmjzvtzua00anixwcjw1glxpf	Post 914286	bold-kira-3709802552045914286	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3709802552045914286_1.jpg	\N	/uploads/media/3709802552045914286_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.226	2026-01-04 15:24:18.226
cmjzvtzuf00aoixwc8imftl77	Post 275936	bold-kira-3713613248467275936	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3713613248467275936_1.jpg	\N	/uploads/media/3713613248467275936_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.231	2026-01-04 15:24:18.231
cmjzvtzuk00apixwcut6oecv4	Post 702312	bold-kira-3714103690111702312	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3714103690111702312_1.jpg	\N	/uploads/media/3714103690111702312_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.237	2026-01-04 15:24:18.237
cmjzvtzur00aqixwcfdn8ywj7	Post 499332	bold-kira-3724378653519499332	\N	bold-kira	PHOTO	BASIC	f	\N	f	t	t	f	f	12000	/uploads/media/3724378653519499332_1.jpg	\N	/uploads/media/3724378653519499332_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.243	2026-01-04 15:24:18.243
cmjzvtzux00arixwccgvwkzjm	Post 868083	bold-kira-3733207072796868083	\N	bold-kira	PHOTO	FREE	f	\N	f	f	t	t	f	\N	/uploads/media/3733207072796868083_1.jpg	\N	/uploads/media/3733207072796868083_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.25	2026-01-04 15:24:18.25
cmjzvtzv300asixwchgzanq9z	Post 152125	bold-kira-3733237650204152125	\N	bold-kira	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3733237650204152125_1_thumb.jpg	\N	/uploads/media/3733237650204152125_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.256	2026-01-04 15:24:18.256
cmjzvtzv900atixwcmtzjwrbr	Post 967751	bold-kira-3733953665451967751	\N	bold-kira	VIDEO	BASIC	f	\N	f	t	t	f	f	3000	/uploads/media/3733953665451967751_1_thumb.jpg	\N	/uploads/media/3733953665451967751_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.261	2026-01-04 15:24:18.261
cmjzvtzve00auixwc7cl04nmq	Post 448229	bold-kira-3735385169713448229	\N	bold-kira	VIDEO	BASIC	f	\N	f	t	t	f	f	11000	/uploads/media/3735385169713448229_1_thumb.jpg	\N	/uploads/media/3735385169713448229_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.267	2026-01-04 15:24:18.267
cmjzvtzvl00avixwcbd3ulvwi	Post 000884	bold-kira-3737841427906000884	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3737841427906000884_1.jpg	\N	/uploads/media/3737841427906000884_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.273	2026-01-04 15:24:18.273
cmjzvtzvr00awixwcksl46j8d	Post 149417	bold-kira-3738990679768149417	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	3000	/uploads/media/3738990679768149417_1.jpg	\N	/uploads/media/3738990679768149417_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.279	2026-01-04 15:24:18.279
cmjzvtzvx00axixwcgni736v7	Post 322744	bold-kira-3745454137422322744	\N	bold-kira	PHOTO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/3745454137422322744_1.jpg	\N	/uploads/media/3745454137422322744_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.285	2026-01-04 15:24:18.285
cmjzvtzw300ayixwcydnf2d1f	Post 320844	bold-kira-3754626463095320844	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3754626463095320844_1.jpg	\N	/uploads/media/3754626463095320844_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.291	2026-01-04 15:24:18.291
cmjzvtzw900azixwcefrunavd	Post 496069	bold-kira-3756310163046496069	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	12000	/uploads/media/3756310163046496069_1.jpg	\N	/uploads/media/3756310163046496069_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.297	2026-01-04 15:24:18.297
cmjzvtzwe00b0ixwcc0ril51k	Post 730983	bold-kira-3757087181115730983	\N	bold-kira	PHOTO	VIP	f	\N	f	f	t	f	t	\N	/uploads/media/3757087181115730983_1.jpg	\N	/uploads/media/3757087181115730983_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.303	2026-01-04 15:24:18.303
cmjzvtzwk00b1ixwcnl0gns5w	Post 695970	bold-kira-3759659553798695970	\N	bold-kira	VIDEO	BASIC	f	\N	t	t	t	f	f	11000	/uploads/media/3759659553798695970_1_thumb.jpg	\N	/uploads/media/3759659553798695970_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.309	2026-01-04 15:24:18.309
cmjzvtzws00b2ixwc3kud83ai	Post 980478	bold-kira-3761165912636980478	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3761165912636980478_1.jpg	\N	/uploads/media/3761165912636980478_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.316	2026-01-04 15:24:18.316
cmjzvtzx000b3ixwcz0pzjmvp	Post 879200	bold-kira-3762150951180879200	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3762150951180879200_1.jpg	\N	/uploads/media/3762150951180879200_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.324	2026-01-04 15:24:18.324
cmjzvtzx800b4ixwc9twvzj9z	Post 338047	bold-kira-3762637298337338047	\N	bold-kira	PHOTO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3762637298337338047_1.jpg	\N	/uploads/media/3762637298337338047_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.332	2026-01-04 15:24:18.332
cmjzvtzxe00b5ixwcfict4nt7	Post 274357	bold-kira-3762812128186274357	\N	bold-kira	PHOTO	FREE	f	\N	t	f	t	t	f	\N	/uploads/media/3762812128186274357_1.jpg	\N	/uploads/media/3762812128186274357_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.338	2026-01-04 15:24:18.338
cmjzvtzxk00b6ixwct94ys815	Post 838412	bold-kira-3763527242480838412	\N	bold-kira	PHOTO	BASIC	f	\N	t	t	t	f	f	4000	/uploads/media/3763527242480838412_1.jpg	\N	/uploads/media/3763527242480838412_1.jpg	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.345	2026-01-04 15:24:18.345
cmjzvtzxq00b7ixwcchrotf02	Post 665393	bold-kira-3765644745973665393	\N	bold-kira	VIDEO	VIP	f	\N	t	f	t	f	t	\N	/uploads/media/3765644745973665393_1_thumb.jpg	\N	/uploads/media/3765644745973665393_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.35	2026-01-04 15:24:18.35
cmjzvtzxw00b8ixwc9v4ifrbs	Post 646667	bold-kira-3770053436512646667	\N	bold-kira	VIDEO	BASIC	f	\N	t	t	t	f	f	6000	/uploads/media/3770053436512646667_1_thumb.jpg	\N	/uploads/media/3770053436512646667_1.mp4	\N	\N	\N	\N	\N	\N	\N	[]	0	0	t	f	t	2026-01-04 15:34:33.548	2026-01-04 15:24:18.356	2026-01-04 15:24:18.356
\.


--
-- Data for Name: MediaPurchase; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."MediaPurchase" (id, "userId", "mediaId", amount, currency, provider, "providerTxId", status, "expiresAt", "downloadCount", "maxDownloads", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."Message" (id, "conversationId", "senderId", "receiverId", text, "replyToId", "isPPV", "ppvPrice", "ppvUnlockedBy", "totalTips", "isRead", "isDeleted", "isAiGenerated", "chatterId", "aiPersonalityId", "scriptId", "scriptModified", "resultedInSale", "saleAmount", "responseTimeSeconds", "fanEngagedAfter", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: MessageMedia; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."MessageMedia" (id, "messageId", "mediaId", type, url, "previewUrl", "createdAt") FROM stdin;
\.


--
-- Data for Name: MessagePayment; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."MessagePayment" (id, "messageId", "userId", type, amount, currency, provider, "providerTxId", status, "createdAt") FROM stdin;
\.


--
-- Data for Name: MessageReaction; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."MessageReaction" (id, "messageId", "userId", emoji, "createdAt") FROM stdin;
\.


--
-- Data for Name: ModelListing; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."ModelListing" (id, "creatorId", bio, photos, "socialLinks", tags, "revenueShare", "chattingEnabled", "averageRating", "reviewCount", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ObjectionHandling; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."ObjectionHandling" (id, "conversationId", "messageId", "patternId", "responseMessageId", strategy, "discountCodeId", outcome, "outcomeMessageId", "revenueGenerated", "createdAt", "resolvedAt") FROM stdin;
\.


--
-- Data for Name: ObjectionPattern; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."ObjectionPattern" (id, "agencyId", name, patterns, strategy, "responseTemplate", "discountEnabled", "discountPercent", "discountMaxAmount", "discountValidHours", language, priority, "isActive", "timesTriggered", "timesConverted", "conversionRate", "totalRevenue", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PageView; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."PageView" (id, path, referrer, "visitorId", "userId", "userAgent", device, browser, os, country, "sessionId", "createdAt") FROM stdin;
cmjzugorp000778lbtazh0g4u	/fr	https://viponly.fun/fr/dashboard/creator/ai	v_1766804038091_cp6wd3qhq1	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767537312792_6tgg0tm23dk	2026-01-04 14:45:57.733
cmjzugq11000878lbq5rxlbe2	/fr/auth/register	https://viponly.fun/fr/dashboard/creator/ai	v_1766804038091_cp6wd3qhq1	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767537312792_6tgg0tm23dk	2026-01-04 14:45:59.365
cmjzuk5kb000978lb8y5i6wva	/fr	https://viponly.fun/fr/dashboard/creator/ai	v_1766804038091_cp6wd3qhq1	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767537312792_6tgg0tm23dk	2026-01-04 14:48:39.467
cmjzuk6gd000a78lb8gk25a7m	/fr/auth/login	https://viponly.fun/fr/dashboard/creator/ai	v_1766804038091_cp6wd3qhq1	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767537312792_6tgg0tm23dk	2026-01-04 14:48:40.622
cmjzuutmm0001peuspl57gspy	/fr/dashboard	https://accounts.google.com/	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767537312792_6tgg0tm23dk	2026-01-04 14:56:57.214
cmjzuv1da0002peuskjkh0mjs	/fr/dashboard/become-creator	https://accounts.google.com/	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767537312792_6tgg0tm23dk	2026-01-04 14:57:07.246
cmjzuvtl90003peuse24pgs0o	/fr	https://viponly.fun/fr/dashboard/become-creator	v_1766804038091_cp6wd3qhq1	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767537312792_6tgg0tm23dk	2026-01-04 14:57:43.821
cmjzuvvak0004peus86x85a96	/fr/auth/login	https://viponly.fun/fr/dashboard/become-creator	v_1766804038091_cp6wd3qhq1	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767537312792_6tgg0tm23dk	2026-01-04 14:57:46.028
cmjzuvzyt0005peuso1sxylhw	/fr/dashboard	https://accounts.google.com/	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767537312792_6tgg0tm23dk	2026-01-04 14:57:52.086
cmjzuw3ed0006peusjc2zwu35	/fr	https://accounts.google.com/	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767537312792_6tgg0tm23dk	2026-01-04 14:57:56.534
cmjzv7ff500002hol55h3zj13	/fr/dashboard	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767539205061_roabqu9wtjc	2026-01-04 15:06:45.329
cmjzvg8dw0000104euqe2g98d	/fr/dashboard	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767539205061_roabqu9wtjc	2026-01-04 15:13:36.117
cmjzvg9n20001104eq8rwfoay	/fr	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767539205061_roabqu9wtjc	2026-01-04 15:13:37.742
cmjzvsxb20002104eznocu6mq	/fr	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767539205061_roabqu9wtjc	2026-01-04 15:23:28.287
cmjzw0pq20003104enp0lzphm	/fr	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767539205061_roabqu9wtjc	2026-01-04 15:29:31.706
cmjzw0x4c0004104eiz6lrky2	/fr/miacosta	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767539205061_roabqu9wtjc	2026-01-04 15:29:41.292
cmjzw53s70005104e5udjfjxc	/fr/miacosta	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767539205061_roabqu9wtjc	2026-01-04 15:32:56.551
cmjzw56n90006104eekl1rd6j	/fr/dashboard	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767539205061_roabqu9wtjc	2026-01-04 15:33:00.262
cmjzw59na0007104e9tvwcxb8	/fr	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767539205061_roabqu9wtjc	2026-01-04 15:33:04.15
cmjzw5can0008104e7ajwu6vm	/fr/miacosta	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767539205061_roabqu9wtjc	2026-01-04 15:33:07.584
cmjzw5dfv0009104ellhr7kc6	/fr	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767539205061_roabqu9wtjc	2026-01-04 15:33:09.067
cmjzw5ffm000a104euls1c5p1	/fr/bold-kira	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767539205061_roabqu9wtjc	2026-01-04 15:33:11.65
cmjzw5slo000b104evtvrg1mm	/fr/dashboard	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767539205061_roabqu9wtjc	2026-01-04 15:33:28.716
cmjzw6luw000c104ecph70gzj	/fr/dashboard/creator/media	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767539205061_roabqu9wtjc	2026-01-04 15:34:06.632
cmjzwadto000d104eq37s6psf	/fr/dashboard/creator/verification	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767541022832_e7ppvrtx1qg	2026-01-04 15:37:02.844
cmjzwjizv000e104e3sgdxc74	/fr/dashboard/admin/creators	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767541022832_e7ppvrtx1qg	2026-01-04 15:44:09.452
cmjzx4zqr000f104elnhjp1p1	/fr/dashboard/admin/creators	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767541022832_e7ppvrtx1qg	2026-01-04 16:00:50.932
cmjzx5dco000g104egsk9ibl4	/fr/dashboard/agency	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767541022832_e7ppvrtx1qg	2026-01-04 16:01:08.568
cmjzy3s3x000h104ebuyhdqf2	/fr/dashboard/admin/analytics	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767544073988_eqmb9jgzqar	2026-01-04 16:27:53.998
cmjzy47u1000i104el3rioq2n	/fr/dashboard/admin/analytics	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767544073988_eqmb9jgzqar	2026-01-04 16:28:14.377
cmjzyd2z1000j104ewxwiimk7	/fr	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767544073988_eqmb9jgzqar	2026-01-04 16:35:07.981
cmjzyd6q2000k104e9njl41ve	/fr/miacosta	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767544073988_eqmb9jgzqar	2026-01-04 16:35:12.842
cmjzyd9qg000l104eqww2auxn	/fr/dashboard	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767544073988_eqmb9jgzqar	2026-01-04 16:35:16.744
cmjzydemf000m104eqnib8ked	/fr/dashboard/creator/media	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767544073988_eqmb9jgzqar	2026-01-04 16:35:23.079
cmjzydn38000n104e0qiyne3n	/fr/dashboard/creator/settings	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767544073988_eqmb9jgzqar	2026-01-04 16:35:34.052
cmjzygrv5000p104ewetlea66	/fr/dashboard/creator/verification	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767544073988_eqmb9jgzqar	2026-01-04 16:38:00.209
cmjzyqrlw000q104eb2aafmrn	/fr/dashboard/creator/verification	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767544073988_eqmb9jgzqar	2026-01-04 16:45:46.437
cmjzyqum1000r104ezcklhvkp	/fr	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767544073988_eqmb9jgzqar	2026-01-04 16:45:50.33
cmjzyqvxw000s104ef7hl518j	/fr/miacosta	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767544073988_eqmb9jgzqar	2026-01-04 16:45:52.053
cmjzyr34a000t104ev7pg9tb6	/fr/dashboard	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767544073988_eqmb9jgzqar	2026-01-04 16:46:01.355
cmjzyri8o000u104eqyy6jhim	/fr/dashboard/creator/settings	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767544073988_eqmb9jgzqar	2026-01-04 16:46:20.952
cmjzysmlq000v104ee1ftz3zh	/fr/miacosta	\N	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767544073988_eqmb9jgzqar	2026-01-04 16:47:13.262
cmjzysoyv000w104eg38gh96x	/fr/dashboard/creator/settings	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767544073988_eqmb9jgzqar	2026-01-04 16:47:16.328
cmjzyspta000x104ex2e7emyh	/fr/dashboard	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767544073988_eqmb9jgzqar	2026-01-04 16:47:17.422
cmjzzihqz000y104e8n4wm6mg	/fr/dashboard/messages	https://viponly.fun/fr/dashboard/messages	v_1766804955115_r25kzpvto1	cmjojjvac001iuzc2514iyrs8	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767546439330_7xdo6tq1cvl	2026-01-04 17:07:20.027
cmjzzikxu000z104eplgvqjjy	/fr/dashboard	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767546444153_nbyusp148	2026-01-04 17:07:24.163
cmjzzinn00010104ebf3p6p3z	/fr/dashboard/creator/settings	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767546444153_nbyusp148	2026-01-04 17:07:27.66
cmk01mrb40001du80o0oc6o5b	/fr	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767549998246_ykqjkh21czl	2026-01-04 18:06:38.272
cmk01mypr0002du80cv9uzjrh	/fr/dashboard	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767549998246_ykqjkh21czl	2026-01-04 18:06:47.852
cmk01n0ea0003du80ptcdi3g1	/fr/dashboard/admin/creators	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767549998246_ykqjkh21czl	2026-01-04 18:06:50.051
cmk01n8cs0004du80ty1wn69t	/fr/dashboard/creator/settings	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767549998246_ykqjkh21czl	2026-01-04 18:07:00.365
cmk01ov4a0006du80kc90i64h	/fr	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767549998246_ykqjkh21czl	2026-01-04 18:08:16.522
cmk01oxhj0007du80t8uql7u0	/fr/bold-kira	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767549998246_ykqjkh21czl	2026-01-04 18:08:19.591
cmk01p59w0008du80hof5245s	/fr/dashboard	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767549998246_ykqjkh21czl	2026-01-04 18:08:29.684
cmk01p8d80009du80af5ro6hq	/fr/dashboard/creator/settings	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767549998246_ykqjkh21czl	2026-01-04 18:08:33.692
cmk01q0ym000bdu80hkfts9ry	/fr	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767549998246_ykqjkh21czl	2026-01-04 18:09:10.751
cmk01q2tb000cdu805zg5nmiq	/fr/bold-kira	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767549998246_ykqjkh21czl	2026-01-04 18:09:13.151
cmk028q0a0000k19wjet9br7u	/fr/bold-kira	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767549998246_ykqjkh21czl	2026-01-04 18:23:43.018
cmk0293y40001k19w2gxnn4ux	/fr/dashboard	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767549998246_ykqjkh21czl	2026-01-04 18:24:01.084
cmk02gz6g0002k19w4sa0beb3	/fr/dashboard/creator/members	https://viponly.fun/fr	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767549998246_ykqjkh21czl	2026-01-04 18:30:08.152
cmk02h25y0003k19w5fch7ysq	/fr/dashboard/creator/ai	\N	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767549998246_ykqjkh21czl	2026-01-04 18:30:12.023
cmk02hstt0004k19wl63trv6g	/fr/dashboard/settings	\N	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767549998246_ykqjkh21czl	2026-01-04 18:30:46.577
cmk02i1940005k19wzveoxvkt	/fr/dashboard/billing	\N	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767549998246_ykqjkh21czl	2026-01-04 18:30:57.494
cmk02igrc0006k19wvdmckooo	/fr/dashboard	\N	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767549998246_ykqjkh21czl	2026-01-04 18:31:17.592
cmk02iovz0007k19ww1aqiiec	/fr/miacosta/membership	\N	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767549998246_ykqjkh21czl	2026-01-04 18:31:28.127
cmk02irgf0008k19wuc1k5ozx	/fr/dashboard	\N	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767549998246_ykqjkh21czl	2026-01-04 18:31:31.454
cmk02jjtx0000xaefwqxp9mj5	/fr	https://viponly.fun/fr/dashboard	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767549998246_ykqjkh21czl	2026-01-04 18:32:08.229
cmk02jkzi0001xaef2uzkob6d	/fr/creators	https://viponly.fun/fr/dashboard	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767549998246_ykqjkh21czl	2026-01-04 18:32:09.726
cmk02k61m0002xaeftcvnppnc	/fr/dashboard	https://viponly.fun/fr/dashboard	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767549998246_ykqjkh21czl	2026-01-04 18:32:37.018
cmk02kbyw0003xaefq02aoz9x	/fr/dashboard/creator/settings	https://viponly.fun/fr/dashboard	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767549998246_ykqjkh21czl	2026-01-04 18:32:44.696
cmk02kz7m0005xaefq714haif	/fr	https://viponly.fun/fr/dashboard	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767549998246_ykqjkh21czl	2026-01-04 18:33:14.819
cmk02l4be0006xaefl9vqw5q0	/fr/bold-kira	https://viponly.fun/fr/dashboard	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767549998246_ykqjkh21czl	2026-01-04 18:33:21.435
cmk02m2gz0007xaeffhduhc0d	/fr	\N	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767549998246_ykqjkh21czl	2026-01-04 18:34:05.699
cmk02q7mk0008xaefwuvi68mg	/fr/dashboard	\N	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767551838985_cf5hxachf3l	2026-01-04 18:37:19.005
cmk02qfc50009xaefmpk3uxf4	/fr/dashboard/creator/ai	\N	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767551838985_cf5hxachf3l	2026-01-04 18:37:28.997
cmk02s63v000axaef0t4gtg1n	/en	\N	v_1767551930342_dpk5cpcqipk	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	desktop	Chrome	Linux	\N	s_1767551930342_kywilj1bem	2026-01-04 18:38:50.348
cmk02uqgn000bxaeflybvyzpg	/fr/dashboard/admin	\N	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767551838985_cf5hxachf3l	2026-01-04 18:40:50.04
cmk02urbs000cxaefrf9n86lw	/fr/dashboard/admin/creators	\N	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767551838985_cf5hxachf3l	2026-01-04 18:40:51.16
cmk02vbxj000dxaefw50kec5i	/fr/dashboard/admin/agencies	\N	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	desktop	Chrome	Windows	\N	s_1767551838985_cf5hxachf3l	2026-01-04 18:41:17.864
cmk0309i7000exaefi41l6c5i	/fr/dashboard/agency	\N	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36	mobile	Chrome	Linux	\N	s_1767551838985_cf5hxachf3l	2026-01-04 18:45:07.999
cmk030ely000hxaef5guypvmh	/fr/dashboard/agency	https://viponly.fun/fr/dashboard/agency	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36	mobile	Chrome	Linux	\N	s_1767551838985_cf5hxachf3l	2026-01-04 18:45:14.614
cmk031gql000ixaef2bu86kje	/fr/dashboard/agency/creators	https://viponly.fun/fr/dashboard/agency	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36	mobile	Chrome	Linux	\N	s_1767551838985_cf5hxachf3l	2026-01-04 18:46:04.029
cmk032pvl000jxaefq9lnbv0z	/fr	https://viponly.fun/fr/dashboard/agency	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36	mobile	Chrome	Linux	\N	s_1767551838985_cf5hxachf3l	2026-01-04 18:47:02.529
cmk03f9wm000kxaefdn63y67y	/fr	https://viponly.fun/fr/dashboard/agency	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36	mobile	Chrome	Linux	\N	s_1767551838985_cf5hxachf3l	2026-01-04 18:56:48.358
cmk03gprs000lxaefy1dp35ui	/fr/dashboard	https://viponly.fun/fr/dashboard/agency	v_1766804038091_cp6wd3qhq1	cmjzuusq60000peus3yh1w5h0	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36	mobile	Chrome	Linux	\N	s_1767551838985_cf5hxachf3l	2026-01-04 18:57:55.576
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."Payment" (id, "userId", "creatorSlug", amount, currency, "platformFee", "netAmount", provider, "providerTxId", status, type, description, metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PaymentDispute; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."PaymentDispute" (id, "userId", "transactionId", "paymentMethod", amount, "transactionHash", "walletAddress", "paymentDate", "cryptoCurrency", email, description, status, resolution, "creditAmount", "resolvedAt", "resolvedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PayoutRequest; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."PayoutRequest" (id, "creatorSlug", amount, "walletType", "walletAddress", status, "paidAt", "paidBy", "txHash", "createdAt") FROM stdin;
\.


--
-- Data for Name: PersonalitySwitch; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."PersonalitySwitch" (id, "conversationId", "fromPersonalityId", "toPersonalityId", reason, "detectedTone", "triggeredBy", "createdAt") FROM stdin;
\.


--
-- Data for Name: RetargetingCampaign; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."RetargetingCampaign" (id, "fanUserId", "creatorSlug", "triggerType", "triggeredAt", channel, "templateId", subject, content, "mediaId", "discountCodeId", "flashSaleId", status, "sentAt", "openedAt", "clickedAt", "convertedAt", error, "revenueGenerated", "createdAt") FROM stdin;
\.


--
-- Data for Name: Script; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."Script" (id, "agencyId", name, content, category, intent, "triggerKeywords", "triggerPatterns", "minConfidence", priority, "successScore", "aiInstructions", "allowAiModify", "preserveCore", language, "folderId", "creatorSlug", "authorId", status, "approvedById", "approvedAt", "rejectionReason", "hasVariables", variables, "sequenceId", "sequenceOrder", "usageCount", "messagesSent", "salesGenerated", "revenueGenerated", "conversionRate", "avgResponseTime", "isActive", "isFavorite", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ScriptFolder; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."ScriptFolder" (id, "agencyId", name, description, color, icon, "parentId", "order", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ScriptMedia; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."ScriptMedia" (id, "scriptId", "mediaId", "order", "createdAt") FROM stdin;
\.


--
-- Data for Name: ScriptSequence; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."ScriptSequence" (id, "agencyId", name, description, category, "isActive", "timesStarted", "timesCompleted", "totalRevenue", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ScriptUsage; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."ScriptUsage" (id, "scriptId", "chatterId", "conversationId", "messageId", "creatorSlug", "fanUserId", action, modifications, "resultedInSale", "saleAmount", "saleType", "usedAt", "responseTime") FROM stdin;
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."Session" (id, "sessionToken", "userId", expires) FROM stdin;
\.


--
-- Data for Name: SiteSettings; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."SiteSettings" (id, "creatorSlug", "siteName", "siteDescription", "siteUrl", "welcomeMessage", "welcomeMediaId", "welcomeMediaUrl", logo, favicon, "primaryColor", "accentColor", pricing, "stripeEnabled", "cryptoEnabled", "chatEnabled", "tipsEnabled", "ppvEnabled", "maintenanceMode", "registrationEnabled", "emailNotifications", "pushNotifications", "platformWalletEth", "platformWalletBtc", "platformCommission", "firstMonthFreeCommission", "createdAt", "updatedAt") FROM stdin;
cmjzygmdf000o104ec3samvzb	miacosta			\N		\N	\N	\N	\N	\N	\N	{"plans":[{"id":"basic","monthlyCredits":999,"annualCredits":9588,"bonusCredits":500},{"id":"vip","monthlyCredits":2999,"annualCredits":28788,"bonusCredits":2000}]}	t	f	t	t	t	f	t	t	f	\N	\N	0.05	t	2026-01-04 16:37:53.091	2026-01-04 17:12:57.661
cmk01mj2u0000du80rea9x32u	emmarose			\N		\N	\N	\N	\N	\N	\N	{"plans":[{"id":"basic","monthlyCredits":999,"annualCredits":9588,"bonusCredits":500},{"id":"vip","monthlyCredits":2999,"annualCredits":28788,"bonusCredits":2000}]}	t	f	t	t	t	f	t	t	f	\N	\N	0.05	t	2026-01-04 18:06:27.605	2026-01-04 18:06:27.605
cmk01osv10005du8011smicnb	bold-kira			\N		\N	\N	\N	\N	\N	\N	{"plans":[{"id":"basic","monthlyCredits":999,"annualCredits":9588,"bonusCredits":500},{"id":"vip","monthlyCredits":2999,"annualCredits":28788,"bonusCredits":2000}]}	t	f	t	t	t	f	t	t	f	\N	\N	0.05	t	2026-01-04 18:08:13.597	2026-01-04 18:33:12.834
\.


--
-- Data for Name: StatsSnapshot; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."StatsSnapshot" (id, "entityType", "entityId", "snapshotAt", metrics) FROM stdin;
\.


--
-- Data for Name: Subscription; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."Subscription" (id, "userId", "planId", "creatorSlug", status, "paymentProvider", "stripeSubscriptionId", "stripeCustomerId", "billingInterval", "currentPeriodStart", "currentPeriodEnd", "cancelAtPeriodEnd", "canceledAt", "trialStart", "trialEnd", "lastCreditGrant", "nextCreditGrant", metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SubscriptionPlan; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."SubscriptionPlan" (id, name, slug, description, "monthlyPrice", "annualPrice", currency, "stripeProductId", "stripePriceMonthly", "stripePriceAnnual", "accessTier", "canMessage", "downloadLimit", "initialCredits", "recurringCredits", "creditIntervalDays", features, "isPopular", "isActive", "sortOrder", "createdAt", "updatedAt") FROM stdin;
cmjzvj3ft0000s3fiy2us8rfo	BASIC	basic	Access to basic content library	9.99	95.88	USD	\N	\N	\N	BASIC	f	\N	0	0	6	["Access to basic content library","Weekly new content","HD quality downloads","Email support"]	f	t	1	2026-01-04 15:15:49.673	2026-01-04 15:15:49.673
cmjzvj3g30001s3fiavy5gx4a	VIP	vip	Ultimate experience with full access	29.99	287.88	USD	\N	\N	\N	VIP	t	\N	0	0	6	["Full content access","4K quality downloads","Unlimited downloads","Direct messaging","Early access to new content","Exclusive VIP-only content","Behind-the-scenes access","Priority support"]	t	t	2	2026-01-04 15:15:49.684	2026-01-04 15:15:49.684
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."User" (id, email, "emailVerified", "passwordHash", name, image, role, "isCreator", "isAgencyOwner", "creditBalance", "paidCredits", "bonusCredits", "stripeCustomerId", "createdAt", "updatedAt") FROM stdin;
admin	mia@viponly.fun	\N	\N	Mia Costa	https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face	ADMIN	f	f	0	0	0	\N	2026-01-04 15:15:49.662	2026-01-04 15:15:49.662
cmjzuusq60000peus3yh1w5h0	viralstudioshop@gmail.com	\N	\N	viral studio	https://lh3.googleusercontent.com/a/ACg8ocItcHGLCZPJV_WNHR_ip-h8V9Y16GN2zr4bZC2Apej1oiEujw=s96-c	ADMIN	t	t	0	0	0	\N	2026-01-04 14:56:56.046	2026-01-04 18:45:13.922
\.


--
-- Data for Name: VerificationToken; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."VerificationToken" (identifier, token, expires) FROM stdin;
\.


--
-- Data for Name: VerifiedReview; Type: TABLE DATA; Schema: public; Owner: viponly
--

COPY public."VerifiedReview" (id, "reviewerType", "reviewerId", "targetType", "targetId", rating, title, content, "communicationRating", "professionalismRating", "paymentReliabilityRating", "contentQualityRating", "supportRating", "isVerified", "collaborationId", "isPublished", "reportCount", "isHidden", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: AccountingQueue AccountingQueue_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AccountingQueue"
    ADD CONSTRAINT "AccountingQueue_pkey" PRIMARY KEY (id);


--
-- Name: AgencyAiPersonality AgencyAiPersonality_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AgencyAiPersonality"
    ADD CONSTRAINT "AgencyAiPersonality_pkey" PRIMARY KEY (id);


--
-- Name: AgencyApplication AgencyApplication_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AgencyApplication"
    ADD CONSTRAINT "AgencyApplication_pkey" PRIMARY KEY (id);


--
-- Name: AgencyCreatorPayout AgencyCreatorPayout_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AgencyCreatorPayout"
    ADD CONSTRAINT "AgencyCreatorPayout_pkey" PRIMARY KEY (id);


--
-- Name: AgencyEarning AgencyEarning_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AgencyEarning"
    ADD CONSTRAINT "AgencyEarning_pkey" PRIMARY KEY (id);


--
-- Name: AgencyListing AgencyListing_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AgencyListing"
    ADD CONSTRAINT "AgencyListing_pkey" PRIMARY KEY (id);


--
-- Name: AgencyPayoutRequest AgencyPayoutRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AgencyPayoutRequest"
    ADD CONSTRAINT "AgencyPayoutRequest_pkey" PRIMARY KEY (id);


--
-- Name: AgencyPublicStats AgencyPublicStats_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AgencyPublicStats"
    ADD CONSTRAINT "AgencyPublicStats_pkey" PRIMARY KEY (id);


--
-- Name: AgencyReview AgencyReview_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AgencyReview"
    ADD CONSTRAINT "AgencyReview_pkey" PRIMARY KEY (id);


--
-- Name: Agency Agency_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Agency"
    ADD CONSTRAINT "Agency_pkey" PRIMARY KEY (id);


--
-- Name: AiPerformanceSummary AiPerformanceSummary_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AiPerformanceSummary"
    ADD CONSTRAINT "AiPerformanceSummary_pkey" PRIMARY KEY (id);


--
-- Name: AiPersonalityEarning AiPersonalityEarning_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AiPersonalityEarning"
    ADD CONSTRAINT "AiPersonalityEarning_pkey" PRIMARY KEY (id);


--
-- Name: AiResponseQueue AiResponseQueue_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AiResponseQueue"
    ADD CONSTRAINT "AiResponseQueue_pkey" PRIMARY KEY (id);


--
-- Name: AiSuggestion AiSuggestion_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AiSuggestion"
    ADD CONSTRAINT "AiSuggestion_pkey" PRIMARY KEY (id);


--
-- Name: AutoBump AutoBump_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AutoBump"
    ADD CONSTRAINT "AutoBump_pkey" PRIMARY KEY (id);


--
-- Name: Bundle Bundle_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Bundle"
    ADD CONSTRAINT "Bundle_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: ChatterCreatorAssignment ChatterCreatorAssignment_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ChatterCreatorAssignment"
    ADD CONSTRAINT "ChatterCreatorAssignment_pkey" PRIMARY KEY (id);


--
-- Name: ChatterEarning ChatterEarning_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ChatterEarning"
    ADD CONSTRAINT "ChatterEarning_pkey" PRIMARY KEY (id);


--
-- Name: ChatterPayoutRequest ChatterPayoutRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ChatterPayoutRequest"
    ADD CONSTRAINT "ChatterPayoutRequest_pkey" PRIMARY KEY (id);


--
-- Name: ChatterScriptFavorite ChatterScriptFavorite_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ChatterScriptFavorite"
    ADD CONSTRAINT "ChatterScriptFavorite_pkey" PRIMARY KEY (id);


--
-- Name: Chatter Chatter_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Chatter"
    ADD CONSTRAINT "Chatter_pkey" PRIMARY KEY (id);


--
-- Name: ConversationHandoff ConversationHandoff_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ConversationHandoff"
    ADD CONSTRAINT "ConversationHandoff_pkey" PRIMARY KEY (id);


--
-- Name: ConversationParticipant ConversationParticipant_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ConversationParticipant"
    ADD CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY (id);


--
-- Name: ConversationSummary ConversationSummary_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ConversationSummary"
    ADD CONSTRAINT "ConversationSummary_pkey" PRIMARY KEY (id);


--
-- Name: Conversation Conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_pkey" PRIMARY KEY (id);


--
-- Name: CreatorEarning CreatorEarning_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."CreatorEarning"
    ADD CONSTRAINT "CreatorEarning_pkey" PRIMARY KEY (id);


--
-- Name: CreatorMember CreatorMember_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."CreatorMember"
    ADD CONSTRAINT "CreatorMember_pkey" PRIMARY KEY (id);


--
-- Name: CreatorPublicStats CreatorPublicStats_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."CreatorPublicStats"
    ADD CONSTRAINT "CreatorPublicStats_pkey" PRIMARY KEY (id);


--
-- Name: CreatorVerification CreatorVerification_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."CreatorVerification"
    ADD CONSTRAINT "CreatorVerification_pkey" PRIMARY KEY (id);


--
-- Name: Creator Creator_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Creator"
    ADD CONSTRAINT "Creator_pkey" PRIMARY KEY (id);


--
-- Name: CreditTransaction CreditTransaction_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."CreditTransaction"
    ADD CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY (id);


--
-- Name: DMCANotice DMCANotice_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."DMCANotice"
    ADD CONSTRAINT "DMCANotice_pkey" PRIMARY KEY (id);


--
-- Name: DailyStats DailyStats_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."DailyStats"
    ADD CONSTRAINT "DailyStats_pkey" PRIMARY KEY (id);


--
-- Name: DiscountCode DiscountCode_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."DiscountCode"
    ADD CONSTRAINT "DiscountCode_pkey" PRIMARY KEY (id);


--
-- Name: FanLeadScore FanLeadScore_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."FanLeadScore"
    ADD CONSTRAINT "FanLeadScore_pkey" PRIMARY KEY (id);


--
-- Name: FanMemory FanMemory_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."FanMemory"
    ADD CONSTRAINT "FanMemory_pkey" PRIMARY KEY (id);


--
-- Name: FanPresence FanPresence_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."FanPresence"
    ADD CONSTRAINT "FanPresence_pkey" PRIMARY KEY (id);


--
-- Name: FanProfile FanProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."FanProfile"
    ADD CONSTRAINT "FanProfile_pkey" PRIMARY KEY (id);


--
-- Name: FlashSale FlashSale_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."FlashSale"
    ADD CONSTRAINT "FlashSale_pkey" PRIMARY KEY (id);


--
-- Name: MediaContent MediaContent_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."MediaContent"
    ADD CONSTRAINT "MediaContent_pkey" PRIMARY KEY (id);


--
-- Name: MediaPurchase MediaPurchase_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."MediaPurchase"
    ADD CONSTRAINT "MediaPurchase_pkey" PRIMARY KEY (id);


--
-- Name: MessageMedia MessageMedia_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."MessageMedia"
    ADD CONSTRAINT "MessageMedia_pkey" PRIMARY KEY (id);


--
-- Name: MessagePayment MessagePayment_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."MessagePayment"
    ADD CONSTRAINT "MessagePayment_pkey" PRIMARY KEY (id);


--
-- Name: MessageReaction MessageReaction_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."MessageReaction"
    ADD CONSTRAINT "MessageReaction_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: ModelListing ModelListing_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ModelListing"
    ADD CONSTRAINT "ModelListing_pkey" PRIMARY KEY (id);


--
-- Name: ObjectionHandling ObjectionHandling_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ObjectionHandling"
    ADD CONSTRAINT "ObjectionHandling_pkey" PRIMARY KEY (id);


--
-- Name: ObjectionPattern ObjectionPattern_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ObjectionPattern"
    ADD CONSTRAINT "ObjectionPattern_pkey" PRIMARY KEY (id);


--
-- Name: PageView PageView_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."PageView"
    ADD CONSTRAINT "PageView_pkey" PRIMARY KEY (id);


--
-- Name: PaymentDispute PaymentDispute_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."PaymentDispute"
    ADD CONSTRAINT "PaymentDispute_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: PayoutRequest PayoutRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."PayoutRequest"
    ADD CONSTRAINT "PayoutRequest_pkey" PRIMARY KEY (id);


--
-- Name: PersonalitySwitch PersonalitySwitch_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."PersonalitySwitch"
    ADD CONSTRAINT "PersonalitySwitch_pkey" PRIMARY KEY (id);


--
-- Name: RetargetingCampaign RetargetingCampaign_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."RetargetingCampaign"
    ADD CONSTRAINT "RetargetingCampaign_pkey" PRIMARY KEY (id);


--
-- Name: ScriptFolder ScriptFolder_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ScriptFolder"
    ADD CONSTRAINT "ScriptFolder_pkey" PRIMARY KEY (id);


--
-- Name: ScriptMedia ScriptMedia_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ScriptMedia"
    ADD CONSTRAINT "ScriptMedia_pkey" PRIMARY KEY (id);


--
-- Name: ScriptSequence ScriptSequence_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ScriptSequence"
    ADD CONSTRAINT "ScriptSequence_pkey" PRIMARY KEY (id);


--
-- Name: ScriptUsage ScriptUsage_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ScriptUsage"
    ADD CONSTRAINT "ScriptUsage_pkey" PRIMARY KEY (id);


--
-- Name: Script Script_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Script"
    ADD CONSTRAINT "Script_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: SiteSettings SiteSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."SiteSettings"
    ADD CONSTRAINT "SiteSettings_pkey" PRIMARY KEY (id);


--
-- Name: StatsSnapshot StatsSnapshot_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."StatsSnapshot"
    ADD CONSTRAINT "StatsSnapshot_pkey" PRIMARY KEY (id);


--
-- Name: SubscriptionPlan SubscriptionPlan_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."SubscriptionPlan"
    ADD CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY (id);


--
-- Name: Subscription Subscription_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: VerifiedReview VerifiedReview_pkey; Type: CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."VerifiedReview"
    ADD CONSTRAINT "VerifiedReview_pkey" PRIMARY KEY (id);


--
-- Name: Account_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON public."Account" USING btree (provider, "providerAccountId");


--
-- Name: AccountingQueue_nextRetryAt_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AccountingQueue_nextRetryAt_idx" ON public."AccountingQueue" USING btree ("nextRetryAt");


--
-- Name: AccountingQueue_status_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AccountingQueue_status_idx" ON public."AccountingQueue" USING btree (status);


--
-- Name: AgencyAiPersonality_agencyId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AgencyAiPersonality_agencyId_idx" ON public."AgencyAiPersonality" USING btree ("agencyId");


--
-- Name: AgencyAiPersonality_creatorSlug_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AgencyAiPersonality_creatorSlug_idx" ON public."AgencyAiPersonality" USING btree ("creatorSlug");


--
-- Name: AgencyAiPersonality_primaryTone_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AgencyAiPersonality_primaryTone_idx" ON public."AgencyAiPersonality" USING btree ("primaryTone");


--
-- Name: AgencyApplication_agencyId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AgencyApplication_agencyId_idx" ON public."AgencyApplication" USING btree ("agencyId");


--
-- Name: AgencyApplication_modelListingId_agencyId_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "AgencyApplication_modelListingId_agencyId_key" ON public."AgencyApplication" USING btree ("modelListingId", "agencyId");


--
-- Name: AgencyApplication_status_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AgencyApplication_status_idx" ON public."AgencyApplication" USING btree (status);


--
-- Name: AgencyCreatorPayout_agencyId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AgencyCreatorPayout_agencyId_idx" ON public."AgencyCreatorPayout" USING btree ("agencyId");


--
-- Name: AgencyCreatorPayout_createdAt_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AgencyCreatorPayout_createdAt_idx" ON public."AgencyCreatorPayout" USING btree ("createdAt");


--
-- Name: AgencyCreatorPayout_creatorSlug_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AgencyCreatorPayout_creatorSlug_idx" ON public."AgencyCreatorPayout" USING btree ("creatorSlug");


--
-- Name: AgencyCreatorPayout_status_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AgencyCreatorPayout_status_idx" ON public."AgencyCreatorPayout" USING btree (status);


--
-- Name: AgencyEarning_agencyId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AgencyEarning_agencyId_idx" ON public."AgencyEarning" USING btree ("agencyId");


--
-- Name: AgencyEarning_creatorEarningId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AgencyEarning_creatorEarningId_idx" ON public."AgencyEarning" USING btree ("creatorEarningId");


--
-- Name: AgencyEarning_status_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AgencyEarning_status_idx" ON public."AgencyEarning" USING btree (status);


--
-- Name: AgencyListing_agencyId_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "AgencyListing_agencyId_key" ON public."AgencyListing" USING btree ("agencyId");


--
-- Name: AgencyListing_averageRating_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AgencyListing_averageRating_idx" ON public."AgencyListing" USING btree ("averageRating");


--
-- Name: AgencyListing_isActive_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AgencyListing_isActive_idx" ON public."AgencyListing" USING btree ("isActive");


--
-- Name: AgencyPayoutRequest_agencyId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AgencyPayoutRequest_agencyId_idx" ON public."AgencyPayoutRequest" USING btree ("agencyId");


--
-- Name: AgencyPayoutRequest_createdAt_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AgencyPayoutRequest_createdAt_idx" ON public."AgencyPayoutRequest" USING btree ("createdAt");


--
-- Name: AgencyPayoutRequest_status_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AgencyPayoutRequest_status_idx" ON public."AgencyPayoutRequest" USING btree (status);


--
-- Name: AgencyPublicStats_activeCreators_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AgencyPublicStats_activeCreators_idx" ON public."AgencyPublicStats" USING btree ("activeCreators");


--
-- Name: AgencyPublicStats_agencyId_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "AgencyPublicStats_agencyId_key" ON public."AgencyPublicStats" USING btree ("agencyId");


--
-- Name: AgencyPublicStats_avgRating_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AgencyPublicStats_avgRating_idx" ON public."AgencyPublicStats" USING btree ("avgRating");


--
-- Name: AgencyReview_rating_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AgencyReview_rating_idx" ON public."AgencyReview" USING btree (rating);


--
-- Name: AgencyReview_reviewerId_targetId_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "AgencyReview_reviewerId_targetId_key" ON public."AgencyReview" USING btree ("reviewerId", "targetId");


--
-- Name: AgencyReview_targetId_targetType_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AgencyReview_targetId_targetType_idx" ON public."AgencyReview" USING btree ("targetId", "targetType");


--
-- Name: Agency_slug_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "Agency_slug_key" ON public."Agency" USING btree (slug);


--
-- Name: AiPerformanceSummary_creatorSlug_date_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "AiPerformanceSummary_creatorSlug_date_key" ON public."AiPerformanceSummary" USING btree ("creatorSlug", date);


--
-- Name: AiPerformanceSummary_creatorSlug_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AiPerformanceSummary_creatorSlug_idx" ON public."AiPerformanceSummary" USING btree ("creatorSlug");


--
-- Name: AiPerformanceSummary_date_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AiPerformanceSummary_date_idx" ON public."AiPerformanceSummary" USING btree (date);


--
-- Name: AiPersonalityEarning_aiPersonalityId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AiPersonalityEarning_aiPersonalityId_idx" ON public."AiPersonalityEarning" USING btree ("aiPersonalityId");


--
-- Name: AiPersonalityEarning_creatorEarningId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AiPersonalityEarning_creatorEarningId_idx" ON public."AiPersonalityEarning" USING btree ("creatorEarningId");


--
-- Name: AiResponseQueue_creatorSlug_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AiResponseQueue_creatorSlug_idx" ON public."AiResponseQueue" USING btree ("creatorSlug");


--
-- Name: AiResponseQueue_messageId_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "AiResponseQueue_messageId_key" ON public."AiResponseQueue" USING btree ("messageId");


--
-- Name: AiResponseQueue_status_scheduledAt_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AiResponseQueue_status_scheduledAt_idx" ON public."AiResponseQueue" USING btree (status, "scheduledAt");


--
-- Name: AiSuggestion_conversationId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AiSuggestion_conversationId_idx" ON public."AiSuggestion" USING btree ("conversationId");


--
-- Name: AiSuggestion_expiresAt_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AiSuggestion_expiresAt_idx" ON public."AiSuggestion" USING btree ("expiresAt");


--
-- Name: AiSuggestion_messageId_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "AiSuggestion_messageId_key" ON public."AiSuggestion" USING btree ("messageId");


--
-- Name: AiSuggestion_personalityId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AiSuggestion_personalityId_idx" ON public."AiSuggestion" USING btree ("personalityId");


--
-- Name: AiSuggestion_status_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AiSuggestion_status_idx" ON public."AiSuggestion" USING btree (status);


--
-- Name: AutoBump_creatorSlug_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AutoBump_creatorSlug_idx" ON public."AutoBump" USING btree ("creatorSlug");


--
-- Name: AutoBump_fanUserId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AutoBump_fanUserId_idx" ON public."AutoBump" USING btree ("fanUserId");


--
-- Name: AutoBump_status_scheduledAt_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "AutoBump_status_scheduledAt_idx" ON public."AutoBump" USING btree (status, "scheduledAt");


--
-- Name: Bundle_agencyId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "Bundle_agencyId_idx" ON public."Bundle" USING btree ("agencyId");


--
-- Name: Bundle_creatorSlug_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "Bundle_creatorSlug_idx" ON public."Bundle" USING btree ("creatorSlug");


--
-- Name: Bundle_isActive_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "Bundle_isActive_idx" ON public."Bundle" USING btree ("isActive");


--
-- Name: Category_name_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "Category_name_key" ON public."Category" USING btree (name);


--
-- Name: Category_slug_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "Category_slug_key" ON public."Category" USING btree (slug);


--
-- Name: ChatterCreatorAssignment_chatterId_creatorSlug_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "ChatterCreatorAssignment_chatterId_creatorSlug_key" ON public."ChatterCreatorAssignment" USING btree ("chatterId", "creatorSlug");


--
-- Name: ChatterCreatorAssignment_creatorSlug_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ChatterCreatorAssignment_creatorSlug_idx" ON public."ChatterCreatorAssignment" USING btree ("creatorSlug");


--
-- Name: ChatterEarning_chatterId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ChatterEarning_chatterId_idx" ON public."ChatterEarning" USING btree ("chatterId");


--
-- Name: ChatterEarning_creatorEarningId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ChatterEarning_creatorEarningId_idx" ON public."ChatterEarning" USING btree ("creatorEarningId");


--
-- Name: ChatterEarning_status_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ChatterEarning_status_idx" ON public."ChatterEarning" USING btree (status);


--
-- Name: ChatterPayoutRequest_agencyId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ChatterPayoutRequest_agencyId_idx" ON public."ChatterPayoutRequest" USING btree ("agencyId");


--
-- Name: ChatterPayoutRequest_chatterId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ChatterPayoutRequest_chatterId_idx" ON public."ChatterPayoutRequest" USING btree ("chatterId");


--
-- Name: ChatterPayoutRequest_createdAt_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ChatterPayoutRequest_createdAt_idx" ON public."ChatterPayoutRequest" USING btree ("createdAt");


--
-- Name: ChatterPayoutRequest_status_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ChatterPayoutRequest_status_idx" ON public."ChatterPayoutRequest" USING btree (status);


--
-- Name: ChatterScriptFavorite_chatterId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ChatterScriptFavorite_chatterId_idx" ON public."ChatterScriptFavorite" USING btree ("chatterId");


--
-- Name: ChatterScriptFavorite_chatterId_scriptId_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "ChatterScriptFavorite_chatterId_scriptId_key" ON public."ChatterScriptFavorite" USING btree ("chatterId", "scriptId");


--
-- Name: Chatter_agencyId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "Chatter_agencyId_idx" ON public."Chatter" USING btree ("agencyId");


--
-- Name: Chatter_email_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "Chatter_email_key" ON public."Chatter" USING btree (email);


--
-- Name: ConversationHandoff_conversationId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ConversationHandoff_conversationId_idx" ON public."ConversationHandoff" USING btree ("conversationId");


--
-- Name: ConversationHandoff_status_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ConversationHandoff_status_idx" ON public."ConversationHandoff" USING btree (status);


--
-- Name: ConversationHandoff_toChatterId_status_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ConversationHandoff_toChatterId_status_idx" ON public."ConversationHandoff" USING btree ("toChatterId", status);


--
-- Name: ConversationParticipant_conversationId_userId_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON public."ConversationParticipant" USING btree ("conversationId", "userId");


--
-- Name: ConversationSummary_conversationId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ConversationSummary_conversationId_idx" ON public."ConversationSummary" USING btree ("conversationId");


--
-- Name: ConversationSummary_summaryDate_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ConversationSummary_summaryDate_idx" ON public."ConversationSummary" USING btree ("summaryDate");


--
-- Name: Conversation_aiMode_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "Conversation_aiMode_idx" ON public."Conversation" USING btree ("aiMode");


--
-- Name: Conversation_aiPersonalityId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "Conversation_aiPersonalityId_idx" ON public."Conversation" USING btree ("aiPersonalityId");


--
-- Name: Conversation_assignedChatterId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "Conversation_assignedChatterId_idx" ON public."Conversation" USING btree ("assignedChatterId");


--
-- Name: CreatorEarning_aiPersonalityId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "CreatorEarning_aiPersonalityId_idx" ON public."CreatorEarning" USING btree ("aiPersonalityId");


--
-- Name: CreatorEarning_chatterId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "CreatorEarning_chatterId_idx" ON public."CreatorEarning" USING btree ("chatterId");


--
-- Name: CreatorEarning_creatorSlug_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "CreatorEarning_creatorSlug_idx" ON public."CreatorEarning" USING btree ("creatorSlug");


--
-- Name: CreatorEarning_status_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "CreatorEarning_status_idx" ON public."CreatorEarning" USING btree (status);


--
-- Name: CreatorEarning_userId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "CreatorEarning_userId_idx" ON public."CreatorEarning" USING btree ("userId");


--
-- Name: CreatorMember_creatorSlug_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "CreatorMember_creatorSlug_idx" ON public."CreatorMember" USING btree ("creatorSlug");


--
-- Name: CreatorMember_creatorSlug_userId_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "CreatorMember_creatorSlug_userId_key" ON public."CreatorMember" USING btree ("creatorSlug", "userId");


--
-- Name: CreatorMember_userId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "CreatorMember_userId_idx" ON public."CreatorMember" USING btree ("userId");


--
-- Name: CreatorPublicStats_activeSubscribers_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "CreatorPublicStats_activeSubscribers_idx" ON public."CreatorPublicStats" USING btree ("activeSubscribers");


--
-- Name: CreatorPublicStats_avgRating_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "CreatorPublicStats_avgRating_idx" ON public."CreatorPublicStats" USING btree ("avgRating");


--
-- Name: CreatorPublicStats_creatorId_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "CreatorPublicStats_creatorId_key" ON public."CreatorPublicStats" USING btree ("creatorId");


--
-- Name: CreatorPublicStats_revenueLast30d_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "CreatorPublicStats_revenueLast30d_idx" ON public."CreatorPublicStats" USING btree ("revenueLast30d");


--
-- Name: CreatorVerification_creatorId_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "CreatorVerification_creatorId_key" ON public."CreatorVerification" USING btree ("creatorId");


--
-- Name: CreatorVerification_creatorSlug_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "CreatorVerification_creatorSlug_idx" ON public."CreatorVerification" USING btree ("creatorSlug");


--
-- Name: CreatorVerification_expiresAt_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "CreatorVerification_expiresAt_idx" ON public."CreatorVerification" USING btree ("expiresAt");


--
-- Name: CreatorVerification_status_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "CreatorVerification_status_idx" ON public."CreatorVerification" USING btree (status);


--
-- Name: Creator_agencyId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "Creator_agencyId_idx" ON public."Creator" USING btree ("agencyId");


--
-- Name: Creator_isListed_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "Creator_isListed_idx" ON public."Creator" USING btree ("isListed");


--
-- Name: Creator_lookingForAgency_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "Creator_lookingForAgency_idx" ON public."Creator" USING btree ("lookingForAgency");


--
-- Name: Creator_slug_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "Creator_slug_key" ON public."Creator" USING btree (slug);


--
-- Name: CreditTransaction_expiresAt_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "CreditTransaction_expiresAt_idx" ON public."CreditTransaction" USING btree ("expiresAt");


--
-- Name: CreditTransaction_type_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "CreditTransaction_type_idx" ON public."CreditTransaction" USING btree (type);


--
-- Name: CreditTransaction_userId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "CreditTransaction_userId_idx" ON public."CreditTransaction" USING btree ("userId");


--
-- Name: DMCANotice_createdAt_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "DMCANotice_createdAt_idx" ON public."DMCANotice" USING btree ("createdAt");


--
-- Name: DMCANotice_email_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "DMCANotice_email_idx" ON public."DMCANotice" USING btree (email);


--
-- Name: DMCANotice_status_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "DMCANotice_status_idx" ON public."DMCANotice" USING btree (status);


--
-- Name: DailyStats_date_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "DailyStats_date_key" ON public."DailyStats" USING btree (date);


--
-- Name: DiscountCode_code_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "DiscountCode_code_idx" ON public."DiscountCode" USING btree (code);


--
-- Name: DiscountCode_code_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "DiscountCode_code_key" ON public."DiscountCode" USING btree (code);


--
-- Name: DiscountCode_creatorSlug_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "DiscountCode_creatorSlug_idx" ON public."DiscountCode" USING btree ("creatorSlug");


--
-- Name: DiscountCode_fanUserId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "DiscountCode_fanUserId_idx" ON public."DiscountCode" USING btree ("fanUserId");


--
-- Name: DiscountCode_isActive_expiresAt_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "DiscountCode_isActive_expiresAt_idx" ON public."DiscountCode" USING btree ("isActive", "expiresAt");


--
-- Name: FanLeadScore_creatorSlug_score_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "FanLeadScore_creatorSlug_score_idx" ON public."FanLeadScore" USING btree ("creatorSlug", score);


--
-- Name: FanLeadScore_fanUserId_creatorSlug_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "FanLeadScore_fanUserId_creatorSlug_key" ON public."FanLeadScore" USING btree ("fanUserId", "creatorSlug");


--
-- Name: FanLeadScore_score_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "FanLeadScore_score_idx" ON public."FanLeadScore" USING btree (score);


--
-- Name: FanMemory_category_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "FanMemory_category_idx" ON public."FanMemory" USING btree (category);


--
-- Name: FanMemory_fanUserId_creatorSlug_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "FanMemory_fanUserId_creatorSlug_idx" ON public."FanMemory" USING btree ("fanUserId", "creatorSlug");


--
-- Name: FanMemory_fanUserId_creatorSlug_key_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "FanMemory_fanUserId_creatorSlug_key_key" ON public."FanMemory" USING btree ("fanUserId", "creatorSlug", key);


--
-- Name: FanMemory_isActive_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "FanMemory_isActive_idx" ON public."FanMemory" USING btree ("isActive");


--
-- Name: FanPresence_creatorSlug_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "FanPresence_creatorSlug_idx" ON public."FanPresence" USING btree ("creatorSlug");


--
-- Name: FanPresence_fanUserId_creatorSlug_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "FanPresence_fanUserId_creatorSlug_key" ON public."FanPresence" USING btree ("fanUserId", "creatorSlug");


--
-- Name: FanPresence_isOnline_lastBumpedAt_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "FanPresence_isOnline_lastBumpedAt_idx" ON public."FanPresence" USING btree ("isOnline", "lastBumpedAt");


--
-- Name: FanProfile_activityLevel_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "FanProfile_activityLevel_idx" ON public."FanProfile" USING btree ("activityLevel");


--
-- Name: FanProfile_creatorSlug_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "FanProfile_creatorSlug_idx" ON public."FanProfile" USING btree ("creatorSlug");


--
-- Name: FanProfile_fanUserId_creatorSlug_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "FanProfile_fanUserId_creatorSlug_key" ON public."FanProfile" USING btree ("fanUserId", "creatorSlug");


--
-- Name: FanProfile_qualityTier_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "FanProfile_qualityTier_idx" ON public."FanProfile" USING btree ("qualityTier");


--
-- Name: FanProfile_spendingTier_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "FanProfile_spendingTier_idx" ON public."FanProfile" USING btree ("spendingTier");


--
-- Name: FlashSale_creatorSlug_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "FlashSale_creatorSlug_idx" ON public."FlashSale" USING btree ("creatorSlug");


--
-- Name: FlashSale_discountCode_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "FlashSale_discountCode_idx" ON public."FlashSale" USING btree ("discountCode");


--
-- Name: FlashSale_discountCode_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "FlashSale_discountCode_key" ON public."FlashSale" USING btree ("discountCode");


--
-- Name: FlashSale_fanUserId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "FlashSale_fanUserId_idx" ON public."FlashSale" USING btree ("fanUserId");


--
-- Name: FlashSale_status_expiresAt_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "FlashSale_status_expiresAt_idx" ON public."FlashSale" USING btree (status, "expiresAt");


--
-- Name: MediaContent_slug_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "MediaContent_slug_key" ON public."MediaContent" USING btree (slug);


--
-- Name: MediaContent_tagAI_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "MediaContent_tagAI_idx" ON public."MediaContent" USING btree ("tagAI");


--
-- Name: MediaContent_tagFree_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "MediaContent_tagFree_idx" ON public."MediaContent" USING btree ("tagFree");


--
-- Name: MediaContent_tagGallery_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "MediaContent_tagGallery_idx" ON public."MediaContent" USING btree ("tagGallery");


--
-- Name: MediaContent_tagVIP_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "MediaContent_tagVIP_idx" ON public."MediaContent" USING btree ("tagVIP");


--
-- Name: MediaPurchase_userId_mediaId_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "MediaPurchase_userId_mediaId_key" ON public."MediaPurchase" USING btree ("userId", "mediaId");


--
-- Name: MessageReaction_messageId_userId_emoji_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "MessageReaction_messageId_userId_emoji_key" ON public."MessageReaction" USING btree ("messageId", "userId", emoji);


--
-- Name: Message_aiPersonalityId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "Message_aiPersonalityId_idx" ON public."Message" USING btree ("aiPersonalityId");


--
-- Name: Message_chatterId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "Message_chatterId_idx" ON public."Message" USING btree ("chatterId");


--
-- Name: Message_isAiGenerated_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "Message_isAiGenerated_idx" ON public."Message" USING btree ("isAiGenerated");


--
-- Name: ModelListing_averageRating_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ModelListing_averageRating_idx" ON public."ModelListing" USING btree ("averageRating");


--
-- Name: ModelListing_creatorId_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "ModelListing_creatorId_key" ON public."ModelListing" USING btree ("creatorId");


--
-- Name: ModelListing_isActive_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ModelListing_isActive_idx" ON public."ModelListing" USING btree ("isActive");


--
-- Name: ModelListing_revenueShare_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ModelListing_revenueShare_idx" ON public."ModelListing" USING btree ("revenueShare");


--
-- Name: ObjectionHandling_conversationId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ObjectionHandling_conversationId_idx" ON public."ObjectionHandling" USING btree ("conversationId");


--
-- Name: ObjectionHandling_outcome_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ObjectionHandling_outcome_idx" ON public."ObjectionHandling" USING btree (outcome);


--
-- Name: ObjectionHandling_patternId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ObjectionHandling_patternId_idx" ON public."ObjectionHandling" USING btree ("patternId");


--
-- Name: ObjectionPattern_agencyId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ObjectionPattern_agencyId_idx" ON public."ObjectionPattern" USING btree ("agencyId");


--
-- Name: ObjectionPattern_isActive_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ObjectionPattern_isActive_idx" ON public."ObjectionPattern" USING btree ("isActive");


--
-- Name: ObjectionPattern_language_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ObjectionPattern_language_idx" ON public."ObjectionPattern" USING btree (language);


--
-- Name: PageView_createdAt_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "PageView_createdAt_idx" ON public."PageView" USING btree ("createdAt");


--
-- Name: PageView_path_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "PageView_path_idx" ON public."PageView" USING btree (path);


--
-- Name: PageView_sessionId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "PageView_sessionId_idx" ON public."PageView" USING btree ("sessionId");


--
-- Name: PageView_visitorId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "PageView_visitorId_idx" ON public."PageView" USING btree ("visitorId");


--
-- Name: PaymentDispute_createdAt_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "PaymentDispute_createdAt_idx" ON public."PaymentDispute" USING btree ("createdAt");


--
-- Name: PaymentDispute_status_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "PaymentDispute_status_idx" ON public."PaymentDispute" USING btree (status);


--
-- Name: PaymentDispute_userId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "PaymentDispute_userId_idx" ON public."PaymentDispute" USING btree ("userId");


--
-- Name: PayoutRequest_createdAt_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "PayoutRequest_createdAt_idx" ON public."PayoutRequest" USING btree ("createdAt");


--
-- Name: PayoutRequest_creatorSlug_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "PayoutRequest_creatorSlug_idx" ON public."PayoutRequest" USING btree ("creatorSlug");


--
-- Name: PayoutRequest_status_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "PayoutRequest_status_idx" ON public."PayoutRequest" USING btree (status);


--
-- Name: PersonalitySwitch_conversationId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "PersonalitySwitch_conversationId_idx" ON public."PersonalitySwitch" USING btree ("conversationId");


--
-- Name: PersonalitySwitch_createdAt_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "PersonalitySwitch_createdAt_idx" ON public."PersonalitySwitch" USING btree ("createdAt");


--
-- Name: PersonalitySwitch_reason_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "PersonalitySwitch_reason_idx" ON public."PersonalitySwitch" USING btree (reason);


--
-- Name: PersonalitySwitch_toPersonalityId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "PersonalitySwitch_toPersonalityId_idx" ON public."PersonalitySwitch" USING btree ("toPersonalityId");


--
-- Name: RetargetingCampaign_creatorSlug_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "RetargetingCampaign_creatorSlug_idx" ON public."RetargetingCampaign" USING btree ("creatorSlug");


--
-- Name: RetargetingCampaign_fanUserId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "RetargetingCampaign_fanUserId_idx" ON public."RetargetingCampaign" USING btree ("fanUserId");


--
-- Name: RetargetingCampaign_status_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "RetargetingCampaign_status_idx" ON public."RetargetingCampaign" USING btree (status);


--
-- Name: RetargetingCampaign_triggerType_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "RetargetingCampaign_triggerType_idx" ON public."RetargetingCampaign" USING btree ("triggerType");


--
-- Name: ScriptFolder_agencyId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ScriptFolder_agencyId_idx" ON public."ScriptFolder" USING btree ("agencyId");


--
-- Name: ScriptFolder_parentId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ScriptFolder_parentId_idx" ON public."ScriptFolder" USING btree ("parentId");


--
-- Name: ScriptMedia_mediaId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ScriptMedia_mediaId_idx" ON public."ScriptMedia" USING btree ("mediaId");


--
-- Name: ScriptMedia_scriptId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ScriptMedia_scriptId_idx" ON public."ScriptMedia" USING btree ("scriptId");


--
-- Name: ScriptSequence_agencyId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ScriptSequence_agencyId_idx" ON public."ScriptSequence" USING btree ("agencyId");


--
-- Name: ScriptSequence_category_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ScriptSequence_category_idx" ON public."ScriptSequence" USING btree (category);


--
-- Name: ScriptUsage_chatterId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ScriptUsage_chatterId_idx" ON public."ScriptUsage" USING btree ("chatterId");


--
-- Name: ScriptUsage_conversationId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ScriptUsage_conversationId_idx" ON public."ScriptUsage" USING btree ("conversationId");


--
-- Name: ScriptUsage_resultedInSale_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ScriptUsage_resultedInSale_idx" ON public."ScriptUsage" USING btree ("resultedInSale");


--
-- Name: ScriptUsage_scriptId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ScriptUsage_scriptId_idx" ON public."ScriptUsage" USING btree ("scriptId");


--
-- Name: ScriptUsage_usedAt_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "ScriptUsage_usedAt_idx" ON public."ScriptUsage" USING btree ("usedAt");


--
-- Name: Script_agencyId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "Script_agencyId_idx" ON public."Script" USING btree ("agencyId");


--
-- Name: Script_creatorSlug_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "Script_creatorSlug_idx" ON public."Script" USING btree ("creatorSlug");


--
-- Name: Script_folderId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "Script_folderId_idx" ON public."Script" USING btree ("folderId");


--
-- Name: Script_intent_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "Script_intent_idx" ON public."Script" USING btree (intent);


--
-- Name: Script_sequenceId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "Script_sequenceId_idx" ON public."Script" USING btree ("sequenceId");


--
-- Name: Script_status_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "Script_status_idx" ON public."Script" USING btree (status);


--
-- Name: Script_successScore_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "Script_successScore_idx" ON public."Script" USING btree ("successScore");


--
-- Name: Session_sessionToken_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON public."Session" USING btree ("sessionToken");


--
-- Name: SiteSettings_creatorSlug_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "SiteSettings_creatorSlug_key" ON public."SiteSettings" USING btree ("creatorSlug");


--
-- Name: StatsSnapshot_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "StatsSnapshot_entityType_entityId_idx" ON public."StatsSnapshot" USING btree ("entityType", "entityId");


--
-- Name: StatsSnapshot_snapshotAt_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "StatsSnapshot_snapshotAt_idx" ON public."StatsSnapshot" USING btree ("snapshotAt");


--
-- Name: SubscriptionPlan_name_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "SubscriptionPlan_name_key" ON public."SubscriptionPlan" USING btree (name);


--
-- Name: SubscriptionPlan_slug_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "SubscriptionPlan_slug_key" ON public."SubscriptionPlan" USING btree (slug);


--
-- Name: Subscription_stripeSubscriptionId_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON public."Subscription" USING btree ("stripeSubscriptionId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: VerificationToken_identifier_token_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON public."VerificationToken" USING btree (identifier, token);


--
-- Name: VerificationToken_token_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "VerificationToken_token_key" ON public."VerificationToken" USING btree (token);


--
-- Name: VerifiedReview_isPublished_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "VerifiedReview_isPublished_idx" ON public."VerifiedReview" USING btree ("isPublished");


--
-- Name: VerifiedReview_rating_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "VerifiedReview_rating_idx" ON public."VerifiedReview" USING btree (rating);


--
-- Name: VerifiedReview_reviewerId_targetId_key; Type: INDEX; Schema: public; Owner: viponly
--

CREATE UNIQUE INDEX "VerifiedReview_reviewerId_targetId_key" ON public."VerifiedReview" USING btree ("reviewerId", "targetId");


--
-- Name: VerifiedReview_reviewerType_reviewerId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "VerifiedReview_reviewerType_reviewerId_idx" ON public."VerifiedReview" USING btree ("reviewerType", "reviewerId");


--
-- Name: VerifiedReview_targetType_targetId_idx; Type: INDEX; Schema: public; Owner: viponly
--

CREATE INDEX "VerifiedReview_targetType_targetId_idx" ON public."VerifiedReview" USING btree ("targetType", "targetId");


--
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AgencyAiPersonality AgencyAiPersonality_agencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AgencyAiPersonality"
    ADD CONSTRAINT "AgencyAiPersonality_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES public."Agency"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AgencyApplication AgencyApplication_agencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AgencyApplication"
    ADD CONSTRAINT "AgencyApplication_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES public."Agency"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AgencyApplication AgencyApplication_agencyListingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AgencyApplication"
    ADD CONSTRAINT "AgencyApplication_agencyListingId_fkey" FOREIGN KEY ("agencyListingId") REFERENCES public."AgencyListing"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AgencyApplication AgencyApplication_modelListingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AgencyApplication"
    ADD CONSTRAINT "AgencyApplication_modelListingId_fkey" FOREIGN KEY ("modelListingId") REFERENCES public."ModelListing"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AgencyCreatorPayout AgencyCreatorPayout_agencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AgencyCreatorPayout"
    ADD CONSTRAINT "AgencyCreatorPayout_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES public."Agency"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AgencyEarning AgencyEarning_agencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AgencyEarning"
    ADD CONSTRAINT "AgencyEarning_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES public."Agency"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AgencyEarning AgencyEarning_creatorEarningId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AgencyEarning"
    ADD CONSTRAINT "AgencyEarning_creatorEarningId_fkey" FOREIGN KEY ("creatorEarningId") REFERENCES public."CreatorEarning"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AgencyListing AgencyListing_agencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AgencyListing"
    ADD CONSTRAINT "AgencyListing_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES public."Agency"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AgencyPayoutRequest AgencyPayoutRequest_agencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AgencyPayoutRequest"
    ADD CONSTRAINT "AgencyPayoutRequest_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES public."Agency"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AgencyPublicStats AgencyPublicStats_agencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AgencyPublicStats"
    ADD CONSTRAINT "AgencyPublicStats_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES public."Agency"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Agency Agency_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Agency"
    ADD CONSTRAINT "Agency_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AiPersonalityEarning AiPersonalityEarning_aiPersonalityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AiPersonalityEarning"
    ADD CONSTRAINT "AiPersonalityEarning_aiPersonalityId_fkey" FOREIGN KEY ("aiPersonalityId") REFERENCES public."AgencyAiPersonality"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AiPersonalityEarning AiPersonalityEarning_creatorEarningId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AiPersonalityEarning"
    ADD CONSTRAINT "AiPersonalityEarning_creatorEarningId_fkey" FOREIGN KEY ("creatorEarningId") REFERENCES public."CreatorEarning"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AiSuggestion AiSuggestion_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AiSuggestion"
    ADD CONSTRAINT "AiSuggestion_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AiSuggestion AiSuggestion_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AiSuggestion"
    ADD CONSTRAINT "AiSuggestion_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public."Message"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AiSuggestion AiSuggestion_personalityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AiSuggestion"
    ADD CONSTRAINT "AiSuggestion_personalityId_fkey" FOREIGN KEY ("personalityId") REFERENCES public."AgencyAiPersonality"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AiSuggestion AiSuggestion_sentById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."AiSuggestion"
    ADD CONSTRAINT "AiSuggestion_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES public."Chatter"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ChatterCreatorAssignment ChatterCreatorAssignment_chatterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ChatterCreatorAssignment"
    ADD CONSTRAINT "ChatterCreatorAssignment_chatterId_fkey" FOREIGN KEY ("chatterId") REFERENCES public."Chatter"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChatterEarning ChatterEarning_chatterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ChatterEarning"
    ADD CONSTRAINT "ChatterEarning_chatterId_fkey" FOREIGN KEY ("chatterId") REFERENCES public."Chatter"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChatterEarning ChatterEarning_creatorEarningId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ChatterEarning"
    ADD CONSTRAINT "ChatterEarning_creatorEarningId_fkey" FOREIGN KEY ("creatorEarningId") REFERENCES public."CreatorEarning"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChatterPayoutRequest ChatterPayoutRequest_chatterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ChatterPayoutRequest"
    ADD CONSTRAINT "ChatterPayoutRequest_chatterId_fkey" FOREIGN KEY ("chatterId") REFERENCES public."Chatter"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChatterScriptFavorite ChatterScriptFavorite_chatterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ChatterScriptFavorite"
    ADD CONSTRAINT "ChatterScriptFavorite_chatterId_fkey" FOREIGN KEY ("chatterId") REFERENCES public."Chatter"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChatterScriptFavorite ChatterScriptFavorite_scriptId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ChatterScriptFavorite"
    ADD CONSTRAINT "ChatterScriptFavorite_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES public."Script"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Chatter Chatter_agencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Chatter"
    ADD CONSTRAINT "Chatter_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES public."Agency"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ConversationHandoff ConversationHandoff_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ConversationHandoff"
    ADD CONSTRAINT "ConversationHandoff_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ConversationParticipant ConversationParticipant_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ConversationParticipant"
    ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ConversationParticipant ConversationParticipant_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ConversationParticipant"
    ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ConversationSummary ConversationSummary_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ConversationSummary"
    ADD CONSTRAINT "ConversationSummary_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Conversation Conversation_aiPersonalityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_aiPersonalityId_fkey" FOREIGN KEY ("aiPersonalityId") REFERENCES public."AgencyAiPersonality"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Conversation Conversation_assignedChatterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_assignedChatterId_fkey" FOREIGN KEY ("assignedChatterId") REFERENCES public."Chatter"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CreatorEarning CreatorEarning_creatorSlug_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."CreatorEarning"
    ADD CONSTRAINT "CreatorEarning_creatorSlug_fkey" FOREIGN KEY ("creatorSlug") REFERENCES public."Creator"(slug) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CreatorEarning CreatorEarning_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."CreatorEarning"
    ADD CONSTRAINT "CreatorEarning_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CreatorPublicStats CreatorPublicStats_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."CreatorPublicStats"
    ADD CONSTRAINT "CreatorPublicStats_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."Creator"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Creator Creator_agencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Creator"
    ADD CONSTRAINT "Creator_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES public."Agency"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Creator Creator_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Creator"
    ADD CONSTRAINT "Creator_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CreditTransaction CreditTransaction_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."CreditTransaction"
    ADD CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FlashSale FlashSale_bundleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."FlashSale"
    ADD CONSTRAINT "FlashSale_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES public."Bundle"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: MediaContent MediaContent_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."MediaContent"
    ADD CONSTRAINT "MediaContent_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: MediaPurchase MediaPurchase_mediaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."MediaPurchase"
    ADD CONSTRAINT "MediaPurchase_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES public."MediaContent"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MediaPurchase MediaPurchase_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."MediaPurchase"
    ADD CONSTRAINT "MediaPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MessageMedia MessageMedia_mediaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."MessageMedia"
    ADD CONSTRAINT "MessageMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES public."MediaContent"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: MessageMedia MessageMedia_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."MessageMedia"
    ADD CONSTRAINT "MessageMedia_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public."Message"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MessagePayment MessagePayment_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."MessagePayment"
    ADD CONSTRAINT "MessagePayment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public."Message"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MessagePayment MessagePayment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."MessagePayment"
    ADD CONSTRAINT "MessagePayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MessageReaction MessageReaction_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."MessageReaction"
    ADD CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public."Message"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_aiPersonalityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_aiPersonalityId_fkey" FOREIGN KEY ("aiPersonalityId") REFERENCES public."AgencyAiPersonality"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Message Message_chatterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_chatterId_fkey" FOREIGN KEY ("chatterId") REFERENCES public."Chatter"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Message Message_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_receiverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Message Message_replyToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES public."Message"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Message Message_scriptId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES public."Script"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Message Message_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ModelListing ModelListing_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ModelListing"
    ADD CONSTRAINT "ModelListing_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."Creator"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ObjectionHandling ObjectionHandling_patternId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ObjectionHandling"
    ADD CONSTRAINT "ObjectionHandling_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES public."ObjectionPattern"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PersonalitySwitch PersonalitySwitch_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."PersonalitySwitch"
    ADD CONSTRAINT "PersonalitySwitch_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PersonalitySwitch PersonalitySwitch_fromPersonalityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."PersonalitySwitch"
    ADD CONSTRAINT "PersonalitySwitch_fromPersonalityId_fkey" FOREIGN KEY ("fromPersonalityId") REFERENCES public."AgencyAiPersonality"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PersonalitySwitch PersonalitySwitch_toPersonalityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."PersonalitySwitch"
    ADD CONSTRAINT "PersonalitySwitch_toPersonalityId_fkey" FOREIGN KEY ("toPersonalityId") REFERENCES public."AgencyAiPersonality"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ScriptFolder ScriptFolder_agencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ScriptFolder"
    ADD CONSTRAINT "ScriptFolder_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES public."Agency"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ScriptFolder ScriptFolder_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ScriptFolder"
    ADD CONSTRAINT "ScriptFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."ScriptFolder"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ScriptMedia ScriptMedia_mediaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ScriptMedia"
    ADD CONSTRAINT "ScriptMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES public."MediaContent"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ScriptMedia ScriptMedia_scriptId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ScriptMedia"
    ADD CONSTRAINT "ScriptMedia_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES public."Script"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ScriptSequence ScriptSequence_agencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ScriptSequence"
    ADD CONSTRAINT "ScriptSequence_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES public."Agency"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ScriptUsage ScriptUsage_chatterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ScriptUsage"
    ADD CONSTRAINT "ScriptUsage_chatterId_fkey" FOREIGN KEY ("chatterId") REFERENCES public."Chatter"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ScriptUsage ScriptUsage_scriptId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."ScriptUsage"
    ADD CONSTRAINT "ScriptUsage_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES public."Script"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Script Script_agencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Script"
    ADD CONSTRAINT "Script_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES public."Agency"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Script Script_approvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Script"
    ADD CONSTRAINT "Script_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Script Script_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Script"
    ADD CONSTRAINT "Script_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Script Script_folderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Script"
    ADD CONSTRAINT "Script_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES public."ScriptFolder"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Script Script_sequenceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Script"
    ADD CONSTRAINT "Script_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES public."ScriptSequence"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Subscription Subscription_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES public."SubscriptionPlan"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Subscription Subscription_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: viponly
--

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: viponly
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict In9PhhBSXdtjH6BXjrTlOqHG6blBKxPtFGC3vS6rQ1LIwykrZPYBSbQxAkAdnJy

