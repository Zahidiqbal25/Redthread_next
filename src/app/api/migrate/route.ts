import { supabase } from '@/lib/supabase'
import { jsonOk, jsonError } from '@/lib/utils'

export async function GET() {
  // Test if images column exists by trying to select it
  const { error } = await supabase.from('products').select('images').limit(1)
  
  if (error && error.message.includes('images')) {
    // Column doesn't exist - we can't add it via Supabase client
    // User needs to add it manually in Supabase Dashboard
    return jsonOk({ 
      status: 'migration_needed',
      message: 'Please add an "images" column to the "products" table in your Supabase Dashboard.',
      instructions: [
        '1. Go to https://supabase.com/dashboard',
        '2. Select your project',
        '3. Go to Table Editor → products',
        '4. Click "Add Column"',
        '5. Name: images, Type: jsonb, Default Value: []',
        '6. Click Save'
      ]
    })
  }

  return jsonOk({ status: 'ok', message: 'images column already exists' })
}
