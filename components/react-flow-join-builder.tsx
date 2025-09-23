"use client"

import { useState, useCallback, useMemo } from "react"
import {
  ReactFlow,
  type Node,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  type Connection,
  ConnectionMode,
  Panel,
  MiniMap,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Database, Link2, Eye, Trash2, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { JoinVennDiagram } from "@/components/join-venn-diagram"
import { SQLJoinsReference } from "@/components/sql-joins-reference"
import type { TableInfo, ForeignKey } from "@/lib/database"

interface JoinConnection {
  id: string
  fromTable: string
  fromColumn: string
  toTable: string
  toColumn: string
  joinType: "INNER" | "LEFT" | "RIGHT" | "FULL"
}

interface ReactFlowJoinBuilderProps {
  tables: TableInfo[]
  foreignKeys: ForeignKey[]
  onJoinsChange?: (joins: JoinConnection[]) => void
}

// Custom Table Node Component
function TableNode({ data }: { data: any }) {
  const { table, isConnected } = data

  return (
    <div
      className={`bg-white border-2 rounded-lg shadow-lg min-w-[220px] ${
        isConnected ? "border-blue-400 shadow-blue-100" : "border-gray-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b rounded-t-lg">
        <Database className="h-4 w-4 text-blue-600" />
        <span className="font-semibold text-sm text-gray-800">{table.table_name}</span>
        <Badge variant="outline" className="text-xs ml-auto bg-white">
          {table.columns.length} cols
        </Badge>
      </div>

      {/* Columns */}
      <div className="max-h-48 overflow-y-auto">
        {table.columns.slice(0, 8).map((column: any, index: number) => (
          <div
            key={column.column_name}
            className="flex items-center gap-2 p-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
          >
            <div
              className={`w-2 h-2 rounded-full ${column.column_name.includes("id") ? "bg-yellow-400" : "bg-gray-300"}`}
            />
            <span className="text-xs font-mono text-gray-700 flex-1">{column.column_name}</span>
            <Badge variant="outline" className="text-xs bg-gray-50">
              {column.data_type}
            </Badge>
          </div>
        ))}
        {table.columns.length > 8 && (
          <div className="p-2 text-xs text-gray-500 text-center bg-gray-50">
            +{table.columns.length - 8} more columns
          </div>
        )}
      </div>
    </div>
  )
}

const nodeTypes = {
  tableNode: TableNode,
}

export function ReactFlowJoinBuilder({ tables, foreignKeys, onJoinsChange }: ReactFlowJoinBuilderProps) {
  const [connections, setConnections] = useState<JoinConnection[]>([])
  const [showVennDiagrams, setShowVennDiagrams] = useState(true)

  // Initialize nodes
  const initialNodes: Node[] = useMemo(() => {
    return tables.map((table, index) => {
      const row = Math.floor(index / 3)
      const col = index % 3
      return {
        id: table.table_name,
        type: "tableNode",
        position: { x: col * 280, y: row * 250 },
        data: {
          table,
          isConnected: connections.some(
            (conn) => conn.fromTable === table.table_name || conn.toTable === table.table_name,
          ),
        },
      }
    })
  }, [tables, connections])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target || params.source === params.target) return

      const newConnection: JoinConnection = {
        id: `${params.source}-${params.target}`,
        fromTable: params.source,
        fromColumn: "id", // Default to id column
        toTable: params.target,
        toColumn: "id", // Default to id column
        joinType: "INNER",
      }

      const updatedConnections = [...connections, newConnection]
      setConnections(updatedConnections)
      onJoinsChange?.(updatedConnections)

      // Add visual edge
      const newEdge = {
        ...params,
        id: newConnection.id,
        type: "smoothstep",
        animated: true,
        style: { stroke: "#3b82f6", strokeWidth: 2 },
        label: "INNER JOIN",
        labelStyle: { fontSize: 12, fontWeight: 600, fill: "#3b82f6" },
        labelBgStyle: { fill: "white", fillOpacity: 0.9 },
      }

      setEdges((eds) => addEdge(newEdge, eds))
    },
    [connections, onJoinsChange, setEdges],
  )

  // Update join type
  const updateJoinType = (connectionId: string, joinType: JoinConnection["joinType"]) => {
    const updatedConnections = connections.map((conn) => (conn.id === connectionId ? { ...conn, joinType } : conn))
    setConnections(updatedConnections)
    onJoinsChange?.(updatedConnections)

    // Update edge label and color
    const joinColors = {
      INNER: "#3b82f6",
      LEFT: "#10b981",
      RIGHT: "#f59e0b",
      FULL: "#8b5cf6",
    }

    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === connectionId
          ? {
              ...edge,
              label: `${joinType} JOIN`,
              style: { stroke: joinColors[joinType], strokeWidth: 2 },
              labelStyle: { fontSize: 12, fontWeight: 600, fill: joinColors[joinType] },
            }
          : edge,
      ),
    )
  }

  // Remove connection
  const removeConnection = (connectionId: string) => {
    const updatedConnections = connections.filter((conn) => conn.id !== connectionId)
    setConnections(updatedConnections)
    onJoinsChange?.(updatedConnections)

    setEdges((eds) => eds.filter((edge) => edge.id !== connectionId))
  }

  // Suggest joins from foreign keys
  const suggestJoinsFromForeignKeys = () => {
    const suggestedConnections: JoinConnection[] = foreignKeys.map((fk) => ({
      id: `${fk.table_name}-${fk.foreign_table_name}`,
      fromTable: fk.table_name,
      fromColumn: fk.column_name,
      toTable: fk.foreign_table_name,
      toColumn: fk.foreign_column_name,
      joinType: "INNER" as const,
    }))

    setConnections(suggestedConnections)
    onJoinsChange?.(suggestedConnections)

    // Add visual edges
    const newEdges = suggestedConnections.map((conn) => ({
      id: conn.id,
      source: conn.fromTable,
      target: conn.toTable,
      type: "smoothstep",
      animated: true,
      style: { stroke: "#3b82f6", strokeWidth: 2 },
      label: "INNER JOIN",
      labelStyle: { fontSize: 12, fontWeight: 600, fill: "#3b82f6" },
      labelBgStyle: { fill: "white", fillOpacity: 0.9 },
    }))

    setEdges(newEdges)
  }

  // Clear all connections
  const clearAll = () => {
    setConnections([])
    setEdges([])
    onJoinsChange?.([])
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold text-gray-800">Visual JOIN Builder</h3>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {connections.length} joins
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowVennDiagrams(!showVennDiagrams)}
            size="sm"
            variant="outline"
            className={showVennDiagrams ? "bg-blue-50 text-blue-700 border-blue-200" : ""}
          >
            <Eye className="h-4 w-4 mr-2" />
            {showVennDiagrams ? "Hide" : "Show"} Diagrams
          </Button>
          <Button onClick={suggestJoinsFromForeignKeys} size="sm" variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            Auto-suggest
          </Button>
          <Button onClick={clearAll} size="sm" variant="outline">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Venn Diagrams */}
      {showVennDiagrams && connections.length > 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-slate-50/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              JOIN Visualizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections.map((connection) => (
                <JoinVennDiagram
                  key={connection.id}
                  joinType={connection.joinType}
                  leftTable={connection.fromTable}
                  rightTable={connection.toTable}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* React Flow Canvas */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="h-[600px] bg-gradient-to-br from-slate-50 to-blue-50/30">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              connectionMode={ConnectionMode.Loose}
              fitView
              className="bg-transparent"
            >
              <Background color="#e2e8f0" gap={20} />
              <Controls className="bg-white border border-gray-200 shadow-sm" />
              <MiniMap
                className="bg-white border border-gray-200 shadow-sm"
                nodeColor="#3b82f6"
                maskColor="rgba(255, 255, 255, 0.8)"
              />
              <Panel
                position="top-left"
                className="bg-white/90 backdrop-blur-sm p-3 rounded-lg border border-gray-200 shadow-sm"
              >
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-1">How to create JOINs:</p>
                  <p>• Drag from one table to another to create a connection</p>
                  <p>• Use controls below to modify JOIN types</p>
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </CardContent>
      </Card>

      {/* Active JOINs Management */}
      {connections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Link2 className="h-5 w-5 text-blue-600" />
              Active JOINs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="flex items-center gap-4 p-4 border rounded-lg bg-white hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                  <div className="text-sm">
                    <div className="font-semibold text-gray-900">{connection.fromTable}</div>
                    <span className="font-mono text-gray-500 text-xs">{connection.fromColumn}</span>
                  </div>

                  <div className="text-center">
                    <Select
                      value={connection.joinType}
                      onValueChange={(value: any) => updateJoinType(connection.id, value)}
                    >
                      <SelectTrigger className="h-9 bg-white border-gray-200">
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

                  <div className="text-sm">
                    <div className="font-semibold text-gray-900">{connection.toTable}</div>
                    <span className="font-mono text-gray-500 text-xs">{connection.toColumn}</span>
                  </div>

                  <div className="text-right">
                    <Button
                      onClick={() => removeConnection(connection.id)}
                      size="sm"
                      variant="ghost"
                      className="hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* SQL Joins Reference */}
      <SQLJoinsReference />
    </div>
  )
}
