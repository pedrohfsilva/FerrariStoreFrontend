"use client"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { API_ENDPOINTS } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import { 
  CheckCircle2, 
  Package, 
  MapPin, 
  CreditCard,
  Loader2,
  ArrowLeft,
  Home
} from "lucide-react"

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
    cvv?: string
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

export default function OrderSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const orderId = searchParams.get('orderId')
  const orderSuccessful = searchParams.get('orderSuccessful')
  console.log(orderSuccessful)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        router.push('/')
        return
      }

      try {
        setIsLoading(true)
        
        const response = await fetch(API_ENDPOINTS.order(orderId), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (!response.ok) {
          throw new Error('Pedido não encontrado')
        }

        const data = await response.json()
        setOrder(data.order)
      } catch (error) {
        console.error("Error fetching order:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os detalhes do pedido.",
          variant: "destructive"
        })
        router.push('/')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, router, toast])

  if (isLoading) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container flex min-h-[50vh] flex-col items-center justify-center py-8">
        <Package className="mb-4 h-16 w-16 text-gray-400" />
        <h1 className="mb-2 text-2xl font-bold">Pedido não encontrado</h1>
        <p className="mb-6 text-gray-600">O pedido que você está procurando não existe.</p>
        <Button className="bg-red-600 hover:bg-red-700" onClick={() => router.push("/")}>
          <Home className="mr-2 h-4 w-4" />
          Voltar ao Início
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Success Header */}
      {orderSuccessful && (
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-green-600">Pedido Realizado com Sucesso!</h1>
          <p className="text-gray-600">
            Seu pedido #{order._id.slice(-8)} foi confirmado e está sendo processado.
          </p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Itens do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.orderItem.map((item, index) => (
                <div key={index} className={`flex items-center gap-4 pb-4 border-b last:border-b-0 last:pb-0 ${item.productDetails?.unavailable ? 'opacity-60' : ''}`}>
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-gray-100">
                    {item.productDetails?.images && item.productDetails.images.length > 0 && !item.productDetails.unavailable ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/public/images/products/${item.productDetails.images[0]}`}
                        alt={item.productDetails.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gray-200">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium ${item.productDetails?.unavailable ? 'text-gray-500' : ''}`}>
                      {item.productDetails?.name || 'Produto'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Quantidade: {item.quantity}
                    </p>
                    {item.productDetails?.unavailable && (
                      <p className="text-xs text-red-500 mt-1">
                        Este produto não está mais disponível
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${item.productDetails?.unavailable ? 'text-gray-400' : ''}`}>
                      {item.productDetails && !item.productDetails.unavailable ? formatCurrency(item.productDetails.price * item.quantity) : '-'}
                    </p>
                    <p className={`text-sm text-gray-600 ${item.productDetails?.unavailable ? 'text-gray-400' : ''}`}>
                      {item.productDetails && !item.productDetails.unavailable ? formatCurrency(item.productDetails.price) : '-'} cada
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="font-medium">
                  {order.shippingAddress.street}, {order.shippingAddress.number}
                  {order.shippingAddress.complement && ` - ${order.shippingAddress.complement}`}
                </p>
                <p className="text-gray-600">
                  {order.shippingAddress.neighborhood}, {order.shippingAddress.city} - {order.shippingAddress.state}
                </p>
                <p className="text-gray-600">CEP: {order.shippingAddress.zipCode}</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Método de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {order.paymentMethod.type === 'credit' ? 'Cartão de Crédito' : 'Cartão de Débito'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Número do Cartão: {order.paymentMethod.cardNumber}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Nome do Titular: {order.paymentMethod.cardHolderName}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Data de Expiração: {order.paymentMethod.expirationDate}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Número do Pedido</span>
                <span className="font-mono text-sm">#{order._id.slice(-8)}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Data do Pedido</span>
                <span>{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Total de Itens</span>
                <span>{order.orderItem.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Pago</span>
                  <span>{formatCurrency(order.totalPrice)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Próximos Passos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <p className="font-medium mb-2">O que acontece agora?</p>
                <ul className="space-y-1 text-gray-600">
                  <li>• Processamento do pagamento</li>
                  <li>• Preparação do pedido</li>
                  <li>• Envio para entrega</li>
                  <li>• Acompanhe pelo seu perfil</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              className="w-full bg-red-600 hover:bg-red-700" 
              onClick={() => router.push('/profile')}
            >
              Ver Meus Pedidos
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continuar Comprando
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
