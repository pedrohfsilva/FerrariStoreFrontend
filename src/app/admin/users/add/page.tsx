"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { API_URL, API_ENDPOINTS, authFetchConfig, isAdmin, isAuthenticated } from "@/lib/api"
import { Loader2 } from "lucide-react"

export default function AddUserPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    password: "",
    confirmPassword: "",
    admin: false,
  })

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    cpf: "",
  })

  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  
  // Verifica autenticação e permissões de administrador
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        toast({
          title: "Autenticação necessária",
          description: "Você precisa estar logado para acessar esta página",
          variant: "destructive",
        })
        router.push('/login')
        return
      }

      if (!isAdmin()) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar esta página",
          variant: "destructive",
        })
        router.push('/')
      }
    }
    
    checkAuth()
  }, [router, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Limpa os erros ao digitar
    if (name === "email" || name === "password" || name === "confirmPassword" || name === "cpf") {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, admin: checked }))
  }

  const validateForm = () => {
    let valid = true
    const newErrors = { email: "", password: "", confirmPassword: "", cpf: "" }

    // Valida o e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Por favor, insira um endereço de e-mail válido"
      valid = false
    }

    // Valida a senha
    if (formData.password.length < 6) { // Alterado para 6 para corresponder à validação do backend
      newErrors.password = "A senha deve ter pelo menos 6 caracteres"
      valid = false
    }

    // Valida a confirmação da senha
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "As senhas não correspondem"
      valid = false
    }
    
    // Valida o CPF (Documento de Identidade Brasileiro) - validação de formato simples
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
    if (formData.cpf && !cpfRegex.test(formData.cpf)) {
      newErrors.cpf = "O CPF deve estar no formato: 000.000.000-00"
      valid = false
    }

    setErrors(newErrors)
    return valid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setIsLoading(true)
      
      // Envia apenas os campos necessários do usuário
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        cpf: formData.cpf,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        admin: formData.admin
      }

      // Usa API_ENDPOINTS.register e a função auxiliar authFetchConfig
      const response = await fetch(API_ENDPOINTS.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao criar usuário');
      }

      toast({
        title: "Usuário criado",
        description: `${formData.name} foi adicionado com sucesso`,
      });

      router.push("/admin/users");
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error);
      
      // Lida com erros comuns
      if (error.message && error.message.includes("email")) {
        setErrors(prev => ({ ...prev, email: "Este e-mail já está em uso" }));
      } else if (error.message && error.message.includes("cpf")) {
        setErrors(prev => ({ ...prev, cpf: "Este CPF já está cadastrado" }));
      } else {
        toast({
          title: "Erro",
          description: error.message || "Falha ao criar usuário. Por favor, tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Adicionar Novo Usuário</h1>

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Informações do Usuário</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Número de Telefone</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF (Identidade Brasileira)</Label>
              <Input 
                id="cpf" 
                name="cpf" 
                value={formData.cpf} 
                onChange={handleInputChange} 
                placeholder="000.000.000-00"
                required 
              />
              {errors.cpf && <p className="text-xs text-red-600">{errors.cpf}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
              {errors.confirmPassword && <p className="text-xs text-red-600">{errors.confirmPassword}</p>}
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="admin" checked={formData.admin} onCheckedChange={handleSwitchChange} />
              <Label htmlFor="admin">Usuário Administrador</Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Usuário"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
