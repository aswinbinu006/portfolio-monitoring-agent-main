import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import FintechFooter from "@/components/FintechFooter";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Portfolio Monitor | Modern Investment Analytics & Risk Management",
  description:
    "Monitor your investments with confidence. Track your portfolio, understand risk, monitor performance, and stay informed with real-time market insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-[#0F172A] dark:text-slate-100 font-sans flex flex-col selection:bg-[#1E3A8A] selection:text-white transition-colors">
        <Navigation />
        <main className="flex-1 w-full">
          {children}
        </main>
        <FintechFooter />
      </body>
    </html>
  );
}
