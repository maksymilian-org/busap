'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Bus, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Link } from '@/i18n/navigation';

export function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const calledRef = useRef(false);
  const t = useTranslations('auth.verifyEmail');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token || calledRef.current) return;
    calledRef.current = true;

    api
      .verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
      })
      .catch((err: unknown) => {
        setStatus('error');
        setMessage(
          err instanceof Error
            ? err.message
            : t('invalidToken'),
        );
      });
  }, [token, t]);

  if (!token) {
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
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <XCircle className="mx-auto h-12 w-12 text-red-500" />
              <p className="text-sm text-muted-foreground">
                {t('invalidToken')}
              </p>
              <Button asChild variant="outline">
                <Link href="/login">{t('goToLogin')}</Link>
              </Button>
            </div>
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
        <CardContent className="pt-6">
          <div className="space-y-4 text-center">
            {status === 'loading' && (
              <>
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  {t('verifying')}
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                <p className="font-medium">{t('successTitle')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('successMessage')}
                </p>
                <Button asChild>
                  <Link href="/login">{t('goToLogin')}</Link>
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="mx-auto h-12 w-12 text-red-500" />
                <p className="font-medium text-red-600 dark:text-red-400">{message}</p>
                <Button asChild variant="outline">
                  <Link href="/login">{t('goToLogin')}</Link>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
