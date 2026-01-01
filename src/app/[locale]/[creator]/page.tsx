import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Hero,
  ContentShowcase,
  SocialProof,
  ExclusivePreview,
  ChatPreview,
  Pricing
} from "@/components/landing";
import { getCreatorFromDB } from "@/lib/creators";

interface PageProps {
  params: Promise<{ creator: string }>;
}

// Dynamic route - creators are fetched from database
export const dynamic = "force-dynamic";
export const dynamicParams = true;

export default async function CreatorHome({ params }: PageProps) {
  const { creator: creatorSlug } = await params;
  console.log("[CreatorHome] Rendering page for:", creatorSlug);

  const creator = await getCreatorFromDB(creatorSlug);
  console.log("[CreatorHome] Creator result:", creator ? "FOUND" : "NOT FOUND");

  if (!creator) {
    console.log("[CreatorHome] Calling notFound()");
    notFound();
  }

  console.log("[CreatorHome] Rendering with creator:", creator.displayName);
  return (
    <>
      <Navbar creatorSlug={creatorSlug} />
      <main className="bg-black">
        {/* Hero - Full screen with parallax */}
        <Hero creator={creator} />

        {/* Content Showcase - Parallax gallery with blurred previews */}
        <ContentShowcase creatorSlug={creatorSlug} />

        {/* Social Proof - Notifications, stats, trust badges */}
        <SocialProof />

        {/* Exclusive Preview - Large teaser cards */}
        <ExclusivePreview creatorSlug={creatorSlug} />

        {/* Chat Preview - Messaging feature showcase */}
        <ChatPreview creator={creator} />

        {/* Pricing - Subscription plans */}
        <Pricing creatorSlug={creatorSlug} />
      </main>
      <Footer creatorSlug={creatorSlug} creatorName={creator.displayName} />
    </>
  );
}
