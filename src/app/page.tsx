import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#070a0e] px-4 text-center">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-900/40">
        <Search className="h-6 w-6" />
      </div>
      <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
        Is your brand showing up in ChatGPT?
      </h1>
      <p className="mt-4 max-w-xl text-slate-400">
        Add your brand and a keyword. Mentionly asks ChatGPT the questions people really search and shows how often you
        and your competitors are mentioned.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/signup">
          <Button size="lg">Get started</Button>
        </Link>
        <Link href="/login">
          <Button size="lg" variant="secondary">
            Sign in
          </Button>
        </Link>
      </div>
    </main>
  );
}
