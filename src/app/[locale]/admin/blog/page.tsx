import React from 'react';
import { AdminBlogManager } from '@/components/admin/blog/AdminBlogManager';
import { getBlogPostsAction, getAdminBlogStatsAction } from '@/actions/blog.actions';

export const metadata = {
  title: 'Gestion du Blog & Articles | Administration Rahalat Bladna',
  description: 'Gérez et rédigez les articles, guides et récits touristiques de Rahalat Bladna.',
};

export default async function AdminBlogPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const [postsRes, statsRes] = await Promise.all([
    getBlogPostsAction({ limit: 100 }),
    getAdminBlogStatsAction(),
  ]);

  const initialPosts = postsRes.success ? postsRes.posts : [];
  const stats = statsRes.success
    ? {
        totalPosts: statsRes.totalPosts,
        publishedPosts: statsRes.publishedPosts,
        draftsPosts: statsRes.draftsPosts,
        totalViews: statsRes.totalViews,
      }
    : { totalPosts: 0, publishedPosts: 0, draftsPosts: 0, totalViews: 0 };

  const categories = postsRes.success ? postsRes.categories : [];

  return (
    <div className="space-y-6">
      <AdminBlogManager
        initialPosts={initialPosts}
        stats={stats}
        categories={categories}
      />
    </div>
  );
}
