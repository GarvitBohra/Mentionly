"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const userEmail = email.trim() || "demo@mentionly.ai";
    document.cookie = `mentionly_user_email=${encodeURIComponent(userEmail)}; path=/; max-age=86400`;

    try {
      const supabase = createClient();
      if (supabase && email && password) {
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
      }
    } catch {
      // Graceful fallback for demo
    }

    router.push("/dashboard/brands");
  };

  const handleDemoAccess = () => {
    document.cookie = `mentionly_user_email=demo@mentionly.ai; path=/; max-age=86400`;
    router.push("/dashboard/brands");
  };

  return (
    <div className="min-h-screen bg-[#070a0e] flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/40">
          <Search className="h-4 w-4" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white">Mentionly</span>
      </Link>

      <Card className="w-full max-w-sm border-[#1e242c] bg-[#0c1015]">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-base font-semibold text-white">Create Account</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Start monitoring AI search visibility for your brand
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Full Name</label>
              <Input
                required
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Work Email</label>
              <Input
                required
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Password</label>
              <Input
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" variant="primary" className="w-full text-xs" isLoading={loading}>
              Get Started
            </Button>

            <div className="relative my-2 text-center text-[11px] text-slate-500">
              <span className="bg-[#0c1015] px-2 relative z-10">Or evaluate directly</span>
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#1e242c]" />
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full text-xs gap-1.5 text-slate-300"
              onClick={handleDemoAccess}
            >
              <Sparkles className="h-3 w-3 text-indigo-400" />
              <span>Explore Demo Workspace</span>
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-400 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
