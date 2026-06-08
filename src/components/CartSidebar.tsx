'use client'
import { useStore } from '@/lib/store-context'

export default function CartSidebar({ onCheckout, onLogin }: { onCheckout: () => void; onLogin?: () => void }) {
  const { cart, user, updateQty, removeFromCart, showToast } = useStore()
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const count = cart.reduce((s, i) => s + i.qty, 0)

  const close = () => {
    document.getElementById('cartSidebar')?.classList.add('translate-x-full')
    document.getElementById('cartSidebar')?.classList.remove('translate-x-0')
    document.getElementById('cartOverlay')?.classList.add('hidden')
  }

  function handleCheckout() {
    if (!user) {
      close()
      if (onLogin) onLogin()
      else showToast('Please login to proceed to checkout')
      return
    }
    close()
    onCheckout()
  }

  return (
    <>
      <div id="cartOverlay" className="hidden fixed inset-0 bg-black/50 z-[200]" onClick={close} />
      <div id="cartSidebar" className="fixed top-0 right-0 w-[400px] max-w-[90vw] h-screen bg-white z-[201] transform translate-x-full transition-transform duration-300 flex flex-col shadow-2xl">
        <div className="p-5 bg-gradient-to-r from-primary-dark to-primary flex justify-between items-center shrink-0">
          <h2 className="font-display text-xl text-white">🛒 Your Cart</h2>
          <button onClick={close} className="w-8 h-8 rounded-full bg-white/10 text-white/80 flex items-center justify-center hover:bg-white/20">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!cart.length ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <span className="text-5xl mb-4">🛒</span>
              <p className="font-semibold">Your cart is empty</p>
              <button onClick={close} className="mt-4 btn-primary text-sm">Continue Shopping</button>
            </div>
          ) : cart.map(item => (
            <div key={item.id} className="flex gap-3 py-3 border-b border-gray-100 relative">
              <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover border" onError={e => (e.currentTarget.src = 'https://via.placeholder.com/64')} />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold truncate">{item.name}</h4>
                <p className="text-xs text-gray-500">{item.weight}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 text-primary font-bold hover:bg-primary hover:text-white transition-colors">−</button>
                    <span className="w-7 text-center text-sm font-bold">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 text-primary font-bold hover:bg-primary hover:text-white transition-colors">+</button>
                  </div>
                  <span className="font-bold text-primary">₹{(item.price * item.qty).toLocaleString()}</span>
                </div>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="absolute top-3 right-0 text-gray-400 hover:text-red-500">×</button>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="p-4 border-t bg-gray-50 shrink-0">
            <div className="flex justify-between text-lg font-bold mb-3">
              <span>Total ({count} items)</span>
              <span className="text-primary">₹{total.toLocaleString()}</span>
            </div>
            {total < 999 && <p className="text-xs text-center text-gray-500 mb-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2">Add ₹{999 - total} more for FREE delivery!</p>}
            <button onClick={handleCheckout} className="w-full py-3 bg-gradient-to-r from-primary-dark to-primary-light text-white rounded-xl font-bold shadow-lg hover:-translate-y-0.5 transition-transform">
              {user ? 'Proceed to Checkout' : '🔒 Login to Checkout'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
