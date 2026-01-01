import { redirect } from "next/navigation";
import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { ChatterNav } from "@/components/chatter/ChatterNav";
import { ShiftWarningBanner } from "@/components/chatter/ShiftWarningBanner";

// Prevent chatter pages from being indexed
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ChatterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Verify this is a chatter
  if (!session || (session.user as any).role !== "CHATTER") {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <ChatterNav />
      <div className="pt-16">
        <ShiftWarningBanner />
        <main>{children}</main>
      </div>
    </div>
  );
}
