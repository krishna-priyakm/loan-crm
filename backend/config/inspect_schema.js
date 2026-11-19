import pool from './db.js';

async function inspect() {
  try {
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    console.log("TABLES:", tables.rows.map(r => r.table_name));

    for (const t of tables.rows) {
      const cols = await pool.query(
        "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position",
        [t.table_name]
      );
      console.log(`\n--- ${t.table_name} ---`);
      cols.rows.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

inspect();
