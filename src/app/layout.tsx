import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mentionly — AI Search Visibility Platform",
  description:
    "Know when AI talks about your brand. Monitor your visibility across AI-generated answers, understand competitors, and discover sources shaping recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="bg-[#070a0e] text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}

