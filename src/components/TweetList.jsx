'use client'

import { useState, useEffect } from 'react'

export default function TweetList({
  tweets,
  totalTweets,
  totalDeleted,
  lastBatchDeleted,
  onDeleteSelected,
  onLoadMore,
  onReset,
  loading,
  deleting,
  maxSelection = 25
}) {
  const [selected, setSelected] = useState(new Set())
  const [filters, setFilters] = useState({
    original: true,
    retweet: true,
    reply: true
  })

  // Filter tweets based on selected filters
  const filteredTweets = tweets.filter(tweet => {
    if (filters.original && tweet.tweetType === 'original') return true
    if (filters.retweet && tweet.tweetType === 'retweet') return true
    if (filters.reply && tweet.tweetType === 'reply') return true
    return false
  })

  const toggleFilter = (filterType) => {
    const newFilters = { ...filters, [filterType]: !filters[filterType] }
    // Ensure at least one filter is active
    if (Object.values(newFilters).some(v => v)) {
      setFilters(newFilters)
      // Clear selection when filters change
      setSelected(new Set())
    }
  }

  useEffect(() => {
    setSelected(new Set())
  }, [tweets.length])

  const toggleSelect = (id) => {
    const newSelected = new Set(selected)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      if (newSelected.size < maxSelection) {
        newSelected.add(id)
      }
    }
    setSelected(newSelected)
  }

  const selectAll = () => {
    const newSelected = new Set(filteredTweets.slice(0, maxSelection).map(t => t.id))
    setSelected(newSelected)
  }

  const deselectAll = () => {
    setSelected(new Set())
  }

  const handleDelete = () => {
    const selectedTweets = tweets.filter(t => selected.has(t.id))
    onDeleteSelected(selectedTweets)
  }

  const allSelected = filteredTweets.length > 0 && selected.size === Math.min(maxSelection, filteredTweets.length)

  // All tweets deleted view
  if (tweets.length === 0 && totalTweets === 0) {
    return (
      <div className="card animate-scale-in text-center">
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>&#127881;</div>
        <h2 className="card-title">All Done!</h2>
        <p className="card-subtitle mb-3">
          You've deleted {totalDeleted} tweets successfully.
        </p>
        <button className="btn-primary" onClick={onReset}>
          Start Over
        </button>
      </div>
    )
  }

  // Need to load more tweets
  if (tweets.length === 0 && totalTweets > 0) {
    return (
      <div className="card animate-scale-in">
        <div className="message success">
          <span className="message-icon">&#10003;</span>
          <span>Batch deleted! {totalDeleted} tweets removed so far.</span>
        </div>

        <div className="text-center" style={{ padding: '32px 0' }}>
          <p className="card-subtitle mb-3">
            There are more tweets to load. Continue?
          </p>
          <div className="actions-bar" style={{ justifyContent: 'center' }}>
            <button className="btn-secondary" onClick={onReset}>
              Done for Now
            </button>
            <button
              className="btn-primary"
              onClick={onLoadMore}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Loading...
                </>
              ) : (
                'Load More Tweets'
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card animate-scale-in">
      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-value">{totalTweets}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{tweets.length}</div>
          <div className="stat-label">Loaded</div>
        </div>
        <div className="stat-item">
          <div className="stat-value selected">{selected.size}</div>
          <div className="stat-label">Selected</div>
        </div>
        <div className="stat-item">
          <div className="stat-value deleted">{totalDeleted}</div>
          <div className="stat-label">Deleted</div>
        </div>
      </div>

      {/* Success Message */}
      {lastBatchDeleted > 0 && (
        <div className="message success">
          <span className="message-icon">&#10003;</span>
          <span>{lastBatchDeleted} tweets deleted successfully!</span>
        </div>
      )}

      {/* Deleting State */}
      {deleting && (
        <div className="loading-state">
          <div className="spinner spinner-lg"></div>
          <p className="loading-text">Deleting {selected.size} tweets...</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
            This may take a moment
          </p>
        </div>
      )}

      {/* Tweet List */}
      {!deleting && (
        <>
          {/* Filters */}
          <div className="tweet-filters">
            <label className={`filter-chip ${filters.original ? 'active' : ''}`}>
              <input
                type="checkbox"
                checked={filters.original}
                onChange={() => toggleFilter('original')}
              />
              <span className="filter-icon">&#128172;</span>
              Tweets
            </label>
            <label className={`filter-chip ${filters.retweet ? 'active' : ''}`}>
              <input
                type="checkbox"
                checked={filters.retweet}
                onChange={() => toggleFilter('retweet')}
              />
              <span className="filter-icon">&#128257;</span>
              Retweets/Quotes
            </label>
            <label className={`filter-chip ${filters.reply ? 'active' : ''}`}>
              <input
                type="checkbox"
                checked={filters.reply}
                onChange={() => toggleFilter('reply')}
              />
              <span className="filter-icon">&#8617;</span>
              Replies
            </label>
          </div>

          <div className="tweet-list-header">
            <span className="tweet-list-title">
              {filteredTweets.length === 0 ? 'No tweets match filters' : `Your Tweets (${Math.min(maxSelection, filteredTweets.length)} shown)`}
            </span>
            <button
              className="btn-ghost btn-sm"
              onClick={allSelected ? deselectAll : selectAll}
              disabled={deleting || filteredTweets.length === 0}
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="tweet-list">
            {filteredTweets.slice(0, maxSelection).map((tweet, index) => (
              <div
                key={tweet.id}
                className={`tweet-item ${selected.has(tweet.id) ? 'selected' : ''}`}
                onClick={() => !deleting && toggleSelect(tweet.id)}
                style={{
                  animationDelay: `${index * 0.03}s`,
                  animation: 'fadeIn 0.3s ease-out both'
                }}
              >
                <input
                  type="checkbox"
                  className="tweet-checkbox"
                  checked={selected.has(tweet.id)}
                  onChange={() => toggleSelect(tweet.id)}
                  disabled={deleting || (!selected.has(tweet.id) && selected.size >= maxSelection)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="tweet-content">
                  <div className="tweet-text">{tweet.text}</div>
                  <div className="tweet-meta">
                    <span className={`tweet-type tweet-type-${tweet.tweetType}`}>
                      {tweet.tweetType === 'original' && '● Tweet'}
                      {tweet.tweetType === 'retweet' && '↻ RT/Quote'}
                      {tweet.tweetType === 'reply' && '↩ Reply'}
                    </span>
                    <span>{tweet.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Info */}
          {filteredTweets.length > maxSelection && (
            <div className="message info mt-2">
              <span className="message-icon">&#128161;</span>
              <span>Showing first {maxSelection} of {filteredTweets.length} filtered tweets. Delete some to see more.</span>
            </div>
          )}

          {selected.size >= maxSelection && (
            <div className="message warning mt-2">
              <span className="message-icon">&#9888;</span>
              <span>Maximum {maxSelection} tweets can be deleted at once.</span>
            </div>
          )}

          {/* Actions */}
          <div className="actions-bar">
            <button
              className="btn-secondary"
              onClick={onReset}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              className="btn-danger"
              onClick={handleDelete}
              disabled={deleting || loading || selected.size === 0}
            >
              Delete {selected.size} Tweet{selected.size !== 1 ? 's' : ''}
            </button>
          </div>

          {/* Load More */}
          {tweets.length < totalTweets && (
            <button
              className="btn-ghost w-full mt-2"
              onClick={onLoadMore}
              disabled={loading || deleting}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Loading...
                </>
              ) : (
                `Load More (${totalTweets - tweets.length} remaining)`
              )}
            </button>
          )}
        </>
      )}
    </div>
  )
}
