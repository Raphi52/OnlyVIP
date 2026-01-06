"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import { MessageNotificationProvider } from "@/components/providers/MessageNotificationProvider";
import { AuthGuard } from "@/components/providers/AuthGuard";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <AuthGuard>
        <CurrencyProvider>
          <MessageNotificationProvider>
            {children}
          </MessageNotificationProvider>
        </CurrencyProvider>
      </AuthGuard>
    </SessionProvider>
  );
}
