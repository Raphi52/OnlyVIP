import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Identity Verification | VipOnly",
  description: "Verify your identity to publish content on VipOnly",
};

export default function VerificationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
