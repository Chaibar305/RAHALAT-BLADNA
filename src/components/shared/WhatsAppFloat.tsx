"use client";

import React from "react";
import { Instagram, Facebook } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";

export function WhatsAppFloat() {
  const pathname = usePathname();
  const locale = useLocale();

  // Masquer sur l'espace d'administration
  if (pathname?.includes("/admin")) {
    return null;
  }

  const message =
    locale === "ar"
      ? "السلام عليكم، أرغب في الاستفسار عن رحلات وبرامج رحلات بلادنا."
      : "Bonjour Rahalat Bladna, je souhaite avoir des informations sur vos prochains départs et circuits.";

  const whatsappUrl = `https://wa.me/212681024758?text=${encodeURIComponent(
    message
  )}`;

  return (
    <div className="fixed bottom-6 end-6 z-40 flex flex-col items-end gap-2.5 pb-[env(safe-area-inset-bottom)]">
      {/* Instagram Floating Quick Access */}
      <div className="flex items-center gap-2 group/ig">
        <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md text-white text-[11px] font-bold shadow-lg opacity-0 group-hover/ig:opacity-100 transition-opacity duration-200 pointer-events-none">
          Instagram @rahalat_bladna
        </span>
        <a
          href="https://www.instagram.com/rahalat_bladna/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-white"
          aria-label="Instagram Rahalat Bladna"
          title="Instagram @rahalat_bladna"
        >
          <Instagram className="w-5 h-5" />
        </a>
      </div>

      {/* Facebook Floating Quick Access */}
      <div className="flex items-center gap-2 group/fb">
        <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md text-white text-[11px] font-bold shadow-lg opacity-0 group-hover/fb:opacity-100 transition-opacity duration-200 pointer-events-none">
          Facebook Rahalat Bladna
        </span>
        <a
          href="https://web.facebook.com/profile.php?id=61594099776679"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#1877F2] hover:bg-[#166fe5] text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-white"
          aria-label="Facebook Rahalat Bladna"
          title="Page Facebook Rahalat Bladna"
        >
          <Facebook className="w-5 h-5" />
        </a>
      </div>

      {/* WhatsApp Main Floating Action */}
      <div className="flex items-center gap-2 group/wa">
        <span className="hidden sm:inline-block px-3.5 py-1.5 rounded-full bg-tp-midnight text-white text-xs font-bold shadow-tp-lg opacity-0 group-hover/wa:opacity-100 transition-opacity duration-200 pointer-events-none">
          {locale === "ar" ? "تواصل معنا عبر واتساب 24/7" : "Besoin d'aide ? Écrivez-nous"}
        </span>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-tp-xl transition-transform duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40 border-2 border-white"
          aria-label="Contacter sur WhatsApp"
        >
          {/* Pulsing ring */}
          <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-75 animate-ping pointer-events-none" />

          {/* WhatsApp Icon */}
          <svg
            className="w-7 h-7 fill-current relative z-10"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.9C17.18 3.03 14.69 2 12.04 2ZM12.05 20.15C10.57 20.15 9.12 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.68 12.05 3.68C14.25 3.68 16.31 4.54 17.87 6.1C19.42 7.66 20.28 9.72 20.27 11.92C20.27 16.46 16.58 20.15 12.05 20.15ZM16.57 14.39C16.32 14.27 15.11 13.67 14.88 13.59C14.66 13.51 14.49 13.47 14.33 13.71C14.16 13.96 13.68 14.53 13.53 14.7C13.39 14.87 13.24 14.89 12.99 14.77C12.74 14.65 11.95 14.39 11.01 13.55C10.28 12.89 9.78 12.08 9.64 11.83C9.49 11.58 9.62 11.45 9.75 11.32C9.86 11.21 10 11.05 10.12 10.91C10.24 10.77 10.28 10.67 10.36 10.5C10.44 10.34 10.4 10.2 10.34 10.08C10.28 9.96 9.79 8.75 9.58 8.26C9.38 7.78 9.18 7.84 9.03 7.83C8.89 7.83 8.72 7.83 8.56 7.83C8.39 7.83 8.12 7.89 7.89 8.14C7.66 8.39 7.01 9 7.01 10.24C7.01 11.48 7.91 12.67 8.04 12.84C8.16 13.01 9.82 15.57 12.35 16.66C12.95 16.92 13.42 17.08 13.79 17.19C14.4 17.39 14.95 17.36 15.39 17.3C15.88 17.23 16.9 16.68 17.11 16.08C17.32 15.48 17.32 14.97 17.26 14.87C17.2 14.76 17.04 14.7 16.79 14.57L16.57 14.39Z" />
          </svg>
        </a>
      </div>
    </div>
  );
}
