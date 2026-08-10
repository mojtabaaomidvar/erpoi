// src/shared/data-access/isMissingTableOrColumn.ts

/**
 * Returns true when a Supabase/PostgREST error means a table or column does
 * not exist. The database schema has evolved over time (columns such as
 * `session_id` or `session_number` were added later), so cascade deletes can
 * skip targets that are missing in a given environment instead of failing.
 */
export const isMissingTableOrColumn = (err: any): boolean => {
  const code = err?.code || "";
  const msg = err?.message || "";
  return (
    code === "PGRST202" || // relation not found
    code === "PGRST204" || // column not found
    code === "PGRST205" || // table not found
    /does not exist/i.test(msg) ||
    /could not find/i.test(msg)
  );
};
