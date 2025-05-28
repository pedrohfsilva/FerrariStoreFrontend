"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Edit, CreditCard } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import PaymentMethodForm from "./payment-method-form"

// Interface do método de pagamento
interface PaymentMethod {
  id: string
  cardName: string
  cardNumber: string
  expiryDate: string
  cardType: string
  isDefault: boolean
}

export default function PaymentMethodList() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [showForm, setShowForm] = useState(false)
  const { toast } = useToast()

  // Carregar método de pagamento do localStorage
  useEffect(() => {
    const storedPaymentMethod = localStorage.getItem("userPaymentMethod")
    if (storedPaymentMethod) {
      setPaymentMethod(JSON.parse(storedPaymentMethod))
    }
  }, [])

  const handleAddPaymentMethod = () => {
    setShowForm(true)
  }

  const handleEditPaymentMethod = () => {
    setShowForm(true)
  }

  const handleSavePaymentMethod = (paymentMethod: PaymentMethod) => {
    const updatedPaymentMethod = {
      ...paymentMethod,
      id: "card1" // Apenas um cartão, então ID fixo
    }

    setPaymentMethod(updatedPaymentMethod)
    localStorage.setItem("userPaymentMethod", JSON.stringify(updatedPaymentMethod))
    setShowForm(false)

    toast({
      title: paymentMethod ? "Método de pagamento atualizado" : "Método de pagamento adicionado",
      description: paymentMethod
        ? "Seu método de pagamento foi atualizado com sucesso."
        : "Seu método de pagamento foi adicionado com sucesso."
    })
  }

  // Ícone do cartão conforme o tipo
  const getCardIcon = (cardType: string) => {
    return <CreditCard className="h-5 w-5" />
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Método de Pagamento</h2>
        <Button 
          className="bg-red-600 hover:bg-red-700" 
          onClick={paymentMethod ? handleEditPaymentMethod : handleAddPaymentMethod}
        >
          {paymentMethod ? (
            <>
              <Edit className="mr-2 h-4 w-4" />
              Editar Cartão
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Cartão
            </>
          )}
        </Button>
      </div>

      {showForm ? (
        <PaymentMethodForm
          paymentMethod={paymentMethod}
          onSave={handleSavePaymentMethod}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <div>
          {!paymentMethod ? (
            <div className="col-span-2 rounded-lg border border-dashed p-8 text-center">
              <p className="text-gray-500">Você ainda não possui nenhum método de pagamento salvo.</p>
              <Button className="mt-4 bg-red-600 hover:bg-red-700" onClick={handleAddPaymentMethod}>
                Adicionar Cartão
              </Button>
            </div>
          ) : (
            <Card className="relative overflow-hidden">
              <div className="absolute right-0 top-0 bg-red-600 px-2 py-1 text-xs text-white">Padrão</div>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center">
                    {getCardIcon(paymentMethod.cardType)}
                    <h3 className="ml-2 font-semibold">
                      {paymentMethod.cardType.charAt(0).toUpperCase() + paymentMethod.cardType.slice(1)}
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-blue-600"
                    onClick={handleEditPaymentMethod}
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                </div>

                <div className="space-y-1 text-sm">
                  <p className="font-medium">{paymentMethod.cardName}</p>
                  <p>{paymentMethod.cardNumber}</p>
                  <p>Validade: {paymentMethod.expiryDate}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
