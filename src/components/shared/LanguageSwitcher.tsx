"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Globe, ChevronDown } from "lucide-react";

export function LanguageSwitcher({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: "fr", label: "FR", fullLabel: "Français", flag: "🇫🇷" },
    { code: "ar", label: "عر", fullLabel: "العربية", flag: "🇲🇦" },
    { code: "en", label: "EN", fullLabel: "English", flag: "🇬🇧" },
  ];

  const currentLang = languages.find((l) => l.code === locale) || languages[0];

  const handleLanguageChange = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    const newPath = segments.join("/");
    router.push(newPath);
    setIsOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-tp-line hover:border-tp-cyan text-xs font-bold text-tp-midnight bg-white/80 backdrop-blur-sm transition-all shadow-tp-sm hover:shadow-md"
        aria-label="Change language"
      >
        <span>{currentLang.flag}</span>
        <span className="uppercase font-extrabold">{currentLang.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-tp-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-36 bg-white rounded-2xl shadow-tp-xl border border-tp-line/80 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full px-3.5 py-2 text-start text-xs font-bold flex items-center justify-between transition-colors ${
                locale === lang.code
                  ? "bg-tp-cyan-tint text-tp-cyan-hover"
                  : "text-tp-midnight hover:bg-tp-cream/60"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span className={lang.code === "ar" ? "font-arabic" : ""}>
                  {lang.fullLabel}
                </span>
              </span>
              {locale === lang.code && (
                <span className="w-1.5 h-1.5 rounded-full bg-tp-cyan" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
