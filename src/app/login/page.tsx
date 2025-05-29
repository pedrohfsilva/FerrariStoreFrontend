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

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Validação de email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha seu email e senha para continuar.",
        variant: "destructive",
      })
      return
    }

    // Validação de email
    if (!isValidEmail(email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido (exemplo: usuario@email.com).",
        variant: "destructive",
      })
      return
    }

    if (password.length < 8) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 8 caracteres.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      
      // Improved error handling for fetch
      const response = await fetch(API_ENDPOINTS.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      }).catch(error => {
        console.error("Network error during fetch:", error);
        // Specific handling for network errors
        throw new Error("Erro de conexão com o servidor. Verifique sua conexão ou tente novamente mais tarde.");
      });
      
      if (!response) {
        throw new Error("Não foi possível conectar ao servidor");
      }

      const data = await response.json();
      
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
          title: "Login realizado com sucesso",
          description: "Você será redirecionado para a página inicial.",
        })
        
        if (data.admin) {
          router.push('/admin')
        } else {
          router.push('/')
        }
      } else {
        // Mensagens de erro específicas baseadas na resposta do servidor
        let errorMessage = "Email ou senha incorretos. Verifique suas credenciais e tente novamente."
        
        if (data.message) {
          if (data.message.includes("Usuário não encontrado")) {
            errorMessage = "Este email não está cadastrado. Verifique o email ou crie uma nova conta."
          } else if (data.message.includes("Senha inválida")) {
            errorMessage = "Senha incorreta. Verifique sua senha e tente novamente."
          } else if (data.message.includes("Email") && data.message.includes("obrigatório")) {
            errorMessage = "Por favor, digite seu email."
          } else if (data.message.includes("senha") && data.message.includes("obrigatório")) {
            errorMessage = "Por favor, digite sua senha."
          } else {
            errorMessage = data.message
          }
        }
        
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error)
      toast({
        title: "Erro ao fazer login",
        description: error instanceof Error ? error.message : "Email ou senha incorretos. Verifique suas credenciais.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center py-10">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>
            Entre com seu email e senha para acessar sua conta
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email"
                placeholder="seu@email.com"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
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
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
            <div className="text-center text-sm">
              Não tem uma conta?{" "}
              <Link href="/register" className="font-medium text-red-600 hover:text-red-800">
                Cadastre-se
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
