import React from 'react';
import { BlogPostForm } from '@/components/admin/blog/BlogPostForm';

export const metadata = {
  title: 'Nouvel Article | Administration Rahalat Bladna',
  description: 'Rédigez un nouvel article pour le blog de Rahalat Bladna.',
};

export default function NewBlogPostPage() {
  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-200 dark:border-white/10">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          Rédiger un Nouvel Article
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Utilisez l’éditeur TipTap pour mettre en page vos textes, titres, nuancier, photos et vidéos.
        </p>
      </div>

      <BlogPostForm />
    </div>
  );
}
