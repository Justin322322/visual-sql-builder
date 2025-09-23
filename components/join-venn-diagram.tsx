"use client"

import { Card, CardContent } from "@/components/ui/card"

interface JoinVennDiagramProps {
  joinType: "INNER" | "LEFT" | "RIGHT" | "FULL"
  leftTable?: string
  rightTable?: string
  className?: string
}

export function JoinVennDiagram({ joinType, leftTable = "A", rightTable = "B", className }: JoinVennDiagramProps) {
  const getJoinDescription = (type: string) => {
    switch (type) {
      case "INNER":
        return "Returns only matching records from both tables"
      case "LEFT":
        return "Returns all records from left table and matching records from right table"
      case "RIGHT":
        return "Returns all records from right table and matching records from left table"
      case "FULL":
        return "Returns all records from both tables, with NULLs where no match exists"
      default:
        return ""
    }
  }

  const getJoinLabel = (type: string) => {
    switch (type) {
      case "INNER":
        return "INNER JOIN"
      case "LEFT":
        return "LEFT INCLUSIVE"
      case "RIGHT":
        return "RIGHT INCLUSIVE"
      case "FULL":
        return "FULL OUTER INCLUSIVE"
      default:
        return ""
    }
  }

  const baseColor = "#1e3a8a" // Navy blue
  const lightColor = "#e0e7ff" // Light blue
  const strokeColor = "#1e40af" // Medium blue

  return (
    <Card
      className={`w-full max-w-sm bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="text-base font-medium text-gray-700 mb-2">
            {leftTable} ↔ {rightTable}
          </div>
          <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
            {getJoinLabel(joinType)}
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <svg width="200" height="120" viewBox="0 0 200 120" className="overflow-visible">
            <defs>
              <mask id={`mask-${joinType}-${leftTable}-${rightTable}`}>
                <rect width="200" height="120" fill="white" />
                {joinType === "INNER" && (
                  <>
                    <circle cx="75" cy="60" r="35" fill="black" />
                    <circle cx="125" cy="60" r="35" fill="black" />
                  </>
                )}
              </mask>
            </defs>

            {/* Left Circle */}
            <circle
              cx="75"
              cy="60"
              r="35"
              fill={
                joinType === "LEFT" || joinType === "FULL" ? baseColor : joinType === "INNER" ? lightColor : "white"
              }
              stroke={strokeColor}
              strokeWidth="2.5"
            />

            {/* Right Circle */}
            <circle
              cx="125"
              cy="60"
              r="35"
              fill={
                joinType === "RIGHT" || joinType === "FULL" ? baseColor : joinType === "INNER" ? lightColor : "white"
              }
              stroke={strokeColor}
              strokeWidth="2.5"
            />

            {joinType === "INNER" && (
              <path
                d="M 100 35 A 35 35 0 0 1 100 85 A 35 35 0 0 1 100 35"
                fill={baseColor}
                stroke={strokeColor}
                strokeWidth="2.5"
              />
            )}

            <text x="75" y="105" textAnchor="middle" className="text-sm font-medium fill-gray-700">
              {leftTable}
            </text>
            <text x="125" y="105" textAnchor="middle" className="text-sm font-medium fill-gray-700">
              {rightTable}
            </text>

            {joinType === "INNER" && (
              <text x="100" y="65" textAnchor="middle" className="text-sm font-bold fill-white">
                MATCH
              </text>
            )}
          </svg>
        </div>

        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed font-medium">{getJoinDescription(joinType)}</p>

          <div className="flex justify-center items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border-2"
                style={{
                  backgroundColor: joinType === "LEFT" || joinType === "FULL" ? baseColor : "white",
                  borderColor: strokeColor,
                }}
              />
              <span className="text-gray-700 font-medium">{leftTable}</span>
            </div>

            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border-2"
                style={{
                  backgroundColor: joinType === "RIGHT" || joinType === "FULL" ? baseColor : "white",
                  borderColor: strokeColor,
                }}
              />
              <span className="text-gray-700 font-medium">{rightTable}</span>
            </div>

            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 border-2"
                style={{
                  backgroundColor: baseColor,
                  borderColor: strokeColor,
                }}
              />
              <span className="text-gray-700 font-medium">Result</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
