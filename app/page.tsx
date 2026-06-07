'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!password) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/project-lines', {
        headers: { Authorization: `Bearer ${password}` },
      });

      if (res.ok) {
        sessionStorage.setItem('memhub_token', password);
        router.push('/dashboard');
      } else {
        setError('密碼錯誤，請重試');
        setLoading(false);
      }
    } catch {
      setError('連線失敗，請稍後再試');
      setLoading(false);
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl bg-gray-900 border border-gray-800 p-8 shadow-xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">MemHub</h1>
            <p className="mt-2 text-sm text-gray-400">SoloAI 記憶總窗口</p>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="輸入通行密碼"
              autoComplete="current-password"
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <button
              onClick={handleLogin}
              disabled={loading || !password}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? '驗證中…' : '進入'}
            </button>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
