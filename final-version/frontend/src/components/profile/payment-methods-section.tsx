"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { API_ENDPOINTS, authFetchConfig } from "@/lib/api"
import { 
  Edit, CreditCard, CheckCircle2, 
  Wallet, BanknoteIcon 
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PaymentMethod {
  type: 'credit' | 'debit'
  cardNumber: string
  cardHolderName: string
  expirationDate: string
  cvv: string
}

export default function PaymentMethodSection() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [currentPayment, setCurrentPayment] = useState<PaymentMethod | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  // Buscar método de pagamento
  useEffect(() => {
    const fetchPaymentMethod = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(API_ENDPOINTS.getPaymentMethod, authFetchConfig())
        
        if (!response.ok) {
          throw new Error('Falha ao buscar método de pagamento')
        }
        
        const data = await response.json()
        setPaymentMethod(data.paymentMethod || null)
      } catch (error) {
        console.error("Erro ao buscar método de pagamento:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar seu método de pagamento.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPaymentMethod()
  }, [toast])

  const handlePaymentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!validatePaymentForm()) return

    try {
      const url = API_ENDPOINTS.updatePaymentMethod
      const method = 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(currentPayment)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Falha ao atualizar método de pagamento')
      }
      
      const data = await response.json()
      
      setPaymentMethod(data.paymentMethod)
      setIsPaymentDialogOpen(false)
      
      toast({
        title: paymentMethod ? "Método atualizado" : "Método adicionado",
        description: paymentMethod 
          ? "Seu método de pagamento foi atualizado com sucesso."
          : "Seu método de pagamento foi adicionado com sucesso."
      })
    } catch (error) {
      console.error("Erro ao salvar método de pagamento:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
        variant: "destructive"
      })
    }
  }

  const validatePaymentForm = () => {
    const errors: Record<string, string> = {}
    
    if (!currentPayment) return false

    if (!currentPayment.type) errors.type = 'O tipo de cartão é obrigatório'

    if (!currentPayment.cardNumber) {
      errors.cardNumber = 'O número do cartão é obrigatório'
    } else if (!/^\d{13,19}$/.test(currentPayment.cardNumber.replace(/\s/g, ''))) {
      errors.cardNumber = 'Número de cartão inválido'
    }

    if (!currentPayment.cardHolderName) {
      errors.cardHolderName = 'O nome do titular é obrigatório'
    }

    if (!currentPayment.expirationDate) {
      errors.expirationDate = 'A data de validade é obrigatória'
    } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(currentPayment.expirationDate)) {
      errors.expirationDate = 'Formato inválido. Use MM/AA'
    }

    if (!currentPayment.cvv) {
      errors.cvv = 'O código de segurança é obrigatório'
    } else if (!/^\d{3,4}$/.test(currentPayment.cvv)) {
      errors.cvv = 'CVV inválido'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (currentPayment) {
      setCurrentPayment({
        ...currentPayment,
        [name]: value
      })
    }
  }

  const handleSelectChange = (value: string) => {
    if (currentPayment) {
      setCurrentPayment({
        ...currentPayment,
        type: value as 'credit' | 'debit'
      })
    }
  }

  const addNewPaymentMethod = () => {
    setCurrentPayment({
      type: 'credit',
      cardNumber: '',
      cardHolderName: '',
      expirationDate: '',
      cvv: ''
    })
    setIsPaymentDialogOpen(true)
  }

  const editPaymentMethod = () => {
    setCurrentPayment(paymentMethod ? { ...paymentMethod, cvv: '' } : {
      type: 'credit',
      cardNumber: '',
      cardHolderName: '',
      expirationDate: '',
      cvv: ''
    })
    setIsPaymentDialogOpen(true)
  }

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'credit': return <CreditCard className="h-5 w-5 text-blue-600" />
      case 'debit': return <BanknoteIcon className="h-5 w-5 text-green-600" />
      default: return <Wallet className="h-5 w-5" />
    }
  }

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'credit': return 'Cartão de Crédito'
      case 'debit': return 'Cartão de Débito'
      default: return type
    }
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
        <h2 className="text-xl font-semibold">Método de Pagamento</h2>
        <Button onClick={editPaymentMethod} className="bg-red-600 hover:bg-red-700">
          {paymentMethod ? "Editar Método" : "Adicionar Método"}
        </Button>
      </div>

      {!paymentMethod ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <Wallet className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">Nenhum método de pagamento cadastrado</h3>
          <p className="mt-2 text-sm text-gray-500">
            Adicione um método de pagamento para facilitar suas compras.
          </p>
          <Button onClick={addNewPaymentMethod} className="mt-4 bg-red-600 hover:bg-red-700">
            Adicionar Método de Pagamento
          </Button>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getPaymentIcon(paymentMethod.type)}
                <CardTitle className="text-base font-medium">
                  {getPaymentTypeLabel(paymentMethod.type)}
                </CardTitle>
              </div>
              <Badge className="bg-green-600">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Principal
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-6 text-sm">
            <p className="font-medium">{paymentMethod.cardHolderName}</p>
            <p>{paymentMethod.cardNumber.replace(/\d(?=\d{4})/g, '•')}</p>
            <p>Validade: {paymentMethod.expirationDate}</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {paymentMethod ? "Editar Método de Pagamento" : "Adicionar Método de Pagamento"}
            </DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo com as informações do seu cartão.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePaymentSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Cartão *</Label>
                <Select value={currentPayment?.type} onValueChange={handleSelectChange}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Selecione o tipo de cartão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Cartão de Crédito</SelectItem>
                    <SelectItem value="debit">Cartão de Débito</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.type && <p className="text-xs text-red-600">{formErrors.type}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardNumber">Número do Cartão *</Label>
                <Input
                  id="cardNumber"
                  name="cardNumber"
                  placeholder="0000 0000 0000 0000"
                  value={currentPayment?.cardNumber || ""}
                  onChange={handleInputChange}
                />
                {formErrors.cardNumber && <p className="text-xs text-red-600">{formErrors.cardNumber}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardHolderName">Nome no Cartão *</Label>
                <Input
                  id="cardHolderName"
                  name="cardHolderName"
                  placeholder="João Silva"
                  value={currentPayment?.cardHolderName || ""}
                  onChange={handleInputChange}
                />
                {formErrors.cardHolderName && <p className="text-xs text-red-600">{formErrors.cardHolderName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expirationDate">Validade *</Label>
                  <Input
                    id="expirationDate"
                    name="expirationDate"
                    placeholder="MM/AA"
                    value={currentPayment?.expirationDate || ""}
                    onChange={handleInputChange}
                    maxLength={5}
                  />
                  {formErrors.expirationDate && <p className="text-xs text-red-600">{formErrors.expirationDate}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV *</Label>
                  <Input
                    id="cvv"
                    name="cvv"
                    type="password"
                    placeholder="123"
                    value={currentPayment?.cvv || ""}
                    onChange={handleInputChange}
                    maxLength={4}
                  />
                  {formErrors.cvv && <p className="text-xs text-red-600">{formErrors.cvv}</p>}
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" className="bg-red-600 hover:bg-red-700">
                {paymentMethod ? "Atualizar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
