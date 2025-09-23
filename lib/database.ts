export interface TableInfo {
  table_name: string
  columns: ColumnInfo[]
}

export interface ColumnInfo {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
}

export interface ForeignKey {
  table_name: string
  column_name: string
  foreign_table_name: string
  foreign_column_name: string
}

// Mock data for demonstration since we're having Supabase integration issues
export async function getTableSchema(): Promise<TableInfo[]> {
  // Return mock schema data for demonstration
  return [
    {
      table_name: "users",
      columns: [
        { column_name: "id", data_type: "uuid", is_nullable: "NO", column_default: "gen_random_uuid()" },
        { column_name: "email", data_type: "varchar", is_nullable: "NO", column_default: null },
        { column_name: "first_name", data_type: "varchar", is_nullable: "YES", column_default: null },
        { column_name: "last_name", data_type: "varchar", is_nullable: "YES", column_default: null },
        { column_name: "created_at", data_type: "timestamp", is_nullable: "NO", column_default: "now()" },
      ],
    },
    {
      table_name: "products",
      columns: [
        { column_name: "id", data_type: "uuid", is_nullable: "NO", column_default: "gen_random_uuid()" },
        { column_name: "name", data_type: "varchar", is_nullable: "NO", column_default: null },
        { column_name: "description", data_type: "text", is_nullable: "YES", column_default: null },
        { column_name: "price", data_type: "decimal", is_nullable: "NO", column_default: null },
        { column_name: "category_id", data_type: "uuid", is_nullable: "YES", column_default: null },
        { column_name: "created_at", data_type: "timestamp", is_nullable: "NO", column_default: "now()" },
      ],
    },
    {
      table_name: "categories",
      columns: [
        { column_name: "id", data_type: "uuid", is_nullable: "NO", column_default: "gen_random_uuid()" },
        { column_name: "name", data_type: "varchar", is_nullable: "NO", column_default: null },
        { column_name: "description", data_type: "text", is_nullable: "YES", column_default: null },
        { column_name: "created_at", data_type: "timestamp", is_nullable: "NO", column_default: "now()" },
      ],
    },
    {
      table_name: "orders",
      columns: [
        { column_name: "id", data_type: "uuid", is_nullable: "NO", column_default: "gen_random_uuid()" },
        { column_name: "user_id", data_type: "uuid", is_nullable: "YES", column_default: null },
        { column_name: "total_amount", data_type: "decimal", is_nullable: "NO", column_default: null },
        { column_name: "status", data_type: "varchar", is_nullable: "YES", column_default: "'pending'" },
        { column_name: "created_at", data_type: "timestamp", is_nullable: "NO", column_default: "now()" },
      ],
    },
    {
      table_name: "order_items",
      columns: [
        { column_name: "id", data_type: "uuid", is_nullable: "NO", column_default: "gen_random_uuid()" },
        { column_name: "order_id", data_type: "uuid", is_nullable: "YES", column_default: null },
        { column_name: "product_id", data_type: "uuid", is_nullable: "YES", column_default: null },
        { column_name: "quantity", data_type: "integer", is_nullable: "NO", column_default: null },
        { column_name: "price", data_type: "decimal", is_nullable: "NO", column_default: null },
        { column_name: "created_at", data_type: "timestamp", is_nullable: "NO", column_default: "now()" },
      ],
    },
  ]
}

export async function getForeignKeys(): Promise<ForeignKey[]> {
  // Return mock foreign key relationships for demonstration
  return [
    {
      table_name: "products",
      column_name: "category_id",
      foreign_table_name: "categories",
      foreign_column_name: "id",
    },
    {
      table_name: "orders",
      column_name: "user_id",
      foreign_table_name: "users",
      foreign_column_name: "id",
    },
    {
      table_name: "order_items",
      column_name: "order_id",
      foreign_table_name: "orders",
      foreign_column_name: "id",
    },
    {
      table_name: "order_items",
      column_name: "product_id",
      foreign_table_name: "products",
      foreign_column_name: "id",
    },
  ]
}

export async function executeQuery(query: string): Promise<{ data: any[]; error: string | null }> {
  // Mock query execution for demonstration
  try {
    // Basic validation
    const trimmedQuery = query.trim().toUpperCase()
    if (!trimmedQuery.startsWith("SELECT")) {
      return { data: [], error: "Only SELECT statements are allowed" }
    }

    // Return mock data based on the query
    if (query.toLowerCase().includes("users")) {
      return {
        data: [
          {
            id: "123e4567-e89b-12d3-a456-426614174000",
            email: "john.doe@example.com",
            first_name: "John",
            last_name: "Doe",
            created_at: "2024-01-15T10:30:00Z",
          },
          {
            id: "123e4567-e89b-12d3-a456-426614174001",
            email: "jane.smith@example.com",
            first_name: "Jane",
            last_name: "Smith",
            created_at: "2024-01-16T14:20:00Z",
          },
        ],
        error: null,
      }
    }

    if (query.toLowerCase().includes("products")) {
      return {
        data: [
          {
            id: "123e4567-e89b-12d3-a456-426614174010",
            name: "Laptop Pro",
            description: "High-performance laptop for professionals",
            price: 1299.99,
            category_id: "123e4567-e89b-12d3-a456-426614174020",
            created_at: "2024-01-10T09:00:00Z",
          },
          {
            id: "123e4567-e89b-12d3-a456-426614174011",
            name: "Wireless Headphones",
            description: "Premium noise-canceling headphones",
            price: 299.99,
            category_id: "123e4567-e89b-12d3-a456-426614174020",
            created_at: "2024-01-11T11:30:00Z",
          },
        ],
        error: null,
      }
    }

    // Default response for other queries
    return {
      data: [
        { column1: "Sample Data", column2: "Value 1", column3: 100 },
        { column1: "Demo Row", column2: "Value 2", column3: 200 },
      ],
      error: null,
    }
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Unknown error occurred",
    }
  }
}
