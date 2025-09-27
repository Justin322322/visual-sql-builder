# Visual SQL Builder

<img width="1919" height="915" alt="image" src="https://github.com/user-attachments/assets/25eb3e5a-eb47-41f6-885a-9d69ecc91ece" />


An interactive SQL query builder for PostgreSQL featuring:

- Visual JOIN builder (drag-to-connect with composite key support)
- Schema explorer with table/column metadata and quick-add actions
- SQL generation with real-time validation and performance warnings
- Query templates aligned to the provided demo schema
- Results viewer with paging-ready structure and export hooks

## What this app does

Visual SQL Builder helps analysts and engineers build correct SQL without hand-writing every clause. You can explore your schema, connect tables visually to define JOINs (including multiple predicates for composite keys), add fields and conditions from a structured builder, and preview and execute the resulting SQL. The UI guides you with inline validation and suggestions, and it keeps the visual model and generated SQL in sync.

### Key capabilities

1. Visual JOIN Builder
   - Drag from a column on one table to a column on another to form a JOIN condition.
   - Multiple connections between the same pair of tables are merged into a single JOIN with multiple predicates (AND across predicates), suitable for composite keys.
   - JOIN type switching (INNER, LEFT, RIGHT, FULL) with color-coded edges and labels.
   - Auto-suggest JOINs from foreign keys, with deduplication and grouping per table pair.
   - Venn-style visualizations to explain JOIN semantics, and an Active JOINs panel for quick edits and removal.
   - "Apply to Query" action to push the current visual JOINs directly into the Query Builder.

2. Query Builder
   - Structured editors for SELECT fields, JOINs, WHERE, GROUP BY, HAVING, ORDER BY, and LIMIT.
   - Aggregate function helpers (COUNT, COUNT DISTINCT, SUM, AVG, MIN, MAX) with aliasing.
   - Inline controls for adding commonly-used filters and fast LIMIT values.
   - Query templates you can load and adapt. Templates are written to match the provided demo schema.

3. Real-time SQL validation
   - Syntax shape checks (starts with SELECT, requires FROM when SELECT is present).
   - Alias-aware table qualifier checks: table aliases defined in FROM or JOIN are recognized to avoid false positives.
   - Performance hints (e.g., consider LIMIT when using ORDER BY, avoid SELECT *).

4. Results view
   - Displays rows as a table with basic formatting and room for paging/export.
   - Exposes an export callback hook so you can wire CSV/JSON exports to your own logic.

## Architecture overview

- App Router with a single page that coordinates three main zones: Schema Explorer (left), Main Content (tabs for Query Builder, Visual JOINs, Results).
- `components/react-flow-join-builder.tsx` implements the canvas using `@xyflow/react`. Each table is a node with per-column handles; edges represent JOINs.
- `components/query-builder.tsx` manages the structured SQL assembly and reflects visual JOINs as JOIN clauses.
- `app/page.tsx` orchestrates state: schema data, active tab, validation, executing queries, and wiring actions between the visual and text builders.
- `lib/join-sql.ts` defines shared types and helpers for translating JOINs with multiple predicates into SQL.
- `lib/database.ts` currently provides mock schema and execution. Swap out the mocks with real database calls as needed.

### Data flow

- Schema is loaded into `HomePage` and passed to both the Visual JOIN Builder and Query Builder.
- JOINs created visually emit a `JoinConnection[]` that includes `conditions[]` for each predicate. These propagate to `QueryBuilder`, which converts them into JOIN clauses in the SQL.
- Query text updates are validated in real-time, including alias detection from FROM/JOIN.
- Executing a query navigates to the Results tab and displays the returned data.

## Sample Database

The repository includes SQL scripts to create and seed a small relational dataset that exercises JOINs and aggregates:

- `scripts/001_create_sample_tables.sql` defines tables: `users`, `products`, `categories`, `orders`, `order_items` with appropriate keys.
- `scripts/002_seed_sample_data.sql` inserts demo rows to make the templates and examples meaningful.
- `scripts/003_create_helper_functions.sql` provides helper functions (e.g., foreign key discovery and a guarded SELECT executor) if you choose to run server-side SQL.

By default, the app uses mock schema/rows in `lib/database.ts` so you can explore the UI without connecting to a database. Replace the mock implementations with real queries or Supabase client code to connect to your environment.

## Quick Start

Prerequisites:
- Node 18+ and npm (uses `package-lock.json`).

Install and run:

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Scripts

```bash
npm run dev        # Start Next.js dev server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Lint
npm run type-check # TypeScript check
```

## Development workflow

- Feature branches from `main` with conventional commits.
- UI components are co-located under `components/` and share Tailwind + Shadcn primitives under `components/ui/`.
- Keep types in shared modules (`lib/join-sql.ts`, `lib/database.ts`) to ensure builder and visual editor remain in sync.
- Prefer server-backed execution for real data; the UI is designed to be backend-agnostic as long as the types are satisfied.

## Tech Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS + Shadcn UI
- `@xyflow/react` for the JOIN canvas

## Roadmap

- Persist layouts and JOIN graphs (localStorage or project storage).
- Rich JOIN condition editor (operators, custom expressions, AND/OR groups).
- Table alias editing and propagation into generated SQL.
- Exporters for CSV and JSON in the Results view.
- Optional auth and user workspaces for saved queries.

## License

MIT

## Quick Start

Prerequisites:
- Node 18+ and npm (uses `package-lock.json`)

Install and run:

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Scripts

```bash
npm run dev        # Start Next.js dev server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Lint
npm run type-check # TypeScript check
```

## Sample Database (optional)

The app works out-of-the-box with mocked schema/data for demos. To use a real Postgres database locally:

1) Create tables and seed data (Postgres):

```sql
-- scripts/001_create_sample_tables.sql
-- scripts/002_seed_sample_data.sql
```

2) Expose foreign keys helper (optional):

```sql
-- scripts/003_create_helper_functions.sql
```

3) Wire your client in `lib/database.ts` (replace mock functions with real queries or Supabase client). The UI expects the following shapes:

- `TableInfo { table_name, columns[] }`
- `ForeignKey { table_name, column_name, foreign_table_name, foreign_column_name }`

## Key Features

- Visual JOIN builder with multiple predicates per connection and JOIN type switching
- JOIN visualizations and active joins management panel
- Query Builder: SELECT, JOIN, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT
- Live validation (syntax hints, alias awareness, performance warnings)
- Templates aligned with the provided demo schema

## Tech Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS + Shadcn UI
- @xyflow/react for the visual canvas

## Contributing

1. Create a feature branch from `main`.
2. Commit using Conventional Commits (e.g., `feat:`, `fix:`, `docs:`).
3. Open a Pull Request.

## License

MIT
