import pg from "pg";

const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();

const seg = await c.query("select count(*)::int as n from public.segments");
const meas = await c.query("select count(*)::int as n from public.measures");
const files = await c.query("select count(*)::int as n from public.measure_files");

console.log(`segments: ${seg.rows[0].n}`);
console.log(`measures: ${meas.rows[0].n}`);
console.log(`measure_files: ${files.rows[0].n}`);

const sample = await c.query(
  "select slug, title, level, region, segments from public.measures order by sort_order limit 3",
);
console.log("\nПервые 3 меры:");
console.table(sample.rows);

await c.end();
