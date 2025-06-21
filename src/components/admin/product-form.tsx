"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Upload, Volume2, X, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { IProduct } from "@/types/models"
import { API_ENDPOINTS, fetchWithAuth, API_URL } from "@/lib/api"
import Image from "next/image"

interface ProductFormProps {
  title: string
  editMode?: boolean
  productId?: string
}

export default function ProductForm({ title, editMode = false, productId }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    type: "car" as "car" | "formula1" | "helmet",
    featured: false,
    stock: "10",
    sold: "0",
    hasSound: true,
  })
  
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
  const [soundFile, setSoundFile] = useState<File | null>(null)
  const [existingSoundFile, setExistingSoundFile] = useState<string>("")
  const [shouldDeleteSound, setShouldDeleteSound] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const soundInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Carregar dados do produto se estiver no modo de edição
  useEffect(() => {
    if (editMode && productId) {
      const fetchProduct = async () => {
        try {
          const response = await fetchWithAuth(API_ENDPOINTS.product(productId))
          
          if (!response.ok) {
            throw new Error(`Falhou em fetch o produto: ${response.status}`)
          }
          
          const contentType = response.headers.get("content-type")
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Servidor retornou resposta com formato invalido")
          }
          
          const data = await response.json()
          
          if (data.product) {
            const product = data.product
            setFormData({
              name: product.name,
              price: product.price.toString(),
              description: product.description,
              type: product.type || "car",
              featured: product.featured || false,
              stock: product.stock !== undefined ? product.stock.toString() : "10",
              sold: product.sold !== undefined ? product.sold.toString() : "0",
              hasSound: !!product.soundFile,
            })
            
            // Definir previews para produtos existentes
            if (product.images && product.images.length > 0) {
              const imageUrls = product.images.map((img: string) => 
                img.startsWith('http') ? img : `${API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/public/images/products/${img}`
              )
              setImagePreviews(imageUrls)
              setExistingImages([...product.images])
            }
            
            // Setar o arquivo de som existente
            if (product.soundFile) {
              setExistingSoundFile(product.soundFile)
            }
          }
        } catch (error) {
          console.error("Erro ao pegar o produto:", error)
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Falhou ao carregar o dado do produto",
            variant: "destructive",
          })
        }
      }
      
      fetchProduct()
    }
  }, [editMode, productId, toast])

  // Atualiza hasSound quando o tipo muda
  useEffect(() => {
    const newHasSound = formData.type !== "helmet"
    setFormData(prev => ({
      ...prev,
      hasSound: newHasSound
    }))
    
    // Ao trocar para capacete no modo de edição, marque o áudio atual para ser excluído
    if (formData.type === "helmet" && editMode && existingSoundFile && !shouldDeleteSound) {
      setShouldDeleteSound(true)
      setExistingSoundFile("")
    }
  }, [formData.type, editMode, existingSoundFile, shouldDeleteSound, soundFile])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === "stock" || name === "sold") {
      const numericValue = value.replace(/\D/g, "")
      setFormData((prev) => ({ ...prev, [name]: numericValue }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleTypeChange = (value: "car" | "formula1" | "helmet") => {
    setFormData((prev) => ({ ...prev, type: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSoundFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de arquivo por MIME type (mais confiável)
      const allowedTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4']
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Formato inválido",
          description: "Por favor, envie apenas arquivos MP3, WAV, OGG ou M4A",
          variant: "destructive",
        })
        // Limpar o input
        if (soundInputRef.current) {
          soundInputRef.current.value = ""
        }
        return
      }
      
      // Validar tamanho (máximo 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo de áudio deve ter no máximo 5MB",
          variant: "destructive",
        })
        // Limpar o input
        if (soundInputRef.current) {
          soundInputRef.current.value = ""
        }
        return
      }
      
      setSoundFile(file)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Validar tipos de arquivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg']
    const invalidFiles: string[] = []
    const validFiles: File[] = []

    Array.from(files).forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        invalidFiles.push(file.name)
      } else {
        validFiles.push(file)
      }
    })

    // Mostrar erro para arquivos inválidos
    if (invalidFiles.length > 0) {
      toast({
        title: "Formato inválido",
        description: `Os seguintes arquivos não são suportados: ${invalidFiles.join(', ')}. Use apenas PNG, JPG ou JPEG.`,
        variant: "destructive",
      })
    }

    // Se não há arquivos válidos, pare aqui
    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    // Validar tamanho dos arquivos (máximo 5MB por imagem)
    const maxSize = 5 * 1024 * 1024 // 5MB
    const oversizedFiles: string[] = []
    const sizeValidFiles: File[] = []

    validFiles.forEach(file => {
      if (file.size > maxSize) {
        oversizedFiles.push(file.name)
      } else {
        sizeValidFiles.push(file)
      }
    })

    // Mostrar erro para arquivos muito grandes
    if (oversizedFiles.length > 0) {
      toast({
        title: "Arquivo muito grande",
        description: `Os seguintes arquivos excedem 5MB: ${oversizedFiles.join(', ')}`,
        variant: "destructive",
      })
    }

    // Se não há arquivos válidos após validação de tamanho, pare aqui
    if (sizeValidFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    // Limitar a 3 imagens no total (incluindo as existentes)
    const totalExistingImages = editMode ? existingImages.length - imagesToDelete.length : 0
    const remainingSlots = 3 - totalExistingImages - imageFiles.length
    const newFiles = sizeValidFiles.slice(0, remainingSlots)

    // Adicionar novos arquivos ao estado
    setImageFiles((prev) => [...prev, ...newFiles])

    // Cria preview URLs para novos arquivos
    const newPreviews = newFiles.map(file => URL.createObjectURL(file))
    setImagePreviews((prev) => [...prev, ...newPreviews])

    // Gerar URLs de pré-visualização para novos arquivos
    if (fileInputRef.current) fileInputRef.current.value = ""

    toast({
      title: "Imagens adicionadas",
      description: `${newFiles.length} imagen(s) selecionada(s) para upload`,
    })
  }

  const removeImage = (index: number) => {
    const isExistingImage = editMode && index < existingImages.length
    
    if (isExistingImage) {
      // Marca a imagem existente para deletar
      const imageFilename = existingImages[index]
      if (!imagesToDelete.includes(imageFilename)) {
        setImagesToDelete(prev => [...prev, imageFilename])
      }

      // Remove dos previews
      setImagePreviews((prev) => prev.filter((_, i) => i !== index))
    } else {
      // Remove nova imagem (ainda não uploadada)
      const newImageIndex = index - existingImages.length
      setImageFiles((prev) => prev.filter((_, i) => i !== newImageIndex))
      setImagePreviews((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const removeSoundFile = () => {
    if (editMode && existingSoundFile) {
      //Marca o arquivo de som para deleção
      setShouldDeleteSound(true)
      setExistingSoundFile("")
    } else {
      //Remove o novo arquivo de som (ainda não uploadado)
      setSoundFile(null)
      if (soundInputRef.current) {
        soundInputRef.current.value = ""
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.price || !formData.description) {
      toast({
        title: "Campos não preenchidos",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    // Checar se temos pelo menos uma imagem (existente ou nova) depois das deleções
    const remainingExistingImages = existingImages.length - imagesToDelete.length
    const totalImages = remainingExistingImages + imageFiles.length
    if (totalImages === 0) {
      toast({
        title: "Imagens obrigatórias",
        description: "Envie pelo menos uma imagem para este produto",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Step 1: delete o arquivo de som se marcado para deleção
      if (editMode && productId && shouldDeleteSound) {
        try {
          const response = await fetchWithAuth(`${API_ENDPOINTS.product(productId)}/remove-sound`, {
            method: 'DELETE',
          })
          if (!response.ok) {
            console.error('Falhou ao deletar o arquivo de som')
          }
        } catch (error) {
          console.error('Erro ao deletar o arquivo de som:', error)
        }
      }

      // Step 2: atualizar os dados do produto
      const apiFormData = new FormData()
      apiFormData.append('name', formData.name)
      apiFormData.append('price', formData.price)
      apiFormData.append('description', formData.description)
      apiFormData.append('type', formData.type)
      apiFormData.append('featured', formData.featured.toString())
      apiFormData.append('stock', formData.stock)
      apiFormData.append('sold', formData.sold)

      // Adicionar os novos arquivos das imagens
      imageFiles.forEach((file) => {
        apiFormData.append('images', file)
      })

      // Adiciona o arquivo de som se ele foi dado
      if (formData.hasSound && soundFile) {
        apiFormData.append('soundFile', soundFile)
      }

      let response
      if (editMode && productId) {
        // Atualizar o produto atual
        response = await fetchWithAuth(API_ENDPOINTS.product(productId), {
          method: 'PATCH',
          body: apiFormData,
        })
      } else {
        // Cria um novo produto
        response = await fetchWithAuth(API_ENDPOINTS.products, {
          method: 'POST',
          body: apiFormData,
        })
      }

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "Erro ao salvar o produto"
        
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        
        throw new Error(errorMessage)
      }

      // Step 3: Apaga iamgens marcadas depois da atualização do produto
      if (editMode && productId && imagesToDelete.length > 0) {
        for (const imageFilename of imagesToDelete) {
          try {
            const response = await fetchWithAuth(`${API_ENDPOINTS.product(productId)}/remove-image`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ filename: imageFilename }),
            })
            if (!response.ok) {
              console.error(`Falhou ao deletar a imagem: ${imageFilename}`)
            }
          } catch (error) {
            console.error(`Erro ao deletar a imagem ${imageFilename}:`, error)
          }
        }
      }

      const data = await response.json()
      
      toast({
        title: editMode ? "Product updated" : "Product created",
        description: data.message || `${formData.name} has been ${editMode ? 'updated' : 'added'} successfully`,
      })

      // Reseta o formulario para novos produtos
      if (!editMode) {
        setFormData({
          name: "",
          price: "",
          description: "",
          type: "car",
          featured: false,
          stock: "10",
          sold: "0",
          hasSound: true,
        })
        setSoundFile(null)
        setImageFiles([])
        setImagePreviews([])
        setExistingImages([])
        setExistingSoundFile("")
      }

      // Redireciona o admin para a página de produtos
      router.push("/admin/products")
    } catch (error) {
      console.error("Error saving product:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Falhou ao salvar o produto",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ferrari SF90 Stradale"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo do produto</Label>
            <Select value={formData.type} onValueChange={handleTypeChange} disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo do produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="car">Carro</SelectItem>
                <SelectItem value="formula1">Fórmula 1</SelectItem>
                <SelectItem value="helmet">Capacete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Preço ($)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={handleChange}
              placeholder="129.99"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-1">
            <div className="space-y-2">
              <Label htmlFor="stock">Quantidade no Stock</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={handleChange}
                placeholder="10"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descrição detalhada do produto"
              rows={4}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Product Images */}
          <div className="space-y-2">
            <Label className="block mb-2">Imagens do produto</Label>
            <div className="grid grid-cols-3 gap-4">
              {imagePreviews.length > 0 ? (
                imagePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded border bg-gray-50 overflow-hidden">
                    <Image
                      src={preview}
                      alt={`Imagem do produto ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-white p-1 rounded-full shadow-sm hover:bg-red-50"
                      title="Remover imagem"
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                ))
              ) : (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="relative aspect-square rounded border bg-gray-50">
                    <div className="flex h-full items-center justify-center">
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {imagePreviews.length < 3 && (
              <div className="mt-4">
                <Input
                  ref={fileInputRef}
                  id="product-images"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,.png,.jpg,.jpeg"
                  onChange={handleImageChange}
                  multiple={true}
                  className="mb-2"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500">
                  Envie até 3 imagens (JPG, JPEG ou PNG). Tamanho máximo: 5MB por imagem.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="featured"
              checked={formData.featured}
              onCheckedChange={(checked) => handleSwitchChange("featured", checked)}
              disabled={isSubmitting}
            />
            <Label htmlFor="featured">Produto em Destaque</Label>
          </div>

          {/* Sessão de upload de áudio */}
          {formData.type !== "helmet" && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="hasSound"
                  checked={formData.hasSound}
                  onCheckedChange={(checked) => handleSwitchChange("hasSound", checked)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="hasSound">Contém som do motor</Label>
              </div>
              
              {formData.hasSound && (
                <div className="space-y-2 rounded-md border p-4">
                  <Label htmlFor="soundFile" className="flex items-center">
                    <Volume2 className="mr-2 h-4 w-4" />
                    Arquivo do Som do Motor
                  </Label>
                  
                  {/* Show existing sound file */}
                  {existingSoundFile && !shouldDeleteSound && (
                    <Alert className="mb-2">
                      <Volume2 className="h-4 w-4" />
                      <AlertDescription className="flex items-center justify-between">
                        <span>Arquivo atual: {existingSoundFile}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removeSoundFile}
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Mostra o novo arquivo de som */}
                  {soundFile && (
                    <Alert className="mb-2">
                      <Volume2 className="h-4 w-4" />
                      <AlertDescription className="flex items-center justify-between">
                        <span>Novo arquivo: {soundFile.name}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removeSoundFile}
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Input
                    ref={soundInputRef}
                    id="soundFile"
                    type="file"
                    accept="audio/mp3,audio/wav,audio/ogg,audio/mp4,audio/mpeg"
                    onChange={handleSoundFileChange}
                    disabled={isSubmitting}
                  />
                  
                  <p className="text-xs text-gray-500">
                    Envie um arquivo MP3, WAV, OGG ou M4A do som do motor. Tamanho máximo: 5MB
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            className="bg-red-600 hover:bg-red-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editMode ? "Atualizando..." : "Adicionando..."}
              </>
            ) : (
              editMode ? "Atualizar Produto" : "Adicionar Produto"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
