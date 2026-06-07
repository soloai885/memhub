type Status = 'active' | 'pending' | 'paused' | 'done';

const STYLES: Record<Status, { dot: string; text: string; label: string }> = {
  active:  { dot: 'bg-green-500',  text: 'text-green-400',  label: '進行中' },
  pending: { dot: 'bg-yellow-500', text: 'text-yellow-400', label: '待處理' },
  paused:  { dot: 'bg-gray-500',   text: 'text-gray-400',   label: '暫停中' },
  done:    { dot: 'bg-blue-500',   text: 'text-blue-400',   label: '已完成' },
};

export default function StatusBadge({ status }: { status: string }) {
  const s = STYLES[status as Status] ?? STYLES.paused;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-medium ${s.text}`}>
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
