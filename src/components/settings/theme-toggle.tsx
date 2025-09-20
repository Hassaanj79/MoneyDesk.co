
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant={theme === "light" ? "secondary" : "ghost"}
        onClick={() => setTheme("light")}
      >
        <Sun className="mr-2 h-4 w-4" />
        Light
      </Button>
      <Button
        variant={theme === "dark" ? "secondary" : "ghost"}
        onClick={() => setTheme("dark")}
      >
        <Moon className="mr-2 h-4 w-4" />
        Dark
      </Button>
    </div>
  )
}
