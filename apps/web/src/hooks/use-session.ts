'use client';

import { useState, useEffect } from 'react';
import { getAccessToken, getStoredOrg } from '@/lib/session';

export interface Session {
  token: string;
  organizationId: string;
}

/**
 * Reads token + org from localStorage for use in client components.
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    const org = getStoredOrg();
    if (token && org?.id) {
      setSession({ token, organizationId: org.id });
    }
  }, []);

  return { session };
}
