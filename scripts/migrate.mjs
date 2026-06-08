// Простой раннер миграций для self-hosted Supabase.
// Применяет все *.sql из ./supabase/migrations по алфавиту, отслеживает
// уже применённые в таблице public.schema_migrations.
//
// Использование:
//   set DATABASE_URL=postgres://...; node scripts/migrate.mjs

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL не задан");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "supabase", "migrations");

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

await client.query(`
  create table if not exists public.schema_migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  )
`);

const { rows: applied } = await client.query(
  "select name from public.schema_migrations",
);
const appliedSet = new Set(applied.map((r) => r.name));

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

for (const file of files) {
  if (appliedSet.has(file)) {
    console.log(`SKIP ${file} (уже применена)`);
    continue;
  }
  console.log(`APPLY ${file}`);
  const sql = readFileSync(join(migrationsDir, file), "utf8");
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query(
      "insert into public.schema_migrations (name) values ($1)",
      [file],
    );
    await client.query("commit");
    console.log(`  OK`);
  } catch (err) {
    await client.query("rollback");
    console.error(`  FAILED: ${err.message}`);
    process.exit(1);
  }
}

await client.end();
console.log("Готово.");
