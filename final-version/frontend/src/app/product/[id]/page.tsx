"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/context/cart-context"
import { API_URL } from "@/lib/api"
import { IProduct } from "@/types/models"
import { ChevronLeft, Loader2, Minus, Plus, ShoppingCart, Play, Pause, Volume2 } from "lucide-react"
import Link from "next/link"

interface ProductDetailPageProps {
  params: Promise<{ id: string }>
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const { addItem, getItemQuantityInCart } = useCart()
  
  const [product, setProduct] = useState<IProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Resolver os parametros primeiro
  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  // Funçao auxiliar para obter a URL correta da imagem
  const getImageUrl = (imageName: string) => {
    if (!imageName) return "/placeholder.svg"
    
    // Se ja for uma URL completa, usa ela
    if (imageName.startsWith('http')) {
      return imageName
    }
    
    // Se começar com /public ou /api, construir a URL completa
    if (imageName.startsWith('/public') || imageName.startsWith('/api')) {
      return `${API_URL}${imageName}`
    }
    
    // Caso contrario, eh apenas um nome de arquivo - construir a URL completa
    return `${API_URL}/public/images/products/${imageName}`
  }

  // Obter a URL do arquivo de audio
  const getSoundUrl = () => {
    if (product?.soundFile) {
      return `${API_URL}/public/sounds/${product.soundFile}`
    }
    return null
  }

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

  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  useEffect(() => {
    if (!resolvedParams?.id) return

    const fetchProduct = async () => {
      try {
        setLoading(true)
        const apiUrl = API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
        const response = await fetch(`${apiUrl}/api/products/${resolvedParams.id}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch product: ${response.status}`)
        }

        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server returned invalid response format")
        }

        const data = await response.json()
        
        if (!data.product) {
          throw new Error("Product not found")
        }
        
        setProduct(data.product)
      } catch (error) {
        console.error("Error fetching product:", error)
        toast({
          title: "Erro",
          description: error instanceof Error ? error.message : "Não foi possível carregar o produto",
          variant: "destructive"
        })
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [resolvedParams?.id, router, toast])

  const handleAddToCart = () => {
    if (!product) return

    addItem({
      id: product._id!, // Este sera substituido pelo ID do item do carrinho no backend
      productId: product._id!, // ID do produto para verificacao de estoque
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '',
      quantity: quantity,
      category: product.type
    })
  }

  const increaseQuantity = () => {
    if (product) {
      const quantityInCart = getItemQuantityInCart(product._id!)
      const availableStock = (product.stock || 0) - quantityInCart
      if (quantity < availableStock) {
        setQuantity(prev => prev + 1)
      }
    }
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1)
    }
  }

  // Calcula o estoque disponivel considerando os itens do carrinho
  const quantityInCart = product ? getItemQuantityInCart(product._id!) : 0
  const availableStock = product ? (product.stock || 0) - quantityInCart : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
          <Link href="/">
            <Button>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Voltar à página inicial
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button variant="outline" asChild className="mb-4">
          <Link href="/">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Images */}
        <div className="space-y-4">
          {/* Main image */}
          <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
            <Image
              src={getImageUrl(product.images?.[selectedImage] || '')}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Thumbnail images */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative aspect-square w-20 overflow-hidden rounded-md ${
                    selectedImage === index ? 'ring-2 ring-red-600' : ''
                  }`}
                >
                  <Image
                    src={getImageUrl(image)}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="mt-2 text-3xl font-bold text-red-600">
              R$ {product.price.toFixed(2)}
            </p>
          </div>

          {/* Engine Sound Section */}
          {product.soundFile && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-gray-900">Som do Motor</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAudio}
                  className="flex items-center gap-2"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Reproduzir
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Ouça o som autêntico do motor deste modelo Ferrari
              </p>
              
              {/* Hidden audio element */}
              <audio
                ref={audioRef}
                src={getSoundUrl()!}
                onEnded={handleAudioEnded}
                preload="none"
              />
            </div>
          )}

          <div className="prose prose-sm">
            <p className="text-gray-600">{product.description}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Quantidade:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={increaseQuantity}
                  disabled={quantity >= availableStock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <span>Estoque disponível: {availableStock} unidades</span>
              {quantityInCart > 0 && (
                <span className="ml-2 text-blue-600">
                  ({quantityInCart} já no carrinho)
                </span>
              )}
            </div>

            <Button
              size="lg"
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={handleAddToCart}
              disabled={availableStock <= 0 || quantity > availableStock}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {availableStock <= 0 ? 'Estoque Insuficiente' : 'Adicionar ao Carrinho'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
