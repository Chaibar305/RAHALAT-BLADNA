"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Logo } from "./Logo";
import { 
  Phone, Mail, MapPin, Heart, 
  Instagram, Facebook, Send, CreditCard, Sparkles 
} from "lucide-react";

export function Footer() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const homeT = useTranslations("home");
  const locale = useLocale();

  // Masquer complètement le footer public sur l'espace d'administration
  if (pathname?.includes("/admin")) {
    return null;
  }

  return (
    <footer className="relative bg-tp-midnight text-white overflow-hidden pt-16 pb-12 border-t border-white/10">
      {/* Subtle radial glow background */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-tp-cyan/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-tp-terracotta/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Top Section : Brand, Newsletter, Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-12 border-b border-white/10">
          <div className="lg:col-span-5 space-y-4">
            <Logo variant="light" size="lg" />
            <p className="text-sm text-tp-ivory/75 max-w-md leading-relaxed">
              {locale === "ar"
                ? "وكالة الأسفار المغربية الرائدة في تنظيم الرحلات السياحية، استكشاف الصحراء والمشي الجبلي مع ضمان معايير الأمان والراحة التامة."
                : "Plateforme marocaine officielle spécialisée dans l'organisation de circuits touristiques, bivouacs au désert, randonnées Atlas et week-ends d'évasion au Maroc."}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-pill bg-white/10 text-xs font-bold text-amber-300">
                ★ 4.9/5 Google
              </span>
            </div>

            {/* Social Media Access Buttons */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-tp-ivory/70 block uppercase tracking-wider">
                {locale === "ar" ? "تابعوا رحلاتنا على وسائل التواصل :" : "Suivez nos aventures en direct :"}
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href="https://www.instagram.com/rahalat_bladna/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] text-white text-xs font-black shadow-md hover:shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
                  title="Instagram @rahalat_bladna"
                >
                  <Instagram className="w-4 h-4" />
                  <span>@rahalat_bladna</span>
                </a>
                <a
                  href="https://web.facebook.com/profile.php?id=61594099776679"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-black shadow-md hover:shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
                  title="Page Facebook Rahalat Bladna"
                >
                  <Facebook className="w-4 h-4" />
                  <span>Facebook</span>
                </a>
              </div>
            </div>
          </div>

          {/* Newsletter Box */}
          <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-tp-cyan text-xs font-extrabold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                {homeT("newsletterTitle")}
              </div>
              <p className="text-xs text-tp-ivory/70">
                {homeT("newsletterSubtitle")}
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert(locale === "ar" ? "شكراً لاشتراككم في قائمتنا البريدية!" : "Merci pour votre inscription !");
              }}
              className="flex flex-col sm:flex-row gap-2.5"
            >
              <input
                type="email"
                required
                placeholder={homeT("newsletterPlaceholder")}
                className="flex-1 bg-white/10 border border-white/20 rounded-control px-4 py-3 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-tp-cyan transition"
              />
              <button
                type="submit"
                className="bg-tp-cyan hover:bg-tp-cyan-hover text-white px-6 py-3 rounded-control text-xs font-black shadow-tp-cyan transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>{homeT("newsletterBtn")}</span>
                <Send className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            </form>
          </div>
        </div>

        {/* Middle Section: Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs text-tp-ivory/75">
          {/* Col 1 : Destinations */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">
              {locale === "ar" ? "وجهات مميزة" : "Destinations Phares"}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}/trips`} className="hover:text-tp-cyan-soft transition">
                  Merzouga & Erg Chebbi
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/trips`} className="hover:text-tp-cyan-soft transition">
                  Chefchaouen & Akchour
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/trips`} className="hover:text-tp-cyan-soft transition">
                  Dakhla & Dune Blanche
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/trips`} className="hover:text-tp-cyan-soft transition">
                  Toubkal & Haut Atlas
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/trips`} className="hover:text-tp-cyan-soft transition">
                  Gorges du Todra & Tinghir
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2 : Programmes */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">
              {locale === "ar" ? "أنواع الرحلات" : "Nos Offres"}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}#weekends`} className="hover:text-tp-cyan-soft transition">
                  {t("weekendTrips")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/trips`} className="hover:text-tp-cyan-soft transition">
                  {t("trips")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}#sur-mesure`} className="hover:text-tp-cyan-soft transition">
                  {t("tailorMade")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}#b2b`} className="hover:text-tp-cyan-soft transition">
                  {t("b2b")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}#avis`} className="hover:text-tp-cyan-soft transition">
                  {t("reviews")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/carrieres`} className="hover:text-tp-cyan transition font-bold text-tp-cyan flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  <span>{locale === "ar" ? "انضم لفريقنا (توظيف)" : "Carrières & Recrutement"}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 : Légal & Confiance */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">
              {locale === "ar" ? "الثقة والأمان" : "Sécurité & Légal"}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}#faq`} className="hover:text-tp-cyan-soft transition">
                  {homeT("faqTitle")}
                </Link>
              </li>
              <li>
                <span className="block text-tp-ivory/60">Paiement Sécurisé CMI / Virement</span>
              </li>
              <li>
                <span className="block text-tp-ivory/60">Conditions Générales de Vente</span>
              </li>
            </ul>
          </div>

          {/* Col 4 : Contact Direct */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">
              {locale === "ar" ? "تواصل معنا" : "Contact & Agence"}
            </h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-tp-cyan shrink-0" />
                <a href="tel:+212681024758" className="hover:text-white transition font-mono">
                  +212 681-024758
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-tp-cyan shrink-0" />
                <a href="mailto:machaibare@gmail.com" className="hover:text-white transition font-mono">
                  machaibare@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-tp-cyan shrink-0 mt-0.5" />
                <span>Casablanca & Rabat, Maroc</span>
              </li>
              <li className="pt-2 border-t border-white/10 flex items-center gap-2">
                <a
                  href="https://www.instagram.com/rahalat_bladna/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-gradient-to-tr hover:from-[#f09433] hover:to-[#bc1888] flex items-center justify-center text-white transition hover:scale-110 shadow-xs"
                  title="Instagram @rahalat_bladna"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://web.facebook.com/profile.php?id=61594099776679"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#1877F2] flex items-center justify-center text-white transition hover:scale-110 shadow-xs"
                  title="Page Facebook Rahalat Bladna"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <span className="text-[11px] text-tp-ivory/60 font-mono">@rahalat_bladna</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section : Payment Badges & Copyright */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-tp-ivory/60">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-bold text-white/80">
              {locale === "ar" ? "وسائل الأداء المعتمدة :" : "Paiements sécurisés :"}
            </span>
            <span className="px-2.5 py-1 rounded bg-white/10 text-white font-extrabold text-[10px] tracking-wider">
              CMI
            </span>
            <span className="px-2.5 py-1 rounded bg-white/10 text-white font-extrabold text-[10px] tracking-wider">
              VISA
            </span>
            <span className="px-2.5 py-1 rounded bg-white/10 text-white font-extrabold text-[10px] tracking-wider">
              MASTERCARD
            </span>
            <span className="px-2.5 py-1 rounded bg-white/10 text-white font-extrabold text-[10px] tracking-wider">
              CASH PLUS
            </span>
            <span className="px-2.5 py-1 rounded bg-white/10 text-white font-extrabold text-[10px] tracking-wider">
              VIREMENT CIH / ATTIJARI
            </span>
          </div>

          <div className="text-center md:text-end">
            <p>
              © {new Date().getFullYear()} <strong className="text-white font-bold">Rahalat Bladna (رحلات بلادنا)</strong>. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
