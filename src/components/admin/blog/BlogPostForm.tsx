'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { 
  Save, Eye, ArrowLeft, Image as ImageIcon, 
  Youtube as YoutubeIcon, Sparkles, AlertCircle, 
  CheckCircle2, Compass, Layers, User, Globe2, Loader2
} from 'lucide-react';
import { TipTapEditor } from '@/components/blog/TipTapEditor';
import { createBlogPostAction, updateBlogPostAction } from '@/actions/blog.actions';

const BLOG_CATEGORIES = [
  'Conseils & Guides',
  'Atlas & Randonnées',
  'Sahara & Bivouac',
  'Culture & Traditions',
  'Spots Secrets & Nature',
  'Roadtrips & Escapades',
  'Gastronomie Marocaine',
];

const PRESET_COVERS = [
  { label: 'Dunes Merzouga', url: '/images/merzouga/cover-merzouga.jpg' },
  { label: 'Cascades Akchour', url: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1200' },
  { label: 'Montagnes Atlas', url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1200' },
  { label: 'Chefchaouen Bleu', url: 'https://images.unsplash.com/photo-1569383746724-6f1b882b8f46?q=80&w=1200' },
  { label: 'Gorges du Dadès', url: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?q=80&w=1200' },
];

interface BlogPostFormProps {
  initialData?: {
    id?: string;
    titleFr: string;
    titleAr?: string | null;
    titleEn?: string | null;
    slug: string;
    excerptFr?: string | null;
    excerptAr?: string | null;
    excerptEn?: string | null;
    contentFr: string;
    contentAr?: string | null;
    contentEn?: string | null;
    coverImage?: string | null;
    youtubeUrl?: string | null;
    category: string;
    authorName: string;
    isPublished: boolean;
    viewsCount?: number;
  };
  isEdit?: boolean;
}

export function BlogPostForm({ initialData, isEdit = false }: BlogPostFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [titleFr, setTitleFr] = useState(initialData?.titleFr || '');
  const [titleAr, setTitleAr] = useState(initialData?.titleAr || '');
  const [titleEn, setTitleEn] = useState(initialData?.titleEn || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [isManualSlug, setIsManualSlug] = useState(Boolean(initialData?.slug));
  const [category, setCategory] = useState(initialData?.category || 'Conseils & Guides');
  const [authorName, setAuthorName] = useState(initialData?.authorName || 'Équipe Rahalat Bladna');
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || '');
  const [youtubeUrl, setYoutubeUrl] = useState(initialData?.youtubeUrl || '');
  const [excerptFr, setExcerptFr] = useState(initialData?.excerptFr || '');
  const [excerptAr, setExcerptAr] = useState(initialData?.excerptAr || '');
  const [excerptEn, setExcerptEn] = useState(initialData?.excerptEn || '');
  const [contentFr, setContentFr] = useState(initialData?.contentFr || '');
  const [contentAr, setContentAr] = useState(initialData?.contentAr || '');
  const [contentEn, setContentEn] = useState(initialData?.contentEn || '');
  const [isPublished, setIsPublished] = useState(initialData?.isPublished ?? true);

  const [activeTab, setActiveTab] = useState<'FR' | 'EN' | 'AR'>('FR');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Auto-slugifier le titre français si non personnalisé manuellement
  const handleTitleFrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitleFr(val);
    if (!isManualSlug) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9 -]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
      );
    }
  };

  const handleSubmit = async (publishStatus?: boolean) => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!titleFr.trim()) {
      setErrorMessage('Le titre en français est obligatoire.');
      return;
    }
    if (!contentFr.trim() || contentFr === '<p></p>') {
      setErrorMessage('Le contenu de l’article en français est obligatoire.');
      return;
    }

    setLoading(true);

    const targetPublished = publishStatus !== undefined ? publishStatus : isPublished;

    try {
      if (isEdit && initialData?.id) {
        const res = await updateBlogPostAction(initialData.id, {
          titleFr,
          titleAr: titleAr.trim() || undefined,
          titleEn: titleEn.trim() || undefined,
          slug: slug.trim() || undefined,
          category,
          authorName,
          coverImage: coverImage.trim() || undefined,
          youtubeUrl: youtubeUrl.trim() || undefined,
          excerptFr: excerptFr.trim() || undefined,
          excerptAr: excerptAr.trim() || undefined,
          excerptEn: excerptEn.trim() || undefined,
          contentFr,
          contentAr: contentAr.trim() || undefined,
          contentEn: contentEn.trim() || undefined,
          isPublished: targetPublished,
        });

        if (!res.success) {
          setErrorMessage(res.error || 'Erreur lors de la mise à jour.');
          setLoading(false);
          return;
        }

        setSuccessMessage('Article mis à jour avec succès !');
        setTimeout(() => {
          router.push(`/${locale}/admin/blog`);
          router.refresh();
        }, 1200);
      } else {
        const res = await createBlogPostAction({
          titleFr,
          titleAr: titleAr.trim() || undefined,
          titleEn: titleEn.trim() || undefined,
          slug: slug.trim() || undefined,
          category,
          authorName,
          coverImage: coverImage.trim() || undefined,
          youtubeUrl: youtubeUrl.trim() || undefined,
          excerptFr: excerptFr.trim() || undefined,
          excerptAr: excerptAr.trim() || undefined,
          excerptEn: excerptEn.trim() || undefined,
          contentFr,
          contentAr: contentAr.trim() || undefined,
          contentEn: contentEn.trim() || undefined,
          isPublished: targetPublished,
        });

        if (!res.success) {
          setErrorMessage(res.error || 'Erreur lors de la création.');
          setLoading(false);
          return;
        }

        setSuccessMessage('Article créé et enregistré avec succès !');
        setTimeout(() => {
          router.push(`/${locale}/admin/blog`);
          router.refresh();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Une erreur inattendue est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Barre de navigation supérieure */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-xs">
        <Link
          href={`/${locale}/admin/blog`}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la liste des articles</span>
        </Link>

        <div className="flex items-center gap-2.5">
          {isEdit && initialData?.slug && (
            <Link
              href={`/${locale}/blog/${initialData.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-500" />
              <span>Aperçu public</span>
            </Link>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit(false)}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/20 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition disabled:opacity-50"
          >
            Enregistrer en Brouillon
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit(true)}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 text-xs font-black shadow-md shadow-cyan-500/25 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isEdit ? 'Mettre à jour et Publier' : 'Publier l’Article'}</span>
          </button>
        </div>
      </div>

      {/* Messages d'erreur et succès */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-3 text-xs font-bold animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-3 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Formulaire Principal en Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLONNE GAUCHE (2/3) : Titres, Résumé, Éditeur TipTap */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Titre et Slug */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Titre de l’article (Français) *
              </label>
              <input
                type="text"
                required
                placeholder="Ex : Guide Ultime : 5 secrets pour réussir votre bivouac à Merzouga"
                value={titleFr}
                onChange={handleTitleFrChange}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm sm:text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Titre de l’article (Arabe - Optionnel)
              </label>
              <input
                type="text"
                dir="rtl"
                placeholder="مثال: الدليل الشامل: 5 نصائح لرحلة تخييم ساحرة في صحراء مرزوكة"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Titre de l’article (Anglais - Optionnel)
              </label>
              <input
                type="text"
                placeholder="Ex : Ultimate Guide: 5 secrets for a magical desert bivouac in Merzouga"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Slug URL permanent (SEO)
                </label>
                <button
                  type="button"
                  onClick={() => setIsManualSlug(!isManualSlug)}
                  className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
                >
                  {isManualSlug ? 'Mode automatique' : 'Modifier manuellement'}
                </button>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-600 dark:text-slate-300">
                <span className="text-slate-400">/blog/</span>
                <input
                  type="text"
                  value={slug}
                  disabled={!isManualSlug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="flex-1 bg-transparent focus:outline-none font-bold text-slate-900 dark:text-white disabled:opacity-80"
                />
              </div>
            </div>
          </div>

          {/* Onglets de Langue pour le Contenu */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('FR')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                activeTab === 'FR'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <span>Version Française (Principal)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-900/10">Requis</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('EN')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                activeTab === 'EN'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <span>English Version (Anglais)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-900/10">Optionnel</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('AR')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                activeTab === 'AR'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <span>النسخة العربية (Arabe)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-900/10">Optionnel</span>
            </button>
          </div>

          {/* Contenu Français */}
          {activeTab === 'FR' && (
            <div className="space-y-6">
              {/* Résumé / Chapeau */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-5 shadow-xs">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Extrait / Chapeau introductif (FR)
                </label>
                <textarea
                  rows={3}
                  placeholder="Bref résumé accrocheur affiché sur la carte d'aperçu de l'article (2 à 3 phrases)..."
                  value={excerptFr}
                  onChange={(e) => setExcerptFr(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Éditeur WYSIWYG TipTap pour le corps de l'article */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Corps de l’article (Éditeur Rich Text TipTap - Français) *
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Supporte titres H1-H3, nuancier, listes, images & vidéos YouTube
                  </span>
                </div>
                <TipTapEditor
                  content={contentFr}
                  onChange={setContentFr}
                  placeholder="Commencez à rédiger votre récit, guide ou carnet de voyage en français..."
                />
              </div>
            </div>
          )}

          {/* Contenu Anglais */}
          {activeTab === 'EN' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-5 shadow-xs">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Excerpt / Introduction Header (EN)
                </label>
                <textarea
                  rows={3}
                  placeholder="Short, punchy summary displayed on the article preview card (2-3 sentences)..."
                  value={excerptEn}
                  onChange={(e) => setExcerptEn(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Article Body (TipTap Rich Text Editor - English)
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Supports H1-H3 headings, color picker, lists, images & YouTube
                  </span>
                </div>
                <TipTapEditor
                  content={contentEn}
                  onChange={setContentEn}
                  placeholder="Write your travel guide or adventure story in English..."
                />
              </div>
            </div>
          )}

          {/* Contenu Arabe */}
          {activeTab === 'AR' && (
            <div className="space-y-6" dir="rtl">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-5 shadow-xs">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  المقتطف التعريفي (بالعربية)
                </label>
                <textarea
                  rows={3}
                  placeholder="ملخص قصير وجذاب يظهر في بطاقة المقال في الدليل..."
                  value={excerptAr}
                  onChange={(e) => setExcerptAr(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  محتوى المقال (بالعربية)
                </label>
                <TipTapEditor
                  content={contentAr}
                  onChange={setContentAr}
                  placeholder="اكتب تفاصيل المقال هنا باللغة العربية..."
                  isAr={true}
                />
              </div>
            </div>
          )}
        </div>

        {/* COLONNE DROITE (1/3) : Métadonnées, Couverture, Vidéo, Publication */}
        <div className="space-y-6">
          {/* Card Publication */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span>Statut de visibilité</span>
            </h4>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-white">
                  {isPublished ? 'Article Publié' : 'Brouillon privé'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {isPublished
                    ? 'Visible par tous les voyageurs sur /blog'
                    : 'Uniquement visible dans l’administration'}
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500" />
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Catégorie *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {BLOG_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-white dark:bg-slate-900">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Auteur affiché
              </label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full text-xs font-bold bg-transparent focus:outline-none text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Card Photo de Couverture */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-5 shadow-xs space-y-3.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
              <span>Image de Couverture</span>
            </h4>

            <div>
              <input
                type="url"
                placeholder="https://images.unsplash.com/... ou URL image"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Presets rapides d'images pour tests immédiats */}
            <div>
              <span className="block text-[10px] font-bold text-slate-400 mb-1.5">
                Ou choisir une photo type Maroc :
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COVERS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setCoverImage(preset.url)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-cyan-500/10 hover:text-cyan-600 text-[10px] font-bold text-slate-600 dark:text-slate-300 transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aperçu de la couverture */}
            {coverImage ? (
              <div className="relative rounded-2xl overflow-hidden aspect-video border border-slate-200 dark:border-white/10 shadow-inner group">
                <img
                  src={coverImage}
                  alt="Aperçu couverture"
                  className="w-full h-full object-cover"
                  onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                />
                <button
                  type="button"
                  onClick={() => setCoverImage('')}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/70 text-white hover:bg-rose-600 transition"
                  title="Supprimer la photo"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 aspect-video flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 text-center">
                <ImageIcon className="w-6 h-6 opacity-40" />
                <span className="text-[11px] font-medium">Aucune photo de couverture sélectionnée</span>
              </div>
            )}
          </div>

          {/* Card Vidéo YouTube Mise en Avant */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-5 shadow-xs space-y-3.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <YoutubeIcon className="w-3.5 h-3.5 text-rose-500" />
              <span>Vidéo YouTube Mise en Avant</span>
            </h4>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Lien vidéo (ex: reportage, vlog du circuit) :
              </label>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {youtubeUrl && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-bold flex items-center gap-2">
                <YoutubeIcon className="w-4 h-4 shrink-0" />
                <span>La vidéo apparaîtra en haut de la page de l’article.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
