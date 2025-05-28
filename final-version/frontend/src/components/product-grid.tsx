"use client"  // indica que este componente roda no client-side

import { useState, useEffect } from "react"
import { IProduct } from "@/types/models"
import ProductCard from "./product-card"
import { Loader2 } from "lucide-react"

// Tipagem das props esperadas
interface ProductGridProps {
  products: IProduct[]
  loading?: boolean
  emptyMessage?: string
}

// Componente que renderiza o grid de produtos
export default function ProductGrid({ 
  products, 
  loading = false,  // valor padrão: não está carregando
  emptyMessage = "Nenhum produto encontrado"  // mensagem padrão
}: ProductGridProps) {
  
  // Se estiver carregando, mostra o spinner
  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  // Se não houver produtos, exibe a mensagem de vazio
  if (!products || products.length === 0) {
    return (
      <div className="flex h-60 flex-col items-center justify-center">
        <h2 className="text-xl font-semibold">Nenhum produto encontrado</h2>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  // Caso existam produtos, renderiza o grid
  return (
    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  )
}
