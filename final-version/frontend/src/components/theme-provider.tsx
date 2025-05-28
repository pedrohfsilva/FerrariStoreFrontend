'use client'  // indica que este componente será executado no client-side

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

// Provedor de Tema - encapsula o NextThemesProvider
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false)  // controla se o componente foi montado

  React.useEffect(() => {
    setMounted(true)  // após montar, atualiza o estado
  }, [])

  // Evita problemas de hidratação no SSR
  if (!mounted) {
    return <div suppressHydrationWarning>{children}</div>
  }

  // Renderiza o provedor de temas com as props passadas
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  )
}
