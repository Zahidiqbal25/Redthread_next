'use client'
import { useState } from 'react'

export default function TrackOrderModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp' | 'orders'>('email')
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    const res = await fetch('/api/orders/send-guest-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim() }) })
    setLoading(false)
    if (res.ok) setStep('otp')
    else { const d = await res.json(); setError(d.error || 'Failed to send code') }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    const res = await fetch('/api/orders/verify-guest-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim(), code: otp }) })
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Invalid code'); setLoading(false); return }

    // Verified - fetch orders
    const ordersRes = await fetch(`/api/orders/track/${encodeURIComponent(email.trim())}`)
    const data = await ordersRes.json()
    setLoading(false)
    if (Array.isArray(data) && data.length > 0) { setOrders(data); setStep('orders') }
    else setError('No orders found for this email.')
  }

  const statusColor = (s: string) =>
    s === 'Delivered' ? 'bg-green-100 text-green-700' :
    s === 'Cancelled' ? 'bg-red-100 text-red-700' :
    s === 'Shipped' || s === 'Dispatched' ? 'bg-blue-100 text-blue-700' :
    'bg-yellow-100 text-yellow-700'

  return (
    <div className="modal-overlay open" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-none md:rounded-xl w-full md:max-w-2xl max-h-screen md:max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-primary-dark to-primary text-white rounded-t-xl shrink-0">
          <h2 className="font-display text-lg">🚚 Track Order</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">✕</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="max-w-sm mx-auto text-center">
              <p className="text-sm text-gray-500 mb-4">Enter the email you used while placing your order. We'll send a verification code.</p>
              <input
                type="email" required value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="Enter your email"
                className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary text-sm mb-3"
              />
              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
              <button type="submit" disabled={loading} className="w-full btn-primary text-sm">
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="max-w-sm mx-auto text-center">
              <p className="text-sm text-gray-500 mb-4">Enter the 6-digit code sent to <strong>{email}</strong></p>
              <input
                type="text" value={otp} onChange={e => { setOtp(e.target.value); setError('') }}
                maxLength={6} placeholder="6-digit code"
                className="w-full px-4 py-3 border-2 rounded-lg text-center text-2xl font-bold tracking-[12px] mb-3 outline-none focus:border-primary"
              />
              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
              <button type="submit" disabled={loading} className="w-full btn-primary text-sm mb-3">
                {loading ? 'Verifying...' : 'Verify & View Orders'}
              </button>
              <button type="button" onClick={() => { setStep('email'); setOtp(''); setError('') }} className="text-primary text-sm font-semibold">← Change Email</button>
            </form>
          )}

          {step === 'orders' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">Orders for <strong>{email}</strong></p>
              {orders.map(order => (
                <div key={order.id} className="border-2 rounded-xl overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 py-3 bg-gray-50 border-b gap-2">
                    <div>
                      <span className="font-bold text-sm text-primary-dark">Order #{order.id}</span>
                      <span className="text-xs text-gray-400 ml-3">{(order.created_at || order.date) ? new Date(order.created_at || order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-primary">₹{order.total?.toLocaleString()}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusColor(order.status)}`}>
                        {order.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                  <div className="divide-y">
                    {(Array.isArray(order.items) ? order.items : []).map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3">
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" onError={e => (e.currentTarget.src = 'https://via.placeholder.com/48')} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{item.name}</p>
                          <p className="text-xs text-gray-400">{item.weight} × {item.qty}</p>
                        </div>
                        <span className="text-sm font-bold text-primary">₹{(item.price * item.qty).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500 flex gap-4">
                    <span>📍 {order.customerCity || '—'}</span>
                    <span>💳 {order.payment}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
