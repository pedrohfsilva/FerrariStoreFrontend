"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Interface do método de pagamento
interface PaymentMethod {
  type: 'credit' | 'debit'
  cardNumber: string
  cardHolderName: string
  expirationDate: string
  cvv: string
}

interface PaymentMethodFormProps {
  paymentMethod: PaymentMethod | null
  onSave: (paymentMethod: PaymentMethod) => void
  onCancel: () => void
}

export default function PaymentMethodForm({ paymentMethod, onSave, onCancel }: PaymentMethodFormProps) {
  const [formData, setFormData] = useState<PaymentMethod>({
    type: 'credit',
    cardNumber: '',
    cardHolderName: '',
    expirationDate: '',
    cvv: ''
  })
  const [cardNumberInput, setCardNumberInput] = useState("")
  const [expiryInput, setExpiryInput] = useState("")
  const [errors, setErrors] = useState({
    cardNumber: "",
    expirationDate: "",
    cvv: "",
  })

  // Preenche os campos se estiver editando
  useEffect(() => {
    if (paymentMethod) {
      setFormData({
        ...paymentMethod,
        cvv: '' // Por segurança, nunca exibir o CVV
      })
      setCardNumberInput("")
      setExpiryInput(paymentMethod.expirationDate)
    }
  }, [paymentMethod])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "") // Apenas números
    if (value.length > 0) {
      value = value.match(/.{1,4}/g)?.join(" ") || value
    }
    setCardNumberInput(value)
    const digits = value.replace(/\s/g, "")
    setFormData((prev) => ({ ...prev, cardNumber: digits }))
    setErrors((prev) => ({
      ...prev,
      cardNumber: digits.length > 0 && digits.length < 16 ? "O número do cartão deve ter 16 dígitos" : ""
    }))
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")
    if (value.length > 0) {
      value = value.length <= 2 ? value : `${value.slice(0, 2)}/${value.slice(2, 4)}`
    }
    setExpiryInput(value)
    setFormData((prev) => ({ ...prev, expirationDate: value }))
    setErrors((prev) => ({
      ...prev,
      expirationDate: value.length > 0 && value.length < 5 ? "A validade deve estar no formato MM/AA" : ""
    }))
  }

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 3)
    setFormData((prev) => ({ ...prev, cvv: value }))
    setErrors((prev) => ({
      ...prev,
      cvv: value.length > 0 && value.length < 3 ? "O CVV deve ter 3 dígitos" : ""
    }))
  }

  const handleCardTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, type: value as 'credit' | 'debit' }))
  }

  const validateForm = () => {
    let valid = true
    const newErrors = { ...errors }

    if (!paymentMethod && (formData.cardNumber.length === 0 || formData.cardNumber.length < 16)) {
      newErrors.cardNumber = "Número de cartão válido é obrigatório"
      valid = false
    }

    if (formData.expirationDate.length === 0 || !formData.expirationDate.includes("/")) {
      newErrors.expirationDate = "Data de validade válida é obrigatória"
      valid = false
    }

    if (!paymentMethod && (formData.cvv.length === 0 || formData.cvv.length < 3)) {
      newErrors.cvv = "CVV válido é obrigatório"
      valid = false
    }

    setErrors(newErrors)
    return valid
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSave(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type">Tipo de Cartão</Label>
        <Select value={formData.type} onValueChange={handleCardTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo de cartão" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="credit">Cartão de Crédito</SelectItem>
            <SelectItem value="debit">Cartão de Débito</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cardHolderName">Nome no Cartão</Label>
        <Input
          id="cardHolderName"
          name="cardHolderName"
          placeholder="João Silva"
          value={formData.cardHolderName}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cardNumber">Número do Cartão</Label>
        <Input
          id="cardNumber"
          placeholder={paymentMethod ? "•••• •••• •••• 1234" : "1234 5678 9012 3456"}
          value={cardNumberInput}
          onChange={handleCardNumberChange}
          required={!paymentMethod}
          maxLength={19}
          inputMode="numeric"
        />
        {errors.cardNumber && <p className="text-sm text-red-600">{errors.cardNumber}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="expirationDate">Validade</Label>
          <Input
            id="expirationDate"
            placeholder="MM/AA"
            value={expiryInput}
            onChange={handleExpiryChange}
            required
            maxLength={5}
            inputMode="numeric"
          />
          {errors.expirationDate && <p className="text-sm text-red-600">{errors.expirationDate}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cvv">CVV</Label>
          <Input
            id="cvv"
            type="password"
            placeholder="123"
            value={formData.cvv}
            onChange={handleCvvChange}
            required={!paymentMethod}
            maxLength={3}
            inputMode="numeric"
          />
          {errors.cvv && <p className="text-sm text-red-600">{errors.cvv}</p>}
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-red-600 hover:bg-red-700">
          {paymentMethod ? "Atualizar Cartão" : "Adicionar Cartão"}
        </Button>
      </div>
    </form>
  )
}
