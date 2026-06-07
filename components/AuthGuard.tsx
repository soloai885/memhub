'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
  /**
   * requireAuth=false (default): login page guard — has token → redirect /dashboard
   * requireAuth=true:  protected page guard — no token  → redirect /
   */
  requireAuth?: boolean;
}

export default function AuthGuard({ children, requireAuth = false }: AuthGuardProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('memhub_token');
    if (requireAuth) {
      if (!token) {
        router.push('/');
      } else {
        setChecking(false);
      }
    } else {
      if (token) {
        router.push('/dashboard');
      } else {
        setChecking(false);
      }
    }
  }, [router, requireAuth]);

  if (checking) return null;
  return <>{children}</>;
}
