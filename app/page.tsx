"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { SchemaExplorer } from "@/components/schema-explorer"
import { QueryBuilder } from "@/components/query-builder"
import { QueryResults } from "@/components/query-results"
import { VisualJoinBuilder } from "@/components/visual-join-builder"
import { getTableSchema, getForeignKeys, type TableInfo, type ForeignKey } from "@/lib/database"
import { Loader2, Database, CheckCircle } from "lucide-react"

export default function HomePage() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [foreignKeys, setForeignKeys] = useState<ForeignKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentQuery, setCurrentQuery] = useState("")
  const [queryResults, setQueryResults] = useState<any[]>([])
  const [queryError, setQueryError] = useState<string | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [queryExecutionTime, setQueryExecutionTime] = useState<number | null>(null)
  
  // Tab state management
  const [activeTab, setActiveTab] = useState("builder")
  
  // Success notification state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  
  // Shared state for connecting workflows
  const [visualJoins, setVisualJoins] = useState<any[]>([])
  const [queryValidation, setQueryValidation] = useState<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  }>({ isValid: true, errors: [], warnings: [] })

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
    setQueryResults([])
    setQueryExecutionTime(null)

    const startTime = performance.now()

    try {
      const response = await fetch("/api/execute-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      })

      const result = await response.json()

      const endTime = performance.now()
      const executionTime = Math.round(endTime - startTime)
      setQueryExecutionTime(executionTime)

      if (result.error) {
        setQueryError(result.error)
        setQueryResults([])
      } else {
        setQueryResults(result.data || [])
        setQueryError(null)
        
        // Show success notification
        setShowSuccessMessage(true)
        setTimeout(() => setShowSuccessMessage(false), 3000)
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

  // Handle quick actions from schema explorer
  const handleAddToQuery = (type: 'field' | 'join', data: any) => {
    console.log(`Quick add ${type}:`, data)
    // This will be handled by the QueryBuilder component
  }

  // Handle visual joins changes and sync with query builder
  const handleVisualJoinsChange = (joins: any[]) => {
    setVisualJoins(joins)
    console.log("Visual joins updated:", joins)
  }

  const handleApplyVisualJoins = (joins: any[]) => {
    setVisualJoins(joins)
    setActiveTab("builder")
  }

  // Validate query in real-time
  const validateQuery = (query: string) => {
    const errors: string[] = []
    const warnings: string[] = []

    if (!query.trim()) {
      setQueryValidation({ isValid: true, errors: [], warnings: [] })
      return
    }

    // Basic syntax validation
    const trimmedQuery = query.trim().toUpperCase()
    
    if (!trimmedQuery.startsWith("SELECT")) {
      errors.push("Query must start with SELECT")
    }

    if (trimmedQuery.includes("SELECT") && !trimmedQuery.includes("FROM")) {
      errors.push("SELECT statement must include FROM clause")
    }

    // Check for undefined table references (support aliases)
    // 1) Collect known table names from schema
    const knownNames = new Set<string>(tables.map(t => t.table_name.toLowerCase()))

    // 2) Collect aliases from FROM/JOIN clauses: FROM table [AS] alias, JOIN table [AS] alias
    const aliasRegex = /\b(?:FROM|JOIN)\s+(\w+)(?:\s+(?:AS\s+)?(\w+))?/gi
    let aliasMatch: RegExpExecArray | null
    while ((aliasMatch = aliasRegex.exec(query)) !== null) {
      const baseTable = (aliasMatch[1] || '').toLowerCase()
      const alias = (aliasMatch[2] || '').toLowerCase()
      if (baseTable) knownNames.add(baseTable)
      if (alias) knownNames.add(alias)
    }

    // 3) Extract table qualifiers used in expressions: qualifier.column
    const qualifierMatches = query.match(/\b(\w+)\s*\.\s*\w+\b/g)
    if (qualifierMatches) {
      const qualifiers = [...new Set(qualifierMatches.map(m => m.split('.')[0].trim().toLowerCase()))]
      const undefinedQualifiers = qualifiers.filter(q => !knownNames.has(q))
      if (undefinedQualifiers.length > 0) {
        errors.push(`Undefined tables: ${undefinedQualifiers.join(', ')}`)
      }
    }

    // Performance warnings
    if (query.includes('SELECT *')) {
      warnings.push("Consider selecting specific columns instead of * for better performance")
    }

    if (query.includes('ORDER BY') && !query.includes('LIMIT')) {
      warnings.push("Consider adding LIMIT clause when using ORDER BY")
    }

    setQueryValidation({ 
      isValid: errors.length === 0, 
      errors, 
      warnings 
    })
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
      {/* Success Notification */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 shadow-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Query executed successfully! Viewing results now.
            </span>
          </div>
        </div>
      )}

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
                onAddToQuery={handleAddToQuery}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Main Content Area */}
          <ResizablePanel defaultSize={80}>
            <div className="h-full">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <div className="border-b px-6 py-2">
                  <TabsList>
                    <TabsTrigger value="builder">Query Builder</TabsTrigger>
                    <TabsTrigger value="visual">Visual JOINs</TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-auto">
                  <TabsContent value="builder" className="h-full m-0">
                    <div className="p-6">
                      <QueryBuilder 
                        tables={tables} 
                        visualJoins={visualJoins}
                        onQueryChange={(query) => {
                          setCurrentQuery(query)
                          validateQuery(query)
                        }} 
                        onExecuteQuery={executeQuery}
                        queryValidation={queryValidation}
                        queryResults={queryResults}
                        queryError={queryError}
                        isExecuting={isExecuting}
                        queryExecutionTime={queryExecutionTime}
                        onClearResults={() => {
                          setQueryResults([])
                          setQueryError(null)
                          setQueryExecutionTime(null)
                        }}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="visual" className="h-full m-0">
                    <div className="p-6">
                      <VisualJoinBuilder
                        tables={tables}
                        foreignKeys={foreignKeys}
                        onJoinsChange={handleVisualJoinsChange}
                        onApplyToQuery={handleApplyVisualJoins}
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
