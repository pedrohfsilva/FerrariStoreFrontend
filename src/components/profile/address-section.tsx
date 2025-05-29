"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { API_URL, API_ENDPOINTS, authFetchConfig } from "@/lib/api"
import { Edit, MapPin, CheckCircle2 } from "lucide-react"
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

// Interface para o endereço
interface Address {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
}

export default function AddressSection() {
  const [address, setAddress] = useState<Address | null>(null) // Endereço atual
  const [isLoading, setIsLoading] = useState(true) // Estado de carregamento
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false) // Controle do modal
  const [currentAddress, setCurrentAddress] = useState<Address | null>(null) // Endereço em edição
  const [formErrors, setFormErrors] = useState<Record<string, string>>({}) // Erros do formulário
  const { toast } = useToast()

  // Buscar endereço na API
  useEffect(() => {
    const fetchAddress = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(API_ENDPOINTS.address, authFetchConfig())

        if (!response.ok) {
          throw new Error('Falha ao buscar endereço')
        }

        const data = await response.json()
        setAddress(data.address || null)
      } catch (error) {
        console.error("Erro ao buscar endereço:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar seu endereço.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchAddress()
  }, [toast])

  // Submissão do formulário
  const handleAddressSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateAddressForm()) {
      return
    }

    try {
      const url = API_ENDPOINTS.address
      const method = 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(currentAddress)
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao atualizar endereço')
      }

      const data = await response.json()

      setAddress(data.address)
      setIsAddressDialogOpen(false)

      toast({
        title: address ? "Endereço atualizado" : "Endereço adicionado",
        description: address
          ? "Seu endereço foi atualizado com sucesso."
          : "Seu endereço foi adicionado com sucesso."
      })
    } catch (error) {
      console.error("Erro ao salvar endereço:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
        variant: "destructive"
      })
    }
  }

  // Validação do formulário
  const validateAddressForm = () => {
    const errors: Record<string, string> = {}

    if (!currentAddress) return false

    if (!currentAddress.street) {
      errors.street = 'A rua é obrigatória'
    }

    if (!currentAddress.number) {
      errors.number = 'O número é obrigatório'
    }

    if (!currentAddress.neighborhood) {
      errors.neighborhood = 'O bairro é obrigatório'
    }

    if (!currentAddress.city) {
      errors.city = 'A cidade é obrigatória'
    }

    if (!currentAddress.state) {
      errors.state = 'O estado é obrigatório'
    }

    if (!currentAddress.zipCode) {
      errors.zipCode = 'O CEP é obrigatório'
    } else if (!/^\d{5}-?\d{3}$/.test(currentAddress.zipCode.replace(/\D/g, ''))) {
      errors.zipCode = 'CEP inválido'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Atualização dos inputs do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (currentAddress) {
      setCurrentAddress({
        ...currentAddress,
        [name]: value
      })
    }
  }

  // Adicionar novo endereço
  const addNewAddress = () => {
    setCurrentAddress({
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    })
    setIsAddressDialogOpen(true)
  }

  // Editar endereço existente
  const editAddress = () => {
    if (address) {
      setCurrentAddress({ ...address })
    } else {
      addNewAddress()
    }
    setIsAddressDialogOpen(true)
  }

  // Formata a linha principal do endereço
  const formatAddress = (address: Address) => {
    return `${address.street}, ${address.number}${address.complement ? `, ${address.complement}` : ''}`;
  }

  // Formata bairro, cidade e estado
  const formatCityState = (address: Address) => {
    return `${address.neighborhood} - ${address.city}, ${address.state}`;
  }

  // Enquanto carrega, exibe loader
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
        <h2 className="text-xl font-semibold">Endereço</h2>
        <Button onClick={editAddress} className="bg-red-600 hover:bg-red-700">
          {address ? "Editar Endereço" : "Adicionar Endereço"}
        </Button>
      </div>

      {!address ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">Nenhum endereço cadastrado</h3>
          <p className="mt-2 text-sm text-gray-500">
            Adicione um endereço para facilitar suas compras.
          </p>
          <Button onClick={addNewAddress} className="mt-4 bg-red-600 hover:bg-red-700">
            Adicionar Endereço
          </Button>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-red-600" />
                <CardTitle className="text-base font-medium">
                  Endereço de Entrega
                </CardTitle>
              </div>
              <Badge className="bg-green-600">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Principal
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-6 text-sm">
            <p className="font-medium">{formatAddress(address)}</p>
            <p>{formatCityState(address)}</p>
            <p>CEP: {address.zipCode}</p>
          </CardContent>
        </Card>
      )}

      {/* Modal de adicionar/editar endereço */}
      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {address ? "Editar Endereço" : "Adicionar Endereço"}
            </DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo com as informações do seu endereço.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddressSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="street">Rua/Avenida *</Label>
                <Input
                  id="street"
                  name="street"
                  value={currentAddress?.street || ""}
                  onChange={handleInputChange}
                  placeholder="Rua João Silva"
                />
                {formErrors.street && (
                  <p className="text-xs text-red-600">{formErrors.street}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number">Número *</Label>
                  <Input
                    id="number"
                    name="number"
                    value={currentAddress?.number || ""}
                    onChange={handleInputChange}
                    placeholder="123"
                  />
                  {formErrors.number && (
                    <p className="text-xs text-red-600">{formErrors.number}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    name="complement"
                    value={currentAddress?.complement || ""}
                    onChange={handleInputChange}
                    placeholder="Apto 101"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro *</Label>
                <Input
                  id="neighborhood"
                  name="neighborhood"
                  value={currentAddress?.neighborhood || ""}
                  onChange={handleInputChange}
                  placeholder="Centro"
                />
                {formErrors.neighborhood && (
                  <p className="text-xs text-red-600">{formErrors.neighborhood}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={currentAddress?.city || ""}
                    onChange={handleInputChange}
                    placeholder="São Paulo"
                  />
                  {formErrors.city && (
                    <p className="text-xs text-red-600">{formErrors.city}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado *</Label>
                  <Input
                    id="state"
                    name="state"
                    value={currentAddress?.state || ""}
                    onChange={handleInputChange}
                    placeholder="SP"
                    maxLength={2}
                  />
                  {formErrors.state && (
                    <p className="text-xs text-red-600">{formErrors.state}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP *</Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  value={currentAddress?.zipCode || ""}
                  onChange={handleInputChange}
                  placeholder="00000-000"
                />
                {formErrors.zipCode && (
                  <p className="text-xs text-red-600">{formErrors.zipCode}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" className="bg-red-600 hover:bg-red-700">
                {address ? "Atualizar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
