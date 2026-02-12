'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';

// Trips page has been replaced by the Timetable page.
// This redirect ensures existing bookmarks/links still work.
export default function TripsRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

  useEffect(() => {
    router.replace(`/company/${companyId}/timetable`);
  }, [router, companyId]);

  return null;
}
