export interface JoinPredicate {
  fromColumn: string
  toColumn: string
  operator?: "=" | "<" | ">" | "<=" | ">=" | "<>"
}

export interface JoinConnection {
  id: string
  fromTable: string
  toTable: string
  joinType: "INNER" | "LEFT" | "RIGHT" | "FULL"
  conditions: JoinPredicate[]
}

export function joinsToSql(joins: JoinConnection[]): string[] {
  return joins.map((j) => {
    const onClause = j.conditions
      .map((c) => `${j.fromTable}.${c.fromColumn} ${c.operator ?? "="} ${j.toTable}.${c.toColumn}`)
      .join(" AND ")
    return `${j.joinType} JOIN ${j.toTable} ON ${onClause}`
  })
}


