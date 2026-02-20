'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { Globe, Copy, Check, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PublicPageCardProps {
  slug: string;
  label: string;
  copyLabel: string;
  copiedLabel: string;
}

export function PublicPageCard({ slug, label, copyLabel, copiedLabel }: PublicPageCardProps) {
  const [copied, setCopied] = useState(false);
  const locale = useLocale();
  const publicUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/${locale}/c/${slug}`
      : `/${locale}/c/${slug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Globe className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground truncate">{publicUrl}</p>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="ml-1">{copied ? copiedLabel : copyLabel}</span>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
