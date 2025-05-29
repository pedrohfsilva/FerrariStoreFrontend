"use client"
import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, List, Users, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { isAdmin, isAuthenticated } from "@/lib/api"

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verifica se o usuario esta autenticado e se ele eh admin
    if (!isAuthenticated()) {
      toast({
        title: "Acesso não autorizado",
        description: "Você precisa fazer login para acessar esta área.",
        variant: "destructive",
      })
      router.push('/login')
      return
    }

    // Verifica se o usuario eh admin
    if (!isAdmin()) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissões de administrador para acessar esta área.",
        variant: "destructive",
      })
      router.push('/')
      return
    }

    setIsLoading(false)
  }, [router, toast])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full border-b bg-gray-50 md:w-64 md:border-b-0 md:border-r">
        <div className="flex h-16 items-center border-b px-6">
          <h2 className="text-lg font-bold">Ferrari Admin</h2>
        </div>
        <nav className="p-4">
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/admin">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <h3 className="mb-2 mt-4 px-2 text-xs font-semibold uppercase text-gray-500">Products</h3>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/admin/products">
                <List className="mr-2 h-4 w-4" />
                Todos Produtos
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/admin/products/add">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Produto
              </Link>
            </Button>
            <h3 className="mb-2 mt-4 px-2 text-xs font-semibold uppercase text-gray-500">Users</h3>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/admin/users">
                <Users className="mr-2 h-4 w-4" />
                Gerenciar Usuários
              </Link>
            </Button>
          </div>
          <div className="mt-6">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
              asChild
            >
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Voltar para a Loja
              </Link>
            </Button>
          </div>
        </nav>
      </aside>
      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
