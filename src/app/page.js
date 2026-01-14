'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import AuthForm from '../components/AuthForm'
import TweetList from '../components/TweetList'

export default function Home() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState('landing') // landing, auth, tweets
  const [credentials, setCredentials] = useState(null)
  const [tweets, setTweets] = useState([])
  const [totalTweets, setTotalTweets] = useState(0)
  const [nextCursor, setNextCursor] = useState(null)
  const [error, setError] = useState('')
  const [fetchLoading, setFetchLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [totalDeleted, setTotalDeleted] = useState(0)
  const [lastBatchDeleted, setLastBatchDeleted] = useState(0)

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
    setDeleting(true)
    setLastBatchDeleted(0)

    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...credentials,
          tweetIds: selectedTweets.map(t => t.id)
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete tweets')
      }

      const deletedIds = new Set(selectedTweets.map(t => t.id))
      setTweets(tweets.filter(t => !deletedIds.has(t.id)))
      setTotalDeleted(prev => prev + data.deleted)
      setLastBatchDeleted(data.deleted)
      setTotalTweets(prev => prev - data.deleted)
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

  // Landing Page
  if (step === 'landing') {
    return (
      <div className="landing">
        {/* Navbar */}
        <nav className="navbar">
          <div className="container">
            <div className="navbar-content">
              <div className="logo">
                <div className="logo-icon">X</div>
                XDeleter
              </div>
              {user ? (
                <Link href="/dashboard" className="btn-primary btn-sm">
                  Dashboard
                </Link>
              ) : (
                <Link href="/login" className="btn-primary btn-sm">
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="hero">
          <div className="container">
            <div className="hero-badge">
              <span className="hero-badge-dot"></span>
              Free & Open Source
            </div>

            <h1 className="hero-title">
              Clean Your <span className="hero-title-gradient">Twitter</span> History
            </h1>

            <p className="hero-subtitle">
              Bulk delete your tweets in seconds. Take control of your digital footprint
              with our fast, secure, and easy-to-use tool.
            </p>

            <div className="hero-cta">
              <Link href={user ? "/app" : "/register"} className="btn-primary btn-lg">
                Start Deleting Now
              </Link>
              <button className="btn-secondary btn-lg" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
                Learn More
              </button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="features" id="features">
          <div className="container">
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">&#9889;</div>
                <h3 className="feature-title">Lightning Fast</h3>
                <p className="feature-desc">
                  Delete up to 25 tweets at once with our optimized batch processing.
                  Clean years of tweets in minutes.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">&#128274;</div>
                <h3 className="feature-title">Secure & Private</h3>
                <p className="feature-desc">
                  Your credentials are never stored. Everything happens in your browser
                  session and is cleared when you're done.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">&#127919;</div>
                <h3 className="feature-title">Selective Control</h3>
                <p className="feature-desc">
                  Choose exactly which tweets to delete. Preview your content before
                  removing it permanently.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Comparison */}
        <section className="pricing" id="pricing">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">
                The <span className="hero-title-gradient">Cheapest</span> Option. Period.
              </h2>
              <p className="section-subtitle">
                Compare us to the competition. We're open-source and cost a fraction of the price.
              </p>
            </div>

            {/* Comparison Table */}
            <div className="comparison-table">
              <div className="comparison-header">
                <div className="comparison-cell">Feature</div>
                <div className="comparison-cell highlight">XDeleter</div>
                <div className="comparison-cell">TweetDeleter</div>
                <div className="comparison-cell">TweetDelete</div>
                <div className="comparison-cell">Circleboom</div>
              </div>

              <div className="comparison-row">
                <div className="comparison-cell label">Monthly Price</div>
                <div className="comparison-cell highlight price">$1.99</div>
                <div className="comparison-cell price">$3.99</div>
                <div className="comparison-cell price">$3.99</div>
                <div className="comparison-cell price">$4.99</div>
              </div>

              <div className="comparison-row">
                <div className="comparison-cell label">Lifetime Access</div>
                <div className="comparison-cell highlight price">$9.99</div>
                <div className="comparison-cell price">$99.99</div>
                <div className="comparison-cell price">$14.99</div>
                <div className="comparison-cell price">N/A</div>
              </div>

              <div className="comparison-row">
                <div className="comparison-cell label">Open Source</div>
                <div className="comparison-cell highlight">&#10003;</div>
                <div className="comparison-cell">&#10007;</div>
                <div className="comparison-cell">&#10007;</div>
                <div className="comparison-cell">&#10007;</div>
              </div>

              <div className="comparison-row">
                <div className="comparison-cell label">No Data Collection</div>
                <div className="comparison-cell highlight">&#10003;</div>
                <div className="comparison-cell">&#10007;</div>
                <div className="comparison-cell">&#10007;</div>
                <div className="comparison-cell">&#10007;</div>
              </div>

              <div className="comparison-row">
                <div className="comparison-cell label">Unlimited Deletes</div>
                <div className="comparison-cell highlight">&#10003;</div>
                <div className="comparison-cell">$7.99/mo</div>
                <div className="comparison-cell">&#10007;</div>
                <div className="comparison-cell">$47/mo</div>
              </div>

              <div className="comparison-row">
                <div className="comparison-cell label">No Account Required</div>
                <div className="comparison-cell highlight">&#10003;</div>
                <div className="comparison-cell">&#10007;</div>
                <div className="comparison-cell">&#10007;</div>
                <div className="comparison-cell">&#10007;</div>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="pricing-grid">
              <div className="pricing-card">
                <div className="pricing-badge">Free</div>
                <div className="pricing-price">
                  <span className="pricing-amount">$0</span>
                  <span className="pricing-period">forever</span>
                </div>
                <ul className="pricing-features">
                  <li>&#10003; 50 tweets per day</li>
                  <li>&#10003; Manual selection</li>
                  <li>&#10003; No account needed</li>
                  <li>&#10003; Open source</li>
                </ul>
                <Link href={user ? "/app" : "/register"} className="btn-secondary w-full">
                  Get Started
                </Link>
              </div>

              <div className="pricing-card featured">
                <div className="pricing-badge">Pro</div>
                <div className="pricing-popular">Most Popular</div>
                <div className="pricing-price">
                  <span className="pricing-amount">$1.99</span>
                  <span className="pricing-period">/month</span>
                </div>
                <ul className="pricing-features">
                  <li>&#10003; Unlimited tweets</li>
                  <li>&#10003; Archive upload</li>
                  <li>&#10003; Auto-delete scheduling</li>
                  <li>&#10003; Priority support</li>
                  <li>&#10003; All free features</li>
                </ul>
                <Link href={user ? "/dashboard" : "/register"} className="btn-primary w-full">
                  Start Free Trial
                </Link>
              </div>

              <div className="pricing-card">
                <div className="pricing-badge">Lifetime</div>
                <div className="pricing-price">
                  <span className="pricing-amount">$9.99</span>
                  <span className="pricing-period">one-time</span>
                </div>
                <ul className="pricing-features">
                  <li>&#10003; Everything in Pro</li>
                  <li>&#10003; Lifetime updates</li>
                  <li>&#10003; No recurring fees</li>
                  <li>&#10003; Support the project</li>
                </ul>
                <Link href={user ? "/dashboard" : "/register"} className="btn-secondary w-full">
                  Get Lifetime
                </Link>
              </div>
            </div>

            <div className="pricing-note">
              <span>&#128161;</span>
              <span>
                <strong>Why so cheap?</strong> We're open-source and community-driven.
                No VC funding, no bloated teams, no hidden fees. Just a simple tool that works.
              </span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="container">
            <p className="footer-text">
              Built with care. Not affiliated with X/Twitter.
            </p>
          </div>
        </footer>
      </div>
    )
  }

  // Auth Step
  if (step === 'auth') {
    return (
      <div className="app-container">
        <div className="app-header">
          <h1 className="app-logo">XDeleter</h1>
          <p className="app-tagline">Connect your account to get started</p>
        </div>

        <div style={{ width: '100%', maxWidth: '480px' }}>
          {error && (
            <div className="message error">
              <span className="message-icon">&#9888;</span>
              {error}
            </div>
          )}
          <AuthForm onSubmit={handleAuth} loading={fetchLoading} onBack={() => setStep('landing')} />
        </div>
      </div>
    )
  }

  // Tweets Step
  return (
    <div className="app-container">
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
        />
      </div>
    </div>
  )
}