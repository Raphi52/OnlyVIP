import { redirect } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // All /admin routes redirect to /dashboard
  redirect("/dashboard");
}
