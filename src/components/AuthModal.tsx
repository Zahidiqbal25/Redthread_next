'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store-context'

export default function AuthModal({ mode: initialMode, onClose, onSwitch }: { mode: 'login' | 'register'; onClose: () => void; onSwitch: (m: 'login' | 'register') => void }) {
  const { setUser, showToast } = useStore()
  const [currentMode, setCurrentMode] = useState(initialMode)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpStep, setOtpStep] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [regData, setRegData] = useState<any>(null)
  const [forgotStep, setForgotStep] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  function switchMode(m: 'login' | 'register') {
    setCurrentMode(m)
    setError('')
    onSwitch(m)
  }

  async function handleForgot(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setLoading(true)
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/users/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fd.get('email') }) })
    const data = await res.json()
    setLoading(false)
    if (res.ok) setForgotSent(true)
    else setError(data.error)
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/users/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }) })
    const data = await res.json()
    if (res.ok) { setUser(data); onClose(); showToast(`Welcome back, ${data.name}!`) }
    else setError(data.error)
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setLoading(true)
    const fd = new FormData(e.currentTarget)
    const data = { name: fd.get('name'), email: fd.get('email'), phone: fd.get('phone'), password: fd.get('password'), address: fd.get('address') || '', city: fd.get('city') || '', pincode: fd.get('pincode') || '' }

    const res = await fetch('/api/users/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: data.email }) })
    setLoading(false)
    const result = await res.json()
    if (res.ok) { setRegData(data); setOtpStep(true) }
    else setError(result.error)
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    const verifyRes = await fetch('/api/users/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: regData.email, code: otpCode }) })
    if (!verifyRes.ok) { const d = await verifyRes.json(); setError(d.error); setLoading(false); return }

    const regRes = await fetch('/api/users/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(regData) })
    setLoading(false)
    const data = await regRes.json()
    if (regRes.ok) { setUser(data); onClose(); showToast(`Welcome, ${data.name}! Account created.`) }
    else setError(data.error)
  }

  if (forgotStep) {
    return (
      <div className="modal-overlay open" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
        <div className="bg-white rounded-none md:rounded-xl w-full md:max-w-md p-6 md:p-8 relative max-h-screen md:max-h-[90vh] overflow-y-auto">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
          {forgotSent ? (
            <>
              <h2 className="font-display text-xl mb-2">📧 Check Your Email</h2>
              <p className="text-sm text-gray-500 mb-5">A password reset link has been sent to your email. It expires in 1 hour.</p>
              <button onClick={() => { setForgotStep(false); setForgotSent(false) }} className="w-full btn-primary">Back to Login</button>
            </>
          ) : (
            <>
              <h2 className="font-display text-xl mb-2">🔑 Forgot Password</h2>
              <p className="text-sm text-gray-500 mb-5">Enter your email and we&apos;ll send you a reset link.</p>
              <form onSubmit={handleForgot} className="space-y-4">
                <input name="email" type="email" required placeholder="Your email address" className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary" />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="submit" disabled={loading} className="w-full btn-primary">{loading ? 'Sending...' : 'Send Reset Link'}</button>
              </form>
              <p className="text-center text-sm text-gray-500 mt-4"><button onClick={() => { setForgotStep(false); setError('') }} className="text-primary font-semibold">Back to Login</button></p>
            </>
          )}
        </div>
      </div>
    )
  }

  if (otpStep) {
    return (
      <div className="modal-overlay open" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
        <div className="bg-white rounded-none md:rounded-xl w-full md:max-w-md p-6 md:p-8 relative max-h-screen md:max-h-[90vh] overflow-y-auto">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
          <h2 className="font-display text-xl mb-2">📧 Verify Your Email</h2>
          <p className="text-sm text-gray-500 mb-5">A 6-digit code has been sent to <strong>{regData?.email}</strong></p>
          <form onSubmit={handleVerifyOtp}>
            <input type="text" value={otpCode} onChange={e => setOtpCode(e.target.value)} maxLength={6} placeholder="Enter 6-digit code" className="w-full px-4 py-3 border-2 rounded-lg text-center text-2xl font-bold tracking-[12px] mb-3 outline-none focus:border-primary" />
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <button type="submit" disabled={loading} className="w-full btn-primary">{loading ? 'Verifying...' : 'Verify & Register'}</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-none md:rounded-xl w-full md:max-w-md p-6 md:p-8 max-h-screen md:max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
        {currentMode === 'login' ? (
          <>
            <h2 className="font-display text-xl mb-5">👤 Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div><label className="text-sm font-semibold text-gray-600 block mb-1">Email</label><input name="email" type="email" required className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary" /></div>
              <div><label className="text-sm font-semibold text-gray-600 block mb-1">Password</label><input name="password" type="password" required className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary" /></div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" className="w-full btn-primary">Login</button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-3"><button onClick={() => { setForgotStep(true); setError('') }} className="text-primary font-semibold">Forgot Password?</button></p>
            <p className="text-center text-sm text-gray-500 mt-2">Don&apos;t have an account? <button onClick={() => switchMode('register')} className="text-primary font-semibold">Register</button></p>
          </>
        ) : (
          <>
            <h2 className="font-display text-xl mb-5">📝 Create Account</h2>
            <form onSubmit={handleRegister} className="space-y-3">
              <div><label className="text-sm font-semibold text-gray-600 block mb-1">Full Name</label><input name="name" required className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="text-sm font-semibold text-gray-600 block mb-1">Email</label><input name="email" type="email" required className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary" /></div>
                <div><label className="text-sm font-semibold text-gray-600 block mb-1">Phone</label><input name="phone" type="tel" required className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary" /></div>
              </div>
              <div><label className="text-sm font-semibold text-gray-600 block mb-1">Password</label><input name="password" type="password" required minLength={6} className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary" /></div>
              <div><label className="text-sm font-semibold text-gray-600 block mb-1">Address (optional)</label><textarea name="address" className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary resize-none h-16" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="text-sm font-semibold text-gray-600 block mb-1">City</label><input name="city" className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary" /></div>
                <div><label className="text-sm font-semibold text-gray-600 block mb-1">Pincode</label><input name="pincode" className="w-full px-4 py-2.5 border-2 rounded-lg outline-none focus:border-primary" /></div>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full btn-primary">{loading ? 'Sending code...' : 'Create Account'}</button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-4">Already have an account? <button onClick={() => switchMode('login')} className="text-primary font-semibold">Login</button></p>
          </>
        )}
      </div>
    </div>
  )
}
