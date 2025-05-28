"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { API_ENDPOINTS, authFetchConfig } from "@/lib/api"
import AccountForm from "./account-form"

export function UserProfileSection() {
  const [userData, setUserData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true)
        
        const userId = localStorage.getItem('userId')
        if (!userId) {
          throw new Error('ID de usuário não encontrado')
        }
        
        const response = await fetch(
          API_ENDPOINTS.userById(userId), 
          authFetchConfig()
        )
        
        if (!response.ok) {
          throw new Error('Falha ao buscar dados do usuário')
        }
        
        const data = await response.json()
        setUserData(data.user)
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar suas informações pessoais.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [toast])

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div>
      <AccountForm userData={userData} />
    </div>
  )
}
