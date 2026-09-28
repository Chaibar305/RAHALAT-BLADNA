import React from 'react';
import Link from 'next/link';
import { Calendar, Clock, Eye, ArrowRight, User } from 'lucide-react';

export interface BlogCardProps {
  slug: string;
  title: string;
  excerpt?: string | null;
  coverImage?: string | null;
  category: string;
  authorName: string;
  createdAt: Date | string;
  viewsCount?: number;
  locale: string;
}

export function BlogCard({
  slug,
  title,
  excerpt,
  coverImage,
  category,
  authorName,
  createdAt,
  viewsCount = 0,
  locale,
}: BlogCardProps) {
  const isAr = locale === 'ar';
  const isEn = locale === 'en';

  const dateObj = new Date(createdAt);
  const formattedDate = dateObj.toLocaleDateString(isAr ? 'ar-MA' : isEn ? 'en-US' : 'fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <article className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* 1. Miniature de Couverture */}
      <Link href={`/${locale}/blog/${slug}`} className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-900 to-slate-800 text-slate-500">
            <span className="text-3xl">🇲🇦</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badge Catégorie */}
        <div className="absolute top-3.5 start-3.5">
          <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-black border border-white/20 shadow-md">
            {category}
          </span>
        </div>
      </Link>

      {/* 2. Corps de la Carte */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          {/* Méta : Date & Vues */}
          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-500" />
              <span>{formattedDate}</span>
            </span>

            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />

            <span className="inline-flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>{viewsCount} {isAr ? 'مشاهدة' : isEn ? 'views' : 'vues'}</span>
            </span>
          </div>

          {/* Titre */}
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug">
            <Link href={`/${locale}/blog/${slug}`}>{title}</Link>
          </h3>

          {/* Extrait */}
          {excerpt && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed font-normal">
              {excerpt}
            </p>
          )}
        </div>

        {/* Pied de Carte : Auteur & Lien Lire */}
        <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold truncate">
            <div className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="truncate text-[11px]">{authorName}</span>
          </div>

          <Link
            href={`/${locale}/blog/${slug}`}
            className="inline-flex items-center gap-1 text-xs font-black text-cyan-600 dark:text-cyan-400 group-hover:gap-2 transition-all shrink-0"
          >
            <span>{isAr ? 'اقرأ المزيد' : isEn ? 'Read article' : 'Lire l’article'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
