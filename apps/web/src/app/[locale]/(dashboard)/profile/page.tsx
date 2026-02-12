'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { User, Mail, Phone, Save, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const t = useTranslations('dashboard.profile');
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const { url } = await api.uploadFile('/storage/upload/avatar', file);
      await api.fetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ avatarUrl: url }),
      });
      setAvatarUrl(url);
      await refreshUser();
      toast({ variant: 'success', title: t('avatarUpdated') });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('avatarError');
      toast({ variant: 'destructive', title: t('avatarError'), description: errorMessage });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.fetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ firstName, lastName, phone: phone || undefined }),
      });
      toast({ variant: 'success', title: t('profileUpdated') });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('profileError');
      toast({ variant: 'destructive', title: t('profileError'), description: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const initials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile info card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('personalDataTitle')}</CardTitle>
            <CardDescription>{t('personalDataDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('firstNameLabel')}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-lg border bg-background py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Jan"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('lastNameLabel')}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full rounded-lg border bg-background py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Kowalski"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('emailLabel')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full rounded-lg border bg-muted py-3 pl-10 pr-4 text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('emailChangeHint')}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('phoneLabel')}</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border bg-background py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('phonePlaceholder')}
                  />
                </div>
              </div>

              <Button type="submit" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? t('saving') : t('saveButton')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account info card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('accountInfoTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="group relative h-20 w-20 rounded-full overflow-hidden border-2 border-border hover:border-primary transition-colors"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary text-xl font-semibold">
                    {initials || <User className="h-8 w-8" />}
                  </div>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-5 w-5 text-white" />
                  <span className="text-[10px] text-white mt-0.5">{t('changeAvatar')}</span>
                </div>
              </button>
              {uploading && (
                <p className="text-xs text-muted-foreground">{t('uploading')}</p>
              )}
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{t('userId')}</p>
                <p className="text-xs text-muted-foreground font-mono">{user.id}</p>
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium mb-1">{t('registrationDate')}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString('pl-PL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
