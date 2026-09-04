# Agent Instructions for Temple Of Fine Arts Penang • Shiva Family Portal

## Supabase Schema & Update Rule
Whenever you make changes to application models, data types, interfaces, database entities, or storage buckets:
1. **Always update `/schema.sql`** to maintain complete parity with the application data layer.
2. **Always update `/instruction.md`** with the incremental SQL query (`ALTER TABLE`, `CREATE TABLE IF NOT EXISTS`, etc.) needed to update existing Supabase databases.
3. Ensure all SQL statements remain idempotent (`IF NOT EXISTS`, `ON CONFLICT DO UPDATE/NOTHING`).
