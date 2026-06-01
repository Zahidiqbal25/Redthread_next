'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useStore } from '@/lib/store-context'

export default function ProductCard({ product }: { product: any }) {
  const { addToCart } = useStore()
  const discount = Math.round((1 - product.price / product.originalPrice) * 100)
  const outOfStock = !product.inStock

  return (
    <div className="bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-gray-100 hover:-translate-y-1.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 relative group">
      {discount > 0 && <span className="absolute top-2 left-2 md:top-3 md:left-3 bg-red-500 text-white px-2 py-0.5 md:px-2.5 md:py-1 rounded-md text-[10px] md:text-xs font-bold z-10 shadow">{discount}% OFF</span>}
      {outOfStock && <span className="absolute top-2 right-2 md:top-3 md:right-3 bg-gray-500 text-white px-2 py-0.5 md:px-2.5 md:py-1 rounded-md text-[10px] md:text-xs font-bold z-10">Out of Stock</span>}

      <Link href={`/products/${product.id}`}>
        <div className="h-36 md:h-52 overflow-hidden relative bg-gray-50">
          <img
            src={product.image && product.image.startsWith('http') ? product.image : `https://via.placeholder.com/300x220?text=${encodeURIComponent(product.name)}`}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={e => (e.currentTarget.src = `https://via.placeholder.com/300x220?text=${encodeURIComponent(product.name)}`)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </Link>

      <div className="p-3 md:p-4">
        <p className="text-[0.6rem] md:text-[0.7rem] text-primary-light font-bold uppercase tracking-wider">{product.category}</p>
        <Link href={`/products/${product.id}`}>
          <h3 className="font-bold text-gray-900 mt-1 text-sm md:text-base truncate hover:text-primary transition-colors">{product.name}</h3>
        </Link>
        <span className="text-[10px] md:text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded inline-block mt-1">{product.weight}</span>
        <div className="flex items-center gap-1 md:gap-2 mt-2 mb-2 md:mb-3">
          <span className="text-lg md:text-xl font-bold text-primary">₹{product.price}</span>
          {product.originalPrice > product.price && <span className="text-xs md:text-sm text-gray-400 line-through">₹{product.originalPrice}</span>}
        </div>
        <button
          onClick={() => !outOfStock && addToCart(product)}
          disabled={outOfStock}
          className="w-full py-2 md:py-2.5 bg-gradient-to-r from-primary to-primary-light text-white rounded-lg font-bold text-xs md:text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          {outOfStock ? 'Out of Stock' : '🛒 Add to Cart'}
        </button>
      </div>
    </div>
  )
}
