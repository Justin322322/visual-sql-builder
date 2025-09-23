"use client"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import type { TableInfo, ForeignKey } from "@/lib/database"
import { ReactFlowJoinBuilder } from "@/components/react-flow-join-builder"

interface JoinConnection {
  id: string
  fromTable: string
  fromColumn: string
  toTable: string
  toColumn: string
  joinType: "INNER" | "LEFT" | "RIGHT" | "FULL"
}

interface VisualJoinBuilderProps {
  tables: TableInfo[]
  foreignKeys: ForeignKey[]
  onJoinsChange?: (joins: JoinConnection[]) => void
}

export function VisualJoinBuilder(props: VisualJoinBuilderProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <ReactFlowJoinBuilder {...props} />
    </DndProvider>
  )
}
