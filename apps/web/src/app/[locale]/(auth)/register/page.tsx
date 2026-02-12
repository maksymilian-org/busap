'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Mail, Lock, User, Eye, EyeOff, Bus, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Link, useRouter } from '@/i18n/navigation';

interface InvitationData {
  email: string;
  role: string;
  companyRole?: string;
  expiresAt: string;
  invitedBy?: {
    firstName: string;
    lastName: string;
  };
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const t = useTranslations('auth.register');

  const { user, loading: authLoading, register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Invitation state
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loadingInvitation, setLoadingInvitation] = useState(!!token);
  const [invitationError, setInvitationError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Load invitation data if token is present
  useEffect(() => {
    if (token) {
      loadInvitation(token);
    }
  }, [token]);

  const loadInvitation = async (invitationToken: string) => {
    setLoadingInvitation(true);
    setInvitationError('');
    try {
      const data = await api.fetch<InvitationData>(`/admin/invitations/verify?token=${invitationToken}`);
      setInvitation(data);
      setFormData((prev) => ({ ...prev, email: data.email }));
    } catch (err: any) {
      setInvitationError(err.message || t('invitationExpired'));
    } finally {
      setLoadingInvitation(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/passenger');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('passwordsNotMatch'));
      return;
    }

    if (formData.password.length < 8) {
      setError(t('passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      if (token && invitation) {
        // Accept invitation
        await api.fetch('/admin/invitations/accept', {
          method: 'POST',
          body: JSON.stringify({
            token,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
          }),
        });
        toast({
          variant: 'success',
          title: t('successTitle'),
          description: t('successMessageInvitation'),
        });
        router.push('/login');
      } else {
        // Normal registration
        await register(formData.email, formData.password, formData.firstName, formData.lastName);
        toast({
          variant: 'success',
          title: t('successTitle'),
          description: t('successMessage'),
        });
        router.push('/passenger');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('errorTitle');
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loadingInvitation) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Invalid invitation
  if (token && invitationError) {
    return (
      <>
        <div className="mb-8 flex items-center justify-center lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Bus className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-primary">Busap</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-destructive">{t('invitationErrorTitle')}</CardTitle>
            <CardDescription>{invitationError}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              {t('invitationExpired')}
            </p>
            <Link href="/login">
              <Button>{t('goToLogin')}</Button>
            </Link>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <div className="mb-8 flex items-center justify-center lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Bus className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-primary">Busap</span>
        </Link>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {invitation ? t('titleInvitation') : t('title')}
          </CardTitle>
          <CardDescription>
            {invitation ? (
              t('subtitleInvitation', {
                name: `${invitation.invitedBy?.firstName} ${invitation.invitedBy?.lastName}`,
              })
            ) : (
              t('subtitle')
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitation && (
            <div className="mb-4 rounded-lg bg-primary/10 p-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <div className="text-sm">
                <p className="font-medium">{t('invitationFor', { email: invitation.email })}</p>
                {invitation.companyRole && (
                  <p className="text-muted-foreground">{t('invitationRole', { role: invitation.companyRole })}</p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">
                  {t('firstNameLabel')}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="firstName"
                    type="text"
                    placeholder={t('firstNamePlaceholder')}
                    className="w-full rounded-md border bg-background py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium">
                  {t('lastNameLabel')}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="lastName"
                    type="text"
                    placeholder={t('lastNamePlaceholder')}
                    className="w-full rounded-md border bg-background py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                {t('emailLabel')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  className={`w-full rounded-md border bg-background py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary ${
                    invitation ? 'bg-muted cursor-not-allowed' : ''
                  }`}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  disabled={!!invitation}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                {t('passwordLabel')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('passwordPlaceholder')}
                  className="w-full rounded-md border bg-background py-2 pl-10 pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                {t('confirmPasswordLabel')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('passwordPlaceholder')}
                  className="w-full rounded-md border bg-background py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('submitting')}
                </>
              ) : invitation ? (
                t('submitButtonInvitation')
              ) : (
                t('submitButton')
              )}
            </Button>
          </form>

          {!invitation && (
            <>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                {t('termsPrefix')}{' '}
                <Link href="/terms" className="text-primary hover:underline">
                  {t('termsLink')}
                </Link>{' '}
                {t('termsAnd')}{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  {t('privacyLink')}
                </Link>
                .
              </p>

              <div className="mt-6 text-center text-sm">
                {t('hasAccount')}{' '}
                <Link href="/login" className="text-primary hover:underline">
                  {t('loginLink')}
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
