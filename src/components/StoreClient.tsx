'use client'
import { useState, useMemo, useEffect } from 'react'
import { StoreProvider, useStore } from '@/lib/store-context'
import Header from '@/components/Header'
import CartSidebar from '@/components/CartSidebar'
import ProductCard from '@/components/ProductCard'
import Footer from '@/components/Footer'
import AuthModal from '@/components/AuthModal'
import CheckoutModal from '@/components/CheckoutModal'
import OrdersModal from '@/components/OrdersModal'
import ProfileModal from '@/components/ProfileModal'
import TrackOrderModal from '@/components/TrackOrderModal'

function ResetPasswordModal({ token, onClose }: { token: string; onClose: () => void }) {
  const { showToast } = useStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setLoading(true)
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/users/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, newPassword: fd.get('newPassword') }) })
    const data = await res.json()
    setLoading(false)
    if (res.ok) { setDone(true); showToast('Password reset successfully!') }
    else setError(data.error)
  }

  return (
    <div className="modal-overlay open">
      <div className="bg-white rounded-none md:rounded-xl w-full md:max-w-md p-6 md:p-8">
        {done ? (
          <>
            <h2 className="font-display text-xl mb-2">✅ Password Reset!</h2>
            <p className="text-sm text-gray-500 mb-5">Your password has been updated. You can now log in.</p>
            <button onClick={onClose} className="w-full btn-primary">Go to Login</button>
          </>
        ) : (
          <>
            <h2 className="font-display text-xl mb-2">🔑 Reset Password</h2>
            <p className="text-sm text-gray-500 mb-5">Enter your new password below.</p>
            <form onSubmit={handleReset} className="space-y-4">
              <input name="newPassword" type="password" required minLength={6} placeholder="New password (min 6 chars)" className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary" />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full btn-primary">{loading ? 'Resetting...' : 'Reset Password'}</button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

function CompleteProfileModal({ onClose }: { onClose: () => void }) {
  const { user, setUser, showToast } = useStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setLoading(true)
    const fd = new FormData(e.currentTarget)
    const body = { name: fd.get('name'), phone: fd.get('phone'), address: fd.get('address'), city: fd.get('city'), pincode: fd.get('pincode') }
    const res = await fetch(`/api/users/${user!.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    setLoading(false)
    if (res.ok) { setUser(data); onClose(); showToast(`Welcome, ${data.name}! Profile completed.`) }
    else setError(data.error || 'Failed to save')
  }

  return (
    <div className="modal-overlay open">
      <div className="bg-white rounded-none md:rounded-xl w-full md:max-w-md p-6 md:p-8 max-h-screen md:max-h-[90vh] overflow-y-auto">
        <h2 className="font-display text-xl mb-2">👋 Complete Your Registration</h2>
        <p className="text-sm text-gray-500 mb-5">Please fill in your details to continue using Valenuts.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="text-sm font-semibold text-gray-600 block mb-1">Full Name</label><input name="name" required defaultValue={user?.name || ''} className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary" /></div>
          <div><label className="text-sm font-semibold text-gray-600 block mb-1">Phone Number</label><input name="phone" type="tel" required placeholder="e.g. 9876543210" className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary" /></div>
          <div><label className="text-sm font-semibold text-gray-600 block mb-1">Address</label><textarea name="address" required placeholder="Your full address" className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary resize-none h-16" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-sm font-semibold text-gray-600 block mb-1">City</label><input name="city" required placeholder="City" className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary" /></div>
            <div><label className="text-sm font-semibold text-gray-600 block mb-1">Pincode</label><input name="pincode" required placeholder="Pincode" className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary" /></div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full btn-primary">{loading ? 'Saving...' : 'Complete Registration'}</button>
        </form>
      </div>
    </div>
  )
}

function StoreContent({ initialProducts, initialCategories }: { initialProducts: any[]; initialCategories: any[] }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [ordersOpen, setOrdersOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [trackOpen, setTrackOpen] = useState(false)
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [completeProfileOpen, setCompleteProfileOpen] = useState(false)

  const { setUser, showToast, setOnRequireAuth } = useStore()

  useEffect(() => {
    setOnRequireAuth(() => { setAuthMode('register') })
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('reset_token')
    if (token) { setResetToken(token); window.history.replaceState({}, '', '/') }
    const googleUser = params.get('google_user')
    if (googleUser) {
      try {
        const user = JSON.parse(decodeURIComponent(googleUser))
        setUser(user)
        if (!user.phone || !user.address) {
          setCompleteProfileOpen(true)
        } else {
          showToast(`Welcome, ${user.name}!`)
        }
      } catch {}
      window.history.replaceState({}, '', '/')
    }
    const authError = params.get('auth_error')
    if (authError) {
      showToast('❌ Google sign-in failed. Please try again.')
      window.history.replaceState({}, '', '/')
    }
  }, [])

  const filtered = useMemo(() => {
    let products = initialProducts
    if (category !== 'All') products = products.filter(p => p.category === category)
    if (search) {
      const q = search.toLowerCase()
      products = products.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
    }
    return products
  }, [initialProducts, category, search])

  return (
    <>
      <Header
        onSearch={setSearch}
        onOpenAuth={setAuthMode}
        onOpenTrack={() => setTrackOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenOrders={() => setOrdersOpen(true)}
      />
      <CartSidebar onCheckout={() => setCheckoutOpen(true)} onLogin={() => setAuthMode('login')} />

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 md:pt-8 pb-5 flex gap-2 md:gap-2.5 flex-wrap justify-center">
        <button onClick={() => setCategory('All')} className={`px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold border-2 transition-all ${category === 'All' ? 'bg-primary text-white border-primary shadow-md' : 'bg-white border-gray-200 hover:border-primary'}`}>All</button>
        {initialCategories.map(c => (
          <button key={c.id} onClick={() => setCategory(c.name)} className={`px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold border-2 transition-all ${category === c.name ? 'bg-primary text-white border-primary shadow-md' : 'bg-white border-gray-200 hover:border-primary'}`}>
            {c.emoji ? `${c.emoji} ` : ''}{c.name}
          </button>
        ))}
      </div>

      {/* Products */}
      <section id="products" className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
        <h2 className="font-display text-2xl md:text-3xl text-center text-primary-dark mt-8 md:mt-10 mb-2">Our Products</h2>
        <p className="text-center text-gray-500 mb-6 md:mb-8 text-sm md:text-base">Premium quality, unbeatable prices</p>
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><p className="text-4xl mb-2">🔍</p><p>No products found</p></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* Why Choose Us */}
      <section id="why-us" className="bg-gradient-to-br from-primary-dark to-primary py-12 md:py-16 px-4 md:px-6">
        <h2 className="font-display text-2xl md:text-3xl text-center text-white mb-2">Why Choose Valenuts?</h2>
        <p className="text-center text-white/70 mb-8 md:mb-10 text-sm md:text-base">We go the extra mile to bring you the best</p>
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            ['🌍', 'Globally Sourced', 'Directly sourced from farms in California, Afghanistan, Iran & Chile.'],
            ['🔬', 'Lab Tested', 'Every batch is tested for quality, purity and freshness.'],
            ['📦', 'Secure Packaging', 'Airtight, food-grade packaging that locks in freshness.'],
            ['💰', 'Best Prices', 'Farm-to-door supply chain cuts out middlemen.'],
          ].map(([icon, title, desc]) => (
            <div key={title} className="bg-white/10 border border-white/15 rounded-2xl p-4 md:p-8 text-center text-white hover:bg-white/15 hover:-translate-y-1 transition-all backdrop-blur-sm">
              <span className="text-3xl md:text-4xl block mb-2 md:mb-4">{icon}</span>
              <h3 className="font-bold text-accent mb-1 md:mb-2 text-sm md:text-base">{title}</h3>
              <p className="text-xs md:text-sm opacity-85 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer onCategoryClick={setCategory} />

      {/* Modals */}
      {completeProfileOpen && <CompleteProfileModal onClose={() => setCompleteProfileOpen(false)} />}
      {authMode && <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onSwitch={setAuthMode} />}
      {checkoutOpen && <CheckoutModal onClose={() => setCheckoutOpen(false)} />}
      {ordersOpen && <OrdersModal onClose={() => setOrdersOpen(false)} />}
      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
      {trackOpen && <TrackOrderModal onClose={() => setTrackOpen(false)} />}
      {resetToken && <ResetPasswordModal token={resetToken} onClose={() => { setResetToken(null); setAuthMode('login') }} />}
    </>
  )
}

export default function StoreClient({ initialProducts, initialCategories }: { initialProducts: any[]; initialCategories: any[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  return (
    <StoreProvider>
      <StoreContent initialProducts={initialProducts} initialCategories={initialCategories} />
    </StoreProvider>
  )
}
