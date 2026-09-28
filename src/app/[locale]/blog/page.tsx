import React from 'react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { 
  Compass, Search, Sparkles, BookOpen, 
  ArrowRight, Calendar, User, Eye, ShieldCheck, Palmtree
} from 'lucide-react';
import { getBlogPostsAction, type BlogPost } from '@/actions/blog.actions';
import { BlogCard } from '@/components/blog/BlogCard';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const isAr = locale === 'ar';
  const isEn = locale === 'en';

  return {
    title: isAr
      ? 'دليل السفر ومدونة رحلات بلادنا | نصائح وجولات استكشافية بالمغرب'
      : isEn
      ? 'Morocco Travel Blog & Guides | Rahalat Bladna'
      : 'Blog & Récits de Voyages au Maroc | Rahalat Bladna',
    description: isAr
      ? 'اكتشف أفضل النصائح السياحية، وأسرار الطبيعة، ودليل الرحلات الجبلية والصحراوية المنظمة بالمغرب برعاية رحلات بلادنا.'
      : isEn
      ? 'Expert tips for your Moroccan adventure, High Atlas hiking guides, Merzouga desert bivouac advice, and travel diaries.'
      : 'Guides pratiques, conseils pour réussir votre bivouac au Sahara, randonnées dans l’Atlas et récits authentiques de nos circuits organisés au Maroc.',
  };
}

const DEFAULT_CATEGORIES = [
  'Tous les articles',
  'Conseils & Guides',
  'Atlas & Randonnées',
  'Sahara & Bivouac',
  'Culture & Traditions',
  'Spots Secrets & Nature',
];

export default async function BlogIndexPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams?: { category?: string; q?: string };
}) {
  const isAr = locale === 'ar';
  const isEn = locale === 'en';
  const selectedCategory = searchParams?.category || 'all';
  const query = searchParams?.q?.trim() || '';

  const res = await getBlogPostsAction({
    isPublished: true,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    search: query || undefined,
    limit: 50,
  });

  const posts: BlogPost[] = res.success ? (res.posts as BlogPost[]) : [];
  const featuredPost: BlogPost | null = !query && selectedCategory === 'all' && posts.length > 0 ? posts[0] : null;
  const regularPosts: BlogPost[] = featuredPost ? posts.slice(1) : posts;

  return (
    <div className="bg-tp-ivory min-h-screen pb-24" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. HERO BANNER */}
      <section className="bg-tp-midnight text-white py-16 sm:py-20 relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-moroccan-pattern-dark opacity-20 pointer-events-none" />
        
        {/* Glow ambient */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-cyan-300 text-xs font-black uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {isAr
                ? 'مجلة السفر والاستكشاف'
                : isEn
                ? 'Moroccan Travel & Culture Magazine'
                : 'Magazine Évasion & Culture Marocaine'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            {isAr
              ? 'دليل السفر، قصص الرحلات وأسرار المغرب'
              : isEn
              ? 'Travel Guides, Stories & Secrets of Morocco'
              : 'Blog, Récits & Guides de Voyage au Maroc'}
          </h1>

          <p className="text-xs sm:text-base text-white/75 max-w-2xl mx-auto font-normal leading-relaxed">
            {isAr
              ? 'نصائح حصرية، أدلة شاملة للمغامرات الصحراوية والجبلية، وقصص ملهمة من قلب أجمل وجهات المملكة المغربية.'
              : isEn
              ? 'Expert tips for your Moroccan vacation, High Atlas hiking secrets, Merzouga desert bivouac guides, and authentic travel diaries.'
              : 'Des astuces pour réussir votre séjour, les secrets des sentiers de l’Atlas, des guides pratiques pour le bivouac à Merzouga et des carnets d’aventure.'}
          </p>

          {/* Formulaire de Recherche */}
          <div className="pt-4 max-w-md mx-auto">
            <form action={`/${locale}/blog`} method="GET" className="relative flex items-center">
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder={
                  isAr
                    ? 'ابحث في مقالات المدونة...'
                    : isEn
                    ? 'Search guides, tips, destinations...'
                    : 'Rechercher un guide, un conseil, un spot...'
                }
                className="w-full ps-11 pe-24 py-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs sm:text-sm font-semibold border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-xl"
              />
              <Search className="w-4 h-4 text-slate-400 absolute start-4 pointer-events-none" />
              <button
                type="submit"
                className="absolute end-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black text-xs shadow-md transition active:scale-95"
              >
                {isAr ? 'بحث' : isEn ? 'Search' : 'Filtrer'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 2. BARRE DES CATÉGORIES */}
      <section className="sticky top-16 z-30 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <Link
              href={`/${locale}/blog${query ? `?q=${query}` : ''}`}
              className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white dark:bg-cyan-500 dark:text-slate-950 shadow-sm'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              {isAr ? 'جميع المقالات' : isEn ? 'All Articles' : 'Tous les articles'}
            </Link>

            {DEFAULT_CATEGORIES.slice(1).map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <Link
                  key={cat}
                  href={`/${locale}/blog?category=${encodeURIComponent(cat)}${query ? `&q=${query}` : ''}`}
                  className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-cyan-500 dark:text-slate-950 shadow-sm'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  {cat}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. CONTENU PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-12">
        {/* Si aucun article ne correspond */}
        {posts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-16 text-center space-y-4 shadow-sm max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {isAr ? 'لا توجد مقالات مطابقة' : isEn ? 'No articles found' : 'Aucun article trouvé'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isAr
                  ? 'جرّب البحث بكلمات أخرى أو اختر تصنيفاً مختلفاً.'
                  : isEn
                  ? 'Try searching with other terms or choose a different category.'
                  : 'Essayez une autre recherche ou découvrez tous nos autres articles disponibles.'}
              </p>
            </div>
            <Link
              href={`/${locale}/blog`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 text-xs font-black transition active:scale-95"
            >
              <span>{isAr ? 'عرض جميع المقالات' : isEn ? 'Reset search' : 'Réinitialiser la recherche'}</span>
            </Link>
          </div>
        ) : (
          <>
            {/* ARTICLE À LA UNE (FEATURED HERO CARD) */}
            {featuredPost && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {isAr ? 'المقال الأبرز' : isEn ? 'Featured this week' : 'À la Une cette semaine'}
                  </span>
                </div>

                <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 gap-0">
                  <div className="lg:col-span-7 relative aspect-[16/10] lg:aspect-auto overflow-hidden bg-slate-100">
                    {featuredPost.coverImage ? (
                      <img
                        src={featuredPost.coverImage}
                        alt={featuredPost.titleFr}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-5xl">
                        🇲🇦
                      </div>
                    )}
                    <div className="absolute top-4 start-4">
                      <span className="px-3.5 py-1.5 rounded-full bg-cyan-500 text-slate-950 text-xs font-black shadow-md">
                        {featuredPost.category}
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                          <span>
                            {new Date(featuredPost.createdAt).toLocaleDateString(
                              isAr ? 'ar-MA' : isEn ? 'en-US' : 'fr-FR',
                              { day: 'numeric', month: 'long', year: 'numeric' }
                            )}
                          </span>
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>{featuredPost.viewsCount || 0} {isAr ? 'مشاهدة' : isEn ? 'views' : 'vues'}</span>
                        </span>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors leading-tight">
                        <Link href={`/${locale}/blog/${featuredPost.slug}`}>
                          {isEn && featuredPost.titleEn
                            ? featuredPost.titleEn
                            : isAr && featuredPost.titleAr
                            ? featuredPost.titleAr
                            : featuredPost.titleFr}
                        </Link>
                      </h2>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal line-clamp-3">
                        {isEn && featuredPost.excerptEn
                          ? featuredPost.excerptEn
                          : isAr && featuredPost.excerptAr
                          ? featuredPost.excerptAr
                          : featuredPost.excerptFr}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-cyan-500/10 text-cyan-600 flex items-center justify-center font-bold text-xs">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          {featuredPost.authorName}
                        </span>
                      </div>

                      <Link
                        href={`/${locale}/blog/${featuredPost.slug}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-black transition group-hover:bg-cyan-500 group-hover:text-slate-950"
                      >
                        <span>{isAr ? 'قراءة المقال' : isEn ? 'Read article' : 'Lire l’article'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* GRILLE DES ARTICLES RÉCENTS */}
            {regularPosts.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Compass className="w-5 h-5 text-cyan-500" />
                    <span>{isAr ? 'أحدث المقالات المنشورة' : isEn ? 'Latest Guides & Stories' : 'Dernières Publications & Guides'}</span>
                  </h3>
                  <span className="text-xs font-bold text-slate-400">
                    {posts.length} {isAr ? 'مقال متاح' : isEn ? 'articles in total' : 'articles au total'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {regularPosts.map((post: BlogPost) => (
                    <BlogCard
                      key={post.id}
                      slug={post.slug}
                      title={
                        isEn && post.titleEn
                          ? post.titleEn
                          : isAr && post.titleAr
                          ? post.titleAr
                          : post.titleFr
                      }
                      excerpt={
                        isEn && post.excerptEn
                          ? post.excerptEn
                          : isAr && post.excerptAr
                          ? post.excerptAr
                          : post.excerptFr
                      }
                      coverImage={post.coverImage}
                      category={post.category}
                      authorName={post.authorName}
                      createdAt={post.createdAt}
                      viewsCount={post.viewsCount}
                      locale={locale}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* 4. BANNIÈRE INSPIRATION VOYAGE */}
        <section className="rounded-3xl bg-gradient-to-r from-tp-midnight via-[#16344F] to-[#0A263F] text-white p-8 sm:p-12 relative overflow-hidden shadow-2xl border border-white/10">
          <div className="absolute inset-0 bg-moroccan-pattern-dark opacity-20 pointer-events-none" />
          <div className="relative max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black uppercase tracking-wider">
              <Palmtree className="w-3.5 h-3.5" />
              <span>{isAr ? 'عش التجربة على أرض الواقع' : isEn ? 'Ready for the adventure?' : 'Prêt à vivre l’aventure ?'}</span>
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {isAr
                ? 'حوّل قراءاتك إلى رحلات حقيقية لا تُنسى في أرجاء المغرب'
                : isEn
                ? 'Turn Inspiration into Reality: Book Your Next Moroccan Journey'
                : 'Passez de la lecture à la réalité : réservez votre prochain circuit'}
            </h2>

            <p className="text-xs sm:text-sm text-white/80 max-w-xl font-normal leading-relaxed">
              {isAr
                ? 'انضم إلى مجموعاتنا في رحلات نهاية الأسبوع إلى شيفشاون، مرزوكة، وجبال الأطلس مع نقل سياحي معتمد ومرافقين محترفين.'
                : isEn
                ? 'Join our weekend group escapes to Chefchaouen, Merzouga, and the High Atlas with certified transport and licensed guides.'
                : 'Tous nos départs sont 100% garantis avec transport touristique agréé TIST, hébergements vérifiés et accompagnateurs diplômés.'}
            </p>

            <div className="pt-2">
              <Link
                href={`/${locale}/trips`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-cyan-500/25 transition active:scale-95"
              >
                <span>{isAr ? 'استكشف برامج الرحلات' : isEn ? 'Explore our trips in Morocco' : 'Découvrir nos circuits au Maroc'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
