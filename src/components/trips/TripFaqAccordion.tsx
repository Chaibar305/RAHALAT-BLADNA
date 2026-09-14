"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import { HelpCircle, ChevronDown, Sparkles } from "lucide-react";

interface FaqItem {
  q: string;
  qAr: string;
  a: string;
  aAr: string;
}

const DEFAULT_TRIP_FAQS: FaqItem[] = [
  {
    q: "Comment fonctionne la réservation et le paiement de l'acompte ?",
    qAr: "كيف تتم عملية الحجز وأداء مبلغ التسبيق ؟",
    a: "Vous réservez en ligne en sélectionnant vos dates et options. Il vous suffit de régler l'acompte par carte bancaire CMI sécurisée ou par virement bancaire (CIH / Attijariwafa). Le solde restant est payable le jour du départ auprès du chef de voyage.",
    aAr: "يتم الحجز مباشرة عبر الموقع باختيار موعد الانطلاق وعدد المقاعد. يكفي دفع مبلغ التسبيق عبر البطاقة البنكية CMI أو تحويل بنكي، ويُسدد باقي المبلغ يوم الانطلاق مباشرة لمرافق الرحلة.",
  },
  {
    q: "Quel est le type de transport et est-il agréé ?",
    qAr: "ما هو نوع النقل السياحي المعتمد في الرحلة ؟",
    a: "Nos circuits sont assurés par des autocars et minibus grand tourisme récents, climatisés et strictement conformes à la réglementation TIST (Transport Touristique) du Ministère du Transport, avec chauffeurs expérimentés.",
    aAr: "رحلاتنا تتم بواسطة حافلات وسيارات نقل سياحي حديثة ومكيفة، مرخصة رسمياً وفق معايير TIST وتحت إشراف سائقين محترفين ومعتمدين لضمان سلامتكم وراحتكم.",
  },
  {
    q: "Quelle est votre politique de modification ou d'annulation ?",
    qAr: "ما هي شروط تعديل موعد الرحلة أو الإلغاء ؟",
    a: "Vous pouvez reporter sans frais la date de votre voyage jusqu'à 5 jours avant le départ sous réserve de disponibilité des places. Notre équipe support WhatsApp reste à votre écoute 7j/7 pour vous assister.",
    aAr: "يمكنكم تغيير تاريخ الرحلة مجاناً حتى 5 أيام قبل موعد الانطلاق وفق توفر المقاعد. فريقنا متاح على واتساب طيلة أيام الأسبوع لمساعدتكم والإجابة على استفساراتكم.",
  },
  {
    q: "Quelles affaires et pièces d'identité faut-il prévoir ?",
    qAr: "ما هي الأغراض والوثائق الواجب اصطحابها ؟",
    a: "La pièce d'identité originale (CIN ou passeport) est obligatoire pour la feuille de route officielle. Prévoyez des vêtements souples, des chaussures de marche fermées, un pull pour les soirées fraîches et de la crème solaire.",
    aAr: "البطاقة الوطنية الأصلية (أو جواز السفر) إلزامية قانونياً لإعداد ورقة الطريق الرسمية. ننصح باصطحاب ملابس مريحة، حذاء مشي عملي، سترة دافئة للمساء وواقي شمس.",
  },
  {
    q: "Les hébergements et repas sont-ils compris dans le tarif ?",
    qAr: "هل الإقامة والوجبات مشمولة في السعر الإجمالي ؟",
    a: "Toutes les nuitées indiquées au programme (hôtels, riads traditionnels ou bivouac de luxe) ainsi que les petits-déjeuners et dîners mentionnés dans les services inclus sont compris dans le prix.",
    aAr: "جميع المبيتات المحددة في البرنامج (فنادق، رياضات أصيلة أو مخيمات صحراوية فاخرة) إضافة إلى وجبات الإفطار والعشاء المذكورة مشمولة بالكامل في السعر النهائي.",
  },
];

export function TripFaqAccordion() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleIndex = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-tp-line shadow-tp-sm space-y-6">
      <div className="flex items-center justify-between border-b border-tp-line pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-tp-cyan-hover">
            <HelpCircle className="w-4 h-4 text-cyan-500" />
            <span>{isAr ? "أسئلة وأجوبة شائعة" : "Foire Aux Questions"}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-tp-midnight">
            {isAr ? "كل ما تود معرفته قبل الانطلاق" : "Questions Fréquentes sur ce Voyage"}
          </h3>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {DEFAULT_TRIP_FAQS.map((item, idx) => {
          const isOpen = openIndex === idx;
          const question = isAr ? item.qAr : item.q;
          const answer = isAr ? item.aAr : item.a;

          return (
            <div key={idx} className="py-4 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => toggleIndex(idx)}
                className="w-full flex items-center justify-between gap-4 text-start group cursor-pointer"
                aria-expanded={isOpen}
              >
                <span className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-cyan-600 transition-colors">
                  {question}
                </span>
                <div
                  className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                    isOpen
                      ? "bg-cyan-500 text-white border-cyan-500 rotate-180"
                      : "bg-slate-50 text-slate-600 border-slate-200 group-hover:border-cyan-400 group-hover:text-cyan-600"
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="pt-3 pr-6 rtl:pr-0 rtl:pl-6 text-xs sm:text-sm text-slate-600 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200 font-medium">
                  {answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TripFaqAccordion;
