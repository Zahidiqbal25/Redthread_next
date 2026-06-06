'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type CartItem = { id: number; name: string; price: number; image: string; weight: string; qty: number }
type User = { id: number; name: string; email: string; phone: string; address: string; city: string; pincode: string } | null

interface StoreContextType {
  cart: CartItem[]
  user: User
  addToCart: (product: any) => void
  updateQty: (id: number, delta: number) => void
  removeFromCart: (id: number) => void
  clearCart: () => void
  setUser: (u: User) => void
  logout: () => void
  toast: string
  showToast: (msg: string) => void
}

const StoreContext = createContext<StoreContextType>(null!)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [user, setUserState] = useState<User>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('df_cart')
    if (saved) setCart(JSON.parse(saved))
    const savedUser = localStorage.getItem('df_user')
    if (savedUser) setUserState(JSON.parse(savedUser))
  }, [])

  useEffect(() => { localStorage.setItem('df_cart', JSON.stringify(cart)) }, [cart])

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { id: product.id, name: product.name, price: product.price, image: product.image, weight: product.weight, qty: 1 }]
    })
    showToast(`${product.name} added to cart!`)
  }

  const updateQty = (id: number, delta: number) => {
    setCart(prev => {
      const item = prev.find(i => i.id === id)
      if (!item) return prev
      if (item.qty + delta <= 0) return prev.filter(i => i.id !== id)
      return prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i)
    })
  }

  const removeFromCart = (id: number) => setCart(prev => prev.filter(i => i.id !== id))
  const clearCart = () => setCart([])

  const setUser = (u: User) => {
    setUserState(u)
    if (u) localStorage.setItem('df_user', JSON.stringify(u))
    else localStorage.removeItem('df_user')
  }

  const logout = () => { setUser(null); setCart([]); showToast('Logged out successfully') }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  return (
    <StoreContext.Provider value={{ cart, user, addToCart, updateQty, removeFromCart, clearCart, setUser, logout, toast, showToast }}>
      {children}
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </StoreContext.Provider>
  )
}

export const useStore = () => useContext(StoreContext)
