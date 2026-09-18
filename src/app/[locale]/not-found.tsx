import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl">
        <h1 className="text-6xl font-black text-cyan-600 dark:text-tp-cyan">404</h1>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Page introuvable</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-xs transition shadow-md"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
