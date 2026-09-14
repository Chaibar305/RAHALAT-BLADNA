'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

interface Review {
  id: string;
  author: string;
  avatarText?: string;
  avatarUrl?: string;
  timeAgo: string;
  timeAgoAr?: string;
  rating: number;
  text: string;
  textAr?: string;
}

const REVIEWS_DATA: Review[] = [
  {
    id: '1',
    author: 'Saida Yaccoubi',
    avatarText: 'S',
    timeAgo: 'Il y a 2 semaines',
    timeAgoAr: 'منذ أسبوعين',
    rating: 5,
    text: 'Mon premier voyage au Barrage Asfalou avec Rahalat Bladna était une pure merveille ! Organisation au millimètre, ponctualité exemplaire et une ambiance chaleureuse exceptionnelle. La session kayak était inoubliable.',
    textAr: 'أول رحلة لي لسد أسفالو مع رحلات بلادنا كانت تجربة رائعة لا تُنسى ! تنظيم متقن، التزام دقيق بالمواعيد وأجواء عائلية مميزة. جولة الكاياك في المياه الفيروزية كانت ساحرة.',
  },
  {
    id: '2',
    author: 'Réda Bahbah',
    avatarText: 'R',
    timeAgo: 'Il y a 3 semaines',
    timeAgoAr: 'منذ 3 أسابيع',
    rating: 5,
    text: 'Une vraie bouffée d\'air frais. Entre la nuit sous les étoiles, les criques sauvages et le professionnalisme de l\'encadrement, tout était parfait. On se sent en totale sécurité et entre amis.',
    textAr: 'تجربة سياحية لا تُضاهى. بين ليلة تحت النجوم، استكشاف المعالم الطبيعية واحترافية المؤطرين، كان كل شيء في غاية الروعة. إحساس تام بالأمان وروح الفريق.',
  },
  {
    id: '3',
    author: 'Asmaa Moustaghfir',
    avatarText: 'A',
    timeAgo: 'Il y a 1 mois',
    timeAgoAr: 'منذ شهر',
    rating: 5,
    text: 'Un grand merci à toute l\'équipe pour cette magnifique expérience à Chefchaouen et Akchour. Transport très confortable, guide passionné et repas délicieux. Je recommande les yeux fermés !',
    textAr: 'شكراً جزيلاً لفريق العمل على هذه التجربة الممتعة بشفشاون وأقشور. حافلة نقل مريحة جداً، مرشد سياحي متمكن ووجبات مغربية لذيذة. أوصي بهم بشدة وبدون تردد !',
  },
  {
    id: '4',
    author: 'Fadwa Benayad',
    avatarText: 'F',
    timeAgo: 'Il y a 1 mois',
    timeAgoAr: 'منذ شهر',
    rating: 5,
    text: 'Déjà mon 3ème circuit avec eux. L\'esprit de famille, l\'attention portée à chaque voyageur et la beauté des paysages choisis font toute la différence. Mes enfants ont adoré !',
    textAr: 'هذه رحلتي الثالثة معهم. الروح العائلية، الاهتمام الخاص بكل مسافر وجمال الوجهات المختارة تجعل التجربة استثنائية. أطفالي استمتعوا كثيراً بكل لحظة !',
  },
  {
    id: '5',
    author: 'Youssef El Amrani',
    avatarText: 'Y',
    timeAgo: 'Il y a 2 mois',
    timeAgoAr: 'منذ شهرين',
    rating: 5,
    text: 'Le bivouac dans le désert de Merzouga et le coucher de soleil sur les dunes resteront gravés. Tout le programme a été respecté à la lettre avec des chauffeurs très prudents.',
    textAr: 'المبيت في مخيم مرزوكة الصحراوي الفاخر وغروب الشمس فوق عرق الشبي سيبقى ذكرى محفورة. تم الالتزام بالبرنامج بدقة متناهية وسياقة احترافية وآمنة.',
  }
];

export function TripReviewsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const locale = useLocale();
  const isAr = locale === 'ar';

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const cardWidth = 360;
    const maxScroll = container.scrollWidth - container.clientWidth;

    // Normaliser pour le sens de lecture RTL
    const effectiveDir = isAr ? (direction === 'right' ? 'left' : 'right') : direction;

    if (effectiveDir === 'right') {
      if (container.scrollLeft >= maxScroll - 30) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: cardWidth, behavior: 'smooth' });
      }
    } else {
      if (container.scrollLeft <= 30) {
        container.scrollTo({ left: maxScroll, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: -cardWidth, behavior: 'smooth' });
      }
    }
  };

  // Rotation automatique toutes les 3.5 secondes avec pause au survol et au toucher
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      scroll('right');
    }, 3500);

    return () => clearInterval(interval);
  }, [isPaused, isAr]);

  return (
    <section className="py-12 my-6 border-t border-slate-200/80 dark:border-slate-800/80">
      {/* En-tête centré */}
      <div className="text-center max-w-xl mx-auto mb-8 px-4">
        <span className="text-amber-600 dark:text-amber-400 font-extrabold text-xs tracking-widest uppercase">
          {isAr ? "آراء ومراجعات المسافرين" : "AVIS CLIENTS"}
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
          {isAr ? "تجارب حقيقية لرحالة شاركونا المغامرة" : "Ils parlent de nous"}
        </h2>
        <div className="w-12 h-1 bg-gradient-to-r from-cyan-500 to-amber-500 mx-auto rounded-full mt-2 mb-4" />

        {/* Badge Google Reviews */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-300">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <div className="flex text-amber-400 gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star className="w-3.5 h-3.5 fill-current" key={i}/>
            ))}
          </div>
          <span className="font-bold text-slate-900 dark:text-white">4.9 / 5</span>
          <span className="text-slate-400">· {isAr ? "+85 تقييم معتمد" : "+85 avis vérifiés"}</span>
        </div>
      </div>

      {/* Carrousel interactif avec pause au survol et au toucher */}
      <div 
        className="relative group px-2 sm:px-4"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <button
          type="button"
          onClick={() => scroll('left')}
          className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg text-slate-700 dark:text-slate-200 hover:scale-110 active:scale-95 transition-all cursor-pointer"
          aria-label={isAr ? "التقييم السابق" : "Précédent"}
        >
          <ChevronLeft className="w-5 h-5 rtl:rotate-180"/>
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory py-2 px-2 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollBehavior: 'smooth' }}
          tabIndex={0}
          aria-label="Carrousel des avis clients vérifiés"
        >
          {REVIEWS_DATA.map((review) => (
            <div
              key={review.id}
              className="min-w-[290px] sm:min-w-[340px] max-w-[360px] snap-start bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all rounded-3xl p-5 sm:p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-black text-sm flex items-center justify-center border border-cyan-500/20 shrink-0">
                      {review.avatarText}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {review.author}
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        {isAr && review.timeAgoAr ? review.timeAgoAr : review.timeAgo}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-600">Google</span>
                </div>

                <div className="flex text-amber-400 gap-0.5 mb-2.5">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star className="w-3.5 h-3.5 fill-current" key={i}/>
                  ))}
                </div>

                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                  &ldquo;{isAr && review.textAr ? review.textAr : review.text}&rdquo;
                </p>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scroll('right')}
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg text-slate-700 dark:text-slate-200 hover:scale-110 active:scale-95 transition-all cursor-pointer"
          aria-label={isAr ? "التقييم التالي" : "Suivant"}
        >
          <ChevronRight className="w-5 h-5 rtl:rotate-180"/>
        </button>
      </div>
    </section>
  );
}

export default TripReviewsCarousel;
