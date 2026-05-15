'use client'
import { useState, useEffect, useRef } from 'react'

interface SliderData {
  images: string[]
  text: string
}

const DEFAULT_SLIDERS: SliderData[] = [
  { images: ['https://images.unsplash.com/photo-1608797178974-15b35a64ede9?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=300&fit=crop'], text: 'Premium Almonds' },
  { images: ['https://images.unsplash.com/photo-1616684000067-36952fde56ec?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop'], text: 'Fresh Cashews' },
  { images: ['https://images.unsplash.com/photo-1625869951429-800e5765c6c2?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400&h=300&fit=crop'], text: 'Healthy Mix' },
]

function MiniSlider({ images, text, current, prev }: SliderData & { current: number; prev: number }) {
  const len = images.length
  if (len === 0) return <div className="relative rounded-xl overflow-hidden h-[120px] md:h-[160px] bg-gray-100" />
  const idx = current % len
  const prevIdx = prev % len

  return (
    <div className="relative rounded-xl overflow-hidden h-[120px] md:h-[160px]">
      {images.map((src, i) => {
        let cls = 'translate-x-full' // default: waiting on right
        if (i === idx) cls = 'translate-x-0'
        else if (i === prevIdx) cls = '-translate-x-full'
        return (
          <img
            key={i}
            src={src}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-in-out ${cls}`}
          />
        )
      })}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      {text && (
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white font-bold text-xs md:text-sm drop-shadow-lg">{text}</p>
        </div>
      )}
    </div>
  )
}

export default function ImageSlider() {
  const [sliders, setSliders] = useState<SliderData[]>(DEFAULT_SLIDERS)
  const [current, setCurrent] = useState(0)
  const prevRef = useRef(0)

  useEffect(() => {
    fetch('/api/settings/sliders').then(r => r.json()).then(d => {
      if (d.sliders?.length) setSliders(d.sliders)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(i => {
        prevRef.current = i
        return i + 1
      })
    }, 3500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {sliders.map((s, i) => <MiniSlider key={i} images={s.images} text={s.text} current={current} prev={prevRef.current} />)}
      </div>
    </div>
  )
}
