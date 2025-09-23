"use client"

import { useState } from "react"
import { Download, FileText, TableIcon, AlertCircle, Loader2, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface QueryResultsProps {
  data: any[]
  error: string | null
  isLoading: boolean
  executedQuery: string
  onExport?: (format: "csv" | "json") => void
  onNavigateBack?: () => void
}

export function QueryResults({ data, error, isLoading, executedQuery, onExport, onNavigateBack }: QueryResultsProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Calculate pagination
  const totalRows = data.length
  const totalPages = Math.ceil(totalRows / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalRows)
  const paginatedData = data.slice(startIndex, endIndex)

  // Get column names from the first row
  const columns = data.length > 0 ? Object.keys(data[0]) : []

  const exportToCSV = () => {
    if (data.length === 0) return

    const csvContent = [
      columns.join(","), // Header row
      ...data.map((row) => columns.map((col) => `"${row[col] || ""}"`).join(",")), // Data rows
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `query_results_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    onExport?.("csv")
  }

  const exportToJSON = () => {
    if (data.length === 0) return

    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `query_results_${new Date().toISOString().split("T")[0]}.json`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    onExport?.("json")
  }

  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return "NULL"
    if (typeof value === "boolean") return value.toString()
    if (typeof value === "object") return JSON.stringify(value)
    if (typeof value === "string" && value.length > 100) {
      return value.substring(0, 100) + "..."
    }
    return value.toString()
  }

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onNavigateBack && (
              <Button onClick={onNavigateBack} size="sm" variant="ghost" className="mr-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Builder
              </Button>
            )}
            <CardTitle className="text-lg flex items-center gap-2">
              <TableIcon className="h-5 w-5" />
              Query Results
            </CardTitle>
            {data.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {totalRows} rows
              </Badge>
            )}
          </div>
          {data.length > 0 && (
            <div className="flex items-center gap-2">
              <Button onClick={exportToCSV} size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button onClick={exportToJSON} size="sm" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Executing query...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-mono text-sm">{error}</AlertDescription>
            </Alert>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TableIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Results</h3>
            <p className="text-muted-foreground mb-4">
              {executedQuery ? "Your query returned no results." : "Execute a query to see results here."}
            </p>
            {executedQuery && (
              <div className="bg-muted p-3 rounded-md max-w-md">
                <p className="text-sm font-mono text-muted-foreground">{executedQuery}</p>
              </div>
            )}
            {!executedQuery && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Build your query in the Query Builder tab, then click "Execute & View Results" to see your data here automatically!
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Results Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table disableScrollContainer>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead key={column} className="font-semibold">
                          {column}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((row, index) => (
                      <TableRow key={startIndex + index}>
                        {columns.map((column) => (
                          <TableCell key={column} className="font-mono text-sm">
                            {formatCellValue(row[column])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 pb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Rows per page:</span>
                  <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{endIndex} of {totalRows}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      {"<<"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      {"<"}
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4 + i))
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNum)}
                            className="h-8 w-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      {">"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      {">>"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Query Info */}
            {executedQuery && (
              <div className="px-4 pb-4">
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-xs text-muted-foreground mb-1">Executed Query:</p>
                  <p className="text-sm font-mono">{executedQuery}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
