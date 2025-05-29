"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { API_ENDPOINTS, authFetchConfig } from "@/lib/api"
import { Package, ChevronRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

// Interface tipando o pedido
interface Order {
  _id: string
  orderItem: Array<{
    product: string
    quantity: number
    productDetails?: {
      name: string
      price: number
      images: string[]
      unavailable?: boolean
    }
  }>
  totalPrice: number
  paymentMethod: {
    type: 'credit' | 'debit'
    cardNumber: string
    cardHolderName: string
    expirationDate: string
  }
  shippingAddress: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
  createdAt: string
}

export default function OrdersSection() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  // Buscar pedidos na API ao montar o componente
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(API_ENDPOINTS.orders, authFetchConfig())
        
        if (!response.ok) {
          console.error(`Erro ao buscar pedidos: ${response.status} - ${response.statusText}`)
          throw new Error(`Falha ao buscar pedidos: ${response.statusText}`)
        }
        
        const data = await response.json()
        setOrders(Array.isArray(data.orders) ? data.orders : [])
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error)
        toast({
          title: "Erro ao carregar pedidos",
          description: "Não foi possível carregar seus pedidos. Tente novamente mais tarde.",
          variant: "destructive"
        })
        setOrders([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [toast])

  // Formatar data para padrão brasileiro
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date)
  }

  // Redirecionar para a página de detalhes do pedido
  const handleOrderClick = (orderId: string) => {
    router.push(`/order?orderId=${orderId}`)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Meus Pedidos</h2>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">Nenhum pedido encontrado</h3>
          <p className="mt-2 text-sm text-gray-500">
            Você ainda não realizou nenhum pedido.
          </p>
          <Button 
            className="mt-4 bg-red-600 hover:bg-red-700"
            onClick={() => router.push('/')}
          >
            Explorar Produtos
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card 
              key={order._id} 
              className="cursor-pointer transition-colors hover:bg-gray-50"
              onClick={() => handleOrderClick(order._id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col space-y-1">
                    <CardTitle className="text-base font-medium">
                      Pedido #{order._id.slice(-8).toUpperCase()}
                    </CardTitle>
                    <span className="text-xs text-gray-500">
                      Realizado em {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-lg font-bold">{formatCurrency(order.totalPrice)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {order.orderItem.length} {order.orderItem.length === 1 ? 'item' : 'itens'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Clique para ver detalhes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
