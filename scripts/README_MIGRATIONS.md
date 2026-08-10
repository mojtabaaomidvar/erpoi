MIGRATIONS GENERATED ON 2026-08-07

These SQL files were generated to create missing schemas/tables/enums/indexes referenced by the application.

Files:

- 20260807_create_core_schema.sql
- 20260807_create_crm_schema.sql
- 20260807_create_contracts_schema.sql
- 20260807_create_projects_schema.sql
- 20260807_create_equipment_schema.sql
- 20260807_create_inspection_schema.sql
- 20260807_create_tpi_schema.sql
- 20260807_create_enums_and_misc.sql

HOW TO RUN

1. Review all files carefully.
2. Run them in Supabase SQL editor or psql. Example psql command:
   psql "postgresql://<user>:<pass>@<host>:5432/<db>" -f scripts/20260807_create_core_schema.sql

3. Run in this order (recommended):
   1. 20260807_create_enums_and_misc.sql
   2. 20260807_create_core_schema.sql
   3. 20260807_create_crm_schema.sql
   4. 20260807_create_contracts_schema.sql
   5. 20260807_create_projects_schema.sql
   6. 20260807_create_equipment_schema.sql
   7. 20260807_create_tpi_schema.sql
   8. 20260807_create_inspection_schema.sql

NOTES & SAFETY

- All CREATE statements are guarded where appropriate (IF NOT EXISTS or DO $$ checks).
- We assumed id columns are text by default (project uses text in several places). If you want uuid instead, do not run these scripts until we update them.
- FK constraints were added conservatively. Some FK relationships are intentionally left out and flagged as TODO.

VERIFICATION

- After running, use information_schema queries to confirm tables/columns exist. Example:
  SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('core','crm','contracts','projects','equipment','tpi','inspection');
