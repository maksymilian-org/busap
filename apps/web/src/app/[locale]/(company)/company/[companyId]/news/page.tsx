'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Newspaper,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  publishedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CompanyNewsPage() {
  const t = useTranslations('company.news');
  const params = useParams();
  const companyId = params.companyId as string;

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const fetchNews = async () => {
    try {
      const data = await api.fetch<NewsItem[]>(`/companies/${companyId}/news`);
      setNews(data);
    } catch (err) {
      console.error('Failed to load news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [companyId]);

  const openCreateModal = () => {
    setEditingNews(null);
    setTitle('');
    setContent('');
    setExcerpt('');
    setImageUrl('');
    setShowModal(true);
  };

  const openEditModal = (item: NewsItem) => {
    setEditingNews(item);
    setTitle(item.title);
    setContent(item.content);
    setExcerpt(item.excerpt || '');
    setImageUrl(item.imageUrl || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data: any = { title, content };
      if (excerpt) data.excerpt = excerpt;
      if (imageUrl) data.imageUrl = imageUrl;

      if (editingNews) {
        await api.fetch(`/news/${editingNews.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        toast({ title: t('editModal.success') });
      } else {
        await api.fetch(`/companies/${companyId}/news`, {
          method: 'POST',
          body: JSON.stringify(data),
        });
        toast({ title: t('createModal.success') });
      }

      setShowModal(false);
      fetchNews();
    } catch (err: any) {
      toast({ variant: 'destructive', title: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;

    try {
      await api.fetch(`/news/${id}`, { method: 'DELETE' });
      toast({ title: t('deleted') });
      fetchNews();
    } catch (err: any) {
      toast({ variant: 'destructive', title: err.message });
    }
  };

  const handleTogglePublish = async (item: NewsItem) => {
    try {
      if (item.publishedAt) {
        await api.fetch(`/news/${item.id}/unpublish`, { method: 'POST' });
        toast({ title: t('unpublished_success') });
      } else {
        await api.fetch(`/news/${item.id}/publish`, { method: 'POST' });
        toast({ title: t('published_success') });
      }
      fetchNews();
    } catch (err: any) {
      toast({ variant: 'destructive', title: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addNews')}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : news.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Newspaper className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('noNews')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {news.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{item.title}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.publishedAt
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}
                    >
                      {item.publishedAt ? t('published') : t('draft')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                    {item.excerpt || item.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleTogglePublish(item)}
                      >
                        {item.publishedAt ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{item.publishedAt ? t('unpublish') : t('publish')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('editModal.title')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('confirmDelete')}</TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-card p-6 shadow-xl mx-4">
            <h2 className="text-lg font-semibold mb-4">
              {editingNews ? t('editModal.title') : t('createModal.title')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('createModal.newsTitle')}</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('createModal.content')}</label>
                <textarea
                  required
                  rows={6}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('createModal.excerpt')}</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('createModal.image')}</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    try {
                      const { url } = await api.uploadFile('/storage/upload/news-image', file);
                      setImageUrl(url);
                    } catch (err: any) {
                      toast({ variant: 'destructive', title: err.message });
                    } finally {
                      setUploading(false);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }
                  }}
                />
                <div className="mt-1 flex items-center gap-3">
                  {imageUrl ? (
                    <div className="relative">
                      <img src={imageUrl} alt="" className="h-20 w-32 rounded-lg object-cover border" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white hover:bg-destructive/90"
                        onClick={() => setImageUrl('')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-3.5 w-3.5 mr-1" />
                      {uploading ? t('createModal.uploading') : t('createModal.selectImage')}
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? (editingNews ? t('editModal.submitting') : t('createModal.submitting'))
                    : (editingNews ? t('editModal.submit') : t('createModal.submit'))}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
