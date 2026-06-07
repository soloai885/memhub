'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import StatusBadge from '@/components/StatusBadge';

interface ProjectLine {
  id: string;
  name: string;
  status: string;
  summary: string | null;
  importance: number;
  last_updated: string | null;
  created_at: string;
}

interface MemoryUnit {
  id: string;
  project_line_id: string;
  memory_type: string;
  content: string;
  next_deadline: string | null;
  assignee: string | null;
  decisions: string | null;
  action_items: string | null;
  open_questions: string | null;
  entities: string | null;
  created_at: string;
}

const MEMORY_TYPES = [
  { value: 'project_state', label: '專案狀態' },
  { value: 'decision',      label: '決策' },
  { value: 'action',        label: '行動項' },
  { value: 'question',      label: '待確認' },
];

function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  return d.slice(0, 10);
}

function parseActionItems(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function DetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [line, setLine] = useState<ProjectLine | null>(null);
  const [memories, setMemories] = useState<MemoryUnit[]>([]);
  const [loadingLine, setLoadingLine] = useState(true);
  const [loadingMems, setLoadingMems] = useState(true);
  const [lineError, setLineError] = useState('');
  const [memError, setMemError] = useState('');

  const [form, setForm] = useState({
    content: '',
    memory_type: 'project_state',
    next_deadline: '',
    assignee: '',
    action_items: '',
    decisions: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);

  function getToken() {
    return sessionStorage.getItem('memhub_token') ?? '';
  }

  useEffect(() => {
    const token = getToken();
    fetch(`/api/project-lines/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('API error');
        return res.json() as Promise<ProjectLine>;
      })
      .then((data) => { setLine(data); setLoadingLine(false); })
      .catch(() => { setLineError('載入專案線失敗'); setLoadingLine(false); });
  }, [id]);

  useEffect(() => {
    fetchMemories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function fetchMemories() {
    const token = getToken();
    setLoadingMems(true);
    fetch(`/api/project-lines/${id}/memories`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('API error');
        return res.json() as Promise<MemoryUnit[]>;
      })
      .then((data) => { setMemories(data); setLoadingMems(false); })
      .catch(() => { setMemError('載入記憶失敗'); setLoadingMems(false); });
  }

  async function handleAsk() {
    if (!question.trim() || asking) return;
    setAsking(true);
    setAnswer('');
    const token = getToken();
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ project_line_id: id, question }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json() as { answer: string };
      setAnswer(data.answer);
    } catch {
      setAnswer('查詢失敗，請重試。');
    } finally {
      setAsking(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!form.content.trim()) {
      setFormError('內容為必填');
      return;
    }

    let parsedActionItems: string[] | null = null;
    if (form.action_items.trim()) {
      try {
        const parsed = JSON.parse(form.action_items.trim());
        if (!Array.isArray(parsed)) throw new Error('not array');
        parsedActionItems = parsed;
      } catch {
        setFormError('action_items 格式錯誤，請輸入 JSON 陣列，例如 ["任務1","任務2"]');
        return;
      }
    }

    setSubmitting(true);
    const token = getToken();
    try {
      const res = await fetch(`/api/project-lines/${id}/memories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: form.content.trim(),
          memory_type: form.memory_type,
          next_deadline: form.next_deadline || null,
          assignee: form.assignee.trim() || null,
          action_items: parsedActionItems,
          decisions: form.decisions.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('API error');
      setForm({ content: '', memory_type: 'project_state', next_deadline: '', assignee: '', action_items: '', decisions: '' });
      fetchMemories();
    } catch {
      setFormError('新增失敗，請重試');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-gray-500 transition-colors hover:text-gray-300">
              ← 總覽
            </Link>
            {line && (
              <>
                <span className="text-gray-700">/</span>
                <span className="text-sm text-gray-300">{line.name}</span>
              </>
            )}
          </div>
          <button
            onClick={() => { sessionStorage.clear(); router.push('/'); }}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 transition-colors hover:border-gray-600 hover:text-gray-300"
          >
            登出
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {loadingLine && <p className="text-gray-500">載入中...</p>}
        {lineError && <p className="text-red-400">{lineError}</p>}

        {line && (
          <div className="mb-8 rounded-xl border border-gray-800 bg-gray-900 p-6">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-xl font-bold text-white">{line.name}</h1>
              <StatusBadge status={line.status} />
            </div>
            {line.summary && (
              <p className="mt-2 text-sm text-gray-400">{line.summary}</p>
            )}
            <div className="mt-4 flex gap-6 text-xs text-gray-600">
              <span>重要度 {line.importance}</span>
              <span>更新：{formatDate(line.last_updated ?? line.created_at)}</span>
            </div>
          </div>
        )}

        <section className="mb-8">
          <h2 className="mb-4 text-base font-semibold text-gray-200">Ask AI</h2>
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-3">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAsk(); }}
              placeholder="詢問關於這條專案線的問題..."
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-gray-500 focus:outline-none"
            />
            <button
              onClick={handleAsk}
              disabled={asking || !question.trim()}
              className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
            >
              {asking ? '思考中...' : '詢問 AI'}
            </button>
            {answer && (
              <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                {answer}
              </div>
            )}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-base font-semibold text-gray-200">新增記憶</h2>
          <form onSubmit={handleSubmit} className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs text-gray-400">內容 *</label>
              <textarea
                rows={3}
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="記錄這條線的最新狀態..."
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-gray-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-gray-400">記憶類型</label>
                <select
                  value={form.memory_type}
                  onChange={(e) => setForm((f) => ({ ...f, memory_type: e.target.value }))}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-gray-500 focus:outline-none"
                >
                  {MEMORY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-400">負責人</label>
                <input
                  type="text"
                  value={form.assignee}
                  onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
                  placeholder="e.g. Alice"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-gray-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-400">截止日</label>
                <input
                  type="date"
                  value={form.next_deadline}
                  onChange={(e) => setForm((f) => ({ ...f, next_deadline: e.target.value }))}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-gray-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-400">決策記錄</label>
                <input
                  type="text"
                  value={form.decisions}
                  onChange={(e) => setForm((f) => ({ ...f, decisions: e.target.value }))}
                  placeholder="本次決定的事項..."
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-gray-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-400">
                行動項 <span className="text-gray-600">（JSON 陣列，例如 [&quot;任務1&quot;,&quot;任務2&quot;]）</span>
              </label>
              <textarea
                rows={2}
                value={form.action_items}
                onChange={(e) => setForm((f) => ({ ...f, action_items: e.target.value }))}
                placeholder='["任務1", "任務2"]'
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-gray-500 focus:outline-none font-mono"
              />
            </div>

            {formError && <p className="text-sm text-red-400">{formError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              {submitting ? '新增中...' : '新增記憶'}
            </button>
          </form>
        </section>

        <section>
          <h2 className="mb-4 text-base font-semibold text-gray-200">
            記憶列表
            {!loadingMems && !memError && (
              <span className="ml-2 text-sm font-normal text-gray-500">{memories.length} 條</span>
            )}
          </h2>

          {loadingMems && <p className="text-gray-500">載入中...</p>}
          {memError && <p className="text-red-400">{memError}</p>}

          {!loadingMems && !memError && memories.length === 0 && (
            <p className="text-sm text-gray-600">尚無記憶，使用上方表單新增第一條。</p>
          )}

          <div className="space-y-3">
            {memories.map((mem) => {
              const actionItems = parseActionItems(mem.action_items);
              return (
                <div key={mem.id} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="rounded-md bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                      {MEMORY_TYPES.find((t) => t.value === mem.memory_type)?.label ?? mem.memory_type}
                    </span>
                    <span className="text-xs text-gray-600">{formatDate(mem.created_at)}</span>
                  </div>

                  <p className="text-sm leading-relaxed text-gray-300">{mem.content}</p>

                  {mem.decisions && (
                    <p className="mt-2 text-xs text-gray-500">決策：{mem.decisions}</p>
                  )}

                  {actionItems.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {actionItems.map((item, i) => (
                        <li key={i} className="text-xs text-gray-500 before:mr-1.5 before:content-['▸']">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-2 flex gap-4 text-xs text-gray-600">
                    {mem.assignee && <span>負責：{mem.assignee}</span>}
                    {mem.next_deadline && <span>截止：{formatDate(mem.next_deadline)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function ProjectLineDetailPage() {
  return (
    <AuthGuard requireAuth>
      <DetailContent />
    </AuthGuard>
  );
}
