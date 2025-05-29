"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

export function useSPANavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    // Add current path to history when it changes
    if (pathname && !history.includes(pathname)) {
      setHistory((prev) => [...prev, pathname])
    }
  }, [pathname, history])

  const goBack = () => {
    if (history.length > 1) {
      // Remove current page from history
      const newHistory = [...history]
      newHistory.pop()

      // Navigate to previous page
      const previousPage = newHistory[newHistory.length - 1]
      router.push(previousPage)

      // Update history
      setHistory(newHistory)
    } else {
      // If no history, go to home
      router.push("/")
    }
  }

  return {
    goBack,
    currentPath: pathname,
    history,
  }
}
