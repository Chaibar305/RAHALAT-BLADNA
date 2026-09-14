"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { WhatsAppFloat } from "@/components/shared/WhatsAppFloat";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname ? (pathname.includes("/admin") || pathname.startsWith("/admin")) : false;

  if (isAdmin) {
    return <>{children}</>;
  }




  return (
    <div className="min-h-screen flex flex-col bg-tp-ivory dark:bg-slate-950 text-tp-midnight dark:text-slate-100 transition-colors">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
