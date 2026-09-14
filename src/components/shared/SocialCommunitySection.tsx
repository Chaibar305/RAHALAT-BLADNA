"use client";

import React from "react";
import { useLocale } from "next-intl";
import { 
  Instagram, Facebook, Sparkles, ArrowUpRight, 
  Heart, Camera, Users, CheckCircle2, MessageCircle 
} from "lucide-react";

export function SocialCommunitySection() {
  const locale = useLocale();
  const isAr = locale === "ar";

  const instagramUrl = "https://www.instagram.com/rahalat_bladna/";
  const facebookUrl = "https://web.facebook.com/profile.php?id=61594099776679";

  const travelStories = [
    {
      id: 1,
      title: isAr ? "غروب الشمس بكثبان مرزوكة" : "Coucher de soleil sur l'Erg Chebbi",
      location: "Merzouga, Sahara",
      image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80",
      channel: "instagram",
      likes: "2.4k",
    },
    {
      id: 2,
      title: isAr ? "تجديف الكاياك بسد أسفالو" : "Session Kayak au Barrage Asfalou",
      location: "Taher Souk, Marnissa",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
      channel: "instagram",
      likes: "1.8k",
    },
    {
      id: 3,
      title: isAr ? "شلالات أقشور والمدينة الزرقاء" : "Cascades d'Akchour & Ville Bleue",
      location: "Chefchaouen, Rif",
      image: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=600&q=80",
      channel: "facebook",
      likes: "3.1k",
    },
    {
      id: 4,
      title: isAr ? "سهرة الطرب والمخيم الفاخر" : "Veillée conviviale & Bivouac sous les étoiles",
      location: "Gorges du Todra & Tinghir",
      image: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=600&q=80",
      channel: "facebook",
      likes: "2.7k",
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden border-y border-slate-200/80">
      {/* Background Decorative Circles */}
      <div className="absolute top-10 left-1/4 w-72 h-72 bg-gradient-to-tr from-[#f09433]/10 via-[#dc2743]/10 to-[#bc1888]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-[#1877F2]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-widest shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#E4405F]" />
            <span>{isAr ? "المجتمع الرسمي • تابعوا رحلاتنا" : "Communauté Officielle • Réseaux Sociaux"}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            {isAr ? (
              <>
                عِش المغامرة مباشرة على{" "}
                <span className="bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] bg-clip-text text-transparent">
                  إنستغرام
                </span>{" "}
                و{" "}
                <span className="text-[#1877F2]">
                  فيسبوك
                </span>
              </>
            ) : (
              <>
                Vivez l&apos;Aventure en Direct sur{" "}
                <span className="bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] bg-clip-text text-transparent">
                  Instagram
                </span>{" "}
                &{" "}
                <span className="text-[#1877F2]">
                  Facebook
                </span>
              </>
            )}
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {isAr
              ? "انضموا إلى آلاف المسافرين الشغوفين. اكتشفوا يوميات الرحلات، كواليس المخيمات الصحراوية وتجارب المسافرين بالصوت والصورة كل أسبوع."
              : "Rejoignez notre communauté de voyageurs passionnés. Découvrez les stories en direct de chaque week-end, les coulisses de nos bivouacs et les avis exclusifs."}
          </p>
        </div>

        {/* Two Main Brand Cards (Instagram & Facebook) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* 1. Instagram Main Card */}
          <div className="rounded-3xl p-6 sm:p-8 bg-white border border-slate-200 shadow-xl shadow-slate-100 flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-[#dc2743]/50 transition-all duration-300">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#f09433]/15 via-[#dc2743]/10 to-transparent rounded-bl-full pointer-events-none" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shadow-md">
                    <Instagram className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-lg font-black text-slate-900">rahalat_bladna</h3>
                      <span className="w-4 h-4 rounded-full bg-cyan-500 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-bold">Rahalat Bladna • رحلات بلادنا</p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-[#dc2743]/10 text-[#dc2743] text-xs font-bold border border-[#dc2743]/20">
                  Stories & Reels
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {isAr
                  ? "صور وفيديوهات حصرية لكل انطلاقة، نصائح السفر في المغرب، ومسابقات دورية للفوز برحلات وتخفيضات خاصة بالمتابعين."
                  : "Stories quotidiennes, vidéos réels des départs chaque vendredi, coulisses des campements et jeux concours réguliers réservés à nos abonnés."}
              </p>

              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="font-black text-slate-900 text-base">100+</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">{isAr ? "رحلة موثقة" : "Circuits"}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="font-black text-slate-900 text-base">4.9/5</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">{isAr ? "تقييم" : "Avis Clients"}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="font-black text-slate-900 text-base">24/7</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">{isAr ? "مباشر" : "En Direct"}</p>
                </div>
              </div>
            </div>

            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#dc2743]/25 transition-all duration-200 active:scale-95 group/btn"
            >
              <Instagram className="w-4 h-4" />
              <span>{isAr ? "متابعتنا على إنستغرام (@rahalat_bladna)" : "Rejoindre sur Instagram (@rahalat_bladna)"}</span>
              <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
            </a>
          </div>

          {/* 2. Facebook Main Card */}
          <div className="rounded-3xl p-6 sm:p-8 bg-white border border-slate-200 shadow-xl shadow-slate-100 flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-[#1877F2]/50 transition-all duration-300">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#1877F2]/15 to-transparent rounded-bl-full pointer-events-none" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#1877F2] text-white flex items-center justify-center shadow-md">
                    <Facebook className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-lg font-black text-slate-900">Rahalat Bladna</h3>
                      <span className="w-4 h-4 rounded-full bg-cyan-500 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-bold">{isAr ? "الصفحة الرسمية المعتمدة" : "Page Officielle • رحلات بلادنا"}</p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-[#1877F2]/10 text-[#1877F2] text-xs font-bold border border-[#1877F2]/20">
                  Page Officielle
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {isAr
                  ? "البرامج التفصيلية لرحلات نهاية الأسبوع، مواعيد الانطلاق الرسمية، ألبومات الصور الكاملة والتواصل عبر الرسائل الفورية."
                  : "Programmes complets, plannings officiels des départs garantis, albums photos HD et assistance personnalisée via Messenger."}
              </p>

              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="font-black text-slate-900 text-base">15k+</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">{isAr ? "متابع" : "Communauté"}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="font-black text-slate-900 text-base">TIST</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">{isAr ? "نقل سياحي" : "Agréé État"}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="font-black text-slate-900 text-base">100%</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">{isAr ? "شفافية" : "Transparence"}</p>
                </div>
              </div>
            </div>

            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#1877F2]/25 transition-all duration-200 active:scale-95 group/btn"
            >
              <Facebook className="w-4 h-4" />
              <span>{isAr ? "زيارة صفحتنا على فيسبوك" : "Rejoindre la Page Facebook"}</span>
              <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* Stories Mini Gallery Preview */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
              {isAr ? "أحدث لقطات مسافرينا هذا الأسبوع :" : "Instantanés récents de nos voyageurs :"}
            </h4>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#dc2743] flex items-center gap-1">
                <Instagram className="w-3.5 h-3.5 text-[#dc2743]" />
                <span>@rahalat_bladna</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {travelStories.map((story) => (
              <a
                key={story.id}
                href={story.channel === "instagram" ? instagramUrl : facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-slate-900 shadow-md transition-transform duration-300 hover:scale-[1.02]"
              >
                <img
                  src={story.image}
                  alt={story.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

                {/* Top Badge */}
                <div className="absolute top-3 start-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black text-white shadow-md ${
                      story.channel === "instagram"
                        ? "bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888]"
                        : "bg-[#1877F2]"
                    }`}
                  >
                    {story.channel === "instagram" ? <Instagram className="w-3 h-3" /> : <Facebook className="w-3 h-3" />}
                    <span>{story.channel === "instagram" ? "Story" : "Post"}</span>
                  </span>
                </div>

                {/* Bottom Content */}
                <div className="absolute bottom-3 start-3 end-3 text-white space-y-1">
                  <p className="text-[10px] text-cyan-300 font-bold">{story.location}</p>
                  <p className="text-xs font-extrabold leading-snug line-clamp-2">{story.title}</p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-300 pt-1">
                    <Heart className="w-3 h-3 text-rose-500 fill-current" />
                    <span>{story.likes} likes</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
