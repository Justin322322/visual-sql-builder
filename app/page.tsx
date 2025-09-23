"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { SchemaExplorer } from "@/components/schema-explorer"
import { QueryBuilder } from "@/components/query-builder"
import { QueryResults } from "@/components/query-results"
import { VisualJoinBuilder } from "@/components/visual-join-builder"
import { getTableSchema, getForeignKeys, type TableInfo, type ForeignKey } from "@/lib/database"
import { Loader2, Database } from "lucide-react"

export default function HomePage() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [foreignKeys, setForeignKeys] = useState<ForeignKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentQuery, setCurrentQuery] = useState("")
  const [queryResults, setQueryResults] = useState<any[]>([])
  const [queryError, setQueryError] = useState<string | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)

  // Load schema on component mount
  useEffect(() => {
    const loadSchema = async () => {
      try {
        setIsLoading(true)
        const [tablesData, foreignKeysData] = await Promise.all([getTableSchema(), getForeignKeys()])
        setTables(tablesData)
        setForeignKeys(foreignKeysData)
      } catch (error) {
        console.error("Failed to load schema:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSchema()
  }, [])

  const executeQuery = async (query: string) => {
    if (!query.trim()) return

    setIsExecuting(true)
    setQueryError(null)

    try {
      const response = await fetch("/api/execute-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      })

      const result = await response.json()

      if (result.error) {
        setQueryError(result.error)
        setQueryResults([])
      } else {
        setQueryResults(result.data || [])
        setQueryError(null)
      }
    } catch (error) {
      setQueryError(error instanceof Error ? error.message : "Failed to execute query")
      setQueryResults([])
    } finally {
      setIsExecuting(false)
    }
  }

  const handleTableSelect = (tableName: string) => {
    console.log("Selected table:", tableName)
  }

  const handleColumnSelect = (tableName: string, columnName: string) => {
    console.log("Selected column:", tableName, columnName)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading database schema...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background px-6 py-4">
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Visual SQL Query Builder</h1>
          <div className="ml-auto text-sm text-muted-foreground">
            {tables.length} tables • {foreignKeys.length} relationships
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Schema Sidebar */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div className="h-full p-4">
              <SchemaExplorer
                tables={tables}
                foreignKeys={foreignKeys}
                onTableSelect={handleTableSelect}
                onColumnSelect={handleColumnSelect}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Main Content Area */}
          <ResizablePanel defaultSize={80}>
            <div className="h-full">
              <Tabs defaultValue="builder" className="h-full flex flex-col">
                <div className="border-b px-6 py-2">
                  <TabsList>
                    <TabsTrigger value="builder">Query Builder</TabsTrigger>
                    <TabsTrigger value="visual">Visual JOINs</TabsTrigger>
                    <TabsTrigger value="results">Results</TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-auto">
                  <TabsContent value="builder" className="h-full m-0">
                    <div className="p-6">
                      <QueryBuilder tables={tables} onQueryChange={setCurrentQuery} onExecuteQuery={executeQuery} />
                    </div>
                  </TabsContent>

                  <TabsContent value="visual" className="h-full m-0">
                    <div className="p-6">
                      <VisualJoinBuilder
                        tables={tables}
                        foreignKeys={foreignKeys}
                        onJoinsChange={(joins) => {
                          console.log("Joins updated:", joins)
                        }}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="results" className="h-full m-0">
                    <div className="p-6">
                      <QueryResults
                        data={queryResults}
                        error={queryError}
                        isLoading={isExecuting}
                        executedQuery={currentQuery}
                        onExport={(format) => {
                          console.log(`Exported as ${format}`)
                        }}
                      />
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
