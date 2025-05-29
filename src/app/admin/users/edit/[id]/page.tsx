"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { API_URL, authFetchConfig, isAdmin, isAuthenticated, getCurrentUserId } from "@/lib/api"
import { IUser } from "@/types/models"
import { Loader2 } from "lucide-react"

export default function EditUserPage() {
  const { id } = useParams()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    password: "",
    confirmPassword: "",
    admin: false,
  })
  const [originalEmail, setOriginalEmail] = useState("")
  const [originalCpf, setOriginalCpf] = useState("")
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    cpf: "",
  })
  const [isLoading, setIsLoading] = useState(true)

  const router = useRouter()
  const { toast } = useToast()

  // Verifica autenticação e permissão de admin
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        toast({
          title: "Autenticação necessária",
          description: "Você deve estar logado para acessar esta página",
          variant: "destructive",
        })
        router.push('/login')
        return
      }

      if (!isAdmin()) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar essa página",
          variant: "destructive",
        })
        router.push('/')
        return
      }

      // Depois de verificar permissão, pegar os dados do usuário
      if (id) {
        fetchUser()
      }
    }
    
    checkAuth()
  }, [id, router, toast])

  // Carregar os dados do usuário
  const fetchUser = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_URL}/api/users/${id}`, authFetchConfig())
      
      if (!response.ok) {
        throw new Error('Falha ao buscar dados do usuário')
      }
      
      const data = await response.json()
      const user = data.user || data as IUser

      if (user) {
        setFormData({
          name: user.name,
          email: user.email,
          phone: user.phone,
          cpf: user.cpf,
          password: "",
          confirmPassword: "",
          admin: user.admin || false,
        })
        setOriginalEmail(user.email)
        setOriginalCpf(user.cpf)
      } else {
        toast({
          title: "Usuário não encontrado",
          description: "O usuário que você está tentando editar não existe",
          variant: "destructive",
        })
        router.push("/admin/users")
      }
    } catch (error) {
      console.error("Erro ao buscar usuário:", error)
      toast({
        title: "Erro",
        description: "Falha ao carregar os dados do usuário. Tente novamente.",
        variant: "destructive",
      })
      router.push("/admin/users")
    } finally {
      setIsLoading(false)
    }
  }

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

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Por favor, insira um endereço de e-mail válido"
      valid = false
    }
    
    // Validar o formato do CPF se ele mudou
    if (formData.cpf !== originalCpf) {
      const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
      if (formData.cpf && !cpfRegex.test(formData.cpf)) {
        newErrors.cpf = "O CPF deve estar no formato: 000.000.000-00"
        valid = false
      }
    }

    // Só valida a senha se ela foi alterada
    if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = "A senha deve ter pelo menos 8 caracteres"
        valid = false
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "As senhas não correspondem"
        valid = false
      }
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
      
      // Inclui a senha apenas se ela foi fornecida
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        cpf: formData.cpf,
        admin: formData.admin,
        ...(formData.password && formData.password.length > 0 ? 
          { password: formData.password, confirmPassword: formData.confirmPassword } : {})
      }

      const response = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(userData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Falha ao atualizar usuário')
      }

      toast({
        title: "Usuário atualizado",
        description: `As informações de ${formData.name} foram atualizadas`,
      })
      router.push("/admin/users")
    } catch (error: any) {
      console.error("Erro ao atualizar usuário:", error)
      
      // Lida com erros específicos
      if (error.message && error.message.includes("email")) {
        setErrors(prev => ({ ...prev, email: "Este e-mail já está em uso" }))
      } else if (error.message && error.message.includes("cpf")) {
        setErrors(prev => ({ ...prev, cpf: "Este CPF já está cadastrado" }))
      } else {
        toast({
          title: "Erro",
          description: error.message || "Falha ao atualizar usuário. Por favor, tente novamente.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Verifica se o usuário sendo editado é o próprio administrador logado
  const currentUserId = getCurrentUserId()
  const isEditingSelf = id === currentUserId
  const canChangeAdminStatus = !isEditingSelf

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Editar Usuário</h1>
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
                required
              />
              {errors.cpf && <p className="text-xs text-red-600">{errors.cpf}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha (deixe em branco para manter a atual)</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
              />
              {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
              />
              {errors.confirmPassword && <p className="text-xs text-red-600">{errors.confirmPassword}</p>}
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="admin" 
                checked={formData.admin} 
                onCheckedChange={handleSwitchChange}
                disabled={!canChangeAdminStatus}
              />
              <Label htmlFor="admin" className={!canChangeAdminStatus ? "text-gray-400" : ""}>
                Usuário Administrador
                {!canChangeAdminStatus && <span className="text-xs text-gray-500 block">Você não pode remover seus próprios privilégios de administrador</span>}
              </Label>
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
                  Atualizando...
                </>
              ) : (
                "Atualizar Usuário"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
