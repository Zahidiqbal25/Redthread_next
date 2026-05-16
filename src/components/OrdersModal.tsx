'use client'
import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store-context'

export default function OrdersModal({ onClose }: { onClose: () => void }) {
  const { user, showToast } = useStore()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<number | null>(null)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    function fetchOrders() {
      fetch(`/api/users/${user!.id}/orders`)
        .then(r => r.json())
        .then(data => { 
          if (Array.isArray(data)) setOrders(data)
          else setOrders([])
          setLoading(false) 
        })
        .catch(() => { setOrders([]); setLoading(false) })
    }
    fetchOrders()
    const interval = setInterval(fetchOrders, 10000)
    return () => clearInterval(interval)
  }, [user])

  async function cancelOrder(id: number) {
    if (!confirm('Are you sure you want to cancel this order?')) return
    setCancelling(id)
    const res = await fetch(`/api/orders/${id}/cancel`, { method: 'PUT' })
    const data = await res.json()
    setCancelling(null)
    if (res.ok) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'Cancelled' } : o))
      showToast('Order cancelled successfully')
    } else {
      showToast('❌ ' + data.error)
    }
  }

  return (
    <div className="modal-overlay open" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-none md:rounded-xl w-full md:max-w-2xl max-h-screen md:max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-primary-dark to-primary text-white rounded-t-xl shrink-0">
          <h2 className="font-display text-lg">📦 My Orders</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {loading ? (
            <p className="text-center text-gray-400 py-10">Loading orders...</p>
          ) : !user ? (
            <p className="text-center text-gray-400 py-10">Please log in to view your orders.</p>
          ) : orders.length === 0 ? (
            <p className="text-center text-gray-400 py-10">No orders yet.</p>
          ) : orders.map(order => (
            <div key={order.id} className="border-2 rounded-xl overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 py-3 bg-gray-50 border-b gap-2">
                <div>
                  <span className="font-bold text-sm text-primary-dark">Order #{order.id}</span>
                  <span className="block sm:inline text-xs text-gray-500 sm:ml-3 mt-1 sm:mt-0">📅 {(order.created_at || order.date) ? new Date(order.created_at || order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' • ' + new Date(order.created_at || order.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-primary">₹{order.total?.toLocaleString()}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {order.status || 'Pending'}
                  </span>
                  {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                    <button
                      onClick={() => cancelOrder(order.id)}
                      disabled={cancelling === order.id}
                      className="text-xs px-2 py-1 rounded-full border-2 border-red-300 text-red-500 hover:bg-red-50 font-semibold disabled:opacity-50"
                    >
                      {cancelling === order.id ? '...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
              <div className="divide-y">
                {(order.items || []).map((item: any, i: number) => (
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
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
