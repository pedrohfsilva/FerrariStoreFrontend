"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import ProductCard from "@/components/product-card"
import { useMediaQuery } from "@/hooks/use-media-query"
import { API_ENDPOINTS, API_URL } from "@/lib/api"
import { IProduct } from "@/types/models"
import { useToast } from "@/components/ui/use-toast"

// Imagens do carrossel
const carouselImages = [
  {
    src: "/slider/a.png",
    alt: "Ferrari Showcase 1",
  },
  {
    src: "/slider/b.png",
    alt: "Ferrari Showcase 2",
  },
  {
    src: "/slider/c.png",
    alt: "Ferrari Showcase 3",
  },
]

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [featuredProducts, setFeaturedProducts] = useState<IProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const { toast } = useToast()

  // Efeito para controlar o slider automático
  useEffect(() => { 
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Efeito para buscar produtos em destaque do backend
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setIsLoading(true)
        
        // Primeira tentativa: buscar do backend
        try {
          const response = await fetch(API_ENDPOINTS.featuredProducts, {
            signal: AbortSignal.timeout(5000) // 5 segundos timeout para evitar espera longa
          });
          
          if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
          }
          
          const data = await response.json();
          if (data.products && Array.isArray(data.products)) {
            setFeaturedProducts(data.products);
            return; // Dados obtidos com sucesso, sair da função
          }
        } catch (apiError) {
          console.error("Erro ao buscar do backend:", apiError);
          // Continue para o fallback abaixo
        }

        // Fallback: buscar do localStorage
        console.log("Usando fallback de dados locais");
        const productCategories = ['Cars', 'Formula1', 'Helmets'];
        let allProducts: IProduct[] = [];
        
        productCategories.forEach(category => {
          const storageKey = `ferrari${category}`;
          const storedProducts = JSON.parse(localStorage.getItem(storageKey) || '[]');
          allProducts = [...allProducts, ...storedProducts];
        });
        
        // Filtrar produtos em destaque
        const featured = allProducts.filter(p => p.featured).slice(0, 4);
        
        if (featured.length > 0) {
          setFeaturedProducts(featured);
        } else {
          // Se não houver produtos em destaque, use alguns dos produtos disponíveis
          setFeaturedProducts(allProducts.slice(0, 4));
        }
        
      } catch (error) {
        console.error("Erro ao buscar produtos em destaque:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os produtos em destaque.",
          variant: "destructive"
        });
        setFeaturedProducts([]); // Garantir que não há produtos indefinidos
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFeaturedProducts();
  }, [toast])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length)
  }
  
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)
  }

  // Função para mapear produtos do backend para o formato esperado pelo componente ProductCard
  const mapProductToCardData = (product: IProduct) => {
    return {
      ...product, // Manter todas as propriedades originais
      id: product._id || '',
      image: product.images && product.images.length > 0 
        ? product.images[0] // Usar apenas o nome do arquivo, não a URL completa
        : "/placeholder.svg",
      category: product.type,
      inStock: (product.stock && product.stock > 0) || false
    }
  }

  return (
    <div className="flex flex-col">
      {/* Hero Carousel */}
      <div className="relative h-[300px] w-full overflow-hidden md:h-[400px] lg:h-[500px]">
        {carouselImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
              priority={index === 0}
            />
          </div>
        ))}
        <div className="absolute inset-0 flex items-center justify-between p-4">
          <Button variant="outline" size="icon" className="rounded-full bg-white/80 hover:bg-white" onClick={prevSlide}>
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">Previous slide</span>
          </Button>
          <Button variant="outline" size="icon" className="rounded-full bg-white/80 hover:bg-white" onClick={nextSlide}>
            <ChevronRight className="h-6 w-6" />
            <span className="sr-only">Next slide</span>
          </Button>
        </div>
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 space-x-2">
          {carouselImages.map((_, index) => (
            <button
              key={index}
              className={`h-2 w-2 rounded-full ${index === currentSlide ? "bg-white" : "bg-white/50"}`}
              onClick={() => setCurrentSlide(index)}
            >
              <span className="sr-only">Go to slide {index + 1}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <section className="container py-8 md:py-12">
        <h2 className="mb-6 text-2xl font-bold md:mb-8 md:text-3xl">Produtos em Destaque</h2>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={mapProductToCardData(product)} />
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-gray-500">
            Nenhum produto em destaque disponível no momento.
          </p>
        )}

        <div className="mt-8 md:mt-12">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
            <Link href="/cars" className="block">
              <Card className="overflow-hidden transition-all hover:shadow-lg">
                <div className="aspect-video relative">
                  <Image
                    src="/cars/sf90/1.png"
                    alt="Car Miniatures"
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="text-lg font-bold md:text-xl">Miniaturas de Carros</h3>
                  <p className="text-sm text-gray-500">Explore nossa coleção de miniaturas de carros Ferrari</p>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button className="w-full bg-red-600 hover:bg-red-700">Comprar Agora</Button>
                </CardFooter>
              </Card>
            </Link>
            <Link href="/formula1" className="block">
              <Card className="overflow-hidden transition-all hover:shadow-lg">
                <div className="aspect-video relative">
                  <Image
                    src="/f1/f1.png"
                    alt="Formula 1 Miniatures"
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="text-lg font-bold md:text-xl">Miniaturas de Fórmula 1</h3>
                  <p className="text-sm text-gray-500">Descubra nossa coleção de Ferrari de Fórmula 1</p>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button className="w-full bg-red-600 hover:bg-red-700">Comprar Agora</Button>
                </CardFooter>
              </Card>
            </Link>
            <Link href="/helmets" className="block">
              <Card className="overflow-hidden transition-all hover:shadow-lg">
                <div className="aspect-video relative">
                  <Image
                    src="/helmets/helmet.png"
                    alt="Ferrari Helmets"
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="text-lg font-bold md:text-xl">Capacetes Ferrari</h3>
                  <p className="text-sm text-gray-500">Miniaturas premium de capacetes Ferrari</p>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button className="w-full bg-red-600 hover:bg-red-700">Comprar Agora</Button>
                </CardFooter>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
