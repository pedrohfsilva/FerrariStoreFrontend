/**
 * API utility functions for fetching data from the backend
 */

// API Configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export const API_ENDPOINTS = {
  // Auth endpoints
  register: `${API_URL}/api/users/register`,
  login: `${API_URL}/api/users/login`,
  checkToken: `${API_URL}/api/users/checktoken`,
  
  // User endpoints
  getUserData: `${API_URL}/api/users/user`,
  updateUser: `${API_URL}/api/users/edit`,
  address: `${API_URL}/api/users/address`,
  updateAddress: `${API_URL}/api/users/address`,
  updatePaymentMethod: `${API_URL}/api/users/payment-method`,
  getPaymentMethod: `${API_URL}/api/users/payment-method`,
  userById: (id: string) => `${API_URL}/api/users/${id}`,
  getCurrentUser: `${API_URL}/api/users/checkuser`,
  
  // Cart endpoints
  cart: `${API_URL}/api/users/cart`,
  addToCart: `${API_URL}/api/users/cart`,
  updateCartItem: (itemId: string) => `${API_URL}/api/users/cart/${itemId}`,
  removeFromCart: (itemId: string) => `${API_URL}/api/users/cart/${itemId}`,
  clearCart: `${API_URL}/api/users/cart/clear`,
  
  // Order endpoints
  createOrder: `${API_URL}/api/users/orders`,
  orders: `${API_URL}/api/users/orders`,
  order: (orderId: string) => `${API_URL}/api/users/orders/${orderId}`,
  
  // Product endpoints
  products: `${API_URL}/api/products`,
  product: (id: string) => `${API_URL}/api/products/${id}`,
  productsByType: (type: string) => `${API_URL}/api/products/type/${type}`,
  featuredProducts: `${API_URL}/api/products/featured`,
  searchProducts: (query: string) => `${API_URL}/api/products/search?q=${encodeURIComponent(query)}`,
  
  // Admin endpoints
  createProduct: `${API_URL}/api/products`,
  updateProduct: (id: string) => `${API_URL}/api/products/${id}`,
  deleteProduct: (id: string) => `${API_URL}/api/products/${id}`,
  removeProductImage: (id: string) => `${API_URL}/api/products/${id}/remove-image`,
  
  // Admin user management
  getAllUsers: `${API_URL}/api/users/all`,
  deleteUser: (id: string) => `${API_URL}/api/users/${id}`,
}
  
// Helper function to get auth headers
export const getAuthHeaders = (isFormData: boolean = false) => {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {}
  
  // Only set Content-Type for JSON requests, not FormData
  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }
  
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  
  return headers
}

// Helper function for authenticated requests
export const authFetchConfig = (method: string = 'GET', body?: any): RequestInit => {
  const isFormData = body instanceof FormData
  const config: RequestInit = {
    method,
    headers: getAuthHeaders(isFormData),
  }
  
  if (body) {
    config.body = isFormData ? body : JSON.stringify(body)
  }
  
  return config
}

// Helper function for authenticated requests with custom headers
export const fetchWithAuth = (url: string, config: RequestInit = {}) => {
  const isFormData = config.body instanceof FormData
  const token = localStorage.getItem('token')
  
  const headers: Record<string, string> = {}
  
  // Only set Content-Type for non-FormData requests
  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }
  
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  
  return fetch(url, {
    ...config,
    headers: {
      ...headers,
      ...config.headers
    }
  })
}

// Auth utility functions
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('token')
}

export const getCurrentUserId = (): string | null => {
  if (typeof window === 'undefined') return null
  
  // Try to get from userData object first
  const userData = localStorage.getItem('userData')
  if (userData) {
    try {
      const user = JSON.parse(userData)
      return user._id || user.id
    } catch {
      // If userData is corrupted, fall back to userId
    }
  }
  
  // Fallback to direct userId for backward compatibility
  return localStorage.getItem('userId')
}

export const isAdmin = (): boolean => {
  if (typeof window === 'undefined') return false
  
  // First try to get from userData object
  const userData = localStorage.getItem('userData')
  if (userData) {
    try {
      const user = JSON.parse(userData)
      return user.admin === true
    } catch {
      // If userData is corrupted, fall back to isAdmin flag
    }
  }
  
  // Fallback to direct isAdmin flag for backward compatibility
  const isAdminFlag = localStorage.getItem('isAdmin')
  return isAdminFlag === 'true'
}

export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
    localStorage.removeItem('userData')
    localStorage.removeItem('userId')
    localStorage.removeItem('isAdmin')
    
    // Dispatch custom event to notify components about auth state change
    window.dispatchEvent(new Event('authStateChanged'))
  }
}