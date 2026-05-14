'use client'
import { useState, useEffect, useCallback } from 'react'

interface SliderData {
  images: string[]
  text: string
}

const DEFAULT_SLIDERS: SliderData[] = [
  { images: ['https://images.unsplash.com/photo-1608797178974-15b35a64ede9?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=300&fit=crop'], text: 'Premium Almonds' },
  { images: ['https://images.unsplash.com/photo-1616684000067-36952fde56ec?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop'], text: 'Fresh Cashews' },
  { images: ['https://images.unsplash.com/photo-1625869951429-800e5765c6c2?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400&h=300&fit=crop'], text: 'Healthy Mix' },
]

function MiniSlider({ images, text }: SliderData) {
  const [current, setCurrent] = useState(0)
  const next = useCallback(() => setCurrent(i => (i + 1) % images.length), [images.length])

  useEffect(() => {
    if (images.length <= 1) return
    const timer = setInterval(next, 3000 + Math.random() * 1000)
    return () => clearInterval(timer)
  }, [next, images.length])

  return (
    <div className="relative rounded-xl overflow-hidden h-[120px] md:h-[160px]">
      {images.map((src, i) => (
        <img key={i} src={src} alt="" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'}`} />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      {text && (
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white font-bold text-xs md:text-sm drop-shadow-lg">{text}</p>
        </div>
      )}
      {images.length > 1 && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
          {images.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-white w-4' : 'bg-white/50'}`} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ImageSlider() {
  const [sliders, setSliders] = useState<SliderData[]>(DEFAULT_SLIDERS)

  useEffect(() => {
    fetch('/api/settings/sliders').then(r => r.json()).then(d => {
      if (d.sliders?.length) setSliders(d.sliders)
    }).catch(() => {})
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {sliders.map((s, i) => <MiniSlider key={i} images={s.images} text={s.text} />)}
      </div>
    </div>
  )
}
