// Применяет ОДНУ миграцию по имени файла и фиксирует её в schema_migrations.
// Строку подключения берёт из ../MSP Supabase/.cursor/mcp.json (--db-url),
// чтобы не светить пароль в командной строке.
//
// Запуск: node scripts/apply-one-migration.mjs 0006_measure_tips.sql

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

const name = process.argv[2];
if (!name) {
  console.error("Укажите имя файла миграции");
  process.exit(1);
}

// db-url из mcp.json (соседняя папка MSP Supabase)
const mcpPath = join(projectRoot, "..", "MSP Supabase", ".cursor", "mcp.json");
const mcp = JSON.parse(readFileSync(mcpPath, "utf8"));
const args = mcp.mcpServers["supabase-self-hosted"].args;
const dbUrl = args[args.indexOf("--db-url") + 1];
if (!dbUrl) {
  console.error("Не нашёл --db-url в mcp.json");
  process.exit(1);
}

const sql = readFileSync(join(projectRoot, "supabase", "migrations", name), "utf8");

const client = new pg.Client({ connectionString: dbUrl });
await client.connect();
await client.query(`
  create table if not exists public.schema_migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  )
`);
const { rows } = await client.query(
  "select 1 from public.schema_migrations where name = $1",
  [name],
);
if (rows.length > 0) {
  console.log(`SKIP ${name} (уже применена)`);
} else {
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query(
      "insert into public.schema_migrations (name) values ($1)",
      [name],
    );
    await client.query("commit");
    console.log(`OK ${name}`);
  } catch (e) {
    await client.query("rollback");
    console.error(`FAILED: ${e.message}`);
    process.exit(1);
  }
}
await client.end();
