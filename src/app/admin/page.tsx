"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { isAdmin, isAuthenticated } from "@/lib/api"
import { Loader2, List, Users, ArrowRight, Plus } from "lucide-react"

export default function AdminPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  // Verificar autenticação e permissões de admin
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!isAuthenticated() || !isAdmin()) {
          router.push('/login')
          return
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="container flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    )
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel de Administração</h1>
        <p className="text-gray-600">Gerencie produtos e usuários do sistema</p>
      </div>
      
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Products Management */}
        <Button
          variant="ghost"
          className="h-auto p-0 group hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-gray-300 rounded-lg"
          onClick={() => router.push("/admin/products")}
        >
          <Card className="w-full border-0 shadow-none group-hover:shadow-none">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                    <List className="h-5 w-5 text-gray-700" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-lg text-gray-900">Produtos</CardTitle>
                    <CardDescription className="text-sm">
                      Visualizar e gerenciar produtos
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="p-4 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors">
                <span className="text-gray-700 font-medium">Ver Todos os Produtos</span>
              </div>
            </CardContent>
          </Card>
        </Button>

        {/* Add Product */}
        <Button
          variant="ghost"
          className="h-auto p-0 group hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-gray-300 rounded-lg"
          onClick={() => router.push("/admin/products/add")}
        >
          <Card className="w-full border-0 shadow-none group-hover:shadow-none">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <Plus className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-lg text-gray-900">Adicionar Produto</CardTitle>
                    <CardDescription className="text-sm">
                      Adicionar novo produto
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="p-4 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors">
                <span className="text-gray-700 font-medium">Adicionar Produto</span>
              </div>
            </CardContent>
          </Card>
        </Button>

        {/* User Management */}
        <Button
          variant="ghost"
          className="h-auto p-0 group hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-gray-300 rounded-lg"
          onClick={() => router.push("/admin/users")}
        >
          <Card className="w-full border-0 shadow-none group-hover:shadow-none">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-lg text-gray-900">Usuários</CardTitle>
                    <CardDescription className="text-sm">
                      Visualizar, editar ou remover usuários
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="p-4 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors">
                <span className="text-gray-700 font-medium">Gerenciar Usuários</span>
              </div>
            </CardContent>
          </Card>
        </Button>
      </div>
    </div>
  )
}
