import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor):',
    sql: "ALTER TABLE products ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '[]';"
  })
}
