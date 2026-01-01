import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Pricing } from "@/components/landing";

interface PageProps {
  params: Promise<{ creator: string }>;
}

export default async function MembershipPage({ params }: PageProps) {
  const { creator: creatorSlug } = await params;

  return (
    <>
      <Navbar creatorSlug={creatorSlug} />
      <main className="pt-16">
        <Pricing creatorSlug={creatorSlug} />
      </main>
      <Footer creatorSlug={creatorSlug} />
    </>
  );
}
