"use client"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import type { TableInfo, ForeignKey } from "@/lib/database"
import { ReactFlowJoinBuilder } from "@/components/react-flow-join-builder"
import type { JoinConnection } from "@/lib/join-sql"

interface VisualJoinBuilderProps {
  tables: TableInfo[]
  foreignKeys: ForeignKey[]
  onJoinsChange?: (joins: JoinConnection[]) => void
  onApplyToQuery?: (joins: JoinConnection[]) => void
}

export function VisualJoinBuilder(props: VisualJoinBuilderProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <ReactFlowJoinBuilder {...props} />
    </DndProvider>
  )
}
