"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Play,
  Building2,
  ChevronDown,
  User,
  LogOut,
  ExternalLink,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/types";

export function DashboardHeader({
  onMobileMenuToggle,
}: {
  onMobileMenuToggle?: () => void;
}) {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/brands")
      .then((res) => res.json())
      .then((data) => {
        if (data.brands && data.brands.length > 0) {
          setBrands(data.brands);
          setSelectedBrand(data.brands[0]);
        }
      })
      .catch((err) => console.error("Error loading brands in header:", err));
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-[#1e242c] bg-[#090d12]/90 backdrop-blur-md px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-[#262c36] text-slate-300"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        {/* Brand Selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg border border-[#242b35] bg-[#12161f] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-600 transition-colors"
          >
            <Building2 className="h-3.5 w-3.5 text-indigo-400" />
            <span className="max-w-[130px] sm:max-w-[180px] truncate">
              {selectedBrand ? selectedBrand.name : "Loading Brand..."}
            </span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-56 rounded-xl border border-[#262c36] bg-[#0e1218] p-1.5 shadow-xl shadow-black/60 z-50">
              <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Monitored Brands
              </div>
              {brands.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setSelectedBrand(b);
                    setDropdownOpen(false);
                    router.push(`/dashboard?brand_id=${b.id}`);
                  }}
                  className={`w-full text-left flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                    selectedBrand?.id === b.id
                      ? "bg-indigo-600/20 text-indigo-300 font-medium"
                      : "text-slate-300 hover:bg-[#161c24]"
                  }`}
                >
                  <span className="truncate">{b.name}</span>
                  {selectedBrand?.id === b.id && (
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  )}
                </button>
              ))}
              <div className="my-1 border-t border-[#1e242c]" />
              <Link
                href="/dashboard/brands"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-indigo-400 hover:bg-indigo-950/40"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add New Brand</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Launch Run */}
        <Link href="/dashboard/visibility">
          <Button size="sm" variant="primary" className="gap-1.5 text-xs">
            <Play className="h-3 w-3 fill-current" />
            <span className="hidden sm:inline">Run Visibility Check</span>
            <span className="sm:hidden">Run</span>
          </Button>
        </Link>

        {/* User Account / Exit to Landing */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-200 text-xs font-semibold hover:border-slate-500 transition-colors"
          >
            M
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-48 rounded-xl border border-[#262c36] bg-[#0e1218] p-1.5 shadow-xl shadow-black/60 z-50">
              <div className="px-2.5 py-1.5 border-b border-[#1e242c]">
                <p className="text-xs font-medium text-slate-200">Workspace User</p>
                <p className="text-[11px] text-slate-400 truncate">demo@mentionly.ai</p>
              </div>
              <Link
                href="/dashboard/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-[#161c24] mt-1"
              >
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span>Account & API Keys</span>
              </Link>
              <Link
                href="/"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-[#161c24]"
              >
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                <span>View Landing Page</span>
              </Link>
              <div className="my-1 border-t border-[#1e242c]" />
              <Link
                href="/login"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-950/20"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

