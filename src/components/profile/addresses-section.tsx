"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { API_ENDPOINTS, authFetchConfig } from "@/lib/api"
import { Plus, Edit, Trash2, Home, CheckCircle2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"

// Interface para representar o endereço
interface Address {
  _id?: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  isDefault: boolean
}

export default function AddressesSection() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false)
  const [currentAddress, setCurrentAddress] = useState<Address | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  // Buscar endereços na API ao carregar
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(API_ENDPOINTS.addresses, authFetchConfig())
        if (!response.ok) throw new Error('Falha ao buscar endereços')
        
        const data = await response.json()
        setAddresses(Array.isArray(data.addresses) ? data.addresses : [])
      } catch (error) {
        console.error("Erro ao buscar endereços:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar seus endereços.",
          variant: "destructive"
        })
        setAddresses([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchAddresses()
  }, [toast])

  // Submissão do formulário de adicionar/editar endereço
  const handleAddressSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validateAddressForm()) return

    try {
      const isEditing = !!currentAddress?._id
      const url = isEditing ? `${API_ENDPOINTS.addresses}/${currentAddress?._id}` : API_ENDPOINTS.addresses
      const method = isEditing ? 'PUT' : 'POST'
      const response = await fetch(url, authFetchConfig(method, currentAddress))

      if (!response.ok) throw new Error(isEditing ? 'Falha ao atualizar endereço' : 'Falha ao adicionar endereço')

      const data = await response.json()

      // Buscar lista atualizada
      const refreshResponse = await fetch(API_ENDPOINTS.addresses, authFetchConfig())
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        if (Array.isArray(refreshData.addresses)) {
          setAddresses(refreshData.addresses)
        }
      } else {
        // Atualizar localmente caso não tenha resposta completa
        if (isEditing && currentAddress) {
          const updatedAddresses = addresses.map(addr =>
            addr._id === currentAddress._id ? { ...currentAddress } : addr
          )
          if (currentAddress.isDefault) {
            updatedAddresses.forEach(addr => {
              if (addr._id !== currentAddress._id) addr.isDefault = false
            })
          }
          setAddresses(updatedAddresses)
        } else if (currentAddress) {
          const newAddress = { ...currentAddress, _id: data._id || Date.now().toString() }
          if (newAddress.isDefault) {
            const updatedAddresses = addresses.map(addr => ({ ...addr, isDefault: false }))
            setAddresses([...updatedAddresses, newAddress])
          } else {
            setAddresses([...addresses, newAddress])
          }
        }
      }

      setIsAddressDialogOpen(false)
      toast({
        title: isEditing ? "Endereço atualizado" : "Endereço adicionado",
        description: isEditing
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

  // Remover endereço
  const handleDeleteAddress = async (addressId: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.addresses}/${addressId}`, authFetchConfig('DELETE'))
      if (!response.ok) throw new Error('Falha ao remover endereço')

      const data = await response.json()
      if (Array.isArray(data.addresses)) {
        setAddresses(data.addresses)
      } else {
        setAddresses(addresses.filter(addr => addr._id !== addressId))
      }
      toast({
        title: "Endereço removido",
        description: "O endereço foi removido com sucesso."
      })
    } catch (error) {
      console.error("Erro ao remover endereço:", error)
      toast({
        title: "Erro",
        description: "Não foi possível remover o endereço.",
        variant: "destructive"
      })
    }
  }

  // Definir endereço como padrão
  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      const address = addresses.find(addr => addr._id === addressId)
      if (!address) return

      const response = await fetch(`${API_ENDPOINTS.addresses}/${addressId}`,
        authFetchConfig('PUT', { ...address, isDefault: true })
      )
      if (!response.ok) throw new Error('Falha ao definir como padrão')

      const data = await response.json()
      if (Array.isArray(data.addresses)) {
        setAddresses(data.addresses)
      } else {
        setAddresses(addresses.map(addr => ({
          ...addr,
          isDefault: addr._id === addressId
        })))
      }
      toast({
        title: "Endereço padrão atualizado",
        description: "Seu endereço padrão foi atualizado com sucesso."
      })
    } catch (error) {
      console.error("Erro ao definir padrão:", error)
      toast({
        title: "Erro",
        description: "Não foi possível definir o endereço como padrão.",
        variant: "destructive"
      })
    }
  }

  // Validação do formulário
  const validateAddressForm = () => {
    const errors: Record<string, string> = {}
    const requiredFields = ['street', 'number', 'neighborhood', 'city', 'state', 'zipCode']
    if (!currentAddress) return false
    requiredFields.forEach(field => {
      if (!currentAddress[field as keyof Address]) {
        errors[field] = 'Este campo é obrigatório'
      }
    })
    if (currentAddress.zipCode && !/^\d{5}-?\d{3}$/.test(currentAddress.zipCode)) {
      errors.zipCode = 'CEP inválido. Use o formato 00000-000'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (currentAddress) {
      setCurrentAddress({ ...currentAddress, [name]: value })
    }
  }

  const addNewAddress = () => {
    setCurrentAddress({
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      isDefault: addresses.length === 0
    })
    setIsAddressDialogOpen(true)
  }

  const editAddress = (address: Address) => {
    setCurrentAddress({ ...address })
    setIsAddressDialogOpen(true)
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
        <h2 className="text-xl font-semibold">Meus Endereços</h2>
        <Button onClick={addNewAddress} className="bg-red-600 hover:bg-red-700">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Endereço
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <Home className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">Nenhum endereço cadastrado</h3>
          <p className="mt-2 text-sm text-gray-500">
            Adicione um endereço para facilitar suas compras.
          </p>
          <Button onClick={addNewAddress} className="mt-4 bg-red-600 hover:bg-red-700">
            Adicionar Endereço
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address._id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">
                    {address.street}, {address.number}
                  </CardTitle>
                  {address.isDefault && (
                    <Badge className="bg-green-600">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Padrão
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pb-2 text-sm">
                <p>
                  {address.complement && `${address.complement}, `}
                  {address.neighborhood}
                </p>
                <p>
                  {address.city} - {address.state}
                </p>
                <p>{address.zipCode}</p>
              </CardContent>
              <CardFooter className="pt-2">
                <div className="flex w-full space-x-2">
                  {!address.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-green-600 hover:text-green-700"
                      onClick={() => handleSetDefaultAddress(address._id!)}
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      Tornar Padrão
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => editAddress(address)}
                  >
                    <Edit className="mr-1 h-4 w-4" />
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-600 hover:text-red-700"
                        disabled={addresses.length === 1}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Remover
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover endereço?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja remover este endereço? Esta ação não poderá ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => handleDeleteAddress(address._id!)}
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentAddress?._id ? "Editar Endereço" : "Adicionar Endereço"}</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo com as informações do seu endereço.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddressSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Rua *</Label>
                  <Input
                    id="street"
                    name="street"
                    value={currentAddress?.street || ""}
                    onChange={handleInputChange}
                    placeholder="Rua, Avenida, etc."
                  />
                  {formErrors.street && (
                    <p className="text-xs text-red-600">{formErrors.street}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Número *</Label>
                  <Input
                    id="number"
                    name="number"
                    value={currentAddress?.number || ""}
                    onChange={handleInputChange}
                    placeholder="Ex: 123"
                  />
                  {formErrors.number && (
                    <p className="text-xs text-red-600">{formErrors.number}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  name="complement"
                  value={currentAddress?.complement || ""}
                  onChange={handleInputChange}
                  placeholder="Apto, Bloco, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro *</Label>
                <Input
                  id="neighborhood"
                  name="neighborhood"
                  value={currentAddress?.neighborhood || ""}
                  onChange={handleInputChange}
                  placeholder="Ex: Centro"
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
                    placeholder="Ex: São Paulo"
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
                    placeholder="Ex: SP"
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
                {currentAddress?._id ? "Atualizar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
