import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DELETE_TWEET_QUERY_ID = 'VaenaVgh5q5ih7kvyVjgtg'

function getHeaders(authToken, csrfToken) {
  return {
    'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
    'Cookie': `auth_token=${authToken}; ct0=${csrfToken}`,
    'X-Csrf-Token': csrfToken,
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'X-Twitter-Active-User': 'yes',
    'X-Twitter-Auth-Type': 'OAuth2Session',
    'X-Twitter-Client-Language': 'en',
  }
}

async function deleteTweet(authToken, csrfToken, tweetId) {
  const response = await fetch(
    `https://x.com/i/api/graphql/${DELETE_TWEET_QUERY_ID}/DeleteTweet`,
    {
      method: 'POST',
      headers: getHeaders(authToken, csrfToken),
      body: JSON.stringify({
        variables: { tweet_id: tweetId, dark_request: false },
        queryId: DELETE_TWEET_QUERY_ID
      })
    }
  )

  if (!response.ok) {
    const text = await response.text()
    console.error(`Failed to delete tweet ${tweetId}:`, response.status, text)
    return false
  }

  return true
}

export async function POST(request) {
  try {
    const { authToken, csrfToken, tweetIds } = await request.json()

    if (!authToken || !csrfToken) {
      return NextResponse.json(
        { error: 'Missing credentials' },
        { status: 400 }
      )
    }

    if (!tweetIds || !Array.isArray(tweetIds) || tweetIds.length === 0) {
      return NextResponse.json(
        { error: 'No tweet IDs provided' },
        { status: 400 }
      )
    }

    let deleted = 0
    const errors = []

    for (const tweetId of tweetIds) {
      try {
        const success = await deleteTweet(authToken, csrfToken, tweetId)
        if (success) {
          deleted++
        } else {
          errors.push(tweetId)
        }

        // Small delay between deletions to avoid rate limits
        await new Promise(r => setTimeout(r, 500))
      } catch (err) {
        console.error(`Error deleting tweet ${tweetId}:`, err)
        errors.push(tweetId)
      }
    }

    // Update user's deletion count
    if (deleted > 0) {
      try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const today = new Date().toISOString().split('T')[0]

          // Get current profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('tweets_deleted_today, last_deletion_date')
            .eq('id', user.id)
            .single()

          // Calculate new count
          const isNewDay = profile?.last_deletion_date !== today
          const newCount = isNewDay ? deleted : (profile?.tweets_deleted_today || 0) + deleted

          await supabase
            .from('profiles')
            .update({
              tweets_deleted_today: newCount,
              last_deletion_date: today,
            })
            .eq('id', user.id)
        }
      } catch (updateError) {
        console.error('Failed to update deletion count:', updateError)
        // Don't fail the request if we can't update the count
      }
    }

    return NextResponse.json({
      deleted,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete tweets' },
      { status: 500 }
    )
  }
}