"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Edit, Trash2, Check } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import AddressForm from "./address-form"
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

// interface representando um endereço
interface Address {
  id: string
  name: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  isDefault: boolean
}

export default function AddressList() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const { toast } = useToast()

  // Carrega os endereços do localStorage
  useEffect(() => {
    const storedAddresses = localStorage.getItem("userAddresses")
    if (storedAddresses) {
      setAddresses(JSON.parse(storedAddresses))
    } else {
      // Definir endereço padrão
      const defaultAddresses = [
        {
          id: "addr1",
          name: "Casa",
          street: "Rua das Ferraris, 458",
          city: "Maranello",
          state: "MO",
          zipCode: "41053",
          country: "Itália",
          isDefault: true,
        },
      ]
      setAddresses(defaultAddresses)
      localStorage.setItem("userAddresses", JSON.stringify(defaultAddresses))
    }
  }, [])

  // função para iniciar adição de novo endereço
  const handleAddAddress = () => {
    setEditingAddress(null)
    setShowForm(true)
  }

  // função para iniciar edição de um endereço
  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setShowForm(true)
  }

  // função para deletar um endereço
  const handleDeleteAddress = (id: string) => {
    const updatedAddresses = addresses.filter((address) => address.id !== id)

    // Se deletou o endereço padrão, define o primeiro como padrão
    if (addresses.find((addr) => addr.id === id)?.isDefault && updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true
    }

    setAddresses(updatedAddresses)
    localStorage.setItem("userAddresses", JSON.stringify(updatedAddresses))

    toast({
      title: "Endereço excluído",
      description: "O endereço foi excluído com sucesso",
    })
  }

  // função para definir um endereço como padrão
  const handleSetDefault = (id: string) => {
    const updatedAddresses = addresses.map((address) => ({
      ...address,
      isDefault: address.id === id,
    }))

    setAddresses(updatedAddresses)
    localStorage.setItem("userAddresses", JSON.stringify(updatedAddresses))

    toast({
      title: "Endereço padrão atualizado",
      description: "Seu endereço padrão foi atualizado",
    })
  }

  // função para salvar novo ou editar endereço existente
  const handleSaveAddress = (address: Address) => {
    let updatedAddresses: Address[]

    if (editingAddress) {
      // Editando endereço existente
      updatedAddresses = addresses.map((addr) => (addr.id === address.id ? address : addr))
    } else {
      // Adicionando novo endereço
      const newAddress = {
        ...address,
        id: `addr${Date.now()}`,
        isDefault: addresses.length === 0 ? true : address.isDefault,
      }

      // Se for definido como padrão, atualiza os outros
      if (newAddress.isDefault) {
        updatedAddresses = addresses.map((addr) => ({
          ...addr,
          isDefault: false,
        }))
        updatedAddresses.push(newAddress)
      } else {
        updatedAddresses = [...addresses, newAddress]
      }
    }

    setAddresses(updatedAddresses)
    localStorage.setItem("userAddresses", JSON.stringify(updatedAddresses))
    setShowForm(false)

    toast({
      title: editingAddress ? "Endereço atualizado" : "Endereço adicionado",
      description: editingAddress
        ? "Seu endereço foi atualizado com sucesso"
        : "Seu novo endereço foi adicionado com sucesso",
    })
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Meus Endereços</h2>
        <Button className="bg-red-600 hover:bg-red-700" onClick={handleAddAddress}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Novo Endereço
        </Button>
      </div>

      {showForm ? (
        <AddressForm
          address={editingAddress}
          onSave={handleSaveAddress}
          onCancel={() => setShowForm(false)}
          addresses={addresses}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.length === 0 ? (
            <div className="col-span-2 rounded-lg border border-dashed p-8 text-center">
              <p className="text-gray-500">Você ainda não tem endereços salvos.</p>
              <Button className="mt-4 bg-red-600 hover:bg-red-700" onClick={handleAddAddress}>
                Adicionar Seu Primeiro Endereço
              </Button>
            </div>
          ) : (
            addresses.map((address) => (
              <Card key={address.id} className="relative overflow-hidden">
                {address.isDefault && (
                  <div className="absolute right-0 top-0 bg-red-600 px-2 py-1 text-xs text-white">Padrão</div>
                )}
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold">{address.name}</h3>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-blue-600"
                        onClick={() => handleEditAddress(address)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Endereço</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir este endereço? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleDeleteAddress(address.id)}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p>{address.street}</p>
                    <p>
                      {address.city}, {address.state} {address.zipCode}
                    </p>
                    <p>{address.country}</p>
                  </div>

                  {!address.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 text-xs"
                      onClick={() => handleSetDefault(address.id)}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Definir como Padrão
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
