"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

// Create a context to manage the SPA state
type RouterContextType = {
  navigate: (path: string) => void
  currentPath: string
  isLoading: boolean
}

const RouterContext = createContext<RouterContextType | undefined>(undefined)

export function useSPARouter() {
  const context = useContext(RouterContext)
  if (!context) {
    throw new Error("useSPARouter must be used within a SPARouterProvider")
  }
  return context
}

interface SPARouterProviderProps {
  children: ReactNode
}

export function SPARouterProvider({ children }: SPARouterProviderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [currentPath, setCurrentPath] = useState(pathname)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setCurrentPath(pathname)
  }, [pathname])

  const navigate = (path: string) => {
    if (path === currentPath) return

    setIsLoading(true)
    router.push(path)

    // Add a small delay to show loading state
    setTimeout(() => {
      setIsLoading(false)
    }, 300)
  }

  return (
    <RouterContext.Provider value={{ navigate, currentPath, isLoading }}>
      {isLoading ? (
        <div className="flex h-[70vh] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-600" />
        </div>
      ) : (
        children
      )}
    </RouterContext.Provider>
  )
}
