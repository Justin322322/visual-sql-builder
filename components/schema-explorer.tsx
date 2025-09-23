"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, Table, Columns, Key, Link, Search, Database } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { TableInfo, ColumnInfo, ForeignKey } from "@/lib/database"

interface SchemaExplorerProps {
  tables: TableInfo[]
  foreignKeys: ForeignKey[]
  onTableSelect?: (tableName: string) => void
  onColumnSelect?: (tableName: string, columnName: string) => void
}

export function SchemaExplorer({ tables, foreignKeys, onTableSelect, onColumnSelect }: SchemaExplorerProps) {
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")

  const toggleTable = (tableName: string) => {
    const newExpanded = new Set(expandedTables)
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName)
    } else {
      newExpanded.add(tableName)
    }
    setExpandedTables(newExpanded)
  }

  const filteredTables = tables.filter(
    (table) =>
      table.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.columns.some((col) => col.column_name.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const getColumnIcon = (column: ColumnInfo, tableName: string) => {
    // Check if this column is a foreign key
    const isForeignKey = foreignKeys.some((fk) => fk.table_name === tableName && fk.column_name === column.column_name)

    // Check if this column is likely a primary key
    const isPrimaryKey =
      column.column_name === "id" || (column.column_name.endsWith("_id") && column.column_name === "id")

    if (isForeignKey) {
      return <Link className="h-3 w-3 text-blue-500" />
    }
    if (isPrimaryKey || column.column_name === "id") {
      return <Key className="h-3 w-3 text-yellow-500" />
    }
    return <Columns className="h-3 w-3 text-gray-500" />
  }

  const getDataTypeBadge = (dataType: string) => {
    const color =
      dataType.includes("varchar") || dataType.includes("text")
        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
        : dataType.includes("int") || dataType.includes("decimal") || dataType.includes("numeric")
          ? "bg-blue-100 text-blue-700 border-blue-200"
          : dataType.includes("timestamp") || dataType.includes("date")
            ? "bg-purple-100 text-purple-700 border-purple-200"
            : dataType.includes("uuid")
              ? "bg-orange-100 text-orange-700 border-orange-200"
              : "bg-gray-100 text-gray-700 border-gray-200"

    return (
      <Badge variant="outline" className={`text-xs font-mono ${color}`}>
        {dataType}
      </Badge>
    )
  }

  const getForeignKeyInfo = (tableName: string, columnName: string) => {
    return foreignKeys.find((fk) => fk.table_name === tableName && fk.column_name === columnName)
  }

  return (
    <Card className="h-full shadow-sm border-0 bg-slate-50/50">
      <CardHeader className="pb-4 border-b bg-white/80 backdrop-blur-sm">
        <CardTitle className="text-lg flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-600" />
          Schema Explorer
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tables and columns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9 bg-white/80"
          />
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            {filteredTables.length} tables
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            {foreignKeys.length} relations
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="p-4 space-y-3">
            {filteredTables.map((table) => (
              <Collapsible
                key={table.table_name}
                open={expandedTables.has(table.table_name)}
                onOpenChange={() => toggleTable(table.table_name)}
              >
                <CollapsibleTrigger
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/80 hover:shadow-sm transition-all duration-200 cursor-pointer group border border-transparent hover:border-gray-200"
                  onClick={() => onTableSelect?.(table.table_name)}
                >
                  {expandedTables.has(table.table_name) ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Table className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-semibold text-sm text-gray-900">{table.table_name}</span>
                    <div className="text-xs text-gray-500 mt-0.5">{table.columns.length} columns</div>
                  </div>
                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 border-0">
                    {table.columns.length}
                  </Badge>
                </CollapsibleTrigger>
                <CollapsibleContent className="ml-4 mt-2 space-y-1">
                  <div className="border-l-2 border-gray-200 pl-4 space-y-2">
                    {table.columns.map((column) => {
                      const foreignKey = getForeignKeyInfo(table.table_name, column.column_name)
                      const isHighlighted =
                        searchTerm && column.column_name.toLowerCase().includes(searchTerm.toLowerCase())

                      return (
                        <div
                          key={column.column_name}
                          className={`flex items-center gap-3 p-2 rounded-md hover:bg-white/60 cursor-pointer group transition-all duration-150 ${
                            isHighlighted ? "bg-yellow-50 border border-yellow-200" : ""
                          }`}
                          onClick={() => onColumnSelect?.(table.table_name, column.column_name)}
                        >
                          <div className="flex items-center justify-center w-6 h-6">
                            {getColumnIcon(column, table.table_name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-mono text-gray-800 block truncate">{column.column_name}</span>
                            {foreignKey && (
                              <div className="text-xs text-blue-600 mt-0.5">
                                → {foreignKey.foreign_table_name}.{foreignKey.foreign_column_name}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {getDataTypeBadge(column.data_type)}
                            {column.is_nullable === "NO" && (
                              <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                NOT NULL
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}

            {filteredTables.length === 0 && searchTerm && (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tables or columns found matching "{searchTerm}"</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
