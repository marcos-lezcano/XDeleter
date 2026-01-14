import { NextResponse } from 'next/server'

const GRAPHQL_URL = 'https://x.com/i/api/graphql'

// GraphQL query IDs (may need updating if X changes them)
const USER_TWEETS_QUERY_ID = 'HuTx74BxAnezK1gWvYY7zg'
const VIEWER_QUERY_ID = 'okNaf-6AQWu2DD2H_MAoVw'

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

async function getViewer(authToken, csrfToken) {
  const variables = JSON.stringify({
    withCommunitiesMemberships: false
  })

  const features = JSON.stringify({
    hidden_profile_subscriptions_enabled: true,
    rweb_tipjar_consumption_enabled: true,
    responsive_web_graphql_exclude_directive_enabled: true,
    verified_phone_label_enabled: false,
    subscriptions_verification_info_is_identity_verified_enabled: true,
    subscriptions_verification_info_verified_since_enabled: true,
    highlights_tweets_tab_ui_enabled: true,
    responsive_web_twitter_article_notes_tab_enabled: true,
    subscriptions_feature_can_gift_premium: true,
    creator_subscriptions_tweet_preview_api_enabled: true,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    responsive_web_graphql_timeline_navigation_enabled: true,
    blue_business_profile_image_shape_enabled: false
  })

  const response = await fetch(
    `${GRAPHQL_URL}/${VIEWER_QUERY_ID}/Viewer?variables=${encodeURIComponent(variables)}&features=${encodeURIComponent(features)}`,
    { headers: getHeaders(authToken, csrfToken) }
  )

  if (!response.ok) {
    const text = await response.text()
    console.error('Viewer API error:', response.status, text)
    throw new Error('Invalid credentials or session expired')
  }

  const data = await response.json()

  if (!data.data?.viewer?.user_results?.result) {
    throw new Error('Could not get user info')
  }

  const user = data.data.viewer.user_results.result
  return {
    userId: user.rest_id,
    screenName: user.legacy.screen_name,
    tweetsCount: user.legacy.statuses_count
  }
}

async function fetchTweets(authToken, csrfToken, userId, cursor = null) {
  const variables = {
    userId,
    count: 100,
    includePromotedContent: false,
    withQuickPromoteEligibilityTweetFields: false,
    withVoice: false,
    withV2Timeline: true
  }

  if (cursor) {
    variables.cursor = cursor
  }

  const features = JSON.stringify({
    rweb_tipjar_consumption_enabled: true,
    responsive_web_graphql_exclude_directive_enabled: true,
    verified_phone_label_enabled: false,
    creator_subscriptions_tweet_preview_api_enabled: true,
    responsive_web_graphql_timeline_navigation_enabled: true,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    communities_web_enable_tweet_community_results_fetch: true,
    c9s_tweet_anatomy_moderator_badge_enabled: true,
    articles_preview_enabled: true,
    responsive_web_edit_tweet_api_enabled: true,
    graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
    view_counts_everywhere_api_enabled: true,
    longform_notetweets_consumption_enabled: true,
    responsive_web_twitter_article_tweet_consumption_enabled: true,
    tweet_awards_web_tipping_enabled: false,
    creator_subscriptions_quote_tweet_preview_enabled: false,
    freedom_of_speech_not_reach_fetch_enabled: true,
    standardized_nudges_misinfo: true,
    tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
    rweb_video_timestamps_enabled: true,
    longform_notetweets_rich_text_read_enabled: true,
    longform_notetweets_inline_media_enabled: true,
    responsive_web_enhance_cards_enabled: false,
    interactive_text_enabled: true,
    blue_business_profile_image_shape_enabled: false,
    tweetypie_unmention_optimization_enabled: true,
    vibe_api_enabled: true,
    responsive_web_text_conversations_enabled: false
  })

  const response = await fetch(
    `${GRAPHQL_URL}/${USER_TWEETS_QUERY_ID}/UserTweets?variables=${encodeURIComponent(JSON.stringify(variables))}&features=${encodeURIComponent(features)}`,
    { headers: getHeaders(authToken, csrfToken) }
  )

  if (!response.ok) {
    const text = await response.text()
    console.error('Tweets API error:', response.status, text)
    throw new Error('Failed to fetch tweets')
  }

  return response.json()
}

function parseTweets(data) {
  const tweets = []
  let nextCursor = null

  try {
    const instructions = data.data?.user?.result?.timeline_v2?.timeline?.instructions || []

    for (const instruction of instructions) {
      if (instruction.type === 'TimelineAddEntries') {
        for (const entry of instruction.entries || []) {
          if (entry.content?.entryType === 'TimelineTimelineItem') {
            const tweetResult = entry.content.itemContent?.tweet_results?.result

            if (tweetResult) {
              // Handle both regular tweets and tweets with tombstone
              const tweet = tweetResult.tweet || tweetResult
              const legacy = tweet.legacy

              if (legacy) {
                // Determine tweet type
                const isRetweet = !!legacy.retweeted_status_result || legacy.full_text?.startsWith('RT @')
                const isReply = !!legacy.in_reply_to_status_id_str || !!legacy.in_reply_to_user_id_str
                const isQuote = !!tweet.quoted_status_result || !!legacy.quoted_status_id_str || !!legacy.is_quote_status

                let tweetType = 'original'
                if (isRetweet || isQuote) {
                  tweetType = 'retweet'
                } else if (isReply) {
                  tweetType = 'reply'
                }

                tweets.push({
                  id: legacy.id_str,
                  text: legacy.full_text || legacy.text || '',
                  date: new Date(legacy.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }),
                  cursor: entry.sortIndex,
                  tweetType
                })
              }
            }
          } else if (entry.content?.entryType === 'TimelineTimelineCursor' && entry.content?.cursorType === 'Bottom') {
            nextCursor = entry.content.value
          }
        }
      }
    }
  } catch (e) {
    console.error('Error parsing tweets:', e)
  }

  return { tweets, nextCursor }
}

export async function POST(request) {
  try {
    const { authToken, csrfToken, cursor } = await request.json()

    if (!authToken || !csrfToken) {
      return NextResponse.json(
        { error: 'Missing credentials' },
        { status: 400 }
      )
    }

    // Get user info
    const { userId, screenName, tweetsCount } = await getViewer(authToken, csrfToken)

    // Fetch tweets
    const tweetsData = await fetchTweets(authToken, csrfToken, userId, cursor)
    const { tweets, nextCursor } = parseTweets(tweetsData)

    return NextResponse.json({
      tweets,
      total: tweetsCount,
      nextCursor,
      screenName
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tweets' },
      { status: 500 }
    )
  }
}