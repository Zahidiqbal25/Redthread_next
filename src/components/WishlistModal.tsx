'use client'
import Link from 'next/link'
import { useStore } from '@/lib/store-context'

export default function WishlistModal({ onClose }: { onClose: () => void }) {
  const { wishlist, toggleWishlist, addToCart } = useStore()

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="bg-white rounded-none md:rounded-xl w-full md:max-w-lg h-full md:h-auto md:max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-5 py-4 border-b shrink-0">
          <h2 className="font-display text-lg">❤️ My Wishlist ({wishlist.length})</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {wishlist.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">💝</p>
              <p className="font-semibold">Your wishlist is empty</p>
              <p className="text-sm mt-1">Save products you love for later!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {wishlist.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 border rounded-xl hover:bg-gray-50 transition-colors">
                  <Link href={`/products/${item.id}`} onClick={onClose}>
                    <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover shrink-0" onError={e => (e.currentTarget.src = 'https://via.placeholder.com/64')} />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.id}`} onClick={onClose}>
                      <p className="font-semibold text-sm truncate hover:text-primary">{item.name}</p>
                    </Link>
                    <p className="text-xs text-gray-400">{item.weight} • {item.category}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-primary">₹{item.price}</span>
                      {item.originalPrice > item.price && <span className="text-xs text-gray-400 line-through">₹{item.originalPrice}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button onClick={() => { addToCart(item); toggleWishlist(item) }} className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-light transition-colors">🛒 Add</button>
                    <button onClick={() => toggleWishlist(item)} className="px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">✕ Remove</button>
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
