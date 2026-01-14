import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build-time errors when env vars are not set
let supabaseAdmin = null

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      throw new Error('Missing Supabase environment variables')
    }

    supabaseAdmin = createClient(url, key)
  }
  return supabaseAdmin
}

export async function POST(request, { params }) {
  try {
    const { secret } = await params

    // 1. Verify the secret in URL matches our secret
    if (secret !== process.env.GUMROAD_WEBHOOK_SECRET) {
      console.log('Invalid webhook secret')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Gumroad sends data as x-www-form-urlencoded
    const formData = await request.formData()

    // Convert FormData to object
    const data = {}
    for (const [key, value] of formData.entries()) {
      data[key] = value
    }

    console.log('Gumroad webhook received:', JSON.stringify(data, null, 2))

    // 2. Verify seller_id matches (prevents someone from forwarding other sellers' pings)
    if (data.seller_id && data.seller_id !== process.env.GUMROAD_SELLER_ID) {
      console.log('Invalid seller_id:', data.seller_id)
      return NextResponse.json({ error: 'Invalid seller' }, { status: 403 })
    }

    // 3. Check this is a successful sale (not refunded, disputed, etc)
    if (data.refunded === 'true' || data.disputed === 'true' || data.chargebacked === 'true') {
      console.log('Ignoring refunded/disputed/chargebacked sale')
      // Handle refund - downgrade user
      const email = data.email
      if (email) {
        await getSupabaseAdmin()
          .from('profiles')
          .update({
            subscription_tier: 'free',
            subscription_status: 'inactive',
          })
          .eq('email', email)
      }
      return NextResponse.json({ received: true, action: 'refund_processed' })
    }

    const email = data.email
    const productPermalink = data.product_permalink || data.short_product_id
    const saleId = data.sale_id
    const isRecurring = data.recurrence === 'monthly'

    if (!email) {
      console.log('No email in webhook data')
      return NextResponse.json({ error: 'No email provided' }, { status: 400 })
    }

    // Find user by email
    const { data: profile, error: profileError } = await getSupabaseAdmin()
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      console.log('User not found for email:', email)
      // Still return 200 to acknowledge the webhook
      return NextResponse.json({ received: true, message: 'User not found' })
    }

    // Determine the plan based on product
    const proPermalink = process.env.NEXT_PUBLIC_GUMROAD_PRO_URL?.split('/l/')[1]
    const lifetimePermalink = process.env.NEXT_PUBLIC_GUMROAD_LIFETIME_URL?.split('/l/')[1]

    let tier = 'free'
    if (productPermalink === lifetimePermalink || data.product_name?.toLowerCase().includes('lifetime')) {
      tier = 'lifetime'
    } else if (productPermalink === proPermalink || isRecurring) {
      tier = 'pro'
    }

    // Update user's subscription
    const { error: updateError } = await getSupabaseAdmin()
      .from('profiles')
      .update({
        subscription_tier: tier,
        subscription_status: 'active',
        gumroad_sale_id: saleId,
      })
      .eq('id', profile.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    console.log(`Updated user ${email} to ${tier} plan`)

    return NextResponse.json({ received: true, tier })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
