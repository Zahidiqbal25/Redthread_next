'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { StoreProvider, useStore } from '@/lib/store-context'
import ProductCard from '@/components/ProductCard'
import CartSidebar from '@/components/CartSidebar'
import CheckoutModal from '@/components/CheckoutModal'
import AuthModal from '@/components/AuthModal'

function ProductDetail({ product, relatedProducts }: { product: any; relatedProducts: any[] }) {
  const { addToCart, showToast, setOnRequireAuth, toggleWishlist, isInWishlist } = useStore()
  const [qty, setQty] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null)

  useEffect(() => {
    setOnRequireAuth(() => { setAuthMode('register') })
  }, [])

  const discount = Math.round((1 - product.price / product.originalPrice) * 100)
  const outOfStock = !product.inStock && product.quantity <= 0
  const images = product.images?.length ? product.images : [product.image]

  function handleAddToCart() {
    if (outOfStock) return
    for (let i = 0; i < qty; i++) addToCart(product)
  }

  function handleBuyNow() {
    if (outOfStock) return
    for (let i = 0; i < qty; i++) addToCart(product)
    const e = document.getElementById('cartSidebar')
    e?.classList.remove('translate-x-full')
    e?.classList.add('translate-x-0')
    document.getElementById('cartOverlay')?.classList.remove('hidden')
  }

  const imgSrc = (img: string) => img && img.startsWith('http') ? img : `https://via.placeholder.com/600x400?text=${encodeURIComponent(product.name)}`

  return (
    <>
      <CartSidebar onCheckout={() => setCheckoutOpen(true)} onLogin={() => setAuthMode('login')} />
      {checkoutOpen && <CheckoutModal onClose={() => setCheckoutOpen(false)} />}
      {authMode && <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onSwitch={setAuthMode} />}

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
        <nav className="text-xs md:text-sm text-gray-500">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-400">{product.category}</span>
          <span className="mx-2">›</span>
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>
      </div>

      {/* Product Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-24 md:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">

          {/* Image Gallery */}
          <div>
            <div className="relative rounded-2xl overflow-hidden bg-gray-50 aspect-square group/img">
              {discount > 0 && <span className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold z-10 shadow">{discount}% OFF</span>}
              <img
                src={imgSrc(images[selectedImage])}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={e => (e.currentTarget.src = `https://via.placeholder.com/600x400?text=${encodeURIComponent(product.name)}`)}
              />
              {images.length > 1 && (
                <>
                  <button onClick={() => setSelectedImage(i => (i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/80 shadow-lg text-gray-700 flex items-center justify-center hover:bg-white transition opacity-0 group-hover/img:opacity-100">‹</button>
                  <button onClick={() => setSelectedImage(i => (i + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/80 shadow-lg text-gray-700 flex items-center justify-center hover:bg-white transition opacity-0 group-hover/img:opacity-100">›</button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_: string, i: number) => (
                      <button key={i} onClick={() => setSelectedImage(i)} className={`w-2 h-2 rounded-full transition-all ${i === selectedImage ? 'bg-primary w-5' : 'bg-white/70'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {images.map((img: string, i: number) => (
                  <button key={i} onClick={() => setSelectedImage(i)} className={`shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-primary shadow-md' : 'border-gray-200 opacity-70 hover:opacity-100'}`}>
                    <img src={imgSrc(img)} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.src = 'https://via.placeholder.com/80')} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <p className="text-xs md:text-sm text-primary font-bold uppercase tracking-wider">{product.category}</p>
            <div className="flex items-start justify-between gap-2 mt-2">
              <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">{product.name}</h1>
              <button onClick={() => toggleWishlist(product)} className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isInWishlist(product.id) ? 'border-red-200 bg-red-50 text-red-500' : 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400'}`}>
                {isInWishlist(product.id) ? '❤️' : '🩶'}
              </button>
            </div>

            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(s => (
                    <span key={s} className={`text-sm ${s <= Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                  ))}
                </div>
                <span className="text-sm text-gray-500">{product.rating}/5</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mt-4">
              <span className="text-3xl md:text-4xl font-bold text-primary">₹{product.price}</span>
              {product.originalPrice > product.price && (
                <>
                  <span className="text-lg text-gray-400 line-through">₹{product.originalPrice}</span>
                  <span className="text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Save ₹{product.originalPrice - product.price}</span>
                </>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mt-5">
                <h3 className="text-sm font-bold text-gray-700 mb-1">Description</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Specifications */}
            <div className="mt-5">
              <h3 className="text-sm font-bold text-gray-700 mb-2">Specifications</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-50 px-3 py-2 rounded-lg"><span className="text-gray-400">Weight</span><p className="font-semibold">{product.weight}</p></div>
                <div className="bg-gray-50 px-3 py-2 rounded-lg"><span className="text-gray-400">Category</span><p className="font-semibold">{product.category}</p></div>
                <div className="bg-gray-50 px-3 py-2 rounded-lg"><span className="text-gray-400">Rating</span><p className="font-semibold">{product.rating || 'N/A'}/5</p></div>
                <div className="bg-gray-50 px-3 py-2 rounded-lg"><span className="text-gray-400">Stock</span><p className={`font-semibold ${outOfStock ? 'text-red-500' : 'text-green-600'}`}>{outOfStock ? 'Out of Stock' : `${product.quantity} available`}</p></div>
              </div>
            </div>

            {/* Features */}
            {product.features?.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-bold text-gray-700 mb-2">Features</h3>
                <ul className="space-y-1.5">
                  {product.features.map((f: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quantity + Buttons (Desktop) */}
            <div className="hidden md:block mt-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 text-lg font-bold text-primary hover:bg-gray-50 transition-colors">−</button>
                  <span className="w-12 text-center font-bold">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.quantity || 99, q + 1))} className="w-10 h-10 text-lg font-bold text-primary hover:bg-gray-50 transition-colors">+</button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={outOfStock}
                  className="flex-1 py-3.5 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl font-bold text-base shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {outOfStock ? 'Out of Stock' : '🛒 Add to Cart'}
                </button>
              </div>
              <button
                onClick={handleBuyNow}
                disabled={outOfStock}
                className="w-full mt-3 py-3.5 bg-accent text-primary-dark rounded-xl font-bold text-base shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none"
              >
                {outOfStock ? 'Unavailable' : '⚡ Buy Now'}
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t">
              {(product.trust_badges?.length > 0 ? product.trust_badges : [
                { icon: '🚚', title: 'Free Delivery', desc: 'On orders above ₹999' },
                { icon: '🔄', title: 'Easy Returns', desc: '7-day return policy' },
                { icon: '✅', title: '100% Authentic', desc: 'Quality guaranteed' },
                { icon: '📦', title: 'Secure Packing', desc: 'Freshness sealed' },
              ]).map((badge: any, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-lg">{badge.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-gray-800">{badge.title}</p>
                    <p className="text-[10px] text-gray-400">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12 border-t pt-8">
          <h2 className="font-display text-xl md:text-2xl text-primary-dark mb-4">Customer Reviews</h2>
          {product.rating ? (
            <div className="flex items-center gap-4 mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">{product.rating}</div>
                <div className="flex mt-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <span key={s} className={`text-sm ${s <= Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">Overall Rating</p>
              </div>
              <div className="flex-1 space-y-1">
                {[5, 4, 3, 2, 1].map(star => {
                  const pct = star === Math.round(product.rating) ? 60 : star === Math.round(product.rating) - 1 ? 25 : star === Math.round(product.rating) + 1 ? 10 : 5
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-3">{star}</span>
                      <span className="text-yellow-400 text-xs">★</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No reviews yet for this product.</p>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-xl md:text-2xl text-primary-dark mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </section>

      {/* Sticky Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-3 z-50">
        <div className="flex items-center gap-2">
          <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 text-lg font-bold text-primary">−</button>
            <span className="w-7 text-center font-bold text-sm">{qty}</span>
            <button onClick={() => setQty(q => Math.min(product.quantity || 99, q + 1))} className="w-8 h-8 text-lg font-bold text-primary">+</button>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="flex-1 py-2.5 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl font-bold text-xs shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {outOfStock ? 'Out of Stock' : '🛒 Add'}
          </button>
          <button
            onClick={handleBuyNow}
            disabled={outOfStock}
            className="flex-1 py-2.5 bg-accent text-primary-dark rounded-xl font-bold text-xs shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {outOfStock ? 'N/A' : '⚡ Buy Now'}
          </button>
        </div>
      </div>
    </>
  )
}

export default function ProductDetailClient({ product, relatedProducts }: { product: any; relatedProducts: any[] }) {
  return (
    <StoreProvider>
      <PdpHeader />
      <ProductDetail product={product} relatedProducts={relatedProducts} />
    </StoreProvider>
  )
}

function PdpHeader() {
  const { cart } = useStore()
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  return (
    <header className="bg-primary-dark text-white sticky top-0 z-[100] shadow-md">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        <Link href="/" className="shrink-0"><img src="/logo.png?v=2" alt="Logo" className="h-8 md:h-10 w-auto mix-blend-screen" /></Link>
        <div className="flex items-center gap-2">
          <Link href="/" className="text-sm px-3 py-2 rounded-lg hover:bg-white/10">← Shop</Link>
          <button onClick={() => { const e = document.getElementById('cartSidebar'); e?.classList.toggle('translate-x-0'); e?.classList.toggle('translate-x-full'); document.getElementById('cartOverlay')?.classList.toggle('hidden') }} className="relative text-sm px-3 py-2 rounded-lg hover:bg-white/10">
            🛒 Cart
            {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-accent text-primary-dark text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{cartCount}</span>}
          </button>
        </div>
      </div>
    </header>
  )
}
