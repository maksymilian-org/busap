import Link from 'next/link';
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

const features = [
  {
    icon: MapPin,
    title: 'Śledzenie GPS w czasie rzeczywistym',
    description:
      'Śledź autobusy na mapie w czasie rzeczywistym. Zawsze wiesz, gdzie jest Twój autobus.',
  },
  {
    icon: Clock,
    title: 'Dokładne ETA',
    description:
      'Inteligentny silnik ETA uwzględnia ruch drogowy i dane historyczne dla precyzyjnych przewidywań.',
  },
  {
    icon: Users,
    title: 'Panel dla kierowców',
    description:
      'Dedykowana aplikacja dla kierowców z automatycznym przydzielaniem kursów i raportowaniem.',
  },
  {
    icon: Shield,
    title: 'Bezpieczeństwo danych',
    description:
      'Twoje dane są bezpieczne. Zgodność z RODO i najwyższe standardy bezpieczeństwa.',
  },
  {
    icon: Smartphone,
    title: 'Tryb offline',
    description:
      'Aplikacja działa nawet bez internetu. Dane synchronizują się automatycznie.',
  },
  {
    icon: BarChart3,
    title: 'Raporty i analityka',
    description:
      'Szczegółowe raporty punktualności, wydajności kierowców i wykorzystania floty.',
  },
];

const pricingPlans = [
  {
    name: 'Starter',
    price: '99',
    description: 'Dla małych firm',
    features: [
      'Do 5 pojazdów',
      'Śledzenie GPS',
      'Podstawowe raporty',
      'Wsparcie email',
    ],
  },
  {
    name: 'Professional',
    price: '249',
    description: 'Dla rosnących firm',
    features: [
      'Do 20 pojazdów',
      'Zaawansowane ETA',
      'Panel managera',
      'Priorytetowe wsparcie',
      'API dostęp',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Indywidualnie',
    description: 'Dla dużych przewoźników',
    features: [
      'Nieograniczona liczba pojazdów',
      'Dedykowany opiekun',
      'SLA 99.9%',
      'Integracje custom',
      'Szkolenia on-site',
    ],
  },
];

export default function HomePage() {
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
                  Nowa era transportu autobusowego
                </div>
                <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  Zarządzaj flotą{' '}
                  <span className="text-primary">inteligentnie</span>
                </h1>
                <p className="mt-6 text-lg text-muted-foreground lg:text-xl">
                  Busap to kompleksowa platforma do zarządzania transportem
                  autobusowym. Śledź pojazdy, optymalizuj trasy i zapewnij
                  pasażerom najlepsze doświadczenie podróży.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
                  <Button size="xl" asChild>
                    <Link href="/register">
                      Rozpocznij za darmo
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="xl" variant="outline" asChild>
                    <Link href="#features">Zobacz funkcje</Link>
                  </Button>
                </div>
                <div className="mt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground lg:justify-start">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    14 dni za darmo
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Bez karty kredytowej
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
                          <p className="font-semibold">Linia 42</p>
                          <p className="text-sm text-muted-foreground">
                            Warszawa - Kraków
                          </p>
                        </div>
                      </div>
                      <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                        W trasie
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Następny przystanek</span>
                        <span className="font-medium">Radom Dworzec</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">ETA</span>
                        <span className="font-medium text-primary">12 min</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Prędkość</span>
                        <span className="font-medium">87 km/h</span>
                      </div>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-muted">
                      <div className="h-full w-2/3 rounded-full bg-primary" />
                    </div>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                      67% trasy ukończone
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
                Wszystko czego potrzebujesz
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Busap oferuje kompletny zestaw narzędzi dla pasażerów, kierowców i
                zarządzających flotą.
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
                { value: '500+', label: 'Aktywnych pojazdów' },
                { value: '50K+', label: 'Pasażerów miesięcznie' },
                { value: '99.9%', label: 'Dostępność systemu' },
                { value: '8', label: 'Obsługiwanych języków' },
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
                Prosty, przejrzysty cennik
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Wybierz plan dopasowany do wielkości Twojej floty. Wszystkie plany
                zawierają 14-dniowy okres próbny.
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
                      Najpopularniejszy
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">
                        {plan.price === 'Indywidualnie' ? '' : `${plan.price} zł`}
                      </span>
                      {plan.price !== 'Indywidualnie' && (
                        <span className="text-muted-foreground">/miesiąc</span>
                      )}
                      {plan.price === 'Indywidualnie' && (
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
                      <Link href="/register">
                        {plan.price === 'Indywidualnie'
                          ? 'Skontaktuj się'
                          : 'Rozpocznij'}
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
              Gotowy na transformację transportu?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
              Dołącz do setek firm, które już korzystają z Busap. Zacznij
              14-dniowy okres próbny i przekonaj się, jak możemy usprawnić Twoją
              działalność.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="xl" variant="secondary" asChild>
                <Link href="/register">
                  Rozpocznij za darmo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="xl"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/contact">Umów demo</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
