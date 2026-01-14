'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

function DashboardContent() {
  const { user, profile, loading, signOut, isPaid, refreshProfile } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Refresh profile when returning from Gumroad checkout
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      // Give webhook time to process, then refresh
      const timer = setTimeout(() => {
        refreshProfile()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [searchParams, refreshProfile])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const getTierBadge = () => {
    if (profile?.subscription_tier === 'lifetime') {
      return <span className="tier-badge lifetime">Lifetime</span>
    }
    if (profile?.subscription_tier === 'pro' && profile?.subscription_status === 'active') {
      return <span className="tier-badge pro">Pro</span>
    }
    return <span className="tier-badge free">Free</span>
  }

  const today = new Date().toISOString().split('T')[0]
  const deletedToday = profile?.last_deletion_date === today ? profile?.tweets_deleted_today || 0 : 0
  const remainingToday = isPaid ? 'Unlimited' : Math.max(0, 50 - deletedToday)

  // Build Gumroad URLs with user info
  const proUrl = `${process.env.NEXT_PUBLIC_GUMROAD_PRO_URL}?email=${encodeURIComponent(user.email)}&wanted=true`
  const lifetimeUrl = `${process.env.NEXT_PUBLIC_GUMROAD_LIFETIME_URL}?email=${encodeURIComponent(user.email)}&wanted=true`

  return (
    <div className="dashboard-page">
      <nav className="dashboard-nav">
        <Link href="/" className="auth-logo">
          <div className="logo-icon">X</div>
          XDeleter
        </Link>
        <button onClick={handleSignOut} className="btn-secondary btn-sm">
          Sign Out
        </button>
      </nav>

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Manage your account and subscription</p>
        </div>

        {searchParams.get('success') === 'true' && (
          <div className="message success" style={{ maxWidth: '600px', margin: '0 auto 24px' }}>
            <span className="message-icon">&#10003;</span>
            <span>Payment successful! Your account is being upgraded...</span>
          </div>
        )}

        <div className="dashboard-grid">
          {/* Account Card */}
          <div className="dashboard-card">
            <h2 className="card-title">Account</h2>
            <div className="card-content">
              <div className="info-row">
                <span className="info-label">Email</span>
                <span className="info-value">{user.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Plan</span>
                <span className="info-value">{getTierBadge()}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Tweets deleted today</span>
                <span className="info-value">{deletedToday}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Remaining today</span>
                <span className="info-value">{remainingToday}</span>
              </div>
            </div>
            <Link href="/app" className="btn-primary w-full">
              Start Deleting Tweets
            </Link>
          </div>

          {/* Subscription Card */}
          <div className="dashboard-card">
            <h2 className="card-title">Subscription</h2>

            {isPaid ? (
              <div className="card-content">
                <div className="subscription-active">
                  <div className="subscription-icon">&#10003;</div>
                  <h3>You have {profile?.subscription_tier === 'lifetime' ? 'Lifetime' : 'Pro'} access</h3>
                  <p>Enjoy unlimited tweet deletions!</p>
                </div>
                {profile?.subscription_tier === 'pro' && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    To manage your subscription, check your email for the receipt from Gumroad.
                  </p>
                )}
              </div>
            ) : (
              <div className="card-content">
                <p className="upgrade-text">
                  Upgrade to remove the 50 tweets/day limit and unlock unlimited deletions.
                </p>

                <div className="upgrade-options">
                  <div className="upgrade-option">
                    <div className="upgrade-header">
                      <span className="upgrade-name">Pro Monthly</span>
                      <span className="upgrade-price">$1.99/mo</span>
                    </div>
                    <a
                      href={proUrl}
                      className="gumroad-button btn-primary w-full"
                      data-gumroad-overlay-checkout="true"
                    >
                      Subscribe
                    </a>
                  </div>

                  <div className="upgrade-option featured">
                    <div className="upgrade-badge">Best Value</div>
                    <div className="upgrade-header">
                      <span className="upgrade-name">Lifetime</span>
                      <span className="upgrade-price">$9.99 once</span>
                    </div>
                    <a
                      href={lifetimeUrl}
                      className="gumroad-button btn-primary w-full"
                      data-gumroad-overlay-checkout="true"
                    >
                      Get Lifetime
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="dashboard-page"><div className="loading-spinner">Loading...</div></div>}>
      <DashboardContent />
    </Suspense>
  )
}
