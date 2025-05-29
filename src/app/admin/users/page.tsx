"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, User, ShieldCheck, Loader2 } from "lucide-react"
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
import { useToast } from "@/components/ui/use-toast"
import { API_URL, authFetchConfig, isAdmin, isAuthenticated, getCurrentUserId } from "@/lib/api"
import { IUser } from "@/types/models"

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("pt-BR", { // Alterado para pt-BR
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

export default function UsersPage() {
  const [users, setUsers] = useState<IUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // Verifica autenticação e permissão de administrador
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
          description: "Você não tem permissão para acessar esta página",
          variant: "destructive",
        })
        router.push('/')
        return
      }

      // Depois de verificar autenticação e permissões, carrega os usuários
      fetchUsers()
    }
    
    checkAuth()
  }, [router, toast])

  // Carrega usuários da API
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_URL}/api/users`, authFetchConfig())
      
      if (!response.ok) {
        throw new Error('Falha ao carregar usuários')
      }
      
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
      toast({
        title: "Erro",
        description: "Falha ao carregar usuários. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditUser = (userId: string) => {
    router.push(`/admin/users/edit/${userId}`)
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Falha ao deletar usuário')
      }

      // Atualiza o estado local após a exclusão bem-sucedida
      setUsers(users.filter(user => user._id !== userId))
      
      toast({
        title: "Usuário deletado",
        description: "O usuário foi deletado com sucesso",
      })
    } catch (error: any) {
      console.error("Erro ao deletar usuário:", error)
      toast({
        title: "Erro",
        description: error.message || "Falha ao deletar usuário. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  const adminUsers = users.filter((user) => user.admin)
  const regularUsers = users.filter((user) => !user.admin)

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
        {/* Adicionar um botão "Adicionar Usuário" aqui se desejar */}
        {/* <Button onClick={() => router.push('/admin/users/add')}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Usuário
        </Button> */}
      </div>
      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">Todos os Usuários ({users.length})</TabsTrigger>
          <TabsTrigger value="admins">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Administradores ({adminUsers.length})
          </TabsTrigger>
          <TabsTrigger value="users">
            <User className="mr-2 h-4 w-4" />
            Usuários Comuns ({regularUsers.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          {users.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {users.map((user) => (
                <UserCard key={user._id} user={user} onEdit={handleEditUser} onDelete={handleDeleteUser} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              Nenhum usuário encontrado. Clique em "Adicionar Usuário" para criar um novo.
            </div>
          )}
        </TabsContent>
        <TabsContent value="admins" className="space-y-4">
          {adminUsers.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {adminUsers.map((user) => (
                <UserCard key={user._id} user={user} onEdit={handleEditUser} onDelete={handleDeleteUser} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              Nenhum usuário administrador encontrado.
            </div>
          )}
        </TabsContent>
        <TabsContent value="users" className="space-y-4">
          {regularUsers.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {regularUsers.map((user) => (
                <UserCard key={user._id} user={user} onEdit={handleEditUser} onDelete={handleDeleteUser} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              Nenhum usuário comum encontrado.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface UserCardProps {
  user: IUser;
  onEdit: (userId: string) => void;
  onDelete: (userId: string) => void;
}

function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  const currentUserId = getCurrentUserId()
  const isCurrentUser = user._id === currentUserId
  
  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">{user.name}</h3>
            {user.admin ? <Badge className="bg-red-600">Admin</Badge> : <Badge variant="outline">Usuário</Badge>}
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">{user.email}</p>
            <p className="text-gray-600">{user.phone}</p>
            <p className="text-xs text-gray-500">Criado em: {formatDate(user.createdAt || '')}</p>
          </div>
        </div>
        <div className="flex border-t">
          <Button
            variant="ghost"
            className="flex-1 rounded-none text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            onClick={() => onEdit(user._id as string)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <div className="w-px bg-gray-200" />
          {isCurrentUser ? (
            <Button 
              variant="ghost" 
              className="flex-1 rounded-none text-gray-400 cursor-not-allowed" 
              disabled
              title="Você não pode excluir sua própria conta"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="flex-1 rounded-none text-red-600 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir {user.name}? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => onDelete(user._id as string)}>
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
