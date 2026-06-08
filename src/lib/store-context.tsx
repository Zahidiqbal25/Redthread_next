'use client'
import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react'

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
  setOnRequireAuth: (fn: () => void) => void
}

const StoreContext = createContext<StoreContextType>(null!)

function getInitialCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem('df_cart')
    return saved ? JSON.parse(saved) : []
  } catch { return [] }
}

function getInitialUser(): User {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem('df_user')
    return saved ? JSON.parse(saved) : null
  } catch { return null }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(getInitialCart)
  const [user, setUserState] = useState<User>(getInitialUser)
  const [toast, setToast] = useState('')
  const onRequireAuthRef = useRef<(() => void) | null>(null)

  const userRef = useRef<User>(getInitialUser())

  // Keep userRef in sync
  useEffect(() => { userRef.current = user }, [user])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('df_cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = useCallback((product: any) => {
    if (!userRef.current) {
      if (onRequireAuthRef.current) onRequireAuthRef.current()
      else { setToast('Please login to add items to cart'); setTimeout(() => setToast(''), 2500) }
      return
    }
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { id: product.id, name: product.name, price: product.price, image: product.image, weight: product.weight, qty: 1 }]
    })
    setToast(`${product.name} added to cart!`)
    setTimeout(() => setToast(''), 2500)
  }, [])

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
    userRef.current = u
    if (u) localStorage.setItem('df_user', JSON.stringify(u))
    else localStorage.removeItem('df_user')
  }

  const logout = () => { setUser(null); setCart([]); setToast('Logged out successfully'); setTimeout(() => setToast(''), 2500) }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const setOnRequireAuth = (fn: () => void) => { onRequireAuthRef.current = fn }

  return (
    <StoreContext.Provider value={{ cart, user, addToCart, updateQty, removeFromCart, clearCart, setUser, logout, toast, showToast, setOnRequireAuth }}>
      {children}
      {toast && <div className="toast show">{toast}</div>}
    </StoreContext.Provider>
  )
}

export const useStore = () => useContext(StoreContext)
