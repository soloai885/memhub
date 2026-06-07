import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { validateToken } from '@/lib/auth';

export async function GET(request: Request) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await sql`
    SELECT
      pl.id,
      pl.name,
      pl.status,
      pl.summary,
      pl.importance,
      pl.last_updated,
      pl.created_at,
      latest.content AS latest_memory,
      latest.created_at AS latest_memory_at
    FROM project_lines pl
    LEFT JOIN LATERAL (
      SELECT content, created_at
      FROM memory_units
      WHERE project_line_id = pl.id
      ORDER BY created_at DESC
      LIMIT 1
    ) latest ON true
    ORDER BY pl.created_at DESC
  `;

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, status, summary } = body;

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO project_lines (name, status, summary)
    VALUES (${name}, ${status ?? 'active'}, ${summary ?? null})
    RETURNING id, name, status, summary, importance, created_at
  `;

  return NextResponse.json(rows[0], { status: 201 });
}
