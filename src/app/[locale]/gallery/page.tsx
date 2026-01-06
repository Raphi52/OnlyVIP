"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

// Redirect to user's library if logged in, otherwise to creators page
export default function GalleryPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (session?.user) {
      router.replace("/dashboard/library");
    } else {
      router.replace("/creators");
    }
  }, [router, session, status]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
    </div>
  );
}
