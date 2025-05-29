"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { API_ENDPOINTS } from "@/lib/api"
import { IProduct } from "@/types/models"
import { Loader2 } from "lucide-react"
import ProductCard from "@/components/product-card"

export default function HelmetsPage() {
  const [products, setProducts] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch(API_ENDPOINTS.productsByType('helmet'))
        
        if (!response.ok) {
          throw new Error('Falha ao buscar produtos')
        }
        
        const data = await response.json()
        setProducts(data.products || [])
      } catch (error) {
        console.error('Erro ao buscar produtos:', error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os capacetes. Tente novamente mais tarde.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [toast])

  return (
    <div className="container py-8">
      <h1 className="mb-8 text-center text-3xl font-bold">Capacetes Ferrari</h1>
      
      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
      ) : products.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex h-60 flex-col items-center justify-center">
          <h2 className="text-xl font-semibold">Nenhum produto encontrado</h2>
          <p className="text-gray-500">Não há capacetes disponíveis no momento.</p>
        </div>
      )}
    </div>
  )
}
