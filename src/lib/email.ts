import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
})

const from = `"Valenuts 🌰" <${process.env.EMAIL_USER}>`
const logo = `<div style="background:linear-gradient(135deg,#1a3009,#2d5016,#4a7c28);padding:32px 24px;text-align:center"><h1 style="color:#d4a843;font-size:1.8rem;margin:0">🌰 Valenuts</h1></div>`

export async function sendVerificationEmail(email: string, code: string) {
  await transporter.sendMail({
    from, to: email,
    subject: 'Your Valenuts Verification Code',
    html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#faf8f5;border-radius:12px;overflow:hidden">
      ${logo}
      <div style="padding:32px 24px;text-align:center">
        <h2 style="color:#1a3009">Email Verification</h2>
        <p style="color:#444">Use the code below to verify your email. Expires in 10 minutes.</p>
        <div style="font-size:2.5rem;font-weight:800;letter-spacing:12px;color:#1a3009;background:#fff;border:2px dashed #d4a843;border-radius:12px;padding:20px;margin:24px 0">${code}</div>
      </div>
    </div>`,
  })
}

export async function sendWelcomeEmail(user: { name: string; email: string; phone: string }) {
  await transporter.sendMail({
    from, to: user.email,
    subject: 'Welcome to Valenuts! 🌰',
    html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#faf8f5;border-radius:12px;overflow:hidden">
      ${logo}
      <div style="padding:32px 24px">
        <h2 style="color:#1a3009">Welcome, ${user.name}! 🎉</h2>
        <p style="color:#444">Your account has been created successfully.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="display:inline-block;background:#d4a843;color:#1a3009;padding:12px 32px;border-radius:50px;font-weight:700;text-decoration:none;margin-top:20px">Start Shopping →</a>
      </div>
    </div>`,
  })
}

export async function sendPasswordResetEmail(user: { name: string; email: string }, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}?reset_token=${token}`
  await transporter.sendMail({
    from, to: user.email,
    subject: 'Reset Your Valenuts Password',
    html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#faf8f5;border-radius:12px;overflow:hidden">
      ${logo}
      <div style="padding:32px 24px">
        <h2 style="color:#1a3009">Reset Your Password</h2>
        <p style="color:#444">Hi ${user.name}, click below to reset your password. Expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#d4a843;color:#1a3009;padding:12px 32px;border-radius:50px;font-weight:700;text-decoration:none;margin:20px 0">Reset Password →</a>
      </div>
    </div>`,
  })
}

export async function sendOrderCancellationEmail(order: any) {
  await transporter.sendMail({
    from, to: order.customerEmail,
    subject: `Order #${order.id} Cancelled - Valenuts`,
    html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#faf8f5;border-radius:12px;overflow:hidden">
      ${logo}
      <div style="padding:32px 24px">
        <h2 style="color:#c0392b">Order Cancelled</h2>
        <p style="color:#444">Hi ${order.customerName}, your order <strong>#${order.id}</strong> has been cancelled.</p>
        <p style="color:#444">Total: ₹${order.total} | Payment: ${order.payment}</p>
        <p style="color:#444;margin-top:16px">If you paid online, refund will be processed within 5-7 business days.</p>
      </div>
    </div>`,
  })
}

export async function sendNewOrderNotificationToAdmin(order: any) {
  const adminEmail = process.env.EMAIL_USER
  if (!adminEmail) return
  const items = Array.isArray(order.items) ? order.items : []
  const itemsList = items.map((i: any) => `${i.name} × ${i.qty} — ₹${(i.price * i.qty).toLocaleString()}`).join('<br/>')
  await transporter.sendMail({
    from, to: adminEmail,
    subject: `🛒 New Order #${order.id} — ₹${order.total?.toLocaleString()}`,
    html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#faf8f5;border-radius:12px;overflow:hidden">
      ${logo}
      <div style="padding:32px 24px">
        <h2 style="color:#1a3009">New Order Received! 🎉</h2>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:6px 0;color:#666;font-size:13px">Order ID</td><td style="padding:6px 0;font-weight:700">#${order.id}</td></tr>
          <tr><td style="padding:6px 0;color:#666;font-size:13px">Customer</td><td style="padding:6px 0;font-weight:700">${order.customerName}</td></tr>
          <tr><td style="padding:6px 0;color:#666;font-size:13px">Phone</td><td style="padding:6px 0">${order.customerPhone}</td></tr>
          <tr><td style="padding:6px 0;color:#666;font-size:13px">Email</td><td style="padding:6px 0">${order.customerEmail}</td></tr>
          <tr><td style="padding:6px 0;color:#666;font-size:13px">Address</td><td style="padding:6px 0">${order.customerAddress}, ${order.customerCity} — ${order.customerPincode}</td></tr>
          <tr><td style="padding:6px 0;color:#666;font-size:13px">Payment</td><td style="padding:6px 0">${order.payment}</td></tr>
          <tr><td style="padding:6px 0;color:#666;font-size:13px">Total</td><td style="padding:6px 0;font-weight:700;color:#2d5016;font-size:18px">₹${order.total?.toLocaleString()}</td></tr>
        </table>
        <div style="background:#fff;border:1px solid #e5e5e5;border-radius:8px;padding:16px;margin-top:12px">
          <p style="font-size:12px;color:#666;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">Items Ordered</p>
          <p style="font-size:13px;color:#333;line-height:1.8;margin:0">${itemsList}</p>
        </div>
      </div>
    </div>`,
  }).catch(() => {})
}
