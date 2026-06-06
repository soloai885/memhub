-- MemHub database schema
-- Execute in Neon Console → memhub project → neondb database

-- Table 1: project_lines
CREATE TABLE project_lines (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active',
  summary       TEXT,
  importance    FLOAT DEFAULT 1.0,
  last_updated  TIMESTAMPTZ DEFAULT now(),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ENUM type for memory_units
CREATE TYPE memory_type AS ENUM (
  'episodic', 'project_state', 'working_summary',
  'semantic', 'preference', 'procedural'
);

-- Table 2: memory_units
CREATE TABLE memory_units (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_line_id UUID REFERENCES project_lines(id) ON DELETE CASCADE,
  memory_type     memory_type NOT NULL DEFAULT 'project_state',
  content         TEXT NOT NULL,
  decisions       TEXT[],
  action_items    JSONB,
  open_questions  TEXT[],
  entities        TEXT[],
  importance      FLOAT DEFAULT 1.0,
  next_deadline   DATE,
  assignee        TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  source          TEXT DEFAULT 'manual'
);

-- Indexes
CREATE INDEX idx_memory_units_project_line_id ON memory_units(project_line_id);
CREATE INDEX idx_memory_units_created_at ON memory_units(created_at DESC);
CREATE INDEX idx_memory_units_next_deadline ON memory_units(next_deadline);
CREATE INDEX idx_project_lines_status ON project_lines(status);
