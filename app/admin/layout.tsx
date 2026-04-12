"use client";

import { useEffect } from "react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useIsAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/");
    }
  }, [loading, isAdmin, router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin" size={36} style={{ color: "var(--cyan)" }} />
          <p style={{ color: "var(--text-muted)" }}>Ellenőrzés...</p>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
