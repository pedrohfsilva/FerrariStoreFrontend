"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingBag, Package } from "lucide-react"

// Props do componente: recebe os dados do usuário, incluindo os pedidos
interface OrderHistoryProps {
  userData: any
}

export default function OrderHistory({ userData }: OrderHistoryProps) {
  const [orders, setOrders] = useState(userData?.orders || [])

  // Caso não consiga carregar o userData
  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ShoppingBag className="mb-2 h-10 w-10 text-gray-400" />
        <h3 className="mb-1 text-lg font-medium">Não foi possível carregar seus pedidos</h3>
        <p className="text-sm text-gray-500">Tente novamente mais tarde</p>
      </div>
    )
  }

  // Caso não existam pedidos
  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ShoppingBag className="mb-2 h-10 w-10 text-gray-400" />
        <h3 className="mb-1 text-lg font-medium">Nenhum pedido encontrado</h3>
        <p className="text-sm text-gray-500">Você ainda não fez nenhuma compra</p>
        <Button className="mt-4 bg-red-600 hover:bg-red-700" onClick={() => window.location.href = '/'}>
          Ver produtos
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Histórico de Pedidos</h2>

      {orders.map((order: any, index: number) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    Pedido #{order._id?.slice(-8).toUpperCase() || `#${index + 1}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    R$ {order.totalPrice?.toFixed(2) || '0,00'}
                  </p>
                </div>
              </div>

              {/* Itens do pedido */}
              <div className="space-y-2">
                {order.orderItem?.length > 0 ? (
                  order.orderItem.map((item: any, itemIndex: number) => (
                    <div 
                      key={itemIndex} 
                      className={`flex items-center gap-3 p-2 bg-gray-50 rounded ${item.productDetails?.unavailable ? 'opacity-60' : ''}`}
                    >
                      <div className="relative h-12 w-12 overflow-hidden rounded bg-gray-100">
                        {item.productDetails?.images?.length > 0 && !item.productDetails.unavailable ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/public/images/products/${item.productDetails.images[0]}`}
                            alt={item.productDetails.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gray-200">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${item.productDetails?.unavailable ? 'text-gray-500' : ''}`}>
                          {item.productDetails?.name || 'Produto não disponível'}
                        </p>
                        <p className="text-xs text-gray-600">Qtd: {item.quantity}</p>
                        {item.productDetails?.unavailable && (
                          <p className="text-xs text-red-500">Este produto não está mais disponível</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${item.productDetails?.unavailable ? 'text-gray-400' : ''}`}>
                          {item.productDetails && !item.productDetails.unavailable 
                            ? `R$ ${(item.productDetails.price * item.quantity).toFixed(2)}`
                            : '-'
                          }
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Nenhum item encontrado neste pedido</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
