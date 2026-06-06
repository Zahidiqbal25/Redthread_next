import { supabase } from '@/lib/supabase'
import { jsonOk } from '@/lib/utils'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const [
    { count: totalProducts },
    { count: totalOrders },
    { count: totalUsers },
    { count: pending },
    { count: confirmed },
    { count: shipped },
    { data: orders },
    { data: products },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'Confirmed'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'Shipped'),
    supabase.from('orders').select('*').order('id', { ascending: false }),
    supabase.from('products').select('id, name, quantity, image'),
  ])

  const allOrders = orders || []
  const revenue = allOrders.reduce((s: number, o: any) => s + (o.total || 0), 0)

  // Low stock products (quantity <= 5)
  const lowStock = (products || []).filter((p: any) => p.quantity <= 5)

  // Recent orders (last 5)
  const recentOrders = allOrders.slice(0, 5)

  // Monthly sales (last 6 months)
  const monthlySales: { month: string; total: number; orders: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const year = d.getFullYear()
    const month = d.getMonth()
    const monthOrders = allOrders.filter((o: any) => {
      const od = new Date(o.date || o.created_at)
      return od.getFullYear() === year && od.getMonth() === month
    })
    monthlySales.push({
      month: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      total: monthOrders.reduce((s: number, o: any) => s + (o.total || 0), 0),
      orders: monthOrders.length,
    })
  }

  // Top selling products
  const productSales: Record<string, { name: string; qty: number; revenue: number }> = {}
  allOrders.forEach((o: any) => {
    const items = Array.isArray(o.items) ? o.items : []
    items.forEach((item: any) => {
      if (!productSales[item.name]) productSales[item.name] = { name: item.name, qty: 0, revenue: 0 }
      productSales[item.name].qty += item.qty || 1
      productSales[item.name].revenue += (item.price || 0) * (item.qty || 1)
    })
  })
  const topSelling = Object.values(productSales).sort((a, b) => b.qty - a.qty).slice(0, 5)

  return NextResponse.json({
    totalProducts: totalProducts || 0,
    totalOrders: totalOrders || 0,
    revenue,
    pending: pending || 0,
    confirmed: confirmed || 0,
    shipped: shipped || 0,
    totalUsers: totalUsers || 0,
    lowStock,
    recentOrders,
    monthlySales,
    topSelling,
  }, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache' }
  })
}
