import Link from 'next/link';
import StatusBadge from './StatusBadge';

export interface ProjectLine {
  id: string;
  name: string;
  status: string;
  summary: string | null;
  importance: number;
  last_updated: string | null;
  created_at: string;
  latest_memory: string | null;
  latest_memory_at: string | null;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return dateStr.slice(0, 10);
}

function truncate(text: string | null | undefined, max = 80): string {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

export default function ProjectLineCard({ line }: { line: ProjectLine }) {
  return (
    <Link href={`/dashboard/${line.id}`} className="block">
    <div className="flex flex-col gap-3 rounded-xl border border-gray-800 bg-gray-900 p-5 transition-colors hover:border-gray-700">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-tight text-white">{line.name}</h3>
        <StatusBadge status={line.status} />
      </div>

      {line.latest_memory && (
        <p className="text-sm leading-relaxed text-gray-400">
          {truncate(line.latest_memory)}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-gray-800 pt-3">
        <span className="text-xs text-gray-600">
          更新：{formatDate(line.last_updated ?? line.created_at)}
        </span>
        <span className="text-xs text-gray-700">重要度 {line.importance}</span>
      </div>
    </div>
    </Link>
  );
}
