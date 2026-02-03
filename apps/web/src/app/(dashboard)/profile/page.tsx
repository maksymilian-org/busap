'use client';

import { useState } from 'react';
import { User, Mail, Phone, Shield, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { account } from '@/lib/appwrite';

export default function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      if (name !== user?.name) {
        await account.updateName(name);
      }
      if (phone !== user?.phone) {
        await account.updatePhone(phone, ''); // Requires verification
      }
      setMessage({ type: 'success', text: 'Profil zaktualizowany pomyślnie' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Nie udało się zaktualizować profilu';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mój profil</h1>
        <p className="text-muted-foreground">
          Zarządzaj swoimi danymi osobowymi i ustawieniami konta
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile info card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dane osobowe</CardTitle>
            <CardDescription>Zaktualizuj swoje dane kontaktowe</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Imię i nazwisko</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border bg-background py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Jan Kowalski"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
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
                  Aby zmienić email, skontaktuj się z administratorem
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Telefon</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border bg-background py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="+48 123 456 789"
                  />
                </div>
              </div>

              {message && (
                <div
                  className={`rounded-lg p-3 text-sm ${
                    message.type === 'success'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <Button type="submit" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account info card */}
        <Card>
          <CardHeader>
            <CardTitle>Informacje o koncie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">ID użytkownika</p>
                <p className="text-xs text-muted-foreground font-mono">{user.$id}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Status weryfikacji</p>
                <p className="text-xs text-muted-foreground">
                  {user.emailVerification ? 'Email zweryfikowany' : 'Email niezweryfikowany'}
                </p>
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium mb-1">Data rejestracji</p>
              <p className="text-xs text-muted-foreground">
                {new Date(user.$createdAt).toLocaleDateString('pl-PL', {
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
