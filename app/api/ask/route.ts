import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import sql from '@/lib/db';
import { validateToken } from '@/lib/auth';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_CONTEXT = 1500;

interface ProjectLineRow {
  id: string;
  name: string;
  status: string;
  summary: string | null;
  importance: number;
}

interface MemoryRow {
  memory_type: string;
  content: string;
  decisions: string | null;
  action_items: string | null;
  created_at: string | Date;
}

function buildContext(line: ProjectLineRow, memories: MemoryRow[]): string {
  let ctx = `專案線：${line.name}（${line.status}）\n`;
  if (line.summary) ctx += `摘要：${line.summary}\n`;
  ctx += `重要度：${line.importance}\n`;

  if (memories.length > 0) {
    ctx += '\n最近記憶：\n';
    for (const mem of memories) {
      const dateStr = mem.created_at
        ? new Date(mem.created_at).toISOString().slice(0, 10)
        : '';
      ctx += `[${dateStr} ${mem.memory_type}] ${mem.content}`;
      if (mem.decisions) ctx += `\n決策：${mem.decisions}`;
      if (mem.action_items) {
        try {
          const items = JSON.parse(mem.action_items) as unknown;
          if (Array.isArray(items) && items.length > 0) {
            ctx += `\n行動項：${(items as string[]).join('、')}`;
          }
        } catch {
          // ignore malformed JSON
        }
      }
      ctx += '\n';
    }
  }

  return ctx.length > MAX_CONTEXT ? ctx.slice(0, MAX_CONTEXT) + '…（已截斷）' : ctx;
}

export async function POST(request: Request) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { project_line_id?: unknown; question?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { project_line_id, question } = body;

  if (typeof project_line_id !== 'string' || !UUID_RE.test(project_line_id)) {
    return NextResponse.json({ error: 'Invalid project_line_id' }, { status: 400 });
  }

  if (typeof question !== 'string' || !question.trim()) {
    return NextResponse.json({ error: 'question is required' }, { status: 400 });
  }

  const lineRows = await sql`
    SELECT id, name, status, summary, importance
    FROM project_lines
    WHERE id = ${project_line_id}
  `;
  if (lineRows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const memRows = await sql`
    SELECT memory_type, content, decisions, action_items, created_at
    FROM memory_units
    WHERE project_line_id = ${project_line_id}
    ORDER BY created_at DESC
    LIMIT 10
  `;

  const context = buildContext(
    lineRows[0] as unknown as ProjectLineRow,
    memRows as unknown as MemoryRow[],
  );

  const client = new Anthropic();
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    system: '你是 MemHub AI 助理，根據提供的專案線資訊回答問題。回答要簡短精確，使用繁體中文，不超過 300 字。',
    messages: [
      {
        role: 'user',
        content: `${context}\n\n問題：${question.trim()}`,
      },
    ],
  });

  const answer =
    response.content[0]?.type === 'text' ? response.content[0].text : '';
  return NextResponse.json({ answer });
}
