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
import { API_URL, authFetchConfig, isAdmin, isAuthenticated } from "@/lib/api"
import { IUser } from "@/types/models"

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
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

  // Verify authentication and admin permission
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        toast({
          title: "Authentication required",
          description: "You must be logged in to access this page",
          variant: "destructive",
        })
        router.push('/login')
        return
      }

      if (!isAdmin()) {
        toast({
          title: "Access denied",
          description: "You don't have permission to access this page",
          variant: "destructive",
        })
        router.push('/')
        return
      }

      // After verifying auth and permissions, load users
      fetchUsers()
    }
    
    checkAuth()
  }, [router, toast])

  // Load users from API
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_URL}/api/users`, authFetchConfig())
      
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
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
        throw new Error(errorData.message || 'Failed to delete user')
      }

      // Update the local state after successful deletion
      setUsers(users.filter(user => user._id !== userId))
      
      toast({
        title: "User deleted",
        description: "The user has been deleted successfully",
      })
    } catch (error: any) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete user. Please try again.",
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
        <h1 className="text-2xl font-bold">User Management</h1>
      </div>
      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Users ({users.length})</TabsTrigger>
          <TabsTrigger value="admins">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Admins ({adminUsers.length})
          </TabsTrigger>
          <TabsTrigger value="users">
            <User className="mr-2 h-4 w-4" />
            Regular Users ({regularUsers.length})
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
              No users found. Click "Add User" to create a new user.
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
              No admin users found.
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
              No regular users found.
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
  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">{user.name}</h3>
            {user.admin ? <Badge className="bg-red-600">Admin</Badge> : <Badge variant="outline">User</Badge>}
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">{user.email}</p>
            <p className="text-gray-600">{user.phone}</p>
            <p className="text-xs text-gray-500">Created: {formatDate(user.createdAt || '')}</p>
          </div>
        </div>
        <div className="flex border-t">
          <Button
            variant="ghost"
            className="flex-1 rounded-none text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            onClick={() => onEdit(user._id as string)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <div className="w-px bg-gray-200" />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="flex-1 rounded-none text-red-600 hover:bg-red-50 hover:text-red-700">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete User</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {user.name}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => onDelete(user._id as string)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}
