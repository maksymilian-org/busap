import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  Bus,
  MapPin,
  Clock,
  Users,
  Shield,
  Smartphone,
  BarChart3,
  Globe,
  Zap,
  Check,
  ArrowRight,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('home');
  const tCommon = await getTranslations('common');

  const features = [
    {
      icon: MapPin,
      title: t('features.gpsTracking.title'),
      description: t('features.gpsTracking.description'),
    },
    {
      icon: Clock,
      title: t('features.eta.title'),
      description: t('features.eta.description'),
    },
    {
      icon: Users,
      title: t('features.driverPanel.title'),
      description: t('features.driverPanel.description'),
    },
    {
      icon: Shield,
      title: t('features.security.title'),
      description: t('features.security.description'),
    },
    {
      icon: Smartphone,
      title: t('features.offline.title'),
      description: t('features.offline.description'),
    },
    {
      icon: BarChart3,
      title: t('features.reports.title'),
      description: t('features.reports.description'),
    },
  ];

  const pricingPlans = [
    {
      name: t('pricing.starter.name'),
      price: t('pricing.starter.price'),
      description: t('pricing.starter.description'),
      features: [
        t('pricing.starter.feature1'),
        t('pricing.starter.feature2'),
        t('pricing.starter.feature3'),
        t('pricing.starter.feature4'),
      ],
      cta: t('pricing.starter.cta'),
    },
    {
      name: t('pricing.professional.name'),
      price: t('pricing.professional.price'),
      description: t('pricing.professional.description'),
      features: [
        t('pricing.professional.feature1'),
        t('pricing.professional.feature2'),
        t('pricing.professional.feature3'),
        t('pricing.professional.feature4'),
        t('pricing.professional.feature5'),
      ],
      cta: t('pricing.professional.cta'),
      popular: true,
    },
    {
      name: t('pricing.enterprise.name'),
      price: t('pricing.enterprise.price'),
      description: t('pricing.enterprise.description'),
      features: [
        t('pricing.enterprise.feature1'),
        t('pricing.enterprise.feature2'),
        t('pricing.enterprise.feature3'),
        t('pricing.enterprise.feature4'),
        t('pricing.enterprise.feature5'),
      ],
      cta: t('pricing.enterprise.cta'),
      isCustom: true,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-background to-primary-100 dark:from-primary-950 dark:via-background dark:to-primary-900">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="container mx-auto px-4 py-20 lg:py-32">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                  <Zap className="h-4 w-4" />
                  {t('hero.badge')}
                </div>
                <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  {t('hero.title')}{' '}
                  <span className="text-primary">{t('hero.titleHighlight')}</span>
                </h1>
                <p className="mt-6 text-lg text-muted-foreground lg:text-xl">
                  {t('hero.description')}
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
                  <Button size="xl" asChild>
                    <Link href="/register">
                      {t('hero.ctaPrimary')}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="xl" variant="outline" asChild>
                    <a href="#features">{t('hero.ctaSecondary')}</a>
                  </Button>
                </div>
                <div className="mt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground lg:justify-start">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    {t('hero.benefit1')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    {t('hero.benefit2')}
                  </div>
                </div>
              </div>
              <div className="relative hidden lg:block">
                <div className="relative mx-auto w-full max-w-lg">
                  {/* Animated bus illustration */}
                  <div className="animate-float rounded-2xl bg-card p-8 shadow-2xl">
                    <div className="flex items-center justify-between border-b pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                          <Bus className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold">{t('demo.line')}</p>
                          <p className="text-sm text-muted-foreground">
                            {t('demo.route')}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                        {t('demo.status')}
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{t('demo.nextStop')}</span>
                        <span className="font-medium">{t('demo.nextStopValue')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{t('demo.eta')}</span>
                        <span className="font-medium text-primary">{t('demo.etaValue')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{t('demo.speed')}</span>
                        <span className="font-medium">{t('demo.speedValue')}</span>
                      </div>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-muted">
                      <div className="h-full w-2/3 rounded-full bg-primary" />
                    </div>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                      {t('demo.progress', { percent: 67 })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t('features.title')}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t('features.description')}
              </p>
            </div>
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="group transition-all hover:shadow-lg">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="mt-4">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-y bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { value: '500+', label: t('stats.vehicles') },
                { value: '50K+', label: t('stats.passengers') },
                { value: '99.9%', label: t('stats.uptime') },
                { value: '8', label: t('stats.languages') },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-4xl font-bold text-primary">{stat.value}</p>
                  <p className="mt-2 text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t('pricing.title')}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t('pricing.description')}
              </p>
            </div>
            <div className="mt-16 grid gap-8 lg:grid-cols-3">
              {pricingPlans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative ${
                    plan.popular
                      ? 'border-primary shadow-lg ring-2 ring-primary'
                      : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-sm font-medium text-white">
                      {t('pricing.mostPopular')}
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">
                        {plan.isCustom ? '' : `${plan.price} zł`}
                      </span>
                      {!plan.isCustom && (
                        <span className="text-muted-foreground">{t('pricing.perMonth')}</span>
                      )}
                      {plan.isCustom && (
                        <span className="text-2xl font-bold">{plan.price}</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Check className="h-5 w-5 text-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="mt-8 w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                      size="lg"
                      asChild
                    >
                      <Link href={plan.isCustom ? '/contact' : '/register'}>
                        {plan.cta}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary py-20">
          <div className="container mx-auto px-4 text-center">
            <Globe className="mx-auto h-16 w-16 text-white/80" />
            <h2 className="mt-6 text-3xl font-bold text-white sm:text-4xl">
              {t('cta.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
              {t('cta.description')}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="xl" variant="secondary" asChild>
                <Link href="/register">
                  {t('cta.primary')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="xl"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/contact">{t('cta.secondary')}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
