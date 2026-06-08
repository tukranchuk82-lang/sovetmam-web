// Smoke-test: проверяем что таблица profiles есть, RLS включён, триггеры на месте.
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL не задан");
  process.exit(1);
}

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

const { rows: cols } = await client.query(`
  select column_name, data_type, is_nullable, column_default
  from information_schema.columns
  where table_schema = 'public' and table_name = 'profiles'
  order by ordinal_position
`);
console.log("Колонки profiles:");
console.table(cols);

const { rows: rls } = await client.query(`
  select relname, relrowsecurity
  from pg_class
  where relname = 'profiles' and relnamespace = 'public'::regnamespace
`);
console.log("\nRLS:");
console.table(rls);

const { rows: policies } = await client.query(`
  select policyname, cmd, qual
  from pg_policies
  where schemaname = 'public' and tablename = 'profiles'
`);
console.log("\nRLS policies:");
console.table(policies);

const { rows: triggers } = await client.query(`
  select trigger_name, event_manipulation, action_timing, action_statement
  from information_schema.triggers
  where (event_object_schema = 'auth' and event_object_table = 'users')
     or (event_object_schema = 'public' and event_object_table = 'profiles')
  order by trigger_name
`);
console.log("\nТриггеры:");
console.table(triggers);

await client.end();
