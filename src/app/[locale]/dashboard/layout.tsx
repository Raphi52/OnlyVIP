import { redirect } from "next/navigation";
import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MessagesFAB } from "@/components/dashboard/MessagesFAB";
import { AdminCreatorProvider } from "@/components/providers/AdminCreatorContext";

// Prevent dashboard pages from being indexed
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/auth/login?callbackUrl=/dashboard");
  }

  return (
    <AdminCreatorProvider>
      <div className="flex min-h-screen bg-[var(--background)] max-w-[100vw] overflow-x-hidden">
        <Sidebar />
        <main className="flex-1 lg:pl-0 min-w-0 overflow-x-hidden">
          {children}
        </main>
        <MessagesFAB />
      </div>
    </AdminCreatorProvider>
  );
}
