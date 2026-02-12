'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface AuditLogData {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  companyId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string };
}

export default function AdminAuditPage() {
  const t = useTranslations('admin.audit');
  const tCommon = useTranslations('common');
  const [logs, setLogs] = useState<AuditLogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState('');

  useEffect(() => {
    loadLogs();
  }, [entityType]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (entityType) params.set('entityType', entityType);
      params.set('limit', '50');
      const data = await api.fetch<any>(`/audit?${params}`);
      setLogs(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'user', 'company', 'route', 'stop', 'trip', 'vehicle', 'price'].map((type) => (
          <Button
            key={type || 'all'}
            variant={entityType === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEntityType(type)}
          >
            {type === '' ? t('filterAll') : type.charAt(0).toUpperCase() + type.slice(1)}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">{t('table.date')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.user')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.action')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.type')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.entityId')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('table.ip')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      {tCommon('actions.loading')}
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      {t('noLogs')}
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : log.userId.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{log.entityType}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                        {log.entityId.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {log.ipAddress || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
