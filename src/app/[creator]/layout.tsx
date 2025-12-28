import { notFound } from "next/navigation";
import { getCreatorFromDB } from "@/lib/creators";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ creator: string }>;
}

export default async function CreatorLayout({ children, params }: LayoutProps) {
  const { creator: creatorSlug } = await params;
  const creator = await getCreatorFromDB(creatorSlug);

  if (!creator) {
    notFound();
  }

  return <>{children}</>;
}
