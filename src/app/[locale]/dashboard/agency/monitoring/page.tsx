"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// Redirect to chatters page with monitoring tab
export default function MonitoringRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/agency/chatters?tab=monitoring");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
    </div>
  );
}
