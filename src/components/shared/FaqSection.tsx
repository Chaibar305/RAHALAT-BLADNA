"use client";

import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Minus, HelpCircle } from "lucide-react";

export function FaqSection() {
  const locale = useLocale();
  const t = useTranslations("home");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q:
        locale === "ar"
          ? "كيف يمكنني حجز رحلتي ودفع التسبيق ؟"
          : "Comment fonctionne la réservation et le paiement de l'acompte ?",
      a:
        locale === "ar"
          ? "يمكنكم الحجز مباشرة عبر موقعنا باختيار تاريخ الانطلاق، عدد الأفراد ونقطة الركوب، ثم تسديد التسبيق (ابتداءً من 300 درهم فقط) عبر البطاقة البنكية CMI أو تحويل بنكي (CIH / Attijariwafa). باقي المبلغ يُسدد يوم الانطلاق."
          : "Vous pouvez réserver en ligne en 2 minutes en sélectionnant vos dates et options. Il vous suffit de régler l'acompte (dès 300 DH par personne) par carte bancaire CMI ou par virement bancaire. Le solde restant est réglé le jour du départ auprès du chef de voyage.",
    },
    {
      q:
        locale === "ar"
          ? "هل توفرون نقلاً سياحياً معتمداً ومريحاً ؟"
          : "Quel est le type de transport utilisé pour les circuits ?",
      a:
        locale === "ar"
          ? "نعم، جميع رحلاتنا تتم بواسطة حافلات وسيارات سياحية حديثة ومكيفة، مرخصة رسمياً وفق معايير TIST من وزارة النقل واللوجستيك مع سائقين محترفين."
          : "Tous nos voyages sont assurés par des autocars et minibus grand tourisme récents, climatisés et strictement conformes à la réglementation TIST du Ministère du Transport, conduits par des chauffeurs professionnels chevronnés.",
    },
    {
      q:
        locale === "ar"
          ? "لماذا يطلب منا رقم بطاقة التعريف الوطنية (CIN) أثناء الحجز ؟"
          : "Pourquoi le numéro de CIN ou Passeport est-il obligatoire ?",
      a:
        locale === "ar"
          ? "طلب رقم البطاقة الوطنية أو جواز السفر إلزامي قانونياً لإعداد ورقة الطريق الرسمية للمسافرين والإدلاء بها لمصالح الدرك الملكي والأمن الوطني حرصاً على سلامتكم التامة."
          : "La saisie du numéro de CIN (ou passeport) est une obligation légale pour l'établissement de la feuille de route officielle et la déclaration des passagers auprès de la Gendarmerie Royale et de la Sûreté Nationale.",
    },
    {
      q:
        locale === "ar"
          ? "هل يمكنني إلغاء أو تغيير موعد الرحلة ؟"
          : "Quelle est votre politique de modification ou d'annulation ?",
      a:
        locale === "ar"
          ? "يمكنكم تغيير تاريخ الرحلة مجاناً حتى 5 أيام قبل موعد الانطلاق حسب توفر المقاعد. في حالة الإلغاء، يرجى مراجعة شروط الخدمة أو التواصل مع فريق الدعم عبر واتساب."
          : "Vous pouvez reporter ou modifier votre réservation sans frais jusqu'à 5 jours avant le départ sous réserve de disponibilité. Notre service client WhatsApp est disponible pour vous accompagner en cas d'imprévu.",
    },
    {
      q:
        locale === "ar"
          ? "ما هي الأغراض التي يجب عليّ جلبها معي في الرحلة ؟"
          : "Que dois-je emporter avec moi dans ma valise ?",
      a:
        locale === "ar"
          ? "ننصح بجلب أمتعة خفيفة وعملية، حذاء مشي مريح، ملابس دافئة لليل (خصوصاً في الصحراء والأطلس)، واقي شمس، وبطاقة التعريف الوطنية الأصلية."
          : "Pour chaque voyage, une checklist détaillée vous est transmise (carte CIN originale, chaussures de marche confortables, vêtements adaptés à la saison, crème solaire et batterie externe).",
    },
  ];

  return (
    <section id="faq" className="py-16 sm:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-tp-terracotta">
            <span className="w-5 h-[2px] bg-tp-terracotta rounded-full" />
            <span className="text-xs font-black uppercase tracking-widest">
              {t("faqKicker")}
            </span>
            <span className="w-5 h-[2px] bg-tp-terracotta rounded-full" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-tp-midnight tracking-tight">
            {t("faqTitle")}
          </h2>
          <p className="text-xs sm:text-sm text-tp-muted max-w-xl mx-auto">
            {t("faqSubtitle")}
          </p>
        </div>

        {/* Accordions */}
        <div className="divide-y divide-tp-line border-y border-tp-line">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="py-4 sm:py-5">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 text-start group"
                  aria-expanded={isOpen}
                >
                  <span className="font-extrabold text-sm sm:text-base text-tp-midnight group-hover:text-tp-cyan-hover transition-colors">
                    {faq.q}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                      isOpen
                        ? "bg-tp-cyan text-white border-tp-cyan"
                        : "bg-tp-surface-2 text-tp-midnight border-tp-line group-hover:border-tp-cyan"
                    }`}
                  >
                    {isOpen ? (
                      <Minus className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="pt-3 pr-8 rtl:pr-0 rtl:pl-8 text-xs sm:text-sm text-tp-slate leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
