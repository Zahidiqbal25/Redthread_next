'use client'
import { useState } from 'react'

export default function TrackOrderModal({ onClose }: { onClose: () => void }) {
  const [phone, setPhone] = useState('')
  const [orders, setOrders] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    const res = await fetch(`/api/orders/track/${phone.trim()}`, { cache: 'no-store' })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    if (!data.length) { setError('No orders found for this phone number.'); return }
    setOrders(data)
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
          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="tel" required value={phone} onChange={e => { setPhone(e.target.value); setOrders(null); setError('') }}
              placeholder="Enter your registered phone number"
              className="flex-1 px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary text-sm"
            />
            <button type="submit" disabled={loading} className="btn-primary text-sm px-5">
              {loading ? '...' : 'Track'}
            </button>
          </form>

          {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

          {orders && (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="border-2 rounded-xl overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 py-3 bg-gray-50 border-b gap-2">
                    <div>
                      <span className="font-bold text-sm text-primary-dark">Order #{order.id}</span>
                      <span className="text-xs text-gray-400 ml-3">{order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
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
