"use client"

// importando tipos e hooks do React
import type React from "react"
import { useState, useEffect } from "react"

// importando componentes de UI
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

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

// props do formulário de endereço
interface AddressFormProps {
  address: Address | null
  onSave: (address: Address) => void // função de callback ao salvar
  onCancel: () => void // função de callback ao cancelar
  addresses: Address[] // lista de endereços existentes
}

// componente principal do formulário de endereço
export default function AddressForm({ address, onSave, onCancel, addresses }: AddressFormProps) {
  // estado do formulário; se não tiver id é porque é um novo endereço
  const [formData, setFormData] = useState<Omit<Address, "id"> & { id?: string }>({
    name: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    isDefault: false,
  })

  // se estiver editando, preenche o formulário com os dados
  useEffect(() => {
    if (address) {
      setFormData(address)
    } else {
      // se for o primeiro endereço, define como padrão
      setFormData((prev) => ({
        ...prev,
        isDefault: addresses.length === 0,
      }))
    }
  }, [address, addresses])

  // função para atualizar os campos de texto
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // função para atualizar o switch de endereço padrão
  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isDefault: checked }))
  }

  // função para lidar com o envio do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData as Address) // chama a função de salvar passando os dados
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Endereço</Label>
        <Input
          id="name"
          name="name"
          placeholder="Casa, Trabalho, etc."
          value={formData.name}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="street">Endereço</Label>
        <Input
          id="street"
          name="street"
          placeholder="Rua Exemplo, 123"
          value={formData.street}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            name="city"
            placeholder="São Paulo"
            value={formData.city}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">Estado/Província</Label>
          <Input
            id="state"
            name="state"
            placeholder="SP"
            value={formData.state}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="zipCode">CEP</Label>
          <Input
            id="zipCode"
            name="zipCode"
            placeholder="00000-000"
            value={formData.zipCode}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">País</Label>
          <Input
            id="country"
            name="country"
            placeholder="Brasil"
            value={formData.country}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isDefault"
          checked={formData.isDefault}
          onCheckedChange={handleSwitchChange}
          disabled={addresses.length === 0} // se for o primeiro, já é padrão
        />
        <Label htmlFor="isDefault">Definir como endereço padrão</Label>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-red-600 hover:bg-red-700">
          {address ? "Atualizar Endereço" : "Adicionar Endereço"}
        </Button>
      </div>
    </form>
  )
}
