"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { API_ENDPOINTS } from "@/lib/api"
import { Loader2 } from "lucide-react"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Validação de email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validação de telefone
  const isValidPhone = (phone: string) => {
    const phoneClean = phone.replace(/[^\d]/g, "")
    return phoneClean.length >= 10 && phoneClean.length <= 11
  }

  // Validação de CPF
  const isValidCPF = (cpf: string) => {
    const cpfClean = cpf.replace(/[^\d]/g, "")
    return cpfClean.length === 11
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações básicas
    if (!formData.name || !formData.email || !formData.phone || !formData.cpf || !formData.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    // Validação de email
    if (!isValidEmail(formData.email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido (exemplo: usuario@email.com).",
        variant: "destructive",
      })
      return
    }

    // Validação de telefone
    if (!isValidPhone(formData.phone)) {
      toast({
        title: "Telefone inválido",
        description: "Por favor, insira um telefone válido com DDD (exemplo: 11987654321).",
        variant: "destructive",
      })
      return
    }

    // Validar formato de CPF
    if (!isValidCPF(formData.cpf)) {
      toast({
        title: "CPF inválido",
        description: "Por favor, insira um CPF válido com 11 dígitos (apenas números).",
        variant: "destructive",
      })
      return
    }

    if (formData.password.length < 8) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 8 caracteres para maior segurança.",
        variant: "destructive",
      })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A senha e a confirmação devem ser exatamente iguais.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      // Improved error handling for fetch
      const response = await fetch(API_ENDPOINTS.register, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          cpf: formData.cpf,
          password: formData.password,
        }),
      }).catch(error => {
        console.error("Network error during fetch:", error);
        throw new Error("Erro de conexão com o servidor. Verifique sua conexão ou tente novamente mais tarde.");
      });

      if (!response) {
        throw new Error("Não foi possível conectar ao servidor");
      }

      const data = await response.json()

      if (response.ok) {
        // Armazenar token e informações do usuário no localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('isAdmin', data.admin ? 'true' : 'false');
        
        // Armazenar userData completo para verificação de admin
        const userData = {
          id: data.userId,
          admin: data.admin || false
        };
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // Disparar evento customizado para atualizar o header
        window.dispatchEvent(new Event('authStateChanged'));
        
        toast({
          title: "Registro realizado com sucesso",
          description: "Sua conta foi criada. Você será redirecionado para a página inicial.",
        })
        
        router.push("/")
      } else {
        // Mensagens de erro específicas baseadas na resposta do servidor
        let errorMessage = "Ocorreu um erro ao criar sua conta. Tente novamente."
        
        if (data.message) {
          if (data.message.includes("Email já cadastrado")) {
            errorMessage = "Este email já está em uso. Tente fazer login ou use outro email."
          } else if (data.message.includes("CPF já cadastrado")) {
            errorMessage = "Este CPF já está cadastrado. Tente fazer login ou verifique os dados."
          } else {
            errorMessage = data.message
          }
        }
        
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error("Erro ao registrar:", error)
      toast({
        title: "Erro ao criar conta",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao criar sua conta. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Criar uma conta</CardTitle>
          <CardDescription>Preencha os campos abaixo para se cadastrar</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                name="name"
                placeholder="Digite seu nome completo"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  name="cpf"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar Conta"
              )}
            </Button>
            <div className="text-center text-sm">
              Já tem uma conta?{" "}
              <Link href="/login" className="font-medium text-red-600 hover:text-red-800">
                Faça login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
