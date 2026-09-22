"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Share2, Check, Copy } from "lucide-react";

interface JobShareButtonsProps {
  jobTitle: string;
  jobLocation: string;
  slug: string;
}

export function JobShareButtons({ jobTitle, jobLocation, slug }: JobShareButtonsProps) {
  const t = useTranslations("recruitment");
  const locale = useLocale();
  const isAr = locale === "ar";

  const [copied, setCopied] = useState(false);

  const getJobUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/${locale}/carrieres/${slug}`;
    }
    return `https://www.rahalatbladna.ma/${locale}/carrieres/${slug}`;
  };

  const handleCopyLink = () => {
    const url = getJobUrl();
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleWhatsAppShare = () => {
    const url = getJobUrl();
    const text = isAr
      ? `فرصة عمل لدى رحلات بلادنا: ${jobTitle} (${jobLocation})\nقدّم الآن: ${url}`
      : `Opportunité chez Rahalat Bladna : ${jobTitle} (${jobLocation})\nDécouvrez l'offre et postulez : ${url}`;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        onClick={handleWhatsAppShare}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-sm"
      >
        <span className="text-base leading-none">💬</span>
        <span>{t("shareWhatsApp")}</span>
      </button>

      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-sm"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-700">{t("linkCopied")}</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>{t("shareOffer")}</span>
          </>
        )}
      </button>
    </div>
  );
}
