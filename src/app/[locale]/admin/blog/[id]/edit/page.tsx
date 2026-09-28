import React from 'react';
import { notFound } from 'next/navigation';
import { BlogPostForm } from '@/components/admin/blog/BlogPostForm';
import { getBlogPostByIdAction } from '@/actions/blog.actions';

export const metadata = {
  title: 'Modifier l’Article | Administration Rahalat Bladna',
  description: 'Éditez le contenu et les paramètres de votre article de blog.',
};

export default async function EditBlogPostPage({
  params: { id },
}: {
  params: { id: string; locale: string };
}) {
  const res = await getBlogPostByIdAction(id);

  if (!res.success || !res.post) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-200 dark:border-white/10">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          Modifier l’Article
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Modifiez le texte, la mise en page, les médias ou la visibilité de l’article.
        </p>
      </div>

      <BlogPostForm initialData={res.post} isEdit={true} />
    </div>
  );
}
