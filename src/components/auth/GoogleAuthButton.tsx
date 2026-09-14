"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

interface GoogleAuthButtonProps {
  callbackUrl?: string;
  variant?: "dark" | "light" | "outline";
  onSuccess?: () => void;
  customText?: string;
  className?: string;
}

export function GoogleAuthButton({
  callbackUrl,
  variant = "dark",
  onSuccess,
  customText,
  className = "",
}: GoogleAuthButtonProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [isLoading, setIsLoading] = useState(false);

  const defaultCallback = callbackUrl || `/${locale}`;

  const defaultText = isAr
    ? "المتابعة باستخدام جوجل"
    : locale === "en"
    ? "Continue with Google"
    : "Continuer avec Google";

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      if (onSuccess) onSuccess();
      // Trigger Google OAuth via NextAuth
      await signIn("google", { callbackUrl: defaultCallback });
    } catch (error) {
      console.error("Google sign in error:", error);
      setIsLoading(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "light":
        return "bg-white text-slate-800 border-slate-200 hover:bg-slate-50 hover:border-tp-cyan/50 shadow-sm";
      case "outline":
        return "bg-transparent text-slate-800 dark:text-white border-slate-300 dark:border-slate-700 hover:border-tp-cyan hover:bg-tp-surface-2";
      case "dark":
      default:
        return "bg-slate-900 hover:bg-slate-850 text-white border-slate-800 hover:border-cyan-500/40 shadow-md hover:shadow-cyan-500/10";
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className={`w-full py-3 px-4 rounded-2xl border font-black text-xs sm:text-sm transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed group ${getVariantStyles()} ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-tp-cyan" />
      ) : (
        /* Official Google 4-Color SVG Icon */
        <svg
          className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110"
          viewBox="0 0 24 24"
        >
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
      )}

      <span>{customText || defaultText}</span>
    </button>
  );
}
