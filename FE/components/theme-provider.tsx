'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
  useTheme as useNextTheme,
} from 'next-themes'
import { useUserSettingsStore } from '@/lib/stores/userSettingsStore'

// 시스템 테마 감지 훅
function useSystemTheme() {
  const [systemTheme, setSystemTheme] = React.useState<'light' | 'dark'>('light')
  
  React.useEffect(() => {
    // 시스템 테마 감지 함수
    const detectSystemTheme = () => {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
      }
      return 'light'
    }
    
    // 초기 시스템 테마 설정
    setSystemTheme(detectSystemTheme())
    
    // 시스템 테마 변경 감지
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }
    
    // 이벤트 리스너 등록
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      // 구형 브라우저 지원
      mediaQuery.addListener(handleChange)
    }
    
    // 클린업
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange)
      } else {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [])
  
  return systemTheme
}

// 테마 동기화 컴포넌트
function ThemeSync() {
  const { settings, isInitialized } = useUserSettingsStore()
  const { theme: currentTheme, setTheme } = useNextTheme()
  const systemTheme = useSystemTheme()
  const [isInitialLoad, setIsInitialLoad] = React.useState(true)
  
  // 초기 로드 시에만 사용자 설정을 적용
  React.useEffect(() => {
    if (!isInitialized || !isInitialLoad) return
    
    console.log('🎨 초기 테마 설정 적용:', { 
      userTheme: settings.theme, 
      systemTheme,
      isInitialized 
    })
    
    if (settings.theme === 'SYSTEM') {
      // 시스템 테마 사용
      console.log('🖥️ 시스템 테마 적용:', systemTheme)
      setTheme(systemTheme)
    } else {
      // 사용자 지정 테마 사용
      const theme = settings.theme.toLowerCase()
      console.log('👤 사용자 테마 적용:', theme)
      setTheme(theme)
    }
    
    setIsInitialLoad(false)
  }, [settings.theme, systemTheme, isInitialized, setTheme, isInitialLoad])
  
  // 시스템 테마가 변경되면 SYSTEM 모드에서만 자동 업데이트
  React.useEffect(() => {
    if (isInitialized && settings.theme === 'SYSTEM' && !isInitialLoad) {
      console.log('🔄 시스템 테마 변경 감지, 테마 업데이트:', systemTheme)
      setTheme(systemTheme)
    }
  }, [systemTheme, isInitialized, settings.theme, setTheme, isInitialLoad])
  
  return null
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider 
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      {...props}
    >
      <ThemeSync />
      {children}
    </NextThemesProvider>
  )
}
