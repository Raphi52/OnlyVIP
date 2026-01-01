"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// Redirect to default creator gallery
export default function GalleryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/miacosta/gallery");
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
    </div>
  );
}
