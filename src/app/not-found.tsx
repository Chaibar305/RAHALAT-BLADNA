import React from "react";

export default function NotFound() {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl">
          <h1 className="text-6xl font-black text-cyan-400">404</h1>
          <h2 className="text-xl font-black text-white">Page introuvable</h2>
          <p className="text-xs text-slate-400">
            La page que vous recherchez n&apos;existe pas ou a été déplacée.
          </p>
          <div className="pt-2">
            <a
              href="/fr"
              className="inline-block px-5 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition"
            >
              Retour à l&apos;accueil
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
