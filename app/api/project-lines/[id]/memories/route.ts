import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { validateToken } from '@/lib/auth';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const rows = await sql`
    SELECT id, project_line_id, memory_type, content,
           next_deadline, assignee, decisions, action_items,
           open_questions, entities, created_at
    FROM memory_units
    WHERE project_line_id = ${id}
    ORDER BY created_at DESC
  `;

  return NextResponse.json(rows);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const body = await request.json();
  const {
    content,
    memory_type,
    next_deadline,
    assignee,
    decisions,
    action_items,
    open_questions,
    entities,
  } = body;

  if (!content) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO memory_units (
      project_line_id, content, memory_type,
      next_deadline, assignee,
      decisions, action_items, open_questions, entities
    )
    VALUES (
      ${id},
      ${content},
      ${memory_type ?? 'project_state'},
      ${next_deadline ?? null},
      ${assignee ?? null},
      ${decisions ?? null},
      ${action_items ? JSON.stringify(action_items) : null},
      ${open_questions ?? null},
      ${entities ?? null}
    )
    RETURNING id, project_line_id, memory_type, content, next_deadline, assignee, created_at
  `;

  return NextResponse.json(rows[0], { status: 201 });
}
