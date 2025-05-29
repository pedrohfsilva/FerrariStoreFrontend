"use client"

// importando tipos e hooks do React
import type React from "react"
import { useState, useEffect } from "react"

// importando componentes de UI
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

// função para configuração de autenticação na API
import { authFetchConfig } from "@/lib/api"

// definindo a interface dos dados do usuário
interface UserData {
  name?: string
  fullName?: string
  email: string
  phone: string
  cpf: string
  [key: string]: any // permite campos adicionais vindos da API
}

// definindo a interface das props do componente
interface AccountFormProps {
  userData: UserData | null;
}

// componente principal do formulário de conta
export default function AccountForm({ userData: propUserData = null }: AccountFormProps) {
  // estados para armazenar dados do usuário
  const [userData, setUserData] = useState<UserData>({
    name: "",
    email: "",
    phone: "",
    cpf: "",
  })
  
  const [isEditing, setIsEditing] = useState(false) // estado para verificar se está editando
  const [currentPassword, setCurrentPassword] = useState("") // senha atual
  const [newPassword, setNewPassword] = useState("") // nova senha
  const [confirmPassword, setConfirmPassword] = useState("") // confirmação da nova senha
  const [passwordError, setPasswordError] = useState("") // erro de validação de senha
  const [isSaving, setIsSaving] = useState(false) // flag de carregamento ao salvar

  const { toast } = useToast() // hook para exibir notificações

  // efeito para carregar os dados do usuário recebidos via props
  useEffect(() => {
    if (propUserData) {
      setUserData({
        name: propUserData.name || "",
        email: propUserData.email || "",
        phone: propUserData.phone || "",
        cpf: propUserData.cpf || "",
      })
    }
  }, [propUserData])

  // função para tratar alterações nos inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUserData((prev) => ({ ...prev, [name]: value }))
  }

  // função para salvar alterações do perfil
  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        throw new Error("Usuário não encontrado")
      }

      // criando objeto com os campos a serem atualizados
      const payload = {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        cpf: userData.cpf
      }

      // enviando dados para o backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`, 
        authFetchConfig('PUT', payload)
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erro ao atualizar perfil")
      }

      setIsEditing(false) // desativa modo de edição

      // exibe notificação de sucesso
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso",
      })
    } catch (error) {
      console.error("Erro ao salvar perfil:", error)
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar suas informações",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false) // encerra carregamento
    }
  }

  // função para validar a nova senha
  const validatePassword = () => {
    if (newPassword.length < 8) {
      setPasswordError("A senha deve ter pelo menos 8 caracteres")
      return false
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem")
      return false
    }
    return true
  }

  // função para alterar a senha
  const handleChangePassword = async () => {
    if (!currentPassword) {
      setPasswordError("Digite sua senha atual")
      return
    }
    
    if (validatePassword()) {
      try {
        const userId = localStorage.getItem('userId')
        if (!userId) {
          throw new Error("Usuário não encontrado")
        }

        // enviando requisição para alterar senha
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/change-password`,
          authFetchConfig('PUT', { 
            currentPassword,
            newPassword
          })
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Erro ao alterar senha")
        }
        
        // limpando campos de senha
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setPasswordError("")

        toast({
          title: "Senha alterada",
          description: "Sua senha foi alterada com sucesso",
        })
      } catch (error) {
        console.error("Erro ao alterar senha:", error)
        toast({
          title: "Erro ao alterar senha",
          description: error instanceof Error ? error.message : "Ocorreu um erro ao alterar sua senha",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Informações Pessoais</h2>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? "Cancelar" : "Editar"}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                name="name"
                placeholder="Digite seu nome completo"
                value={userData.name}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={userData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input 
                id="phone" 
                name="phone" 
                placeholder="(11) 99999-9999"
                value={userData.phone} 
                onChange={handleInputChange} 
                disabled={!isEditing} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input 
                id="cpf" 
                name="cpf" 
                placeholder="000.000.000-00"
                value={userData.cpf} 
                onChange={handleInputChange} 
                disabled={!isEditing} 
              />
            </div>
          </div>
          
          {isEditing && (
            <Button 
              className="mt-4 bg-red-600 hover:bg-red-700" 
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          )}
        </div>
      </div>

      <div className="border-t pt-8">
        <h2 className="mb-4 text-xl font-semibold">Alterar Senha</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Senha Atual</Label>
            <Input
              id="currentPassword"
              type="password"
              placeholder="Digite sua senha atual"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Digite a nova senha novamente"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
          </div>
          <Button className="bg-red-600 hover:bg-red-700" onClick={handleChangePassword}>
            Alterar Senha
          </Button>
        </div>
      </div>
    </div>
  )
}
