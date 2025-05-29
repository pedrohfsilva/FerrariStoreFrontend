"use client"

import ProductForm from "@/components/admin/product-form"

export default function AddProductPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Adicione Novo Produto</h1>
      <ProductForm title="Adicionar Novo Produto" />
    </div>
  )
}
