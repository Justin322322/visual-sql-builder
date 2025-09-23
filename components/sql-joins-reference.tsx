"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, X } from "lucide-react"
import { useState } from "react"

export function SQLJoinsReference() {
  const [isOpen, setIsOpen] = useState(false)

  const joinTypes = [
    {
      type: "LEFT INCLUSIVE",
      sql: "SELECT Select(s)\nFROM Table A\nLEFT OUTER JOIN Table B\nON A.Key = B.Key",
      description: "All records from A, matching from B",
    },
    {
      type: "RIGHT INCLUSIVE",
      sql: "SELECT Select(s)\nFROM Table A\nRIGHT OUTER JOIN Table B\nON A.Key = B.Key",
      description: "All records from B, matching from A",
    },
    {
      type: "LEFT EXCLUSIVE",
      sql: "SELECT Select(s)\nFROM Table A\nLEFT OUTER JOIN Table B\nON A.Key = B.Key\nWHERE B.Key IS NULL",
      description: "Records only in A",
    },
    {
      type: "RIGHT EXCLUSIVE",
      sql: "SELECT Select(s)\nFROM Table A\nRIGHT OUTER JOIN Table B\nON A.Key = B.Key\nWHERE A.Key IS NULL",
      description: "Records only in B",
    },
    {
      type: "FULL OUTER INCLUSIVE",
      sql: "SELECT Select(s)\nFROM Table A\nFULL OUTER JOIN Table B\nON A.Key = B.Key",
      description: "All records from both tables",
    },
    {
      type: "INNER JOIN",
      sql: "SELECT Select(s)\nFROM Table A\nINNER JOIN Table B\nON A.Key = B.Key",
      description: "Only matching records",
    },
  ]

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 shadow-lg"
      >
        <BookOpen className="h-4 w-4 mr-2" />
        SQL Joins Reference
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold">SQL JOINS Reference</CardTitle>
          <Button onClick={() => setIsOpen(false)} variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {joinTypes.map((join, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold text-sm mb-2 text-center">{join.type}</h3>
                <div className="bg-white p-3 rounded border mb-2">
                  <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap">{join.sql}</pre>
                </div>
                <p className="text-xs text-gray-600 text-center">{join.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
