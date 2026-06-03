'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store-context'

export default function CheckoutModal({ onClose }: { onClose: () => void }) {
  const { cart, user, clearCart, showToast } = useStore()
  const [payment, setPayment] = useState('COD')
  const [loading, setLoading] = useState(false)
  const [guestOtp, setGuestOtp] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [pendingData, setPendingData] = useState<any>(null)

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const shipping = subtotal >= 999 ? 0 : 50
  const total = subtotal + shipping

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!cart.length) return
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const customer = { name: fd.get('name') as string, phone: fd.get('phone') as string, email: fd.get('email') as string, address: fd.get('address') as string, city: fd.get('city') as string, pincode: fd.get('pincode') as string }

    if (!user) {
      const res = await fetch('/api/orders/send-guest-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: customer.email }) })
      setLoading(false)
      if (!res.ok) { const d = await res.json(); showToast('❌ ' + d.error); return }
      setPendingData({ customer, total, payment })
      setGuestOtp(true)
      return
    }

    await placeOrder(customer, payment)
  }

  async function handleGuestVerify(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/orders/verify-guest-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: pendingData.customer.email, code: otpCode }) })
    if (!res.ok) { const d = await res.json(); showToast('❌ ' + d.error); setLoading(false); return }
    await placeOrder(pendingData.customer, pendingData.payment)
  }

  async function placeOrder(customer: any, payMethod: string) {
    if (payMethod === 'Razorpay') {
      if (!(window as any).Razorpay) {
        showToast('❌ Payment gateway is loading. Please try again.')
        setLoading(false)
        return
      }
      try {
        const rzpOrder = await fetch('/api/payments/create-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: total }) }).then(r => r.json())
        if (rzpOrder.error) throw new Error(rzpOrder.error)

        const cartSnapshot = [...cart]
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: rzpOrder.amount, currency: rzpOrder.currency,
          name: 'Valenuts', order_id: rzpOrder.id,
          prefill: { name: customer.name, email: customer.email, contact: customer.phone },
          theme: { color: '#2d5016' },
          handler: async (response: any) => {
            try {
              const verify = await fetch('/api/payments/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(response) }).then(r => r.json())
              if (verify.verified) {
                const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user?.id || 0, customer, items: cartSnapshot, total, payment: 'Razorpay', paymentId: response.razorpay_payment_id }) })
                const order = await res.json()
                if (res.ok) {
                  clearCart()
                  onClose()
                  showToast(`🎉 Order placed successfully! Order #${order.id}`)
                } else {
                  showToast('❌ Order failed: ' + (order.error || 'Unknown error'))
                }
              } else {
                showToast('❌ Payment verification failed')
              }
            } catch (err: any) {
              showToast('❌ Error processing payment: ' + err.message)
            }
            setLoading(false)
          },
          modal: { ondismiss: () => { setLoading(false) } },
        }
        const rzp = new (window as any).Razorpay(options)
        rzp.on('payment.failed', () => { showToast('❌ Payment failed. Please try again.'); setLoading(false) })
        rzp.open()
        return
      } catch (err: any) { showToast('❌ ' + err.message); setLoading(false); return }
    }

    await finalizeOrder(customer, 'COD', '')
  }

  async function finalizeOrder(customer: any, payMethod: string, paymentId: string) {
    const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user?.id || 0, customer, items: cart, total, payment: payMethod, paymentId }) })
    const order = await res.json()
    setLoading(false)
    clearCart()
    onClose()
    showToast(`🎉 Order placed successfully! Order #${order.id}`)
  }

  if (guestOtp) {
    return (
      <div className="modal-overlay open" onClick={onClose}>
        <div className="bg-white rounded-none md:rounded-xl w-full md:max-w-md p-6 md:p-8" onClick={e => e.stopPropagation()}>
          <h2 className="font-display text-xl mb-2">📧 Verify Email</h2>
          <p className="text-sm text-gray-500 mb-5">Enter the code sent to <strong>{pendingData?.customer.email}</strong></p>
          <form onSubmit={handleGuestVerify}>
            <input type="text" value={otpCode} onChange={e => setOtpCode(e.target.value)} maxLength={6} placeholder="6-digit code" className="w-full px-4 py-3 border-2 rounded-lg text-center text-2xl font-bold tracking-[12px] mb-4 outline-none focus:border-primary" />
            <button type="submit" disabled={loading} className="w-full btn-primary">{loading ? 'Verifying...' : 'Verify & Place Order'}</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="bg-white rounded-none md:rounded-2xl max-w-4xl w-full h-full md:h-auto md:max-h-[92vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-5 md:px-7 py-4 md:py-5 bg-gradient-to-r from-primary-dark to-primary text-white shrink-0">
          <div><h2 className="font-display text-lg md:text-xl">🛒 Checkout</h2><p className="text-xs opacity-75 mt-0.5">Complete your order</p></div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 text-white/80 flex items-center justify-center hover:bg-white/20">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-[1fr_300px]">
          <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-primary border-b-2 pb-2">👤 Contact Information</p>
            <input name="name" required placeholder="Full Name" defaultValue={user?.name || ''} className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input name="phone" required placeholder="Phone" defaultValue={user?.phone || ''} className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary" />
              <input name="email" type="email" required placeholder="Email" defaultValue={user?.email || ''} className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary" />
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-primary border-b-2 pb-2 pt-2">📍 Delivery Address</p>
            <textarea name="address" required placeholder="Street Address" defaultValue={user?.address || ''} className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary resize-none h-16" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input name="city" required placeholder="City" defaultValue={user?.city || ''} className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary" />
              <input name="pincode" required placeholder="Pincode" defaultValue={user?.pincode || ''} className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary" />
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-primary border-b-2 pb-2 pt-2">💳 Payment Method</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={`flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all ${payment === 'COD' ? 'border-primary bg-green-50' : 'border-gray-200 hover:border-primary-light'}`}>
                <input type="radio" name="payment" value="COD" checked={payment === 'COD'} onChange={() => setPayment('COD')} className="hidden" />
                <span className="text-2xl">💵</span>
                <div><div className="font-bold text-sm">Cash on Delivery</div><div className="text-xs text-gray-400">Pay when delivered</div></div>
              </label>
              <label className="flex items-center gap-3 p-3.5 border-2 rounded-xl border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed">
                <input type="radio" name="payment" disabled className="hidden" />
                <span className="text-2xl">💳</span>
                <div><div className="font-bold text-sm">Pay Online</div><div className="text-xs text-gray-400">Coming soon</div></div>
              </label>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-primary-dark to-primary-light text-white rounded-xl font-bold text-lg shadow-lg hover:-translate-y-0.5 transition-transform disabled:bg-gray-400 disabled:transform-none">
              {loading ? 'Processing...' : 'Place Order →'}
            </button>
          </form>

          <div className="bg-gray-50 border-t md:border-t-0 md:border-l p-4 md:p-5 overflow-y-auto">
            <p className="text-xs font-bold uppercase tracking-wider text-primary border-b-2 pb-2 mb-3">🛒 Order Summary</p>
            {cart.map(i => (
              <div key={i.id} className="flex items-center gap-2.5 py-2.5 border-b border-gray-200">
                <img src={i.image} alt={i.name} className="w-10 h-10 rounded-lg object-cover" onError={e => (e.currentTarget.src = 'https://via.placeholder.com/40')} />
                <div className="flex-1 min-w-0"><p className="text-xs font-semibold truncate">{i.name}</p><p className="text-[0.7rem] text-gray-400">{i.weight} × {i.qty}</p></div>
                <span className="text-sm font-bold text-primary">₹{(i.price * i.qty).toLocaleString()}</span>
              </div>
            ))}
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-gray-500"><span>Shipping</span><span className={shipping === 0 ? 'text-green-600 font-bold' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
              <div className="flex justify-between font-bold text-lg border-t-2 pt-2 mt-2"><span>Total</span><span className="text-primary">₹{total.toLocaleString()}</span></div>
            </div>
            <p className="text-center text-[0.7rem] text-gray-400 mt-4">🔒 Secure checkout • 🚚 Fast delivery</p>
          </div>
        </div>
      </div>
    </div>
  )
}
