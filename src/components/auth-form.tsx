"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    const supabase = createClient();
    if (!supabase) {
      setError("Supabase is not configured. Check your .env file.");
      setLoading(false);
      return;
    }

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) setError(error.message);
      else if (!data.session) setNotice("Check your email to confirm your account, then sign in.");
      else {
        router.push("/dashboard/brands");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else {
        router.push("/dashboard");
        router.refresh();
      }
    }
    setLoading(false);
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
          <CardTitle className="text-base font-semibold text-white">
            {isSignup ? "Create Account" : "Sign In to Mentionly"}
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            {isSignup
              ? "Start monitoring AI search visibility for your brand"
              : "Access your AI search visibility dashboard and reports"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Full Name</label>
                <Input required placeholder="Jane Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
            )}
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
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}
            {notice && <p className="text-xs text-emerald-400">{notice}</p>}

            <Button type="submit" variant="primary" className="w-full text-xs" isLoading={loading}>
              {isSignup ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-400">
            {isSignup ? "Already have an account? " : "Don't have an account? "}
            <Link href={isSignup ? "/login" : "/signup"} className="text-indigo-400 hover:underline">
              {isSignup ? "Sign in" : "Sign up"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
