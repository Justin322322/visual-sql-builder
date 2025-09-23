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

  const baseRGB = "30,58,138" // Navy blue (rgb)
  const lightRGB = "224,231,255" // Light blue (rgb)
  const strokeColor = "#1e40af" // Medium blue

  const size = 112
  const overlapOffset = Math.round(size * 0.34) // balanced overlap
  const containerWidth = size + (size - overlapOffset)
  const containerHeight = size
  const leftIsSolid = joinType === "LEFT" || joinType === "FULL"
  const rightIsSolid = joinType === "RIGHT" || joinType === "FULL"
  const leftText = leftIsSolid ? "#ffffff" : "#0f172a"
  const rightText = rightIsSolid ? "#ffffff" : "#0f172a"
  // Use translucency so the overlap is visually distinct
  const solidAlpha = 0.75
  const lightAlpha = 0.45
  const leftBg = `rgba(${baseRGB}, ${leftIsSolid ? solidAlpha : lightAlpha})`
  const rightBg = `rgba(${baseRGB}, ${rightIsSolid ? solidAlpha : lightAlpha})`
  const leftAltBg = `rgba(${lightRGB}, ${lightAlpha})`
  const rightAltBg = `rgba(${lightRGB}, ${lightAlpha})`
  // Label positions centered under each circle
  const labelsTop = size + 6
  const leftCenterX = Math.round(size / 2)
  const rightCenterX = Math.round((size - overlapOffset) + size / 2)

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
          <div
            className="relative"
            style={{ width: containerWidth, height: containerHeight }}
          >
            {/* Left circle */}
            <div
              className="absolute rounded-full border"
              style={{
                width: size,
                height: size,
                left: 0,
                top: 0,
                borderColor: strokeColor,
                backgroundColor: leftIsSolid ? leftBg : leftAltBg,
              }}
            />
            {/* Right circle */}
            <div
              className="absolute rounded-full border"
              style={{
                width: size,
                height: size,
                left: size - overlapOffset,
                top: 0,
                borderColor: strokeColor,
                backgroundColor: rightIsSolid ? rightBg : rightAltBg,
              }}
            />

            {/* Center result indicator for INNER join */}
            {joinType === "INNER" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.65)] tracking-wide">MATCH</span>
              </div>
            )}

            {/* Labels below each circle, centered */}
            <span
              className="absolute text-[12px] font-medium"
              style={{ top: labelsTop, left: leftCenterX, transform: "translate(-50%, 0)", color: "#0f172a" }}
            >
              {leftTable}
            </span>
            <span
              className="absolute text-[12px] font-medium"
              style={{ top: labelsTop, left: rightCenterX, transform: "translate(-50%, 0)", color: "#0f172a" }}
            >
              {rightTable}
            </span>
          </div>
        </div>

        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed font-medium">{getJoinDescription(joinType)}</p>

          <div className="flex justify-center items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2" style={{ backgroundColor: leftIsSolid ? leftBg : leftAltBg, borderColor: strokeColor }} />
              <span className="text-gray-700 font-medium">{leftTable}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2" style={{ backgroundColor: rightIsSolid ? rightBg : rightAltBg, borderColor: strokeColor }} />
              <span className="text-gray-700 font-medium">{rightTable}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2" style={{ backgroundColor: `rgba(${baseRGB}, ${solidAlpha})`, borderColor: strokeColor }} />
              <span className="text-gray-700 font-medium">Result</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
