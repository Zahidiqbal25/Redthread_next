'use client'
import { useEffect, useState } from 'react'

export default function Footer() {
  const [contact, setContact] = useState({ name: '', email: 'hello@nutrinuts.com', phone: '+91 98765 43210', address: 'Mumbai, India', pincode: '' })

  useEffect(() => {
    fetch('/api/settings/contact').then(r => r.json()).then(setContact).catch(() => {})
  }, [])

  return (
    <footer className="bg-primary-dark text-white/80 pt-10 md:pt-16 pb-6 px-4 md:px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 mb-10">
        <div>
          <img src="/logo.png" alt="Logo" className="h-8 w-auto mix-blend-screen" />
          <p className="text-sm leading-relaxed">Your trusted source for premium quality dry fruits and nuts. Sourced directly from farms across California, Afghanistan, Iran, and Chile.</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {['💳 Secure Payments', '🚚 Fast Delivery', '✅ Quality Assured'].map(b => (
              <span key={b} className="text-xs bg-white/10 border border-white/15 px-2.5 py-1 rounded-full">{b}</span>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-display text-white text-lg mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#products" className="hover:text-accent">🛒 Shop All</a></li>
            <li><a href="#why-us" className="hover:text-accent">✨ Why Red Thread</a></li>
            <li><a href="/admin" className="hover:text-accent">📊 Admin Panel</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-display text-white text-lg mb-4">Categories</h3>
          <ul className="space-y-2 text-sm">
            {['🌰 Almonds', '🥜 Cashews', '💚 Pistachios', '🧠 Walnuts', '🍇 Raisins'].map(c => (
              <li key={c}><a href="#products" className="hover:text-accent">{c}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-display text-white text-lg mb-4">Contact Us</h3>
          {contact.name && <p className="text-sm font-semibold text-white mb-1">{contact.name}</p>}
          <p className="text-sm">📧 {contact.email}</p>
          <p className="text-sm mt-1">📞 {contact.phone}</p>
          <p className="text-sm mt-1">📍 {contact.address}{contact.pincode ? ` — ${contact.pincode}` : ''}</p>
          <div className="mt-4">
            <p className="text-xs text-white/50 mb-2">We Accept</p>
            <div className="flex gap-2">
              {['Visa', 'Mastercard', 'UPI', 'COD'].map(p => (
                <span key={p} className="text-xs bg-white/10 border border-white/20 text-white font-semibold px-3 py-1 rounded-md">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-5 border-t border-white/10 text-center text-xs text-white/50">
        © 2024 Red Thread. All rights reserved. Made with ❤️ for nut lovers.
      </div>
    </footer>
  )
}
