import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    // Basic validation - only allow SELECT statements
    const trimmedQuery = query.trim().toUpperCase()
    if (!trimmedQuery.startsWith("SELECT")) {
      return NextResponse.json({ error: "Only SELECT statements are allowed" }, { status: 400 })
    }

    const result = await executeQuery(query)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Query execution error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
