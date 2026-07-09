-- Approximate-nearest-neighbour index for semantic search.
-- Prisma cannot express HNSW/IVFFlat indexes, so apply this once AFTER
-- `prisma migrate deploy` (which creates the `vector` extension + column):
--
--   psql "$DATABASE_URL" -f prisma/sql/002_vector_index.sql
--   # or: pnpm prisma db execute --file prisma/sql/002_vector_index.sql --schema prisma/schema.prisma
--
-- Cosine search works without it (sequential scan); the index makes it fast at scale.
-- HNSW gives the best recall/latency; requires pgvector >= 0.5.0.

CREATE INDEX IF NOT EXISTS bando_embedding_hnsw
  ON "Bando"
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Alternative (older pgvector): IVFFlat — build after you have some rows.
-- CREATE INDEX IF NOT EXISTS bando_embedding_ivfflat
--   ON "Bando" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
