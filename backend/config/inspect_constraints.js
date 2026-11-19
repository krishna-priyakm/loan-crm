import pool from './db.js';

async function inspectConstraints() {
  try {
    const res = await pool.query(
      "SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid = 'leads'::regclass"
    );
    console.log(res.rows);

    const appRes = await pool.query(
      "SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid = 'loan_applications'::regclass"
    );
    console.log(appRes.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

inspectConstraints();
