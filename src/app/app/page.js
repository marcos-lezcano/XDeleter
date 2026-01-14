'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import AuthForm from '@/components/AuthForm'
import TweetList from '@/components/TweetList'

export default function AppPage() {
  const { user, profile, loading, isPaid, canDeleteTweets, refreshProfile } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState('auth') // auth, tweets
  const [credentials, setCredentials] = useState(null)
  const [tweets, setTweets] = useState([])
  const [totalTweets, setTotalTweets] = useState(0)
  const [nextCursor, setNextCursor] = useState(null)
  const [error, setError] = useState('')
  const [fetchLoading, setFetchLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [totalDeleted, setTotalDeleted] = useState(0)
  const [lastBatchDeleted, setLastBatchDeleted] = useState(0)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const handleAuth = async (creds) => {
    setError('')
    setFetchLoading(true)

    try {
      const res = await fetch('/api/tweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch tweets')
      }

      setCredentials(creds)
      setTweets(data.tweets)
      setTotalTweets(data.total)
      setNextCursor(data.nextCursor)
      setStep('tweets')
    } catch (err) {
      setError(err.message)
    } finally {
      setFetchLoading(false)
    }
  }

  const handleDeleteSelected = async (selectedTweets) => {
    setError('')

    // Check limits for free users
    const { allowed, remaining } = canDeleteTweets()

    if (!allowed) {
      setError('Daily limit reached. Upgrade to Pro or Lifetime for unlimited deletions.')
      return
    }

    const tweetsToDelete = isPaid
      ? selectedTweets
      : selectedTweets.slice(0, Math.min(remaining, selectedTweets.length))

    if (tweetsToDelete.length < selectedTweets.length) {
      setError(`Only ${remaining} deletions remaining today. Deleting ${tweetsToDelete.length} tweets.`)
    }

    setDeleting(true)
    setLastBatchDeleted(0)

    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...credentials,
          tweetIds: tweetsToDelete.map(t => t.id)
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete tweets')
      }

      const deletedIds = new Set(tweetsToDelete.map(t => t.id))
      setTweets(tweets.filter(t => !deletedIds.has(t.id)))
      setTotalDeleted(prev => prev + data.deleted)
      setLastBatchDeleted(data.deleted)
      setTotalTweets(prev => prev - data.deleted)

      // Refresh profile to update deletion counts
      await refreshProfile()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleLoadMore = async () => {
    setFetchLoading(true)
    setError('')

    try {
      const res = await fetch('/api/tweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...credentials,
          cursor: nextCursor
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch more tweets')
      }

      setTweets([...tweets, ...data.tweets])
      setTotalTweets(data.total)
      setNextCursor(data.nextCursor)
    } catch (err) {
      setError(err.message)
    } finally {
      setFetchLoading(false)
    }
  }

  const handleReset = () => {
    setStep('auth')
    setCredentials(null)
    setTweets([])
    setTotalTweets(0)
    setNextCursor(null)
    setError('')
    setTotalDeleted(0)
    setLastBatchDeleted(0)
  }

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const { remaining } = canDeleteTweets()

  // Auth Step
  if (step === 'auth') {
    return (
      <div className="app-container">
        <nav className="app-nav">
          <Link href="/dashboard" className="btn-secondary btn-sm">
            &#8592; Dashboard
          </Link>
          {!isPaid && (
            <div className="usage-badge">
              {remaining} deletions remaining today
            </div>
          )}
          {isPaid && (
            <div className="usage-badge pro">
              Unlimited deletions
            </div>
          )}
        </nav>

        <div className="app-header">
          <h1 className="app-logo">XDeleter</h1>
          <p className="app-tagline">Connect your Twitter account to get started</p>
        </div>

        <div style={{ width: '100%', maxWidth: '480px' }}>
          {error && (
            <div className="message error">
              <span className="message-icon">&#9888;</span>
              {error}
            </div>
          )}
          <AuthForm onSubmit={handleAuth} loading={fetchLoading} onBack={() => router.push('/dashboard')} />
        </div>
      </div>
    )
  }

  // Tweets Step
  return (
    <div className="app-container">
      <nav className="app-nav">
        <Link href="/dashboard" className="btn-secondary btn-sm">
          &#8592; Dashboard
        </Link>
        {!isPaid && (
          <div className="usage-badge">
            {remaining} deletions remaining today
          </div>
        )}
        {isPaid && (
          <div className="usage-badge pro">
            Unlimited deletions
          </div>
        )}
      </nav>

      <div className="app-header">
        <h1 className="app-logo">XDeleter</h1>
        <p className="app-tagline">Select tweets to delete</p>
      </div>

      <div style={{ width: '100%', maxWidth: '640px' }}>
        {error && (
          <div className="message error">
            <span className="message-icon">&#9888;</span>
            {error}
          </div>
        )}

        <TweetList
          tweets={tweets}
          totalTweets={totalTweets}
          totalDeleted={totalDeleted}
          lastBatchDeleted={lastBatchDeleted}
          onDeleteSelected={handleDeleteSelected}
          onLoadMore={handleLoadMore}
          onReset={handleReset}
          loading={fetchLoading}
          deleting={deleting}
          maxSelection={isPaid ? 25 : Math.min(25, remaining)}
        />
      </div>
    </div>
  )
}