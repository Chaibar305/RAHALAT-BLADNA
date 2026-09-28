import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  Calendar, Eye, User, ArrowLeft, ArrowRight, 
  Sparkles, Compass, Share2, Youtube as YoutubeIcon, 
  ShieldCheck, CheckCircle2 
} from 'lucide-react';
import { getBlogPostBySlugAction } from '@/actions/blog.actions';
import { BlogShareButtons } from '@/components/blog/BlogShareButtons';
import { BlogCard } from '@/components/blog/BlogCard';

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  const res = await getBlogPostBySlugAction(slug, false);
  if (!res.success || !res.post) {
    return { title: 'Article introuvable | Rahalat Bladna' };
  }

  const post = res.post;
  const isAr = locale === 'ar';
  const isEn = locale === 'en';
  const title = (isEn && post.titleEn) ? post.titleEn : (isAr && post.titleAr) ? post.titleAr : post.titleFr;
  const description = (isEn && post.excerptEn) ? post.excerptEn : (isAr && post.excerptAr) ? post.excerptAr : (post.excerptFr || post.titleFr);

  return {
    title: `${title} | Blog Rahalat Bladna`,
    description,
    openGraph: {
      title,
      description,
      images: post.coverImage ? [{ url: post.coverImage }] : [],
      type: 'article',
      publishedTime: post.createdAt.toISOString(),
      authors: [post.authorName],
    },
  };
}

/**
 * Extrait l'ID de la vidéo YouTube à partir d'une URL
 */
function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11
    ? `https://www.youtube-nocookie.com/embed/${match[2]}`
    : null;
}

export default async function BlogPostDetailPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  const isAr = locale === 'ar';
  const isEn = locale === 'en';
  // Récupère l'article et incrémente automatiquement le compteur de lectures
  const res = await getBlogPostBySlugAction(slug, true);

  if (!res.success || !res.post) {
    notFound();
  }

  const post = res.post;
  const relatedPosts = res.relatedPosts || [];

  const displayTitle = (isEn && post.titleEn) ? post.titleEn : (isAr && post.titleAr) ? post.titleAr : post.titleFr;
  const displayContent = (isEn && post.contentEn) ? post.contentEn : (isAr && post.contentAr) ? post.contentAr : post.contentFr;
  const displayExcerpt = (isEn && post.excerptEn) ? post.excerptEn : (isAr && post.excerptAr) ? post.excerptAr : post.excerptFr;

  const dateObj = new Date(post.createdAt);
  const formattedDate = dateObj.toLocaleDateString(isAr ? 'ar-MA' : isEn ? 'en-US' : 'fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const youtubeEmbedUrl = post.youtubeUrl ? getYouTubeEmbedUrl(post.youtubeUrl) : null;
  const currentUrl = `https://www.rahalatbladna.ma/${locale}/blog/${post.slug}`;

  // Calcul temps de lecture approximatif
  const wordsCount = displayContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordsCount / 200));

  return (
    <div className="bg-tp-ivory min-h-screen pb-24" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. FIL D'ARIANE (BREADCRUMB) */}
      <div className="bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-white/10 backdrop-blur-sm sticky top-16 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-xs">
          <nav className="flex items-center gap-2 text-slate-400 font-medium truncate">
            <Link href={`/${locale}`} className="hover:text-cyan-600 transition">
              {isAr ? 'الرئيسية' : isEn ? 'Home' : 'Accueil'}
            </Link>
            <span>/</span>
            <Link href={`/${locale}/blog`} className="hover:text-cyan-600 transition">
              {isAr ? 'المدونة' : 'Blog'}
            </Link>
            <span>/</span>
            <Link
              href={`/${locale}/blog?category=${encodeURIComponent(post.category)}`}
              className="hover:text-cyan-600 transition truncate hidden sm:inline"
            >
              {post.category}
            </Link>
          </nav>

          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-cyan-600 shrink-0 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isAr ? 'العودة للمدونة' : isEn ? 'All articles' : 'Tous les articles'}</span>
          </Link>
        </div>
      </div>

      {/* 2. EN-TÊTE DE L'ARTICLE */}
      <header className="pt-8 sm:pt-12 pb-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Catégorie & Temps de lecture */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/${locale}/blog?category=${encodeURIComponent(post.category)}`}
            className="px-3.5 py-1 rounded-full bg-cyan-500 text-slate-950 font-black text-xs shadow-sm hover:bg-cyan-400 transition"
          >
            {post.category}
          </Link>

          <span className="text-xs font-bold text-slate-400">
            {readingTimeMinutes} {isAr ? 'دقائق قراءة' : isEn ? 'min read' : 'min de lecture'}
          </span>
        </div>

        {/* Titre Principal (H1) */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-[1.2] tracking-tight">
          {displayTitle}
        </h1>

        {/* Chapeau introductif si présent */}
        {displayExcerpt && (
          <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 font-normal leading-relaxed border-s-4 border-cyan-500 ps-4 py-1 italic bg-cyan-500/5 rounded-e-2xl">
            {displayExcerpt}
          </p>
        )}

        {/* Métadonnées & Boutons de Partage */}
        <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                {post.authorName}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <span>{formattedDate}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{post.viewsCount || 0} {isAr ? 'مشاهدة' : isEn ? 'reads' : 'lectures'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Boutons Sociaux */}
          <BlogShareButtons title={displayTitle} url={currentUrl} isAr={isAr} />
        </div>
      </header>

      {/* 3. PHOTO DE COUVERTURE PRINCIPALE */}
      {post.coverImage && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 sm:mb-12">
          <div className="relative aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10">
            <img
              src={post.coverImage}
              alt={displayTitle}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* 4. VIDÉO YOUTUBE MISE EN AVANT (SI PRÉSENTE) */}
      {youtubeEmbedUrl && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-4 sm:p-6 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-rose-600 dark:text-rose-400">
              <YoutubeIcon className="w-4 h-4" />
              <span>{isAr ? 'فيديو الرحلة والاستكشاف' : isEn ? 'Featured Video Report' : 'Reportage Vidéo Associé'}</span>
            </div>

            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-md border border-slate-100 dark:border-white/5 bg-black">
              <iframe
                src={youtubeEmbedUrl}
                title={displayTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. CORPS DE L'ARTICLE FORMATÉ TIPTAP (TYPOGRAPHY) */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-sm">
          <div
            className="prose prose-base sm:prose-lg dark:prose-invert max-w-none 
              prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900 dark:prose-headings:text-white
              prose-h1:text-2xl sm:prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4
              prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:mt-7 prose-h2:mb-3
              prose-h3:text-lg sm:prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-2
              prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-p:my-4
              prose-a:text-cyan-600 dark:prose-a:text-cyan-400 prose-a:font-bold hover:prose-a:underline
              prose-img:rounded-3xl prose-img:shadow-xl prose-img:mx-auto prose-img:my-8
              prose-blockquote:border-s-4 prose-blockquote:border-cyan-500 prose-blockquote:bg-cyan-500/5 prose-blockquote:ps-4 prose-blockquote:py-2 prose-blockquote:rounded-e-2xl prose-blockquote:not-italic prose-blockquote:font-medium
              prose-ul:list-disc prose-ol:list-decimal prose-li:my-1
              prose-hr:border-slate-200 dark:prose-hr:border-white/10"
            dangerouslySetInnerHTML={{ __html: displayContent }}
          />

          {/* SIGNATURE / AUTEUR BOX */}
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center sm:items-start gap-4 bg-slate-50 dark:bg-white/[0.02] p-6 rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xl shrink-0 shadow-md">
              🇲🇦
            </div>
            <div className="space-y-1 text-center sm:text-start">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                {post.authorName}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                {isAr
                  ? 'فريق تحرير رحلات بلادنا يضم مرشدين معتمدين وخبراء في تنظيم الرحلات السياحية بالمغرب، نتقاسم معكم شغف اكتشاف بلادنا بكل حب واحترافية.'
                  : isEn
                  ? 'The Rahalat Bladna editorial team brings together tour leaders and licensed guides. We explore Atlas tracks and Sahara dunes to share our best travel recommendations.'
                  : 'L’équipe de rédaction Rahalat Bladna rassemble nos chefs de voyage et guides agréés. Nous parcourons les pistes de l’Atlas et les sables du Sahara pour vous partager nos meilleures recommandations.'}
              </p>
            </div>
          </div>
        </article>

        {/* 6. BANNIÈRE VOYAGE ASSOCIÉ */}
        <div className="my-12 rounded-3xl bg-gradient-to-r from-tp-midnight via-[#16344F] to-tp-midnight text-white p-8 sm:p-10 shadow-2xl border border-white/10 text-center sm:text-start flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 text-cyan-300 text-xs font-black uppercase tracking-wider">
              <Compass className="w-4 h-4" />
              <span>{isAr ? 'عش التجربة معنا' : isEn ? 'Want to experience this?' : 'Envie de vivre cette expérience ?'}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {isAr ? 'انضم إلى رحلاتنا القادمة بالمغرب' : isEn ? 'Join our next group departures in Morocco' : 'Rejoignez nos prochains départs de groupe'}
            </h3>
            <p className="text-xs sm:text-sm text-white/75">
              {isAr
                ? 'رحلات نهاية الأسبوع وعطلات سياحية منظمة برعاية نقل سياحي مريح TIST ومرشدين ذوي خبرة.'
                : isEn
                ? 'All our tours are 100% guaranteed with certified TIST comfort transport.'
                : 'Tous nos circuits sont 100% garantis avec transport touristique grand confort agréé TIST.'}
            </p>
          </div>

          <Link
            href={`/${locale}/trips`}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-cyan-500/25 transition active:scale-95 shrink-0"
          >
            <span>{isAr ? 'استعراض الرحلات' : isEn ? 'View all trips' : 'Voir les circuits'}</span>
          </Link>
        </div>

        {/* 7. ARTICLES SIMILAIRES */}
        {relatedPosts.length > 0 && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {isAr ? 'مقالات ذات صلة قد تهمك' : isEn ? 'Related articles you might enjoy' : 'À lire également dans la même thématique'}
              </h3>
              <Link
                href={`/${locale}/blog`}
                className="text-xs font-black text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>{isAr ? 'كل المقالات' : isEn ? 'View all' : 'Voir tout'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((related) => (
                <BlogCard
                  key={related.id}
                  slug={related.slug}
                  title={
                    isEn && related.titleEn
                      ? related.titleEn
                      : isAr && related.titleAr
                      ? related.titleAr
                      : related.titleFr
                  }
                  excerpt={
                    isEn && related.excerptEn
                      ? related.excerptEn
                      : isAr && related.excerptAr
                      ? related.excerptAr
                      : related.excerptFr
                  }
                  coverImage={related.coverImage}
                  category={related.category}
                  authorName={related.authorName}
                  createdAt={related.createdAt}
                  viewsCount={related.viewsCount}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
