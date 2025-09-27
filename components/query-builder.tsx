"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Play, Copy, RotateCcw, BookOpen, Sparkles, Users, Trophy, Package, BarChart3, User, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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

interface GroupByField {
  id: string
  table: string
  column: string
}

interface AggregateField {
  id: string
  function: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'COUNT_DISTINCT'
  table: string
  column: string
  alias?: string
}

interface HavingCondition {
  id: string
  aggregateFunction: string
  operator: string
  value: string
  logicalOperator?: "AND" | "OR"
}

interface QueryValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

interface QueryBuilderProps {
  tables: TableInfo[]
  visualJoins?: any[]
  onQueryChange?: (query: string) => void
  onExecuteQuery?: (query: string) => void
  queryValidation?: QueryValidation
  queryResults?: any[]
  queryError?: string | null
  isExecuting?: boolean
  queryExecutionTime?: number | null
  onClearResults?: () => void
}

// Query Templates
const QUERY_TEMPLATES = [
  {
    id: "users-with-orders",
    name: "Users with Order Count",
    description: "Get all users with their total order count",
    icon: Users,
    category: "Basic Analytics",
    query: `SELECT u.id, u.email, u.first_name, u.last_name, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.email, u.first_name, u.last_name
ORDER BY order_count DESC`
  },
  {
    id: "top-products",
    name: "Top Products by Sales",
    description: "Find best-selling products by quantity",
    icon: Trophy,
    category: "Sales Analytics",
    query: `SELECT p.id, p.name, p.price,
SUM(oi.quantity) AS total_sold,
SUM(oi.quantity * oi.price) AS total_revenue
FROM products p
JOIN order_items oi ON oi.product_id = p.id
GROUP BY p.id, p.name, p.price
ORDER BY total_sold DESC
LIMIT 10`
  },
  {
    id: "recent-orders",
    name: "Recent Orders with Details",
    description: "Get recent orders with user and product information",
    icon: Package,
    category: "Order Management",
    query: `SELECT o.id, o.created_at, u.email, u.first_name, u.last_name, o.total_amount, o.status
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.created_at >= NOW() - INTERVAL '7 days'
ORDER BY o.created_at DESC
LIMIT 50`
  },
  {
    id: "category-analysis",
    name: "Category Performance",
    description: "Analyze product categories by sales and revenue",
    icon: BarChart3,
    category: "Category Analytics",
    query: `SELECT c.id, c.name AS category_name,
COUNT(DISTINCT p.id) AS product_count,
COALESCE(SUM(oi.quantity), 0) AS total_quantity,
COALESCE(SUM(oi.quantity * oi.price), 0) AS total_revenue,
AVG(p.price) AS avg_price
FROM categories c
JOIN products p ON p.category_id = c.id
LEFT JOIN order_items oi ON oi.product_id = p.id
GROUP BY c.id, c.name
ORDER BY total_revenue DESC`
  },
  {
    id: "user-activity",
    name: "User Activity Summary",
    description: "Summary of user activity and engagement",
    icon: User,
    category: "User Analytics",
    query: `SELECT u.id, u.email, u.first_name, u.last_name,
COUNT(DISTINCT o.id) AS order_count,
COUNT(DISTINCT oi.id) AS item_count,
COALESCE(SUM(o.total_amount), 0) AS total_spent,
MAX(o.created_at) AS last_order_date
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY u.id, u.email, u.first_name, u.last_name
HAVING COUNT(DISTINCT o.id) > 0
ORDER BY total_spent DESC`
  }
]

export function QueryBuilder({ tables, visualJoins = [], onQueryChange, onExecuteQuery, queryValidation, queryResults = [], queryError, isExecuting = false, queryExecutionTime, onClearResults }: QueryBuilderProps) {
  const [selectedFields, setSelectedFields] = useState<QueryField[]>([])
  const [whereConditions, setWhereConditions] = useState<WhereCondition[]>([])
  const [orderByFields, setOrderByFields] = useState<OrderByField[]>([])
  const [joinClauses, setJoinClauses] = useState<JoinClause[]>([])
  const [groupByFields, setGroupByFields] = useState<GroupByField[]>([])
  const [aggregateFields, setAggregateFields] = useState<AggregateField[]>([])
  const [havingConditions, setHavingConditions] = useState<HavingCondition[]>([])
  const [limit, setLimit] = useState<string>("")
  const [generatedQuery, setGeneratedQuery] = useState<string>("")
  const [showTemplates, setShowTemplates] = useState(false)
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false)
  const [showCopyFeedback, setShowCopyFeedback] = useState(false)
  const [isTemplateMode, setIsTemplateMode] = useState(false)

  // Sync visual joins with query builder
  useEffect(() => {
    if (visualJoins.length > 0) {
      const newJoinClauses = visualJoins.map((join: any) => ({
        id: join.id,
        type: join.joinType,
        table: join.toTable,
        onCondition: (join.conditions || [{ fromColumn: join.fromColumn, toColumn: join.toColumn }])
          .map((c: any) => `${join.fromTable}.${c.fromColumn} = ${join.toTable}.${c.toColumn}`)
          .join(" AND "),
      }))
      setJoinClauses(newJoinClauses)
    }
  }, [visualJoins])

  // Generate SQL query whenever conditions change (but not when in template mode)
  useEffect(() => {
    if (!isTemplateMode) {
      const query = generateSQLQuery()
      setGeneratedQuery(query)
      onQueryChange?.(query)
    }
  }, [selectedFields, whereConditions, orderByFields, joinClauses, groupByFields, aggregateFields, havingConditions, limit, isTemplateMode])

  const generateSQLQuery = (): string => {
    if (selectedFields.length === 0 && aggregateFields.length === 0) return ""

    let query = "SELECT "

    // SELECT clause - combine regular fields and aggregate fields
    const selectFields = selectedFields.map((field) => {
      const fieldName = `${field.table}.${field.column}`
      return field.alias ? `${fieldName} AS ${field.alias}` : fieldName
    })

    const aggregateSelectFields = aggregateFields.map((field) => {
      const fieldName = `${field.table}.${field.column}`
      const functionName = field.function === 'COUNT_DISTINCT' ? 'COUNT(DISTINCT' : field.function
      const closingParen = field.function === 'COUNT_DISTINCT' ? ')' : ''
      const alias = field.alias || `${field.function.toLowerCase()}_${field.column}`
      return `${functionName}(${fieldName})${closingParen} AS ${alias}`
    })

    const allSelectFields = [...selectFields, ...aggregateSelectFields]
    query += allSelectFields.join(", ")

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

    // GROUP BY clause
    if (groupByFields.length > 0) {
      query += "\nGROUP BY "
      const groupFields = groupByFields.map((field) => `${field.table}.${field.column}`)
      query += groupFields.join(", ")
    }

    // HAVING clause
    if (havingConditions.length > 0) {
      query += "\nHAVING "
      const havingClause = havingConditions
        .map((condition, index) => {
          const conditionStr = `${condition.aggregateFunction} ${condition.operator} ${condition.value}`
          if (index === 0) return conditionStr
          return `${condition.logicalOperator || "AND"} ${conditionStr}`
        })
        .join(" ")
      query += havingClause
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
    // Exit template mode when user starts building manually
    if (isTemplateMode) {
      setIsTemplateMode(false)
      setGeneratedQuery("")
    }
    
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
    setGroupByFields([])
    setAggregateFields([])
    setHavingConditions([])
    setLimit("")
    setIsTemplateMode(false)
    setGeneratedQuery("")
    onQueryChange?.("")
  }

  // GROUP BY functions
  const addGroupByField = () => {
    const newGroupBy: GroupByField = {
      id: Date.now().toString(),
      table: tables[0]?.table_name || "",
      column: tables[0]?.columns[0]?.column_name || "",
    }
    setGroupByFields([...groupByFields, newGroupBy])
  }

  const removeGroupByField = (id: string) => {
    setGroupByFields(groupByFields.filter((field) => field.id !== id))
  }

  const updateGroupByField = (id: string, updates: Partial<GroupByField>) => {
    setGroupByFields(groupByFields.map((field) => (field.id === id ? { ...field, ...updates } : field)))
  }

  // Aggregate functions
  const addAggregateField = () => {
    const newAggregate: AggregateField = {
      id: Date.now().toString(),
      function: 'COUNT',
      table: tables[0]?.table_name || "",
      column: tables[0]?.columns[0]?.column_name || "",
    }
    setAggregateFields([...aggregateFields, newAggregate])
  }

  const removeAggregateField = (id: string) => {
    setAggregateFields(aggregateFields.filter((field) => field.id !== id))
  }

  const updateAggregateField = (id: string, updates: Partial<AggregateField>) => {
    setAggregateFields(aggregateFields.map((field) => (field.id === id ? { ...field, ...updates } : field)))
  }

  // HAVING functions
  const addHavingCondition = () => {
    const newHaving: HavingCondition = {
      id: Date.now().toString(),
      aggregateFunction: "COUNT(*)",
      operator: ">",
      value: "0",
      logicalOperator: havingConditions.length > 0 ? "AND" : undefined,
    }
    setHavingConditions([...havingConditions, newHaving])
  }

  const removeHavingCondition = (id: string) => {
    setHavingConditions(havingConditions.filter((condition) => condition.id !== id))
  }

  const updateHavingCondition = (id: string, updates: Partial<HavingCondition>) => {
    setHavingConditions(
      havingConditions.map((condition) => (condition.id === id ? { ...condition, ...updates } : condition)),
    )
  }

  const copyQuery = async () => {
    try {
      await navigator.clipboard.writeText(generatedQuery)
      setShowCopyFeedback(true)
      setTimeout(() => setShowCopyFeedback(false), 2000)
    } catch (err) {
      console.error('Failed to copy query:', err)
    }
  }

  // Quick action functions
  const addLimit = (limitValue: string) => {
    if (generatedQuery) {
      // If there's a generated query (from template), modify it directly
      let newQuery = generatedQuery
      if (newQuery.includes('LIMIT')) {
        // Replace existing LIMIT
        newQuery = newQuery.replace(/LIMIT\s+\d+/i, `LIMIT ${limitValue}`)
      } else {
        // Add new LIMIT at the end
        newQuery = newQuery + `\nLIMIT ${limitValue}`
      }
      setGeneratedQuery(newQuery)
      onQueryChange?.(newQuery)
    } else {
      // If no generated query, use the form builder approach
      setLimit(limitValue)
    }
  }

  const addCommonWhere = (condition: string) => {
    if (generatedQuery) {
      // If there's a generated query (from template), modify it directly
      let newQuery = generatedQuery
      const whereClause = `created_at >= '${condition}'`
      if (newQuery.includes('WHERE')) {
        // Add to existing WHERE clause
        newQuery = newQuery.replace(/(WHERE\s+.*?)(\n|ORDER BY|GROUP BY|HAVING|LIMIT|$)/i, `$1 AND ${whereClause}$2`)
      } else {
        // Add new WHERE clause before ORDER BY, GROUP BY, HAVING, or LIMIT
        const insertBefore = /(\n(?:ORDER BY|GROUP BY|HAVING|LIMIT))/i
        if (insertBefore.test(newQuery)) {
          newQuery = newQuery.replace(insertBefore, `\nWHERE ${whereClause}$1`)
        } else {
          newQuery = newQuery + `\nWHERE ${whereClause}`
        }
      }
      setGeneratedQuery(newQuery)
      onQueryChange?.(newQuery)
    } else {
      // If no generated query, use the form builder approach
      const newCondition: WhereCondition = {
        id: Date.now().toString(),
        table: tables[0]?.table_name || "",
        column: "created_at",
        operator: ">=",
        value: condition,
        logicalOperator: whereConditions.length > 0 ? "AND" : undefined,
      }
      setWhereConditions([...whereConditions, newCondition])
    }
  }

  const optimizeQuery = () => {
    if (generatedQuery) {
      // If there's a generated query (from template), modify it directly
      let newQuery = generatedQuery
      if (newQuery.includes('ORDER BY') && !newQuery.includes('LIMIT')) {
        newQuery = newQuery + '\nLIMIT 100'
        setGeneratedQuery(newQuery)
        onQueryChange?.(newQuery)
      }
    } else {
      // If no generated query, use the form builder approach
      if (orderByFields.length > 0 && !limit) {
        setLimit("100")
      }
    }
    console.log("Query optimized!")
  }

  // Load template
  const loadTemplate = (template: any) => {
    setIsLoadingTemplate(true)
    setIsTemplateMode(true)
    
    // Clear any existing results and errors first
    onClearResults?.()
    
    // Parse the template query and populate the builder
    // For now, we'll set the generated query directly
    setGeneratedQuery(template.query)
    
    // Delay the onQueryChange call to ensure clearResults has processed
    setTimeout(() => {
      onQueryChange?.(template.query)
      setIsLoadingTemplate(false)
    }, 100)
    
    setShowTemplates(false)
    
    // Don't execute automatically - let user choose when to run it
  }

  const getColumnsForTable = (tableName: string) => {
    return tables.find((table) => table.table_name === tableName)?.columns || []
  }

  return (
    <>
      {/* Copy Feedback Notification */}
      {showCopyFeedback && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 shadow-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Query copied to clipboard!
            </span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
      {/* Left Column - Query Builder Forms */}
      <div className="lg:col-span-3 space-y-6 pr-2">
        {/* Query Templates */}
        <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Query Templates
            </CardTitle>
            <Button 
              onClick={() => setShowTemplates(!showTemplates)} 
              size="sm" 
              variant="outline"
              className={showTemplates ? "bg-blue-50 text-blue-700 border-blue-200" : ""}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {showTemplates ? "Hide" : "Show"} Templates
            </Button>
          </div>
        </CardHeader>
        {showTemplates && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {QUERY_TEMPLATES.map((template) => {
                const IconComponent = template.icon
                return (
                  <div
                    key={template.id}
                    className="p-4 border rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => loadTemplate(template)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <IconComponent className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-gray-900">{template.name}</h4>
                        <p className="text-xs text-blue-600 font-medium">{template.category}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{template.description}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        )}
      </Card>

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

      {/* Aggregate Functions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Aggregate Functions</CardTitle>
            <Button onClick={addAggregateField} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Aggregate
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {aggregateFields.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No aggregate functions defined. Add functions like COUNT, SUM, AVG to perform calculations.
            </p>
          ) : (
            aggregateFields.map((field) => (
              <div key={field.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1 grid grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Function</Label>
                    <Select
                      value={field.function}
                      onValueChange={(value: any) => updateAggregateField(field.id, { function: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COUNT">COUNT</SelectItem>
                        <SelectItem value="COUNT_DISTINCT">COUNT(DISTINCT)</SelectItem>
                        <SelectItem value="SUM">SUM</SelectItem>
                        <SelectItem value="AVG">AVG</SelectItem>
                        <SelectItem value="MIN">MIN</SelectItem>
                        <SelectItem value="MAX">MAX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Table</Label>
                    <Select value={field.table} onValueChange={(value) => updateAggregateField(field.id, { table: value })}>
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
                    <Select value={field.column} onValueChange={(value) => updateAggregateField(field.id, { column: value })}>
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
                      onChange={(e) => updateAggregateField(field.id, { alias: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={() => removeAggregateField(field.id)} size="sm" variant="ghost">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* GROUP BY */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">GROUP BY</CardTitle>
            <Button onClick={addGroupByField} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Group
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {groupByFields.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No grouping defined. Add fields to group your results.
            </p>
          ) : (
            groupByFields.map((field) => (
              <div key={field.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Table</Label>
                    <Select value={field.table} onValueChange={(value) => updateGroupByField(field.id, { table: value })}>
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
                    <Select value={field.column} onValueChange={(value) => updateGroupByField(field.id, { column: value })}>
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
                </div>
                <Button onClick={() => removeGroupByField(field.id)} size="sm" variant="ghost">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* HAVING Conditions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">HAVING Conditions</CardTitle>
            <Button onClick={addHavingCondition} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Condition
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {havingConditions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No HAVING conditions defined. Add conditions to filter grouped results.
            </p>
          ) : (
            havingConditions.map((condition, index) => (
              <div key={condition.id} className="flex items-center gap-3 p-3 border rounded-lg">
                {index > 0 && (
                  <div className="w-16">
                    <Select
                      value={condition.logicalOperator}
                      onValueChange={(value: any) => updateHavingCondition(condition.id, { logicalOperator: value })}
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
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Aggregate Function</Label>
                    <Input
                      className="h-8"
                      placeholder="COUNT(*)"
                      value={condition.aggregateFunction}
                      onChange={(e) => updateHavingCondition(condition.id, { aggregateFunction: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Operator</Label>
                    <Select
                      value={condition.operator}
                      onValueChange={(value) => updateHavingCondition(condition.id, { operator: value })}
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
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Value</Label>
                    <Input
                      className="h-8"
                      placeholder="value"
                      value={condition.value}
                      onChange={(e) => updateHavingCondition(condition.id, { value: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={() => removeHavingCondition(condition.id)} size="sm" variant="ghost">
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

      </div>

      {/* Right Column - Sticky SQL Preview */}
      <div className="lg:col-span-2 order-first lg:order-last">
        <div className="sticky top-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  Generated SQL Query
                  {queryValidation && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      queryValidation.isValid 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {queryValidation.isValid ? '✓ Valid' : '✗ Invalid'}
                    </span>
                  )}
                </CardTitle>
                <Button onClick={copyQuery} size="sm" variant="outline" disabled={!generatedQuery}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {generatedQuery ? (
                <>
                  <Textarea
                    value={generatedQuery}
                    readOnly
                    className={`font-mono text-sm min-h-[200px] ${
                      queryValidation && !queryValidation.isValid 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-muted'
                    }`}
                    placeholder="Your generated SQL query will appear here..."
                  />
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3">
                    {/* Quick Actions */}
                    <div className="flex gap-0.5 pt-2 border-t flex-wrap max-w-full">
                      <Button onClick={() => addLimit("10")} size="sm" variant="outline" className="px-1 text-xs h-6 flex-1 min-w-0">10</Button>
                      <Button onClick={() => addLimit("100")} size="sm" variant="outline" className="px-1 text-xs h-6 flex-1 min-w-0">100</Button>
                      <Button onClick={() => addCommonWhere("NOW() - INTERVAL '7 days'")} size="sm" variant="outline" className="px-1 text-xs h-6 flex-1 min-w-0">Recent</Button>
                      <Button onClick={optimizeQuery} size="sm" variant="outline" className="px-1 text-xs h-6 flex-1 min-w-0">Optimize</Button>
                    </div>
                    
                    {/* Primary Actions - Execute and Reset */}
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => onExecuteQuery?.(generatedQuery)} 
                        size="sm" 
                        disabled={!generatedQuery || (queryValidation && !queryValidation.isValid) || isExecuting}
                        className="bg-green-600 hover:bg-green-700 text-white flex-1"
                      >
                        {isExecuting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Executing...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Execute & View Results
                          </>
                        )}
                      </Button>
                      <Button onClick={resetQuery} size="sm" variant="outline" className="px-3">
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Query Results */}
                  {!isLoadingTemplate && (queryResults.length > 0 || (queryError && queryError.trim() !== '') || isExecuting) && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-800">Query Results:</h4>
                        {queryExecutionTime !== null && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {queryExecutionTime}ms
                          </span>
                        )}
                      </div>
                      
                      {isExecuting && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="flex items-center gap-2 text-blue-700">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-700 border-t-transparent"></div>
                            <span className="text-sm">Executing query...</span>
                          </div>
                        </div>
                      )}
                      
                      {queryError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                          <h4 className="text-sm font-medium text-red-800 mb-2">Error:</h4>
                          <p className="text-sm text-red-700">{queryError}</p>
                        </div>
                      )}
                      
                      {queryResults.length > 0 && (
                        <div className="border rounded-md max-h-64 overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {Object.keys(queryResults[0] || {}).map((column) => (
                                  <TableHead key={column} className="text-xs">
                                    {column}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {queryResults.slice(0, 50).map((row, index) => (
                                <TableRow key={index}>
                                  {Object.values(row).map((value: any, cellIndex) => (
                                    <TableCell key={cellIndex} className="text-xs">
                                      {value?.toString() || ''}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {queryResults.length > 50 && (
                            <div className="p-2 text-xs text-gray-500 text-center border-t">
                              Showing first 50 of {queryResults.length} results
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Validation Messages */}
                  {queryValidation && (
                    <div className="space-y-2">
                      {queryValidation.errors.length > 0 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                          <h4 className="text-sm font-medium text-red-800 mb-2">Errors:</h4>
                          <ul className="text-sm text-red-700 space-y-1">
                            {queryValidation.errors.map((error, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <span className="text-red-500">•</span>
                                {error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {queryValidation.warnings.length > 0 && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <h4 className="text-sm font-medium text-yellow-800 mb-2">Warnings:</h4>
                          <ul className="text-sm text-yellow-700 space-y-1">
                            {queryValidation.warnings.map((warning, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <span className="text-yellow-500">⚠</span>
                                {warning}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No query generated yet.</p>
                  <p className="text-sm">Add some SELECT fields or aggregate functions to start building your query.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  )
}
