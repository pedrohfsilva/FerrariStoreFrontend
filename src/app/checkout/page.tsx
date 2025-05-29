"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/context/cart-context"
import { API_ENDPOINTS, authFetchConfig } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import { 
  Loader2, 
  MapPin, 
  CreditCard, 
  Package, 
  AlertCircle,
  CheckCircle2,
  Edit
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Address {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
}

interface PaymentMethod {
  type: 'credit' | 'debit'
  cardNumber: string
  cardHolderName: string
  expirationDate: string
}

export default function CheckoutPage() {
  const { cart, clearCart, isLoading: cartLoading } = useCart()
  const { toast } = useToast()
  const router = useRouter()
  
  const [address, setAddress] = useState<Address | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessingOrder, setIsProcessingOrder] = useState(false)

  // Calcula os valores totais
  const subtotal = cart.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)
  const shipping = subtotal > 500 ? 0 : 50 // Frete gratis acima de $500
  const total = subtotal + shipping

  // Fetch dados do usuario
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch endereço
        const addressResponse = await fetch(API_ENDPOINTS.address, authFetchConfig())
        if (addressResponse.ok) {
          const addressData = await addressResponse.json()
          setAddress(addressData.address)
        }
        
        // Fetch metodo de pagamento
        const paymentResponse = await fetch(API_ENDPOINTS.getPaymentMethod, authFetchConfig())
        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json()
          setPaymentMethod(paymentData.paymentMethod)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar seus dados.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [toast])

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

  const handlePlaceOrder = async () => {
    if (!address) {
      toast({
        title: "Endereço necessário",
        description: "Você precisa cadastrar um endereço antes de finalizar o pedido.",
        variant: "destructive"
      })
      return
    }

    if (!paymentMethod) {
      toast({
        title: "Método de pagamento necessário",
        description: "Você precisa cadastrar um método de pagamento antes de finalizar o pedido.",
        variant: "destructive"
      })
      return
    }

    if (cart.items.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho antes de finalizar o pedido.",
        variant: "destructive"
      })
      return
    }

    setIsProcessingOrder(true)
    
    try {
      const response = await fetch(API_ENDPOINTS.createOrder, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Falha ao criar pedido')
      }

      const data = await response.json()
      
      // Esvazia o carrinho localmente
      await clearCart()
      
      toast({
        title: "Pedido realizado com sucesso!",
        description: "Você será redirecionado para a página de confirmação.",
      })
      
      // Redireciona para a pagina de pedido concluido com sucesso
      router.push(`/order?orderId=${data.order._id}&orderSuccessful=true`)
      
    } catch (error) {
      console.error("Error creating order:", error)
      toast({
        title: "Erro ao processar pedido",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
        variant: "destructive"
      })
    } finally {
      setIsProcessingOrder(false)
    }
  }

  if (isLoading || cartLoading) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="container flex min-h-[50vh] flex-col items-center justify-center py-8">
        <Package className="mb-4 h-16 w-16 text-gray-400" />
        <h1 className="mb-2 text-2xl font-bold">Seu carrinho está vazio</h1>
        <p className="mb-6 text-gray-600">Adicione alguns produtos incríveis da Ferrari!</p>
        <Button className="bg-red-600 hover:bg-red-700" onClick={() => router.push("/")}>
          Explorar Produtos
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="mb-8 text-3xl font-bold">Finalizar Compra</h1>
      
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Resumo do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                    <Image
                      src={getImageUrl(item)}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-600">
                      Quantidade: {item.quantity || 1}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(item.price * (item.quantity || 1))}</p>
                    <p className="text-sm text-gray-600">{formatCurrency(item.price)} cada</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Endereço de Entrega
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      {address ? "Editar" : "Adicionar"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Gerenciar Endereço</DialogTitle>
                      <DialogDescription>
                        Acesse seu perfil para gerenciar seu endereço de entrega.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => router.push('/profile')}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Ir para Perfil
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {address ? (
                <div className="space-y-1">
                  <p className="font-medium">
                    {address.street}, {address.number}
                    {address.complement && ` - ${address.complement}`}
                  </p>
                  <p className="text-gray-600">
                    {address.neighborhood}, {address.city} - {address.state}
                  </p>
                  <p className="text-gray-600">CEP: {address.zipCode}</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <p>Nenhum endereço cadastrado</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Método de Pagamento
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      {paymentMethod ? "Editar" : "Adicionar"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Gerenciar Pagamento</DialogTitle>
                      <DialogDescription>
                        Acesse seu perfil para gerenciar seus métodos de pagamento.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => router.push('/profile')}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Ir para Perfil
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paymentMethod ? (
                <div className="flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium">{paymentMethod.cardHolderName}</p>
                    <p className="text-gray-600">
                      {paymentMethod.type === 'credit' ? 'Cartão de Crédito' : 'Cartão de Débito'}
                    </p>
                    <p className="text-sm text-gray-500">
                      •••• •••• •••• {paymentMethod.cardNumber.slice(-4)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <p>Nenhum método de pagamento cadastrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Total do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal ({cart.items.length} {cart.items.length === 1 ? 'item' : 'itens'})</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Frete</span>
                <span className={shipping === 0 ? "text-green-600 font-medium" : ""}>
                  {shipping === 0 ? "Grátis" : formatCurrency(shipping)}
                </span>
              </div>
              
              {shipping === 0 && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Frete grátis para compras acima de R$ 500</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
              
              <Button 
                className="w-full bg-red-600 hover:bg-red-700" 
                size="lg"
                onClick={handlePlaceOrder}
                disabled={isProcessingOrder || !address || !paymentMethod}
              >
                {isProcessingOrder ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Finalizar Pedido"
                )}
              </Button>
              
              {(!address || !paymentMethod) && (
                <p className="text-sm text-gray-500 text-center">
                  Complete seu endereço e método de pagamento para continuar
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}