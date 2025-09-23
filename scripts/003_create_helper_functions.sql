-- Create helper function to get foreign key relationships
CREATE OR REPLACE FUNCTION get_foreign_keys()
RETURNS TABLE (
  table_name TEXT,
  column_name TEXT,
  foreign_table_name TEXT,
  foreign_column_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.table_name::TEXT,
    kcu.column_name::TEXT,
    ccu.table_name::TEXT AS foreign_table_name,
    ccu.column_name::TEXT AS foreign_column_name
  FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public';
END;
$$ LANGUAGE plpgsql;

-- Create helper function to execute dynamic SQL (with safety restrictions)
CREATE OR REPLACE FUNCTION execute_sql(query TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Basic safety check - only allow SELECT statements
  IF UPPER(TRIM(query)) NOT LIKE 'SELECT%' THEN
    RAISE EXCEPTION 'Only SELECT statements are allowed';
  END IF;
  
  -- Execute the query and return as JSON
  EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
  
  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql;
