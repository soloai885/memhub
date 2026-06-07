'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import ProjectLineCard, { type ProjectLine } from '@/components/ProjectLineCard';

function DashboardContent() {
  const router = useRouter();
  const [lines, setLines] = useState<ProjectLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('memhub_token');
    fetch('/api/project-lines', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('API error');
        return res.json() as Promise<ProjectLine[]>;
      })
      .then((data) => {
        setLines(data);
        setLoading(false);
      })
      .catch(() => {
        setError('載入失敗，請重新整理');
        setLoading(false);
      });
  }, []);

  function handleLogout() {
    sessionStorage.clear();
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">MemHub</h1>
            <p className="text-xs text-gray-500">SoloAI 記憶總窗口</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 transition-colors hover:border-gray-600 hover:text-gray-300"
          >
            登出
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h2 className="mb-6 text-lg font-semibold text-gray-200">
          專案線總覽
          {!loading && !error && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              {lines.length} 條
            </span>
          )}
        </h2>

        {loading && (
          <p className="text-gray-500">載入中...</p>
        )}

        {error && (
          <p className="text-red-400">{error}</p>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lines.map((line) => (
              <ProjectLineCard key={line.id} line={line} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard requireAuth>
      <DashboardContent />
    </AuthGuard>
  );
}
