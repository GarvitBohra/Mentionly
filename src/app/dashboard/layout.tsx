"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const signOut = async () => {
    await createClient()?.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#070a0e] text-slate-100">
      <header className="border-b border-[#1e242c] bg-[#090d12]">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600">
              <Search className="h-3.5 w-3.5" />
            </span>
            Mentionly
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">{children}</main>
    </div>
  );
}
