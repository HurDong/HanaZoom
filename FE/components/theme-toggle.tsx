"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useUserSettingsStore } from "@/lib/stores/userSettingsStore"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { updateTheme: updateThemeStore } = useUserSettingsStore()

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeToggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    console.log('🔄 테마 변경 (로컬만):', { from: theme, to: newTheme })
    
    // 1. 즉시 UI 테마 변경
    setTheme(newTheme)
    
    // 2. 사용자 설정 스토어 업데이트 (로컬 스토리지에만 저장)
    updateThemeStore(newTheme.toUpperCase() as 'LIGHT' | 'DARK')
    
    // 서버 API 호출 제거됨 - 로컬에서만 테마 관리
  }

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-9 h-9 rounded-full bg-green-100 hover:bg-green-200 transition-all duration-300"
      >
        <Sun className="h-4 w-4 text-green-700" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleThemeToggle}
      className="w-9 h-9 rounded-full bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 transition-all duration-300"
    >
      {theme === "dark" ? <Sun className="h-4 w-4 text-green-300" /> : <Moon className="h-4 w-4 text-green-700" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
