'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminClient() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [section, setSection] = useState('dashboard')
  const [stats, setStats] = useState<any>({})
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [contact, setContact] = useState({ name: '', email: '', phone: '', address: '', pincode: '' })
  const [globalBadges, setGlobalBadges] = useState<{icon: string, title: string, desc: string}[]>([])
  const [infoCards, setInfoCards] = useState<{icon: string, title: string, desc: string}[]>([])
  const [sliders, setSliders] = useState<{images: string[], text: string}[]>([
    { images: [], text: '' }, { images: [], text: '' }, { images: [], text: '' }
  ])
  const [sliderUploading, setSliderUploading] = useState(false)
  const [editProduct, setEditProduct] = useState<any>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [imagePreview, setImagePreview] = useState('')
  const [productImages, setProductImages] = useState<string[]>([])
  const [productVideo, setProductVideo] = useState('')
  const [productFeatures, setProductFeatures] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<any>(null)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [userOrders, setUserOrders] = useState<any[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('df_admin') === 'true') setAuthed(true)
  }, [])

  useEffect(() => { if (authed) loadAll() }, [authed])

  async function loadAll() {
    const t = Date.now()
    const [s, p, o, c, u, ct, sl] = await Promise.all([
      fetch(`/api/stats?t=${t}`).then(r => r.json()),
      fetch(`/api/products?t=${t}`).then(r => r.json()),
      fetch(`/api/orders?t=${t}`).then(r => r.json()),
      fetch(`/api/categories?t=${t}`).then(r => r.json()),
      fetch(`/api/users?t=${t}`).then(r => r.json()),
      fetch(`/api/settings/contact?t=${t}`).then(r => r.json()),
      fetch(`/api/settings/sliders?t=${t}`).then(r => r.json()),
    ])
    setStats(s); setProducts(p); setOrders(Array.isArray(o) ? o.sort((a: any, b: any) => b.id - a.id) : []); setCategories(c); setUsers(u); setContact(ct)
    if (sl.sliders?.length) setSliders(sl.sliders)
    const badges = await fetch(`/api/settings/trust-badges?t=${t}`, { cache: 'no-store' }).then(r => r.json())
    if (Array.isArray(badges)) setGlobalBadges(badges)
    const cards = await fetch(`/api/settings/info-cards?t=${t}`, { cache: 'no-store' }).then(r => r.json())
    if (Array.isArray(cards)) setInfoCards(cards)
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: fd.get('password') }) })
    if (res.ok) { sessionStorage.setItem('df_admin', 'true'); setAuthed(true) }
    else alert('Invalid password')
  }

  async function updateOrderStatus(id: number, status: string) {
    await fetch(`/api/orders/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    loadAll()
  }

  async function deleteOrder(id: number) {
    if (!confirm('Delete this order?')) return
    await fetch(`/api/orders/${id}`, { method: 'DELETE' })
    loadAll()
  }

  async function deleteProduct(id: number) {
    if (!confirm('Delete this product?')) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    loadAll()
  }

  async function moveProduct(id: number, direction: 'up' | 'down') {
    const idx = products.findIndex(p => p.id === id)
    if (idx === -1) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === products.length - 1) return
    const newProducts = [...products]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    ;[newProducts[idx], newProducts[swapIdx]] = [newProducts[swapIdx], newProducts[idx]]
    setProducts(newProducts)
    const order = newProducts.map(p => p.id)
    await fetch('/api/settings/product-order', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order }) })
  }

  async function uploadImage(file: File): Promise<string> {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    setUploading(false)
    return data.url || ''
  }

  async function saveProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const fileInput = (e.currentTarget.querySelector('#mainImage') as HTMLInputElement)
    let image = imagePreview || editProduct?.image || ''

    if (fileInput?.files?.[0]) {
      image = await uploadImage(fileInput.files[0])
    }

    const images = productImages.length > 0 ? productImages : (editProduct?.images || [])
    const video = productVideo || editProduct?.video || ''
    const features = productFeatures.filter(f => f.trim())
    const body = { name: fd.get('name'), category: fd.get('category'), price: Number(fd.get('price')), originalPrice: Number(fd.get('originalPrice')), weight: fd.get('weight'), description: fd.get('description'), rating: Number(fd.get('rating')) || 4.5, quantity: Number(fd.get('quantity')) || 0, image, images, video, features, inStock: Number(fd.get('quantity')) > 0 }

    if (editProduct) await fetch(`/api/products/${editProduct.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    else await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

    setShowProductModal(false); setEditProduct(null); setImagePreview(''); setProductImages([]); setProductVideo(''); setProductFeatures([]); loadAll()
  }


  async function saveContact() {
    const res = await fetch('/api/settings/contact', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contact) })
    if (res.ok) { alert('Contact info updated!'); loadAll() }
    else { const d = await res.json(); alert('Failed: ' + (d.error || 'Unknown error')) }
  }

  async function saveSliders() {
    await fetch('/api/settings/sliders', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sliders }) })
    alert('Sliders updated!')
  }

  async function uploadSliderImage(sliderIdx: number, file: File) {
    setSliderUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    setSliderUploading(false)
    if (data.url) {
      const updated = [...sliders]
      updated[sliderIdx] = { ...updated[sliderIdx], images: [...updated[sliderIdx].images, data.url] }
      setSliders(updated)
    }
  }

  function removeSliderImage(sliderIdx: number, imgIdx: number) {
    const updated = [...sliders]
    updated[sliderIdx] = { ...updated[sliderIdx], images: updated[sliderIdx].images.filter((_, i) => i !== imgIdx) }
    setSliders(updated)
  }

  function updateSliderText(sliderIdx: number, text: string) {
    const updated = [...sliders]
    updated[sliderIdx] = { ...updated[sliderIdx], text }
    setSliders(updated)
  }

  async function addCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: fd.get('name'), emoji: fd.get('emoji') }) })
    e.currentTarget.reset(); loadAll()
  }

  async function deleteCategory(id: number) {
    if (!confirm('Delete this category?')) return
    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    loadAll()
  }

  async function saveCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    await fetch(`/api/categories/${editCategory.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: fd.get('name'), emoji: fd.get('emoji') }) })
    setEditCategory(null); loadAll()
  }

  async function deleteUser(id: number) {
    if (!confirm('Delete this user?')) return
    await fetch(`/api/users/${id}`, { method: 'DELETE' })
    loadAll()
  }

  async function viewUserDetails(user: any) {
    setSelectedUser(user)
    setUserOrders([])
    try {
      const res = await fetch(`/api/users/${user.id}/orders?t=${Date.now()}`)
      const text = await res.text()
      const data = JSON.parse(text)
      setUserOrders(Array.isArray(data) ? data : [])
    } catch {
      setUserOrders([])
    }
  }

  async function toggleBlockUser(id: number, blocked: boolean) {
    await fetch(`/api/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocked: !blocked }) })
    loadAll()
    if (selectedUser?.id === id) setSelectedUser({ ...selectedUser, blocked: !blocked })
  }

  function printInvoice(o: any) {
    const items = Array.isArray(o.items) ? o.items : []
    const subtotal = items.reduce((s: number, i: any) => s + i.price * i.qty, 0)
    const shipping = subtotal >= 999 ? 0 : 50
    const win = window.open('', '_blank', 'width=800,height=600')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><title>Invoice #${o.id}</title><style>
      body{font-family:Arial,sans-serif;padding:40px;color:#222;max-width:700px;margin:0 auto}
      .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #2d5016;padding-bottom:16px;margin-bottom:24px}
      .brand{font-size:22px;font-weight:800;color:#2d5016}  .brand span{color:#d4a843}
      .badge{background:#2d5016;color:#fff;padding:4px 12px;border-radius:20px;font-size:12px}
      h3{color:#2d5016;margin:20px 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:1px}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th{background:#f5f5f5;padding:8px 10px;text-align:left;font-size:12px;text-transform:uppercase;color:#666}
      td{padding:8px 10px;border-bottom:1px solid #eee;font-size:13px}
      .total-row td{font-weight:700;font-size:15px;border-top:2px solid #2d5016;border-bottom:none}
      .footer{margin-top:32px;text-align:center;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:16px}
      @media print{body{padding:20px}}
    </style></head><body>
      <div class="header">
        <div><div class="brand"><img src="/logo.png?v=2" style="height:30px" /></div><div style="font-size:12px;color:#666;margin-top:4px">Premium Dry Fruits</div></div>
        <div style="text-align:right"><div class="badge">INVOICE</div><div style="font-size:13px;margin-top:6px">#${o.id}</div><div style="font-size:11px;color:#666"><strong>Order Date:</strong> ${o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
        <div><h3>Bill To</h3><div style="font-size:13px;line-height:1.8"><strong>${o.customerName}</strong><br/>${o.customerPhone}<br/>${o.customerEmail || ''}</div></div>
        <div><h3>Ship To</h3><div style="font-size:13px;line-height:1.8">${o.customerAddress || '—'}<br/>${o.customerCity || ''} ${o.customerPincode || ''}</div></div>
      </div>
      <h3>Order Items</h3>
      <table><thead><tr><th>Product</th><th>Weight</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead><tbody>
        ${items.map((i: any) => `<tr><td>${i.name}</td><td>${i.weight}</td><td>${i.qty}</td><td>₹${i.price.toLocaleString()}</td><td>₹${(i.price * i.qty).toLocaleString()}</td></tr>`).join('')}
      </tbody><tfoot>
        <tr><td colspan="4" style="text-align:right;font-size:12px;color:#666;padding:6px 10px">Subtotal</td><td style="padding:6px 10px">₹${subtotal.toLocaleString()}</td></tr>
        <tr><td colspan="4" style="text-align:right;font-size:12px;color:#666;padding:6px 10px">Shipping</td><td style="padding:6px 10px">${shipping === 0 ? 'FREE' : '₹' + shipping}</td></tr>
        <tr class="total-row"><td colspan="4" style="text-align:right;padding:10px">Total</td><td style="padding:10px;color:#2d5016">₹${o.total?.toLocaleString()}</td></tr>
      </tfoot></table>
      <div style="margin-top:16px;font-size:12px"><strong>Payment:</strong> ${o.payment} &nbsp;|&nbsp; <strong>Status:</strong> ${o.status || 'Pending'}</div>
      <div class="footer">Thank you for shopping with Valenuts! 🌰 &nbsp;|&nbsp; For support contact us at ${contact.email || ''}</div>
    </body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  function printLabel(o: any) {
    const win = window.open('', '_blank', 'width=500,height=400')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><title>Label #${o.id}</title><style>
      body{font-family:Arial,sans-serif;padding:0;margin:0}
      .label{width:380px;border:2px dashed #333;padding:20px;margin:20px auto;position:relative}
      .brand{font-size:16px;font-weight:800;color:#2d5016;border-bottom:1px solid #ccc;padding-bottom:8px;margin-bottom:12px}
      .brand span{color:#d4a843}
      .section{margin-bottom:10px}
      .section label{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#999;display:block;margin-bottom:2px}
      .section p{font-size:13px;font-weight:600;margin:0;line-height:1.5}
      .order-id{position:absolute;top:20px;right:20px;background:#2d5016;color:#fff;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:700}
      .divider{border:none;border-top:1px dashed #ccc;margin:10px 0}
      .from{font-size:11px;color:#666;margin-top:10px}
      @media print{body{margin:0}.label{border:2px dashed #333;margin:0}}
    </style></head><body>
      <div class="label">
        <div class="brand"><img src="/logo.png?v=2" style="height:24px" /></div>
        <div class="order-id">#${o.id}</div>
        <div class="section"><label>Deliver To</label><p>${o.customerName}</p><p>${o.customerPhone}</p></div>
        <div class="section"><label>Address</label><p>${o.customerAddress || '—'}</p><p>${o.customerCity || ''} — ${o.customerPincode || ''}</p></div>
        <hr class="divider"/>
        <div class="section"><label>Payment</label><p>${o.payment}</p></div>
        <div class="section"><label>Order Date</label><p>${o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p></div>
        <hr class="divider"/>
        <div class="from">From: Valenuts &nbsp;|&nbsp; ${contact.address || ''} &nbsp;|&nbsp; ${contact.phone || ''}</div>
      </div>
    </body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  const [forgotPassword, setForgotPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [fpEmail, setFpEmail] = useState('')
  const [fpOtp, setFpOtp] = useState('')
  const [fpStep, setFpStep] = useState<'email' | 'otp' | 'reset'>('email')
  const [fpLoading, setFpLoading] = useState(false)
  const [fpError, setFpError] = useState('')

  async function handleFpSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setFpError(''); setFpLoading(true)
    const res = await fetch('/api/admin/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fpEmail }) })
    const data = await res.json()
    setFpLoading(false)
    if (res.ok) setFpStep('otp')
    else setFpError(data.error)
  }

  async function handleFpVerify(e: React.FormEvent) {
    e.preventDefault()
    setFpError(''); setFpLoading(true)
    const res = await fetch('/api/admin/verify-reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fpEmail, code: fpOtp }) })
    const data = await res.json()
    setFpLoading(false)
    if (res.ok) setFpStep('reset')
    else setFpError(data.error)
  }

  async function handleFpReset(e: React.FormEvent) {
    e.preventDefault()
    setFpError(''); setFpLoading(true)
    const res = await fetch('/api/admin/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fpEmail, code: fpOtp, newPassword }) })
    const data = await res.json()
    setFpLoading(false)
    if (res.ok) { alert('Password reset successfully!'); setForgotPassword(false); setFpStep('email'); setFpOtp(''); setNewPassword('') }
    else setFpError(data.error)
  }

  if (!authed) {
    if (forgotPassword) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-dark to-primary">
          <div className="bg-white p-10 rounded-xl w-full max-w-sm shadow-2xl text-center">
            <h1 className="font-display text-2xl text-primary mb-2"><img src="/logo.png?v=2" alt="Logo" className="h-10 mx-auto mix-blend-multiply" /></h1>
            <p className="text-gray-500 text-sm mb-6">Reset Admin Password</p>
            {fpStep === 'email' && (
              <form onSubmit={handleFpSendOtp}>
                <input type="email" value={fpEmail} onChange={e => setFpEmail(e.target.value)} placeholder="Admin email" required className="w-full px-4 py-3 border-2 rounded-lg mb-4 outline-none focus:border-primary" />
                {fpError && <p className="text-red-500 text-sm mb-3">{fpError}</p>}
                <button type="submit" disabled={fpLoading} className="w-full btn-primary mb-3">{fpLoading ? 'Sending...' : 'Send OTP'}</button>
              </form>
            )}
            {fpStep === 'otp' && (
              <form onSubmit={handleFpVerify}>
                <p className="text-sm text-gray-500 mb-3">Enter the code sent to <strong>{fpEmail}</strong></p>
                <input type="text" value={fpOtp} onChange={e => setFpOtp(e.target.value)} maxLength={6} placeholder="6-digit code" className="w-full px-4 py-3 border-2 rounded-lg text-center text-2xl font-bold tracking-[12px] mb-4 outline-none focus:border-primary" />
                {fpError && <p className="text-red-500 text-sm mb-3">{fpError}</p>}
                <button type="submit" disabled={fpLoading} className="w-full btn-primary mb-3">{fpLoading ? 'Verifying...' : 'Verify Code'}</button>
              </form>
            )}
            {fpStep === 'reset' && (
              <form onSubmit={handleFpReset}>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" required minLength={6} className="w-full px-4 py-3 border-2 rounded-lg mb-4 outline-none focus:border-primary" />
                {fpError && <p className="text-red-500 text-sm mb-3">{fpError}</p>}
                <button type="submit" disabled={fpLoading} className="w-full btn-primary mb-3">{fpLoading ? 'Resetting...' : 'Reset Password'}</button>
              </form>
            )}
            <button onClick={() => { setForgotPassword(false); setFpStep('email'); setFpError('') }} className="text-primary text-sm font-semibold">← Back to Login</button>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-dark to-primary">
        <div className="bg-white p-10 rounded-xl w-full max-w-sm shadow-2xl text-center">
          <h1 className="font-display text-2xl text-primary mb-2"><img src="/logo.png?v=2" alt="Logo" className="h-10 mx-auto mix-blend-multiply" /></h1>
          <p className="text-gray-500 text-sm mb-6">Admin Panel Login</p>
          <form onSubmit={handleLogin}>
            <input name="password" type="password" placeholder="Enter admin password" required className="w-full px-4 py-3 border-2 rounded-lg mb-4 outline-none focus:border-primary" />
            <button type="submit" className="w-full btn-primary">Login</button>
          </form>
          <button onClick={() => setForgotPassword(true)} className="text-primary text-sm font-semibold mt-4">Forgot Password?</button>
        </div>
      </div>
    )
  }

  const nav = [['dashboard', '📊', 'Dashboard'], ['sliders', '🖼️', 'Sliders'], ['products', '📦', 'Products'], ['orders', '🧾', 'Orders'], ['categories', '🏷️', 'Categories'], ['users', '👥', 'Users']]

  return (
    <div className="flex min-h-screen">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-[99] lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`w-60 bg-primary-dark text-white py-5 fixed h-screen overflow-y-auto z-[100] transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="px-5 pb-5 border-b border-white/10 flex justify-between items-center"><img src="/logo.png?v=2" alt="Logo" className="h-8 w-auto mix-blend-screen" /><button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/70 hover:text-white">✕</button></div>
        <nav className="mt-5 space-y-1">
          {nav.map(([key, icon, label]) => (
            <button key={key} onClick={() => { setSection(key); setSidebarOpen(false) }} className={`w-full text-left flex items-center gap-3 px-6 py-3 text-sm transition-colors ${section === key ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'}`}>
              <span>{icon}</span> {label}
            </button>
          ))}
          <a href="/" className="flex items-center gap-3 px-6 py-3 text-sm text-white/70 hover:bg-white/5"><span>🏪</span> View Store</a>
          <button onClick={() => { sessionStorage.removeItem('df_admin'); router.push('/') }} className="w-full text-left flex items-center gap-3 px-6 py-3 text-sm text-white/70 hover:bg-white/5"><span>🚪</span> Logout</button>
        </nav>
      </aside>

      {/* Main */}
      <main className="lg:ml-60 flex-1 p-4 md:p-6 bg-[#faf8f5] min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between mb-4 bg-white rounded-xl p-3 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="text-primary text-xl">☰</button>
          <span className="font-display text-primary">Admin Panel</span>
          <span></span>
        </div>
        {section === 'dashboard' && (
          <>
            <h1 className="font-display text-2xl mb-6">Dashboard</h1>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
              {[
                ['🧾', stats.totalOrders, 'Total Orders', 'bg-blue-50 text-blue-700'],
                ['💰', `₹${(stats.revenue || 0).toLocaleString()}`, 'Revenue', 'bg-green-50 text-green-700'],
                ['📦', stats.totalProducts, 'Products', 'bg-purple-50 text-purple-700'],
                ['👥', stats.totalUsers, 'Customers', 'bg-orange-50 text-orange-700'],
                ['⏳', stats.pending, 'Pending', 'bg-yellow-50 text-yellow-700'],
                ['✅', stats.confirmed, 'Confirmed', 'bg-emerald-50 text-emerald-700'],
                ['🚚', stats.shipped, 'Shipped', 'bg-indigo-50 text-indigo-700'],
                ['⚠️', stats.lowStock?.length || 0, 'Low Stock', 'bg-red-50 text-red-700'],
              ].map(([icon, val, label, color]) => (
                <div key={label as string} className={`p-4 rounded-xl shadow-sm ${color}`}>
                  <span className="text-xl">{icon}</span>
                  <div className="text-xl font-bold mt-1">{val}</div>
                  <div className="text-xs opacity-70">{label}</div>
                </div>
              ))}
            </div>

            {/* Monthly Sales Graph */}
            <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
              <h2 className="font-semibold mb-4">📊 Monthly Sales (Last 6 Months)</h2>
              <div className="flex items-end gap-2 h-40">
                {(stats.monthlySales || []).map((m: any, i: number) => {
                  const maxVal = Math.max(...(stats.monthlySales || []).map((s: any) => s.total), 1)
                  const height = Math.max((m.total / maxVal) * 100, 4)
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold text-primary">₹{m.total >= 1000 ? `${(m.total/1000).toFixed(1)}k` : m.total}</span>
                      <div className="w-full bg-gradient-to-t from-primary to-primary-light rounded-t-md transition-all" style={{ height: `${height}%` }} />
                      <span className="text-[10px] text-gray-500">{m.month}</span>
                      <span className="text-[9px] text-gray-400">{m.orders} orders</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Top Selling Products */}
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h2 className="font-semibold mb-3">🏆 Top Selling Products</h2>
                {(stats.topSelling || []).length === 0 ? (
                  <p className="text-sm text-gray-400">No sales data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {(stats.topSelling || []).map((p: any, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.qty} sold • ₹{p.revenue.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Low Stock Products */}
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h2 className="font-semibold mb-3">⚠️ Low Stock Products</h2>
                {(stats.lowStock || []).length === 0 ? (
                  <p className="text-sm text-gray-400">All products are well stocked.</p>
                ) : (
                  <div className="space-y-2">
                    {(stats.lowStock || []).map((p: any) => (
                      <div key={p.id} className="flex items-center gap-3 p-2 bg-red-50 rounded-lg">
                        <img src={p.image} className="w-8 h-8 rounded object-cover" onError={e => (e.currentTarget.src = 'https://via.placeholder.com/32')} />
                        <span className="text-sm font-semibold flex-1 truncate">{p.name}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.quantity === 0 ? 'bg-red-200 text-red-700' : 'bg-yellow-200 text-yellow-700'}`}>{p.quantity} left</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
              <h2 className="font-semibold mb-3">🕔 Recent Orders</h2>
              {(stats.recentOrders || []).length === 0 ? (
                <p className="text-sm text-gray-400">No orders yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead><tr className="text-left text-xs uppercase text-gray-400"><th className="pb-2">#</th><th className="pb-2">Customer</th><th className="pb-2">Total</th><th className="pb-2">Status</th><th className="pb-2">Date</th></tr></thead>
                    <tbody>
                      {(stats.recentOrders || []).map((o: any) => (
                        <tr key={o.id} className="border-t">
                          <td className="py-2 font-semibold">#{o.id}</td>
                          <td className="py-2">{o.customerName}</td>
                          <td className="py-2 font-bold text-primary">₹{o.total?.toLocaleString()}</td>
                          <td className="py-2"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${o.status === 'Delivered' ? 'bg-green-100 text-green-700' : o.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{o.status || 'Pending'}</span></td>
                          <td className="py-2 text-xs text-gray-400">{(o.date || o.created_at) ? new Date(o.date || o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Contact */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-semibold mb-3">📞 Contact Info</h2>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input value={contact.name} onChange={e => setContact({ ...contact, name: e.target.value })} placeholder="Name" className="px-4 py-2.5 border rounded-lg outline-none focus:border-primary" />
                <input value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} placeholder="Email" className="px-4 py-2.5 border rounded-lg outline-none focus:border-primary" />
                <input value={contact.phone} onChange={e => setContact({ ...contact, phone: e.target.value })} placeholder="Phone" className="px-4 py-2.5 border rounded-lg outline-none focus:border-primary" />
                <input value={contact.address} onChange={e => setContact({ ...contact, address: e.target.value })} placeholder="Address" className="px-4 py-2.5 border rounded-lg outline-none focus:border-primary" />
                <input value={contact.pincode} onChange={e => setContact({ ...contact, pincode: e.target.value })} placeholder="Pincode" className="px-4 py-2.5 border rounded-lg outline-none focus:border-primary" />
              </div>
              <button onClick={saveContact} className="btn-primary text-sm">Save Contact</button>
            </div>

            {/* Trust Badges */}
            <div className="bg-white rounded-xl shadow-sm p-5 mt-6">
              <h2 className="font-semibold mb-3">🏅 Trust Badges (shown on home & product pages)</h2>
              {globalBadges.map((badge, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <input value={badge.icon} onChange={e => { const b = [...globalBadges]; b[i] = { ...b[i], icon: e.target.value }; setGlobalBadges(b) }} placeholder="🚚" className="w-14 px-2 py-2 border rounded-lg text-center outline-none focus:border-primary" />
                  <input value={badge.title} onChange={e => { const b = [...globalBadges]; b[i] = { ...b[i], title: e.target.value }; setGlobalBadges(b) }} placeholder="Title" className="flex-1 px-3 py-2 border rounded-lg outline-none focus:border-primary text-sm" />
                  <input value={badge.desc} onChange={e => { const b = [...globalBadges]; b[i] = { ...b[i], desc: e.target.value }; setGlobalBadges(b) }} placeholder="Description" className="flex-1 px-3 py-2 border rounded-lg outline-none focus:border-primary text-sm" />
                  <button onClick={() => setGlobalBadges(globalBadges.filter((_, j) => j !== i))} className="w-8 h-8 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200 shrink-0">×</button>
                </div>
              ))}
              <div className="flex gap-2 mt-3">
                <button onClick={() => setGlobalBadges([...globalBadges, { icon: '', title: '', desc: '' }])} className="text-xs text-primary font-semibold hover:underline">+ Add Badge</button>
                <button onClick={async () => { const filtered = globalBadges.filter(b => b.title.trim()); await fetch('/api/settings/trust-badges', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ badges: filtered }) }); setGlobalBadges(filtered); alert('Trust badges saved!') }} className="btn-primary text-sm ml-auto">Save Badges</button>
              </div>
            </div>

            {/* Info Cards */}
            <div className="bg-white rounded-xl shadow-sm p-5 mt-6">
              <h2 className="font-semibold mb-3">🌟 Info Cards ("Why Choose Us" section)</h2>
              {infoCards.map((card, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <input value={card.icon} onChange={e => { const c = [...infoCards]; c[i] = { ...c[i], icon: e.target.value }; setInfoCards(c) }} placeholder="🌍" className="w-14 px-2 py-2 border rounded-lg text-center outline-none focus:border-primary" />
                  <input value={card.title} onChange={e => { const c = [...infoCards]; c[i] = { ...c[i], title: e.target.value }; setInfoCards(c) }} placeholder="Title" className="flex-1 px-3 py-2 border rounded-lg outline-none focus:border-primary text-sm" />
                  <input value={card.desc} onChange={e => { const c = [...infoCards]; c[i] = { ...c[i], desc: e.target.value }; setInfoCards(c) }} placeholder="Description" className="flex-1 px-3 py-2 border rounded-lg outline-none focus:border-primary text-sm" />
                  <button onClick={() => setInfoCards(infoCards.filter((_, j) => j !== i))} className="w-8 h-8 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200 shrink-0">×</button>
                </div>
              ))}
              <div className="flex gap-2 mt-3">
                <button onClick={() => setInfoCards([...infoCards, { icon: '', title: '', desc: '' }])} className="text-xs text-primary font-semibold hover:underline">+ Add Card</button>
                <button onClick={async () => { const filtered = infoCards.filter(c => c.title.trim()); await fetch('/api/settings/info-cards', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cards: filtered }) }); setInfoCards(filtered); alert('Info cards saved!') }} className="btn-primary text-sm ml-auto">Save Cards</button>
              </div>
            </div>
          </>
        )}

        {section === 'sliders' && (
          <>
            <h1 className="font-display text-2xl mb-6">Banner Sliders</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
              {sliders.map((slider, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-sm p-5">
                  <h3 className="font-semibold text-sm mb-3">Slider {idx + 1}</h3>
                  {/* Images */}
                  <div className="flex gap-2 flex-wrap mb-3">
                    {slider.images.map((img, imgIdx) => (
                      <div key={imgIdx} className="relative group">
                        <img src={img} className="w-16 h-16 rounded-lg object-cover" />
                        <button onClick={() => removeSliderImage(idx, imgIdx)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center">×</button>
                      </div>
                    ))}
                  </div>
                  <input
                    type="file" accept="image/*"
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadSliderImage(idx, f) }}
                    className="w-full text-xs mb-3 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-semibold file:cursor-pointer"
                  />
                  {/* Text */}
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Display Text</label>
                  <input
                    value={slider.text}
                    onChange={e => updateSliderText(idx, e.target.value)}
                    placeholder="Text shown on slider"
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:border-primary text-sm"
                  />
                </div>
              ))}
            </div>
            <button onClick={saveSliders} disabled={sliderUploading} className="btn-primary text-sm disabled:opacity-50">
              {sliderUploading ? 'Uploading...' : 'Save All Sliders'}
            </button>
          </>
        )}

        {section === 'products' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="font-display text-2xl">Products</h1>
              <button onClick={() => { setEditProduct(null); setImagePreview(''); setProductImages([]); setProductVideo(''); setProductFeatures([]); setShowProductModal(true) }} className="btn-primary text-sm">+ Add Product</button>
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead><tr className="bg-gray-50 text-left text-xs uppercase text-gray-500"><th className="p-3">#</th><th className="p-3">Image</th><th className="p-3">Name</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Qty</th><th className="p-3">Actions</th></tr></thead>
                <tbody>
                  {products.map((p, idx) => (
                    <tr key={p.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 text-xs text-gray-400">{idx + 1}</td>
                      <td className="p-3"><img src={p.image} className="w-10 h-10 rounded-lg object-cover" onError={e => (e.currentTarget.src = 'https://via.placeholder.com/40')} /></td>
                      <td className="p-3 font-semibold">{p.name}</td>
                      <td className="p-3">{p.category}</td>
                      <td className="p-3">₹{p.price} <span className="text-gray-400 line-through text-xs">₹{p.originalPrice}</span></td>
                      <td className="p-3"><span className={p.quantity > 0 ? 'text-primary font-bold' : 'text-red-500 font-bold'}>{p.quantity ?? 0}</span></td>
                      <td className="p-3 flex gap-1">
                        <button onClick={() => moveProduct(p.id, 'up')} className="px-1.5 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200" title="Move Up">⬆️</button>
                        <button onClick={() => moveProduct(p.id, 'down')} className="px-1.5 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200" title="Move Down">⬇️</button>
                        <button onClick={() => { setEditProduct(p); setImagePreview(''); setProductImages(p.images || []); setProductVideo(p.video || ''); setProductFeatures(p.features || []); setShowProductModal(true) }} className="px-2 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200">✏️</button>
                        <button onClick={() => deleteProduct(p.id)} className="px-2 py-1 bg-gray-100 rounded text-xs hover:bg-red-100 hover:text-red-600">🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {section === 'orders' && (
          <>
            <h1 className="font-display text-2xl mb-6">Orders ({orders.length})</h1>
            <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead><tr className="bg-gray-50 text-left text-xs uppercase text-gray-500"><th className="p-3">#</th><th className="p-3">Date</th><th className="p-3">Customer</th><th className="p-3">Items</th><th className="p-3">Total</th><th className="p-3">Payment</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">#{o.id}</td>
                      <td className="p-3 text-xs text-gray-500 whitespace-nowrap">{(o.created_at || o.date) ? new Date(o.created_at || o.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + '\n' + new Date(o.created_at || o.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="p-3"><div className="font-semibold">{o.customerName}</div><div className="text-xs text-gray-400">{o.customerPhone}</div></td>
                      <td className="p-3 text-xs">{(Array.isArray(o.items) ? o.items : []).map((i: any) => `${i.name} ×${i.qty}`).join(', ')}</td>
                      <td className="p-3 font-bold">₹{o.total?.toLocaleString()}</td>
                      <td className="p-3">{o.payment}</td>
                      <td className="p-3">
                        <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)} className="text-xs px-2 py-1 border rounded-lg">
                          {['Pending', 'Confirmed', 'Shipped', 'Dispatched', 'Delivered', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="p-3 flex gap-1 flex-wrap">
                        <button onClick={() => printInvoice(o)} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100" title="Print Invoice">🧾 Invoice</button>
                        <button onClick={() => printLabel(o)} className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs hover:bg-green-100" title="Print Label">🏷️ Label</button>
                        <button onClick={() => deleteOrder(o.id)} className="px-2 py-1 bg-gray-100 rounded text-xs hover:bg-red-100">🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {section === 'categories' && (
          <>
            <h1 className="font-display text-2xl mb-6">Categories</h1>
            <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
              <form onSubmit={addCategory} className="flex gap-3 items-end">
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">Emoji</label><input name="emoji" placeholder="🌰" className="w-20 px-3 py-2.5 border rounded-lg outline-none focus:border-primary" /></div>
                <div className="flex-1"><label className="text-xs font-semibold text-gray-500 block mb-1">Name</label><input name="name" required placeholder="Category name" className="w-full px-4 py-2.5 border rounded-lg outline-none focus:border-primary" /></div>
                <button type="submit" className="btn-primary text-sm">+ Add</button>
              </form>
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-left text-xs uppercase text-gray-500"><th className="p-3">Emoji</th><th className="p-3">Name</th><th className="p-3">Actions</th></tr></thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.id} className="border-t hover:bg-gray-50">
                      {editCategory?.id === c.id ? (
                        <td colSpan={3} className="p-3">
                          <form onSubmit={saveCategory} className="flex gap-2 items-center">
                            <input name="emoji" defaultValue={c.emoji || ''} placeholder="🌰" className="w-16 px-2 py-1.5 border rounded-lg outline-none focus:border-primary text-sm" />
                            <input name="name" required defaultValue={c.name} className="flex-1 px-3 py-1.5 border rounded-lg outline-none focus:border-primary text-sm" />
                            <button type="submit" className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-dark">Save</button>
                            <button type="button" onClick={() => setEditCategory(null)} className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs hover:bg-gray-200">Cancel</button>
                          </form>
                        </td>
                      ) : (
                        <>
                          <td className="p-3 text-xl">{c.emoji || '—'}</td>
                          <td className="p-3 font-semibold">{c.name}</td>
                          <td className="p-3 flex gap-2">
                            <button onClick={() => setEditCategory(c)} className="px-2 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200">✏️</button>
                            <button onClick={() => deleteCategory(c.id)} className="px-2 py-1 bg-gray-100 rounded text-xs hover:bg-red-100">🗑</button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {section === 'users' && (
          <>
            <h1 className="font-display text-2xl mb-6">Users ({users.length})</h1>

            {selectedUser ? (
              <div className="bg-white rounded-xl shadow-sm p-5">
                <button onClick={() => setSelectedUser(null)} className="text-primary text-sm font-semibold mb-4">← Back to Users</button>
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* User Info */}
                  <div className="sm:w-1/3">
                    <div className="bg-gray-50 rounded-xl p-5">
                      <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold mb-3">{selectedUser.name?.charAt(0)?.toUpperCase()}</div>
                      <h3 className="font-bold text-lg">{selectedUser.name}</h3>
                      <p className="text-sm text-gray-500">{selectedUser.email}</p>
                      <p className="text-sm text-gray-500">{selectedUser.phone || '—'}</p>
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs font-bold uppercase text-gray-400 mb-1">Address</p>
                        <p className="text-sm">{selectedUser.address || '—'}</p>
                        <p className="text-sm">{selectedUser.city || ''}{selectedUser.pincode ? ` — ${selectedUser.pincode}` : ''}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs font-bold uppercase text-gray-400 mb-1">Total Spending</p>
                        <p className="text-2xl font-bold text-primary">₹{userOrders.reduce((s: number, o: any) => s + (o.total || 0), 0).toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{userOrders.length} orders placed</p>
                      </div>
                      <div className="mt-4 pt-4 border-t flex gap-2">
                        <button onClick={() => toggleBlockUser(selectedUser.id, selectedUser.blocked)} className={`flex-1 py-2 rounded-lg text-xs font-bold ${selectedUser.blocked ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                          {selectedUser.blocked ? '✅ Unblock User' : '🚫 Block User'}
                        </button>
                        <button onClick={() => { deleteUser(selectedUser.id); setSelectedUser(null) }} className="flex-1 py-2 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200">🗑 Delete</button>
                      </div>
                    </div>
                  </div>

                  {/* Order History */}
                  <div className="sm:w-2/3">
                    <h3 className="font-semibold mb-3">📦 Order History</h3>
                    {userOrders.length === 0 ? (
                      <p className="text-gray-400 text-sm">No orders yet.</p>
                    ) : (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto">
                        {userOrders.map((o: any) => (
                          <div key={o.id} className="border rounded-xl p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-sm">#{o.id}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-primary">₹{o.total?.toLocaleString()}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${o.status === 'Delivered' ? 'bg-green-100 text-green-700' : o.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{o.status || 'Pending'}</span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {(Array.isArray(o.items) ? o.items : []).map((i: any) => `${i.name} ×${i.qty}`).join(', ')}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">{(o.date || o.created_at) ? new Date(o.date || o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} • {o.payment}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead><tr className="bg-gray-50 text-left text-xs uppercase text-gray-500"><th className="p-3">ID</th><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Phone</th><th className="p-3">City</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className={`border-t hover:bg-gray-50 ${u.blocked ? 'bg-red-50/50' : ''}`}>
                        <td className="p-3">#{u.id}</td>
                        <td className="p-3 font-semibold">{u.name}</td>
                        <td className="p-3">{u.email}</td>
                        <td className="p-3">{u.phone || '—'}</td>
                        <td className="p-3">{u.city || '—'}</td>
                        <td className="p-3">
                          {u.blocked ? <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">Blocked</span> : <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">Active</span>}
                        </td>
                        <td className="p-3 flex gap-1">
                          <button onClick={() => viewUserDetails(u)} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100">👁 View</button>
                          <button onClick={() => toggleBlockUser(u.id, u.blocked)} className={`px-2 py-1 rounded text-xs ${u.blocked ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>{u.blocked ? '✅' : '🚫'}</button>
                          <button onClick={() => deleteUser(u.id)} className="px-2 py-1 bg-gray-100 rounded text-xs hover:bg-red-100">🗑</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Product Modal */}
        {showProductModal && (
          <div className="modal-overlay open">
            <div className="bg-white rounded-xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto">
              <h2 className="font-display text-xl mb-5">{editProduct ? 'Edit Product' : 'Add Product'}</h2>
              <form onSubmit={saveProduct} className="space-y-3">
                <input name="name" required placeholder="Product Name" defaultValue={editProduct?.name || ''} className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary" />
                <div className="grid grid-cols-2 gap-3">
                  <select name="category" required defaultValue={editProduct?.category || ''} className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary">
                    {categories.map(c => <option key={c.id} value={c.name}>{c.emoji} {c.name}</option>)}
                  </select>
                  <input name="weight" required placeholder="Weight (e.g. 500g)" defaultValue={editProduct?.weight || ''} className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input name="price" type="number" required placeholder="Selling Price" defaultValue={editProduct?.price || ''} className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary" />
                  <input name="originalPrice" type="number" required placeholder="Original Price" defaultValue={editProduct?.originalPrice || ''} className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Main Image (Thumbnail)</label>
                  {(imagePreview || editProduct?.image) && <img src={imagePreview || editProduct?.image} className="w-20 h-20 rounded-lg object-cover mb-2" />}
                  <input id="mainImage" type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) setImagePreview(URL.createObjectURL(f)) }} className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-semibold file:cursor-pointer" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Gallery Images (max 5)</label>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {productImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img src={img} className="w-16 h-16 rounded-lg object-cover" />
                        <button type="button" onClick={() => setProductImages(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center">×</button>
                      </div>
                    ))}
                  </div>
                  {productImages.length < 5 && (
                    <input type="file" accept="image/*" multiple onChange={async e => {
                      const files = e.target.files
                      if (!files?.length) return
                      const remaining = 5 - productImages.length
                      setUploading(true)
                      const urls: string[] = []
                      for (let i = 0; i < Math.min(files.length, remaining); i++) {
                        const fd = new FormData(); fd.append('file', files[i])
                        const res = await fetch('/api/upload', { method: 'POST', body: fd })
                        const data = await res.json()
                        if (data.url) urls.push(data.url)
                      }
                      setProductImages(prev => [...prev, ...urls].slice(0, 5))
                      setUploading(false)
                      e.target.value = ''
                    }} className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-semibold file:cursor-pointer" />
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">{productImages.length}/5 images uploaded</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Product Video (optional)</label>
                  {productVideo && (
                    <div className="relative mb-2 inline-block">
                      <video src={productVideo} className="w-32 h-20 rounded-lg object-cover" />
                      <button type="button" onClick={() => setProductVideo('')} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">×</button>
                    </div>
                  )}
                  {!productVideo && (
                    <input type="file" accept="video/*" onChange={async e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setUploading(true)
                      const fd = new FormData(); fd.append('file', file)
                      const res = await fetch('/api/upload', { method: 'POST', body: fd })
                      const data = await res.json()
                      if (data.url) setProductVideo(data.url)
                      setUploading(false)
                      e.target.value = ''
                    }} className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-semibold file:cursor-pointer" />
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">Upload one video to showcase the product.</p>
                </div>
                <textarea name="description" placeholder="Description" defaultValue={editProduct?.description || ''} className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary resize-none h-16" />
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Features (one per line)</label>
                  <textarea
                    value={productFeatures.join('\n')}
                    onChange={e => setProductFeatures(e.target.value.split('\n'))}
                    placeholder={"e.g.\nPremium quality\n100% Natural"}
                    className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary resize-none h-20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input name="rating" type="number" step="0.1" min="1" max="5" placeholder="Rating" defaultValue={editProduct?.rating || 4.5} className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary" />
                  <input name="quantity" type="number" min="0" placeholder="Stock Qty" defaultValue={editProduct?.quantity || 0} className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={uploading} className="flex-1 btn-primary disabled:opacity-50">{uploading ? 'Uploading...' : 'Save Product'}</button>
                  <button type="button" onClick={() => { setShowProductModal(false); setEditProduct(null); setProductImages([]); setProductFeatures([]) }} className="btn-secondary">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
