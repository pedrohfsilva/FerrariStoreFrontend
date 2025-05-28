"use client"  // indica que este componente é client-side

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Menu, ShoppingCart, User, LogOut } from "lucide-react"
import { useCart } from "@/context/cart-context"
import { isAuthenticated, isAdmin, logout } from "@/lib/api"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function Header() {
  const { itemCount, clearCart } = useCart()  // contexto do carrinho
  const [isLoggedIn, setIsLoggedIn] = useState(false)  // estado de autenticação
  const [isUserAdmin, setIsUserAdmin] = useState(false)  // estado de admin
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)  // estado do menu mobile
  const router = useRouter()
  const { toast } = useToast()

  // verifica status de autenticação e administra eventos de mudança
  useEffect(() => {
    const checkAuthStatus = () => {
      setIsLoggedIn(isAuthenticated())
      setIsUserAdmin(isAdmin())
    }
    
    // verifica imediatamente
    checkAuthStatus()
    
    // escuta mudanças no armazenamento (login/logout em outra aba)
    const handleStorageChange = () => {
      checkAuthStatus()
    }
    
    // escuta mudanças personalizadas no estado de autenticação
    const handleAuthStateChange = () => {
      checkAuthStatus()
    }
    
    // escuta eventos
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('authStateChanged', handleAuthStateChange)
    window.addEventListener('focus', checkAuthStatus)
    
    // remove os listeners ao desmontar
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('authStateChanged', handleAuthStateChange)
      window.removeEventListener('focus', checkAuthStatus)
    }
  }, [])

  // função de logout
  const handleLogout = async () => {
    try {
      await clearCart()  // limpa o carrinho no backend e local
    } catch (error) {
      console.error("Erro ao limpar o carrinho durante o logout:", error)
      // prossegue mesmo com erro
    }
    
    logout()  // encerra sessão
    setIsLoggedIn(false)
    setIsUserAdmin(false)
    setMobileMenuOpen(false)
    
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado e seu carrinho foi esvaziado.",
    })
    
    router.push("/")  // redireciona para home
  }

  // itens de navegação
  const navItems = [
    { href: "/", label: "Início" },
    { href: "/cars", label: "Carros" },
    { href: "/formula1", label: "Fórmula 1" },
    { href: "/helmets", label: "Capacetes" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
      <div className="container flex h-14 items-center">
        
        {/* Logo - fixo à esquerda */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logo.png?height=60&width=60"
              alt="Loja Ferrari"
              width={60}
              height={60}
              className="h-8 w-8 object-contain"
            />
            <span className="hidden font-bold md:inline-block">Loja Ferrari</span>
          </Link>
        </div>

        {/* Botão do menu mobile */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="ml-4 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
            <Link
              href="/"
              className="flex items-center space-x-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Image
                src="/logo.png?height=60&width=60"
                alt="Loja Ferrari"
                width={60}
                height={60}
                className="h-8 w-8 object-contain"
              />
              <span className="font-bold">Loja Ferrari</span>
            </Link>
            
            {/* Navegação mobile */}
            <nav className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
              <div className="space-y-3">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                {/* link admin só aparece para admin logado */}
                {isLoggedIn && isUserAdmin && (
                  <Link
                    href="/admin"
                    className="block text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Navegação central - desktop */}
        <div className="hidden md:flex flex-1 justify-center">
          <nav className="flex items-center space-x-8 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Ações à direita */}
        <div className="flex items-center space-x-2 ml-auto md:ml-0">
          
          {/* Botão do carrinho */}
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link href="/cart">
              <ShoppingCart className="h-4 w-4" />
              {itemCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </Badge>
              )}
              <span className="sr-only">Carrinho</span>
            </Link>
          </Button>

          {/* Menu do usuário */}
          {isLoggedIn ? (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/profile">
                  <User className="h-4 w-4" />
                  <span className="sr-only">Perfil</span>
                </Link>
              </Button>
              
              {isUserAdmin && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin">Admin</Link>
                </Button>
              )}
              
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Sair</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Entrar</Link>
              </Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700" asChild>
                <Link href="/register">Registrar</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
