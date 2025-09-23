"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Play, Copy, RotateCcw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { TableInfo } from "@/lib/database"

interface QueryField {
  id: string
  table: string
  column: string
  alias?: string
}

interface WhereCondition {
  id: string
  table: string
  column: string
  operator: string
  value: string
  logicalOperator?: "AND" | "OR"
}

interface OrderByField {
  id: string
  table: string
  column: string
  direction: "ASC" | "DESC"
}

interface JoinClause {
  id: string
  type: "INNER" | "LEFT" | "RIGHT" | "FULL"
  table: string
  onCondition: string
}

interface QueryBuilderProps {
  tables: TableInfo[]
  onQueryChange?: (query: string) => void
  onExecuteQuery?: (query: string) => void
}

export function QueryBuilder({ tables, onQueryChange, onExecuteQuery }: QueryBuilderProps) {
  const [selectedFields, setSelectedFields] = useState<QueryField[]>([])
  const [whereConditions, setWhereConditions] = useState<WhereCondition[]>([])
  const [orderByFields, setOrderByFields] = useState<OrderByField[]>([])
  const [joinClauses, setJoinClauses] = useState<JoinClause[]>([])
  const [limit, setLimit] = useState<string>("")
  const [generatedQuery, setGeneratedQuery] = useState<string>("")

  // Generate SQL query whenever conditions change
  useEffect(() => {
    const query = generateSQLQuery()
    setGeneratedQuery(query)
    onQueryChange?.(query)
  }, [selectedFields, whereConditions, orderByFields, joinClauses, limit])

  const generateSQLQuery = (): string => {
    if (selectedFields.length === 0) return ""

    let query = "SELECT "

    // SELECT clause
    const selectFields = selectedFields.map((field) => {
      const fieldName = `${field.table}.${field.column}`
      return field.alias ? `${fieldName} AS ${field.alias}` : fieldName
    })
    query += selectFields.join(", ")

    // FROM clause - get the first table from selected fields
    const fromTable = selectedFields[0]?.table
    if (fromTable) {
      query += `\nFROM ${fromTable}`
    }

    // JOIN clauses
    if (joinClauses.length > 0) {
      joinClauses.forEach((join) => {
        query += `\n${join.type} JOIN ${join.table} ON ${join.onCondition}`
      })
    }

    // WHERE clause
    if (whereConditions.length > 0) {
      query += "\nWHERE "
      const whereClause = whereConditions
        .map((condition, index) => {
          const conditionStr = `${condition.table}.${condition.column} ${condition.operator} '${condition.value}'`
          if (index === 0) return conditionStr
          return `${condition.logicalOperator || "AND"} ${conditionStr}`
        })
        .join(" ")
      query += whereClause
    }

    // ORDER BY clause
    if (orderByFields.length > 0) {
      query += "\nORDER BY "
      const orderFields = orderByFields.map((field) => `${field.table}.${field.column} ${field.direction}`)
      query += orderFields.join(", ")
    }

    // LIMIT clause
    if (limit && Number.parseInt(limit) > 0) {
      query += `\nLIMIT ${limit}`
    }

    return query
  }

  const addField = () => {
    const newField: QueryField = {
      id: Date.now().toString(),
      table: tables[0]?.table_name || "",
      column: tables[0]?.columns[0]?.column_name || "",
    }
    setSelectedFields([...selectedFields, newField])
  }

  const removeField = (id: string) => {
    setSelectedFields(selectedFields.filter((field) => field.id !== id))
  }

  const updateField = (id: string, updates: Partial<QueryField>) => {
    setSelectedFields(selectedFields.map((field) => (field.id === id ? { ...field, ...updates } : field)))
  }

  const addWhereCondition = () => {
    const newCondition: WhereCondition = {
      id: Date.now().toString(),
      table: tables[0]?.table_name || "",
      column: tables[0]?.columns[0]?.column_name || "",
      operator: "=",
      value: "",
      logicalOperator: whereConditions.length > 0 ? "AND" : undefined,
    }
    setWhereConditions([...whereConditions, newCondition])
  }

  const removeWhereCondition = (id: string) => {
    setWhereConditions(whereConditions.filter((condition) => condition.id !== id))
  }

  const updateWhereCondition = (id: string, updates: Partial<WhereCondition>) => {
    setWhereConditions(
      whereConditions.map((condition) => (condition.id === id ? { ...condition, ...updates } : condition)),
    )
  }

  const addOrderByField = () => {
    const newOrderBy: OrderByField = {
      id: Date.now().toString(),
      table: tables[0]?.table_name || "",
      column: tables[0]?.columns[0]?.column_name || "",
      direction: "ASC",
    }
    setOrderByFields([...orderByFields, newOrderBy])
  }

  const removeOrderByField = (id: string) => {
    setOrderByFields(orderByFields.filter((field) => field.id !== id))
  }

  const updateOrderByField = (id: string, updates: Partial<OrderByField>) => {
    setOrderByFields(orderByFields.map((field) => (field.id === id ? { ...field, ...updates } : field)))
  }

  const addJoinClause = () => {
    const newJoin: JoinClause = {
      id: Date.now().toString(),
      type: "INNER",
      table: tables[1]?.table_name || "",
      onCondition: "",
    }
    setJoinClauses([...joinClauses, newJoin])
  }

  const removeJoinClause = (id: string) => {
    setJoinClauses(joinClauses.filter((join) => join.id !== id))
  }

  const updateJoinClause = (id: string, updates: Partial<JoinClause>) => {
    setJoinClauses(joinClauses.map((join) => (join.id === id ? { ...join, ...updates } : join)))
  }

  const resetQuery = () => {
    setSelectedFields([])
    setWhereConditions([])
    setOrderByFields([])
    setJoinClauses([])
    setLimit("")
  }

  const copyQuery = () => {
    navigator.clipboard.writeText(generatedQuery)
  }

  const getColumnsForTable = (tableName: string) => {
    return tables.find((table) => table.table_name === tableName)?.columns || []
  }

  return (
    <div className="space-y-6">
      {/* SELECT Fields */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">SELECT Fields</CardTitle>
            <Button onClick={addField} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedFields.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No fields selected. Add a field to start building your query.
            </p>
          ) : (
            selectedFields.map((field) => (
              <div key={field.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Table</Label>
                    <Select value={field.table} onValueChange={(value) => updateField(field.id, { table: value })}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tables.map((table) => (
                          <SelectItem key={table.table_name} value={table.table_name}>
                            {table.table_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Column</Label>
                    <Select value={field.column} onValueChange={(value) => updateField(field.id, { column: value })}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getColumnsForTable(field.table).map((column) => (
                          <SelectItem key={column.column_name} value={column.column_name}>
                            {column.column_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Alias (optional)</Label>
                    <Input
                      className="h-8"
                      placeholder="alias"
                      value={field.alias || ""}
                      onChange={(e) => updateField(field.id, { alias: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={() => removeField(field.id)} size="sm" variant="ghost">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* JOIN Clauses */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">JOIN Clauses</CardTitle>
            <Button onClick={addJoinClause} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add JOIN
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {joinClauses.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No joins defined. Add a JOIN to combine data from multiple tables.
            </p>
          ) : (
            joinClauses.map((join) => (
              <div key={join.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Join Type</Label>
                    <Select
                      value={join.type}
                      onValueChange={(value: any) => updateJoinClause(join.id, { type: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INNER">INNER JOIN</SelectItem>
                        <SelectItem value="LEFT">LEFT JOIN</SelectItem>
                        <SelectItem value="RIGHT">RIGHT JOIN</SelectItem>
                        <SelectItem value="FULL">FULL JOIN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Table</Label>
                    <Select value={join.table} onValueChange={(value) => updateJoinClause(join.id, { table: value })}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tables.map((table) => (
                          <SelectItem key={table.table_name} value={table.table_name}>
                            {table.table_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">ON Condition</Label>
                    <Input
                      className="h-8"
                      placeholder="table1.id = table2.foreign_id"
                      value={join.onCondition}
                      onChange={(e) => updateJoinClause(join.id, { onCondition: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={() => removeJoinClause(join.id)} size="sm" variant="ghost">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* WHERE Conditions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">WHERE Conditions</CardTitle>
            <Button onClick={addWhereCondition} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Condition
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {whereConditions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No conditions defined. Add conditions to filter your results.
            </p>
          ) : (
            whereConditions.map((condition, index) => (
              <div key={condition.id} className="flex items-center gap-3 p-3 border rounded-lg">
                {index > 0 && (
                  <div className="w-16">
                    <Select
                      value={condition.logicalOperator}
                      onValueChange={(value: any) => updateWhereCondition(condition.id, { logicalOperator: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">AND</SelectItem>
                        <SelectItem value="OR">OR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex-1 grid grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Table</Label>
                    <Select
                      value={condition.table}
                      onValueChange={(value) => updateWhereCondition(condition.id, { table: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tables.map((table) => (
                          <SelectItem key={table.table_name} value={table.table_name}>
                            {table.table_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Column</Label>
                    <Select
                      value={condition.column}
                      onValueChange={(value) => updateWhereCondition(condition.id, { column: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getColumnsForTable(condition.table).map((column) => (
                          <SelectItem key={column.column_name} value={column.column_name}>
                            {column.column_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Operator</Label>
                    <Select
                      value={condition.operator}
                      onValueChange={(value) => updateWhereCondition(condition.id, { operator: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="=">=</SelectItem>
                        <SelectItem value="!=">!=</SelectItem>
                        <SelectItem value="<">{"<"}</SelectItem>
                        <SelectItem value=">">{">"}</SelectItem>
                        <SelectItem value="<=">{"<="}</SelectItem>
                        <SelectItem value=">=">{">="}</SelectItem>
                        <SelectItem value="LIKE">LIKE</SelectItem>
                        <SelectItem value="IN">IN</SelectItem>
                        <SelectItem value="IS NULL">IS NULL</SelectItem>
                        <SelectItem value="IS NOT NULL">IS NOT NULL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Value</Label>
                    <Input
                      className="h-8"
                      placeholder="value"
                      value={condition.value}
                      onChange={(e) => updateWhereCondition(condition.id, { value: e.target.value })}
                      disabled={condition.operator === "IS NULL" || condition.operator === "IS NOT NULL"}
                    />
                  </div>
                </div>
                <Button onClick={() => removeWhereCondition(condition.id)} size="sm" variant="ghost">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* ORDER BY */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">ORDER BY</CardTitle>
            <Button onClick={addOrderByField} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Order
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {orderByFields.length === 0 ? (
            <p className="text-muted-foreground text-sm">No ordering defined. Add fields to sort your results.</p>
          ) : (
            orderByFields.map((orderField) => (
              <div key={orderField.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Table</Label>
                    <Select
                      value={orderField.table}
                      onValueChange={(value) => updateOrderByField(orderField.id, { table: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tables.map((table) => (
                          <SelectItem key={table.table_name} value={table.table_name}>
                            {table.table_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Column</Label>
                    <Select
                      value={orderField.column}
                      onValueChange={(value) => updateOrderByField(orderField.id, { column: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getColumnsForTable(orderField.table).map((column) => (
                          <SelectItem key={column.column_name} value={column.column_name}>
                            {column.column_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Direction</Label>
                    <Select
                      value={orderField.direction}
                      onValueChange={(value: any) => updateOrderByField(orderField.id, { direction: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ASC">ASC</SelectItem>
                        <SelectItem value="DESC">DESC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={() => removeOrderByField(orderField.id)} size="sm" variant="ghost">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* LIMIT */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">LIMIT</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Label className="text-sm">Limit results to:</Label>
            <Input
              type="number"
              placeholder="100"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">rows</span>
          </div>
        </CardContent>
      </Card>

      {/* Generated Query Preview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Generated SQL Query</CardTitle>
            <div className="flex gap-2">
              <Button onClick={copyQuery} size="sm" variant="outline" disabled={!generatedQuery}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button onClick={resetQuery} size="sm" variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button onClick={() => onExecuteQuery?.(generatedQuery)} size="sm" disabled={!generatedQuery}>
                <Play className="h-4 w-4 mr-2" />
                Execute
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {generatedQuery ? (
            <Textarea
              value={generatedQuery}
              readOnly
              className="font-mono text-sm min-h-[120px] bg-muted"
              placeholder="Your generated SQL query will appear here..."
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No query generated yet.</p>
              <p className="text-sm">Add some SELECT fields to start building your query.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
