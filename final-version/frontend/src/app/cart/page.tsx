"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/context/cart-context"
import { Minus, Plus, Trash2, ShoppingBag, Loader2 } from "lucide-react"

export default function CartPage() {
  const { 
    cart, 
    removeItem, 
    updateItemQuantity, 
    clearCart, 
    isLoading 
  } = useCart()
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [productStocks, setProductStocks] = useState<Record<string, number>>({})

  // Carregar o estoque do produto quando o carrinho muda
  useEffect(() => {
    const loadProductStocks = async () => {
      if (cart.items.length === 0) return

      const stocks: Record<string, number> = {}
      
      for (const item of cart.items) {
        try {
          // Usa productId para fazer fetch nas infomaçoes do estoque
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/products/${item.productId}`)
          if (response.ok) {
            const data = await response.json()
            if (data.product) {
              stocks[item.id] = data.product.stock || 0 // Map cart item ID to stock
            }
          }
        } catch (error) {
          console.error(`Error fetching stock for product ${item.productId}:`, error)
          stocks[item.id] = 0
        }
      }
      
      setProductStocks(stocks)
    }

    loadProductStocks()
  }, [cart.items])

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    
    // Verifica o limite do estoque
    const productStock = productStocks[itemId] || 0
    if (newQuantity > productStock) {
      toast({
        title: "Estoque insuficiente",
        description: `Apenas ${productStock} unidades disponíveis em estoque.`,
        variant: "destructive"
      })
      return
    }
    
    setIsUpdating(itemId)
    try {
      await updateItemQuantity(itemId, newQuantity)
    } finally {
      setIsUpdating(null)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    setIsUpdating(itemId)
    try {
      await removeItem(itemId)
      toast({
        title: "Item removido",
        description: "O produto foi removido do carrinho.",
      })
    } finally {
      setIsUpdating(null)
    }
  }

  const handleClearCart = async () => {
    try {
      await clearCart()
      toast({
        title: "Carrinho limpo",
        description: "Todos os itens foram removidos do carrinho.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível limpar o carrinho.",
        variant: "destructive"
      })
    }
  }

  const getImageUrl = (item: any) => {
    if (item.image) {
      if (item.image.startsWith('http')) {
        return item.image
      }
      if (item.image.startsWith('/public')) {
        return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${item.image}`
      }
      if (!item.image.startsWith('/')) {
        return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/public/images/products/${item.image}`
      }
      return item.image
    }
    return "/placeholder.svg"
  }

  if (isLoading) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="container flex min-h-[50vh] flex-col items-center justify-center py-8">
        <ShoppingBag className="mb-4 h-16 w-16 text-gray-400" />
        <h1 className="mb-2 text-2xl font-bold">Seu carrinho está vazio</h1>
        <p className="mb-6 text-gray-600">Adicione alguns produtos incríveis da Ferrari!</p>
        <Button className="bg-red-600 hover:bg-red-700" asChild>
          <Link href="/">Explorar Produtos</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="mb-8 text-3xl font-bold">Carrinho de Compras</h1>
      
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {cart.items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative h-20 w-20 overflow-hidden rounded-lg">
                      <Image
                        src={getImageUrl(item)}
                        alt={item.name}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg"
                        }}
                      />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-gray-600">
                        Preço unitário: R$ {item.price.toFixed(2)}
                      </p>
                      {item.category && (
                        <p className="text-sm text-gray-500">
                          Categoria: {item.category}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleUpdateQuantity(item.id, (item.quantity || 1) - 1)}
                        disabled={(item.quantity || 1) <= 1 || isUpdating === item.id}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity || 1}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleUpdateQuantity(item.id, (item.quantity || 1) + 1)}
                        disabled={
                          isUpdating === item.id || 
                          (item.quantity || 1) >= (productStocks[item.id] || 0)
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {productStocks[item.id] !== undefined && (
                      <div className="text-xs text-gray-500">
                        {productStocks[item.id]} em estoque
                      </div>
                    )}

                    <div className="text-right">
                      <p className="font-semibold">
                        R$ {(item.price * (item.quantity || 1)).toFixed(2)}
                      </p>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={isUpdating === item.id}
                      className="text-red-600 hover:bg-red-100"
                    >
                      {isUpdating === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={handleClearCart}
              className="text-red-600 hover:bg-red-100"
            >
              Limpar Carrinho
            </Button>
          </div>
        </div>
        
        <div>
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Resumo do Pedido</h2>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Itens ({cart.itemCount})</span>
                  <span>R$ {cart.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete</span>
                  <span>Grátis</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>R$ {cart.total.toFixed(2)}</span>
                </div>
              </div>
              
              <Button className="mt-6 w-full bg-red-600 hover:bg-red-700" asChild>
                <Link href="/checkout">Finalizar Compra</Link>
              </Button>
              
              <Button variant="outline" className="mt-2 w-full" asChild>
                <Link href="/">Continuar Comprando</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
