"use client"

import { use } from "react"
import ProductForm from "@/components/admin/product-form"

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Editar Produtos</h1>
      <ProductForm title="Edit Product" editMode={true} productId={id} />
    </div>
  )
}
