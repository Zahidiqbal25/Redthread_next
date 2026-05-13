'use client'
import { useState } from 'react'
import Link from 'next/link'
import { StoreProvider, useStore } from '@/lib/store-context'
import ProductCard from '@/components/ProductCard'
import CartSidebar from '@/components/CartSidebar'

function ProductDetail({ product, relatedProducts }: { product: any; relatedProducts: any[] }) {
  const { addToCart, showToast, cart } = useStore()
  const [qty, setQty] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)

  const discount = Math.round((1 - product.price / product.originalPrice) * 100)
  const outOfStock = !product.inStock
  const images = product.images?.length ? product.images : [product.image]

  function handleAddToCart() {
    if (outOfStock) return
    for (let i = 0; i < qty; i++) addToCart(product)
    showToast(`${product.name} × ${qty} added to cart!`)
  }

  const imgSrc = (img: string) => img && img.startsWith('http') ? img : `https://via.placeholder.com/600x400?text=${encodeURIComponent(product.name)}`

  return (
    <>
      <CartSidebar onCheckout={() => {}} />

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
            <div className="relative rounded-2xl overflow-hidden bg-gray-50 aspect-square">
              {discount > 0 && <span className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold z-10 shadow">{discount}% OFF</span>}
              <img
                src={imgSrc(images[selectedImage])}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={e => (e.currentTarget.src = `https://via.placeholder.com/600x400?text=${encodeURIComponent(product.name)}`)}
              />
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
            <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mt-2">{product.name}</h1>

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

            {/* Weight */}
            <div className="mt-4">
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">{product.weight}</span>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mt-5">
                <h3 className="text-sm font-bold text-gray-700 mb-1">Description</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Stock Status */}
            <div className="mt-5">
              {outOfStock ? (
                <span className="text-red-500 font-semibold text-sm">❌ Out of Stock</span>
              ) : (
                <span className="text-green-600 font-semibold text-sm">✅ In Stock ({product.quantity} available)</span>
              )}
            </div>

            {/* Quantity + Add to Cart (Desktop) */}
            <div className="hidden md:flex items-center gap-4 mt-6">
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

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t">
              {[
                ['🚚', 'Free Delivery', 'On orders above ₹999'],
                ['🔄', 'Easy Returns', '7-day return policy'],
                ['✅', '100% Authentic', 'Quality guaranteed'],
                ['📦', 'Secure Packing', 'Freshness sealed'],
              ].map(([icon, title, desc]) => (
                <div key={title} className="flex items-start gap-2">
                  <span className="text-lg">{icon}</span>
                  <div>
                    <p className="text-xs font-bold text-gray-800">{title}</p>
                    <p className="text-[10px] text-gray-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-xl md:text-2xl text-primary-dark mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </section>

      {/* Sticky Mobile Add to Cart */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-3 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 text-lg font-bold text-primary">−</button>
            <span className="w-8 text-center font-bold text-sm">{qty}</span>
            <button onClick={() => setQty(q => Math.min(product.quantity || 99, q + 1))} className="w-9 h-9 text-lg font-bold text-primary">+</button>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="flex-1 py-3 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl font-bold text-sm shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {outOfStock ? 'Out of Stock' : `🛒 Add to Cart — ₹${(product.price * qty).toLocaleString()}`}
          </button>
        </div>
      </div>
    </>
  )
}

export default function ProductDetailClient({ product, relatedProducts }: { product: any; relatedProducts: any[] }) {
  return (
    <StoreProvider>
      {/* Mini Header */}
      <header className="bg-primary-dark text-white sticky top-0 z-[100] shadow-md">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="shrink-0"><img src="/logo.png" alt="Logo" className="h-8 md:h-10 w-auto mix-blend-screen" /></Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-sm px-3 py-2 rounded-lg hover:bg-white/10">← Shop</Link>
            <button onClick={() => { const e = document.getElementById('cartSidebar'); e?.classList.toggle('translate-x-0'); e?.classList.toggle('translate-x-full'); document.getElementById('cartOverlay')?.classList.toggle('hidden') }} className="relative text-sm px-3 py-2 rounded-lg hover:bg-white/10">
              🛒 Cart
            </button>
          </div>
        </div>
      </header>
      <ProductDetail product={product} relatedProducts={relatedProducts} />
    </StoreProvider>
  )
}
