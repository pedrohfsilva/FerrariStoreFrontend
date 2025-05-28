"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { API_ENDPOINTS, API_URL, fetchWithAuth, isAdmin, isAuthenticated } from "@/lib/api"
import { IProduct } from "@/types/models"
import { Loader2, Pencil, Trash2, ArrowLeft, Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import Link from "next/link"

export default function AdminProductsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [products, setProducts] = useState<IProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null)

  // Verificar autenticação e permissões de admin
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!isAuthenticated() || !isAdmin()) {
          router.push('/login')
          return
        }

        // Carregar produtos
        setIsLoading(true)
        await loadProducts()
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const loadProducts = async () => {
    try {
      const response = await fetchWithAuth(API_ENDPOINTS.products)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response. Backend may be down.')
      }
      
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
      
      let errorMessage = "Não foi possível carregar os produtos."
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = "Erro de conexão. Verifique se o servidor backend está rodando."
      } else if (error instanceof Error) {
        if (error.message.includes('non-JSON response')) {
          errorMessage = "Servidor backend não está respondendo corretamente. Verifique se está rodando na porta 5000."
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const handleDeleteClick = (product: IProduct) => {
    setSelectedProduct(product)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedProduct || !selectedProduct._id) return
    
    try {
      setIsSubmitting(true)
      const response = await fetchWithAuth(API_ENDPOINTS.product(selectedProduct._id), {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast({
          title: "Produto excluído",
          description: "O produto foi excluído com sucesso.",
          variant: "default"
        })
        
        // Recarregar a lista de produtos
        await loadProducts()
      } else {
        const data = await response.json()
        throw new Error(data.message || "Erro ao excluir produto")
      }
    } catch (error) {
      console.error("Erro ao excluir produto:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir produto",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
      setShowDeleteDialog(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <div className="container py-8 px-0">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Gerenciar Produtos</h1>
        </div>
        <Button className="bg-red-600 hover:bg-red-700" asChild>
          <Link href="/admin/products/add">
            <Plus className="mr-2 h-4 w-4" /> Adicionar Produto
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imagem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Vendidos</TableHead>
                <TableHead>Destaque</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length > 0 ? (
                products.map((product) => (
                  <TableRow key={product._id}>
                    <TableCell>
                      {product.images && product.images.length > 0 ? (
                        <div className="relative h-10 w-10">
                          <Image
                            src={`${API_URL}/public/images/products/${product.images[0]}`}
                            alt={product.name}
                            fill
                            className="rounded-md object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-gray-200" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>R$ {product.price.toFixed(2)}</TableCell>
                    <TableCell>
                      {product.type === 'car' && 'Carro'}
                      {product.type === 'formula1' && 'Fórmula 1'}
                      {product.type === 'helmet' && 'Capacete'}
                    </TableCell>
                    <TableCell>{product.stock || 0}</TableCell>
                    <TableCell>{product.sold || 0}</TableCell>
                    <TableCell>{product.featured ? 'Sim' : 'Não'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => router.push(`/admin/products/edit/${product._id}`)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteClick(product)}
                          className="text-red-600 hover:bg-red-100 hover:text-red-700"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    Nenhum produto encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Diálogo de confirmação de exclusão */}
      {showDeleteDialog && (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o produto "{selectedProduct?.name}"?
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  "Excluir"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
