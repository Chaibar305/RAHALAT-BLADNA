'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { 
  FileText, Plus, Search, Eye, Edit3, Trash2, 
  ExternalLink, Sparkles, Filter, CheckCircle2, 
  Clock, AlertCircle, BarChart3, Layers, Compass, Loader2
} from 'lucide-react';
import { togglePublishBlogPostAction, deleteBlogPostAction } from '@/actions/blog.actions';

interface AdminBlogManagerProps {
  initialPosts: any[];
  stats: {
    totalPosts: number;
    publishedPosts: number;
    draftsPosts: number;
    totalViews: number;
  };
  categories: { name: string; count: number }[];
}

export function AdminBlogManager({ initialPosts, stats, categories }: AdminBlogManagerProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [posts, setPosts] = useState(initialPosts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filtrage local en temps réel
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      post.titleFr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.titleAr && post.titleAr.toLowerCase().includes(searchTerm.toLowerCase())) ||
      post.slug.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'published' && post.isPublished) ||
      (statusFilter === 'draft' && !post.isPublished);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleTogglePublish = async (id: string) => {
    startTransition(async () => {
      const res = await togglePublishBlogPostAction(id);
      if (res.success) {
        setPosts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isPublished: res.isPublished } : p))
        );
      }
    });
  };

  const handleDeletePost = async (id: string) => {
    startTransition(async () => {
      const res = await deleteBlogPostAction(id);
      if (res.success) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        setDeleteConfirmId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. EN-TÊTE & BOUTON D'ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-black uppercase tracking-wider mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Gestion Éditoriale</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {isAr ? "إدارة المدونة والمقالات" : "Blog & Articles Touristiques"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Rédigez, mettez en page et publiez vos guides, conseils de voyage et récits au Maroc.
          </p>
        </div>

        <Link
          href={`/${locale}/admin/blog/new`}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/25 transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Créer un Nouvel Article</span>
        </Link>
      </div>

      {/* 2. STATISTIQUES ÉDITORIALES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
            Total Articles
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalPosts}</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <FileText className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-500 block mb-1">
            Articles Publiés
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.publishedPosts}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-500 block mb-1">
            Brouillons
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {stats.draftsPosts}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-500 block mb-1">
            Lectures Totales
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{stats.totalViews}</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600">
              <Eye className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. BARRE DE FILTRES ET RECHERCHE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Recherche textuelle */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par titre, slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-10 pe-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filtres Catégorie & Statut */}
        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.count})
              </option>
            ))}
          </select>

          {/* Boutons Statut */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tous
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('published')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                statusFilter === 'published'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Publiés
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('draft')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                statusFilter === 'draft'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Brouillons
            </button>
          </div>
        </div>
      </div>

      {/* 4. LISTE DES ARTICLES */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Aucun article trouvé</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Modifiez vos critères de recherche ou rédigez votre tout premier article de blog.
            </p>
          </div>
          <Link
            href={`/${locale}/admin/blog/new`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Rédiger un article</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-4 text-start">Article</th>
                  <th className="py-3.5 px-4 text-start">Catégorie</th>
                  <th className="py-3.5 px-4 text-center">Statut</th>
                  <th className="py-3.5 px-4 text-center">Lectures</th>
                  <th className="py-3.5 px-4 text-start">Date</th>
                  <th className="py-3.5 px-4 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition">
                    {/* Article & Miniature */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3.5 max-w-md">
                        {post.coverImage ? (
                          <img
                            src={post.coverImage}
                            alt=""
                            className="w-14 h-12 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-white/10 shadow-xs"
                            onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                          />
                        ) : (
                          <div className="w-14 h-12 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-black text-slate-900 dark:text-white truncate hover:text-cyan-500 transition">
                            {post.titleFr}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-mono truncate block">
                            /{post.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Catégorie */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                        {post.category}
                      </span>
                    </td>

                    {/* Statut Toggle Switch */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(post.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold transition cursor-pointer ${
                          post.isPublished
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                        }`}
                        title="Cliquer pour basculer le statut"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            post.isPublished ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                        <span>{post.isPublished ? 'Publié' : 'Brouillon'}</span>
                      </button>
                    </td>

                    {/* Vues */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className="font-bold text-slate-600 dark:text-slate-300">
                        {post.viewsCount || 0}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                      {new Date(post.createdAt).toLocaleDateString(isAr ? 'ar-MA' : 'fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-end whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Voir sur le site public */}
                        {post.isPublished && (
                          <Link
                            href={`/${locale}/blog/${post.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-cyan-500 transition"
                            title="Voir l'article en ligne"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}

                        {/* Éditer */}
                        <Link
                          href={`/${locale}/admin/blog/${post.id}/edit`}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-800 dark:hover:text-white transition"
                          title="Modifier l'article"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>

                        {/* Supprimer */}
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(post.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition"
                          title="Supprimer définitivement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMATION DE SUPPRESSION */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                Supprimer cet article ?
              </h4>
              <p className="text-xs text-slate-400">
                Cette action est irréversible. L’article et tout son contenu formaté seront définitivement retirés du site.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleDeletePost(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md shadow-rose-600/25 transition active:scale-95"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
