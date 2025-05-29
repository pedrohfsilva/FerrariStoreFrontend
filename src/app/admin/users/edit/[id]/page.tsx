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
import { API_URL, authFetchConfig, isAdmin, isAuthenticated } from "@/lib/api"
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

      // After verifying permissions, fetch the user data
      if (id) {
        fetchUser()
      }
    }
    
    checkAuth()
  }, [id, router, toast])

  // Load user data
  const fetchUser = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_URL}/api/users/${id}`, authFetchConfig())
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data')
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
          title: "User not found",
          description: "The user you are trying to edit does not exist",
          variant: "destructive",
        })
        router.push("/admin/users")
      }
    } catch (error) {
      console.error("Error fetching user:", error)
      toast({
        title: "Error",
        description: "Failed to load user data. Please try again.",
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

    // Clear errors when typing
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

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
      valid = false
    }
    
    // Validate CPF format if it's been changed
    if (formData.cpf !== originalCpf) {
      const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
      if (formData.cpf && !cpfRegex.test(formData.cpf)) {
        newErrors.cpf = "CPF should be in format: 000.000.000-00"
        valid = false
      }
    }

    // Only validate password if it's being changed
    if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters"
        valid = false
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match"
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
      
      // Only include password if it was provided
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
        throw new Error(errorData.message || 'Failed to update user')
      }

      toast({
        title: "User updated",
        description: `${formData.name}'s information has been updated`,
      })
      router.push("/admin/users")
    } catch (error: any) {
      console.error("Error updating user:", error)
      
      // Handle specific errors
      if (error.message && error.message.includes("email")) {
        setErrors(prev => ({ ...prev, email: "This email is already in use" }))
      } else if (error.message && error.message.includes("cpf")) {
        setErrors(prev => ({ ...prev, cpf: "This CPF is already registered" }))
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to update user. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Edit User</h1>
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF (Brazilian ID)</Label>
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
              <Label htmlFor="password">New Password (leave blank to keep current)</Label>
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
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
              <Switch id="admin" checked={formData.admin} onCheckedChange={handleSwitchChange} />
              <Label htmlFor="admin">Admin User</Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update User"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
