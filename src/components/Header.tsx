'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store-context'

export default function Header({ onSearch, onOpenAuth, onOpenTrack, onOpenProfile, onOpenOrders }: {
  onSearch: (q: string) => void
  onOpenAuth: (mode: 'login' | 'register') => void
  onOpenTrack: () => void
  onOpenProfile: () => void
  onOpenOrders: () => void
}) {
  const { cart, user, logout } = useStore()
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false) }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  return (
    <header className="bg-primary-dark text-white sticky top-0 z-[100] shadow-md">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3 md:gap-5">
        <Link href="/" className="shrink-0"><img src="/logo.png?v=2" alt="Logo" className="h-8 md:h-10 w-auto mix-blend-screen" /></Link>

        {/* Desktop search */}
        <div className="flex-1 max-w-md relative hidden md:block">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSearch(search)}
            placeholder="Search almonds, cashews, pistachios..."
            className="w-full px-4 py-2.5 pr-10 rounded-full bg-white/10 border-2 border-white/20 text-white placeholder:text-white/60 outline-none focus:border-accent text-sm"
          />
          <button onClick={() => onSearch(search)} className="absolute right-1 top-1/2 -translate-y-1/2 bg-accent text-primary-dark w-8 h-8 rounded-full text-sm">🔍</button>
        </div>

        <div className="flex items-center gap-1 md:gap-3">
          {/* Mobile search toggle */}
          <button onClick={() => setMobileSearchOpen(!mobileSearchOpen)} className="md:hidden text-sm px-2 py-2 rounded-lg hover:bg-white/10">🔍</button>

          {!user ? (
            <>
              <button onClick={() => onOpenAuth('login')} className="text-sm px-2 md:px-3 py-2 rounded-lg hover:bg-white/10">👤 <span className="hidden sm:inline">Login</span></button>
              <button onClick={onOpenTrack} className="text-sm px-3 py-2 rounded-lg hover:bg-white/10 hidden md:block">📦 Track Order</button>
            </>
          ) : (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenuOpen(!menuOpen)} className="text-sm px-2 md:px-3 py-2 rounded-lg hover:bg-white/10 flex items-center gap-1">
                👤 <span className="hidden sm:inline">{user.name.split(' ')[0]}</span> ▾
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl min-w-[180px] overflow-hidden z-50">
                  <button onClick={() => { onOpenOrders(); setMenuOpen(false) }} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">📦 My Orders</button>
                  <button onClick={() => { onOpenProfile(); setMenuOpen(false) }} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">⚙️ My Profile</button>
                  <button onClick={() => { onOpenTrack(); setMenuOpen(false) }} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 md:hidden">📦 Track Order</button>
                  <button onClick={() => { logout(); setMenuOpen(false) }} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">🚪 Logout</button>
                </div>
              )}
            </div>
          )}

          <button onClick={() => { const e = document.getElementById('cartSidebar'); e?.classList.toggle('translate-x-0'); e?.classList.toggle('translate-x-full'); document.getElementById('cartOverlay')?.classList.toggle('hidden') }} className="relative text-sm px-2 md:px-3 py-2 rounded-lg hover:bg-white/10">
            🛒 <span className="hidden sm:inline">Cart</span>
            <span className="absolute -top-1 -right-1 bg-accent text-primary-dark text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{cartCount}</span>
          </button>
        </div>
      </div>

      {/* Mobile search bar */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { onSearch(search); setMobileSearchOpen(false) } }}
              placeholder="Search products..."
              autoFocus
              className="w-full px-4 py-2.5 pr-10 rounded-full bg-white/10 border-2 border-white/20 text-white placeholder:text-white/60 outline-none focus:border-accent text-sm"
            />
            <button onClick={() => { onSearch(search); setMobileSearchOpen(false) }} className="absolute right-1 top-1/2 -translate-y-1/2 bg-accent text-primary-dark w-8 h-8 rounded-full text-sm">🔍</button>
          </div>
        </div>
      )}
    </header>
  )
}
