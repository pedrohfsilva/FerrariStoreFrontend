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
  
  // Check authentication and admin rights
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
      }
    }
    
    checkAuth()
  }, [router, toast])

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

    // Validate password
    if (formData.password.length < 6) { // Changed to 6 to match backend validation
      newErrors.password = "Password must be at least 6 characters"
      valid = false
    }

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
      valid = false
    }
    
    // Validate CPF (Brazilian ID) - simple format validation
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
    if (formData.cpf && !cpfRegex.test(formData.cpf)) {
      newErrors.cpf = "CPF should be in format: 000.000.000-00"
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
      
      // Only send the necessary user data fields
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        cpf: formData.cpf,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        admin: formData.admin
      }

      // Use API_ENDPOINTS.register and the authFetchConfig helper
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
        throw new Error(errorData.message || 'Failed to create user');
      }

      toast({
        title: "User created",
        description: `${formData.name} has been added successfully`,
      });

      router.push("/admin/users");
    } catch (error: any) {
      console.error("Error creating user:", error);
      
      // Handle common errors
      if (error.message && error.message.includes("email")) {
        setErrors(prev => ({ ...prev, email: "This email is already in use" }));
      } else if (error.message && error.message.includes("cpf")) {
        setErrors(prev => ({ ...prev, cpf: "This CPF is already registered" }));
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to create user. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Add New User</h1>

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
                placeholder="000.000.000-00"
                required 
              />
              {errors.cpf && <p className="text-xs text-red-600">{errors.cpf}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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
              <Label htmlFor="confirmPassword">Confirm Password</Label>
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
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
