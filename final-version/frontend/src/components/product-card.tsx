"use client"  // indica que o componente será executado no client-side

import { useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { ShoppingCart, Loader2, Play, Pause } from "lucide-react"
import { useCart } from "@/context/cart-context"
import { API_URL } from "@/lib/api"
import { IProduct } from "@/types/models"

// Props esperadas: um produto
interface ProductCardProps {
  product: IProduct
}

// Componente do Card de Produto
export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, getItemQuantityInCart } = useCart()  // contexto do carrinho
  const [imageError, setImageError] = useState(false)  // estado para erro na imagem
  const [isPlaying, setIsPlaying] = useState(false)  // estado do áudio
  const [isAddingToCart, setIsAddingToCart] = useState(false)  // estado local para este card
  const audioRef = useRef<HTMLAudioElement>(null)  // referência do áudio

  // Função para obter a URL correta da imagem
  const getImageUrl = () => {
    if (product.images && product.images.length > 0) {
      return `${API_URL}/public/images/products/${product.images[0]}`
    }
    return "/placeholder.svg"  // imagem padrão
  }

  // Função para obter a URL do som
  const getSoundUrl = () => {
    if (product.soundFile) {
      return `${API_URL}/public/sounds/${product.soundFile}`
    }
    return null
  }

  // Adiciona o produto ao carrinho
  const handleAddToCart = async () => {
    setIsAddingToCart(true)
    try {
      const cartItem = {
        id: product._id || '',
        productId: product._id || '',
        name: product.name,
        price: product.price,
        image: getImageUrl(),
        quantity: 1,
        category: product.type
      }
      await addItem(cartItem)
    } finally {
      setIsAddingToCart(false)
    }
  }

  // Toca ou pausa o áudio
  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  // Quando o áudio termina, atualiza o estado
  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  // Verifica se está fora de estoque
  const isOutOfStock = product.stock !== undefined ? product.stock <= 0 : false
  
  // Verifica se há estoque disponível considerando itens no carrinho
  const quantityInCart = getItemQuantityInCart(product._id || '')
  const availableStock = (product.stock || 0) - quantityInCart
  const canAddToCart = availableStock > 0 && !isOutOfStock

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      {/* Link para a página do produto */}
      <Link href={`/product/${product._id}`}>
        <div className="relative aspect-square overflow-hidden">
          {!imageError ? (
            <Image
              src={getImageUrl()}
              alt={product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <span className="text-gray-400">Sem imagem</span>
            </div>
          )}

          {/* Exibe aviso se estiver fora de estoque */}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="text-white font-semibold">Fora de Estoque</span>
            </div>
          )}
        </div>
      </Link>
      
      {/* Elemento de áudio oculto */}
      {product.soundFile && (
        <audio
          ref={audioRef}
          src={getSoundUrl()!}
          onEnded={handleAudioEnded}
          preload="none"
        />
      )}

      <CardContent className="p-4">
        {/* Nome do produto com link */}
        <Link href={`/product/${product._id}`}>
          <h3 className="mb-2 font-semibold hover:text-red-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between">
          <p className="text-xl font-bold text-red-600">
            R$ {product.price.toFixed(2)}
          </p>

          {/* Botão para tocar o som, se existir */}
          {product.soundFile && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleAudio()
              }}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3 w-3 mr-1" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 mr-1" />
                  Som
                </>
              )}
            </Button>
          )}
        </div>

        {/* Informação de estoque */}
        {product.stock !== undefined && (
          <p className="text-sm text-gray-500">
            {product.stock > 0 ? (
              <>
                {product.stock} em estoque
                {quantityInCart > 0 && (
                  <span className="ml-1 text-blue-600">
                    ({quantityInCart} no carrinho)
                  </span>
                )}
              </>
            ) : (
              'Fora de estoque'
            )}
          </p>
        )}
      </CardContent>

      {/* Rodapé do card com botão de adicionar ao carrinho */}
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50"
          onClick={handleAddToCart}
          disabled={isAddingToCart || !canAddToCart}
        >
          {isAddingToCart ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adicionando...
            </>
          ) : !canAddToCart ? (
            isOutOfStock ? (
              'Fora de Estoque'
            ) : (
              'Estoque Insuficiente'
            )
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Adicionar ao Carrinho
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
