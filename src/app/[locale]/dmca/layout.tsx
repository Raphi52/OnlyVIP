import { Metadata } from "next";

export const metadata: Metadata = {
  title: "DMCA Policy | VipOnly",
  description: "Digital Millennium Copyright Act Notice and Takedown Procedure for VipOnly",
};

export default function DMCALayout({ children }: { children: React.ReactNode }) {
  return children;
}
