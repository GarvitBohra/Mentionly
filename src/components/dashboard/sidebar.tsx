"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  Eye,
  Users2,
  Compass,
  Link2,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "Overview", href: "/dashboard", icon: BarChart3 },
  { name: "Brands", href: "/dashboard/brands", icon: Building2 },
  { name: "AI Visibility", href: "/dashboard/visibility", icon: Eye },
  { name: "Competitors", href: "/dashboard/competitors", icon: Users2 },
  { name: "Prompt Explorer", href: "/dashboard/prompts", icon: Compass },
  { name: "Sources & Citations", href: "/dashboard/sources", icon: Link2 },
  { name: "GEO Recommendations", href: "/dashboard/recommendations", icon: Sparkles },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar({
  isCollapsed,
  setIsCollapsed,
}: {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-[#1e242c] bg-[#090d12] transition-all duration-300 z-30 shrink-0",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand logo & title */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-[#1e242c]">
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold shrink-0 shadow-md shadow-indigo-900/40">
            <Search className="h-4 w-4" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
                Mentionly
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-indigo-950 text-indigo-400 rounded border border-indigo-800/40">
                  MVP
                </span>
              </span>
              <span className="text-[11px] text-slate-400">AI Search Visibility</span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex h-6 w-6 items-center justify-center rounded-md border border-[#262c36] text-slate-400 hover:text-slate-200 hover:bg-[#151a22]"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20"
                  : "text-slate-400 hover:bg-[#13171e] hover:text-slate-200"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-indigo-400" : "text-slate-400")} />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Grounding engine tag */}
      {!isCollapsed && (
        <div className="p-3 border-t border-[#1e242c] text-[11px] text-slate-500 flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span>Gemini Search Grounding</span>
        </div>
      )}
    </aside>
  );
}

