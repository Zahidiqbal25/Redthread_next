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
  const [sliders, setSliders] = useState<{images: string[], text: string}[]>([
    { images: [], text: '' }, { images: [], text: '' }, { images: [], text: '' }
  ])
  const [sliderUploading, setSliderUploading] = useState(false)
  const [editProduct, setEditProduct] = useState<any>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [imagePreview, setImagePreview] = useState('')
  const [productImages, setProductImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('df_admin') === 'true') setAuthed(true)
  }, [])

  useEffect(() => { if (authed) loadAll() }, [authed])

  async function loadAll() {
    const [s, p, o, c, u, ct, sl] = await Promise.all([
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
      fetch('/api/orders').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
      fetch('/api/settings/contact?t=' + Date.now()).then(r => r.json()),
      fetch('/api/settings/sliders').then(r => r.json()),
    ])
    setStats(s); setProducts(p); setOrders(Array.isArray(o) ? o.sort((a: any, b: any) => b.id - a.id) : []); setCategories(c); setUsers(u); setContact(ct)
    if (sl.sliders?.length) setSliders(sl.sliders)
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
    const body = { name: fd.get('name'), category: fd.get('category'), price: Number(fd.get('price')), originalPrice: Number(fd.get('originalPrice')), weight: fd.get('weight'), description: fd.get('description'), rating: Number(fd.get('rating')) || 4.5, quantity: Number(fd.get('quantity')) || 0, image, images, inStock: Number(fd.get('quantity')) > 0 }

    if (editProduct) await fetch(`/api/products/${editProduct.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    else await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

    setShowProductModal(false); setEditProduct(null); setImagePreview(''); setProductImages([]); loadAll()
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {[['📦', stats.totalProducts, 'Products'], ['🧾', stats.totalOrders, 'Orders'], ['💰', `₹${(stats.revenue || 0).toLocaleString()}`, 'Revenue'], ['⏳', stats.pending, 'Pending']].map(([icon, val, label]) => (
                <div key={label as string} className="bg-white p-6 rounded-xl shadow-sm"><span className="text-2xl">{icon}</span><div className="text-2xl font-bold text-primary mt-2">{val}</div><div className="text-sm text-gray-500">{label}</div></div>
              ))}
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
              <button onClick={() => { setEditProduct(null); setImagePreview(''); setProductImages([]); setShowProductModal(true) }} className="btn-primary text-sm">+ Add Product</button>
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
                        <button onClick={() => { setEditProduct(p); setImagePreview(''); setProductImages(p.images || []); setShowProductModal(true) }} className="px-2 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200">✏️</button>
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
            <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead><tr className="bg-gray-50 text-left text-xs uppercase text-gray-500"><th className="p-3">ID</th><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Phone</th><th className="p-3">City</th><th className="p-3">Actions</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">#{u.id}</td>
                      <td className="p-3 font-semibold">{u.name}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">{u.phone || '—'}</td>
                      <td className="p-3">{u.city || '—'}</td>
                      <td className="p-3"><button onClick={() => deleteUser(u.id)} className="px-2 py-1 bg-gray-100 rounded text-xs hover:bg-red-100">🗑</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Gallery Images (for Product Detail Page)</label>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {productImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img src={img} className="w-16 h-16 rounded-lg object-cover" />
                        <button type="button" onClick={() => setProductImages(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center">×</button>
                      </div>
                    ))}
                  </div>
                  <input type="file" accept="image/*" multiple onChange={async e => {
                    const files = e.target.files
                    if (!files?.length) return
                    setUploading(true)
                    const urls: string[] = []
                    for (let i = 0; i < files.length; i++) {
                      const fd = new FormData(); fd.append('file', files[i])
                      const res = await fetch('/api/upload', { method: 'POST', body: fd })
                      const data = await res.json()
                      if (data.url) urls.push(data.url)
                    }
                    setProductImages(prev => [...prev, ...urls])
                    setUploading(false)
                    e.target.value = ''
                  }} className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-semibold file:cursor-pointer" />
                  <p className="text-[10px] text-gray-400 mt-1">Upload multiple images for the product gallery. These will be shown on the product detail page.</p>
                </div>
                <textarea name="description" placeholder="Description" defaultValue={editProduct?.description || ''} className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary resize-none h-16" />
                <div className="grid grid-cols-2 gap-3">
                  <input name="rating" type="number" step="0.1" min="1" max="5" placeholder="Rating" defaultValue={editProduct?.rating || 4.5} className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary" />
                  <input name="quantity" type="number" min="0" placeholder="Stock Qty" defaultValue={editProduct?.quantity || 0} className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={uploading} className="flex-1 btn-primary disabled:opacity-50">{uploading ? 'Uploading...' : 'Save Product'}</button>
                  <button type="button" onClick={() => { setShowProductModal(false); setEditProduct(null); setProductImages([]) }} className="btn-secondary">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
