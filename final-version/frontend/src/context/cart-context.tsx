"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { API_ENDPOINTS, authFetchConfig, isAuthenticated } from "@/lib/api"

export interface ICartItem {
  id: string
  productId: string // Add product ID for stock checking
  name: string
  price: number
  image: string
  category: string
  quantity?: number
}

interface Cart {
  items: ICartItem[]
  total: number
  itemCount: number
}

interface CartContextState {
  cart: Cart
  isLoading: boolean
  addItem: (item: ICartItem) => Promise<void>
  removeItem: (id: string) => Promise<void>
  updateItemQuantity: (id: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  itemCount: number
  getItemQuantityInCart: (productId: string) => number
}

const CartContext = createContext<CartContextState | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>({ items: [], total: 0, itemCount: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Load cart from backend on mount
  useEffect(() => {
    if (isAuthenticated()) {
      loadCartFromBackend()
    } else {
      // If not authenticated, ensure cart is empty
      setCart({ items: [], total: 0, itemCount: 0 })
    }
  }, [])

  // Listen for authentication changes to clear cart when user logs out
  useEffect(() => {
    const handleAuthChange = () => {
      if (!isAuthenticated()) {
        // Clear cart immediately when user is no longer authenticated
        setCart({ items: [], total: 0, itemCount: 0 })
      }
    }

    window.addEventListener('storage', handleAuthChange)
    window.addEventListener('authStateChanged', handleAuthChange)

    return () => {
      window.removeEventListener('storage', handleAuthChange)
      window.removeEventListener('authStateChanged', handleAuthChange)
    }
  }, [])

  const loadCartFromBackend = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(API_ENDPOINTS.cart, authFetchConfig())
      
      if (response.ok) {
        const data = await response.json()
        
        // Filter out items where product is null (deleted products)
        const validCartItems = data.cart.filter((item: any) => item.product !== null)
        
        const cartItems: ICartItem[] = validCartItems.map((item: any) => ({
          id: item._id, // Use cart item's _id, not product._id
          productId: item.product._id, // Add product ID for stock checking
          name: item.product.name,
          price: item.product.price,
          image: item.product.images && item.product.images.length > 0 
            ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/public/images/products/${item.product.images[0]}`
            : "/placeholder.svg",
          category: item.product.type,
          quantity: item.quantity
        }))
        
        const total = cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)
        const itemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)

        setCart({ items: cartItems, total, itemCount })
      }
    } catch (error) {
      console.error("Error loading cart from backend:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addItem = async (item: ICartItem) => {
    if (!isAuthenticated()) {
      toast({
        title: "Login necessário",
        description: "Você precisa fazer login para adicionar itens ao carrinho.",
        variant: "destructive",
      })
      return
    }

    try {
      // Não usar setIsLoading aqui para evitar bloquear todos os botões
      const response = await fetch(API_ENDPOINTS.addToCart, authFetchConfig('POST', {
        productId: item.productId, // Use productId for backend
        quantity: item.quantity || 1
      }))

      if (response.ok) {
        await loadCartFromBackend() // Reload cart from backend
        toast({
          title: "Item adicionado",
          description: `${item.name} foi adicionado ao carrinho.`,
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erro ao adicionar item ao carrinho")
      }
    } catch (error) {
      console.error("Error adding item to cart:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao adicionar item ao carrinho.",
        variant: "destructive",
      })
    }
  }

  const removeItem = async (id: string) => {
    if (!isAuthenticated()) return

    try {
      setIsLoading(true)
      
      // Find the cart item to get the backend cart item ID
      const cartItem = cart.items.find(item => item.id === id)
      if (!cartItem) return

      const response = await fetch(API_ENDPOINTS.removeFromCart(id), authFetchConfig('DELETE'))

      if (response.ok) {
        await loadCartFromBackend() // Reload cart from backend
        toast({
          title: "Item removido",
          description: `${cartItem.name} foi removido do carrinho.`,
        })
      } else {
        throw new Error("Erro ao remover item do carrinho")
      }
    } catch (error) {
      console.error("Error removing item from cart:", error)
      toast({
        title: "Erro",
        description: "Erro ao remover item do carrinho.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateItemQuantity = async (id: string, quantity: number) => {
    if (!isAuthenticated()) return

    if (quantity <= 0) {
      await removeItem(id)
      return
    }

    try {
      setIsLoading(true)
      
      const response = await fetch(API_ENDPOINTS.updateCartItem(id), authFetchConfig('PUT', {
        quantity
      }))

      if (response.ok) {
        await loadCartFromBackend() // Reload cart from backend
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erro ao atualizar quantidade")
      }
    } catch (error) {
      console.error("Error updating item quantity:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar quantidade do item.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const clearCart = async () => {
    if (!isAuthenticated()) return

    try {
      setIsLoading(true)
      
      const response = await fetch(API_ENDPOINTS.clearCart, authFetchConfig('DELETE'))

      if (response.ok) {
        setCart({ items: [], total: 0, itemCount: 0 })
      } else {
        throw new Error("Erro ao limpar carrinho")
      }
    } catch (error) {
      console.error("Error clearing cart:", error)
      toast({
        title: "Erro",
        description: "Erro ao limpar carrinho.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to get current quantity of a product in cart by product ID
  const getItemQuantityInCart = (productId: string): number => {
    const cartItem = cart.items.find(item => item.productId === productId)
    return cartItem?.quantity || 0
  }

  const value: CartContextState = {
    cart,
    isLoading,
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
    itemCount: cart.itemCount,
    getItemQuantityInCart
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
