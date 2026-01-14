'use client'

import { useState } from 'react'

export default function AuthForm({ onSubmit, loading, onBack }) {
  const [authToken, setAuthToken] = useState('')
  const [csrfToken, setCsrfToken] = useState('')
  const [showInstructions, setShowInstructions] = useState(true)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!authToken.trim() || !csrfToken.trim()) return
    onSubmit({ authToken: authToken.trim(), csrfToken: csrfToken.trim() })
  }

  return (
    <div className="card animate-scale-in">
      <div className="card-header">
        <h2 className="card-title">Connect Your Account</h2>
        <p className="card-subtitle">We need your session cookies to access your tweets</p>
      </div>

      {showInstructions && (
        <div className="instructions">
          <div className="instructions-title">
            <span>&#128273;</span>
            How to get your cookies
          </div>
          <ol className="instructions-list">
            <li>Open <strong>x.com</strong> and make sure you're logged in</li>
            <li>Press <strong>F12</strong> to open Developer Tools</li>
            <li>Go to <strong>Application</strong> tab &rarr; <strong>Cookies</strong> &rarr; <strong>x.com</strong></li>
            <li>Find and copy these values:
              <div className="code-block">
                <div><strong>auth_token</strong> - Your session token</div>
                <div><strong>ct0</strong> - Your CSRF token</div>
              </div>
            </li>
          </ol>
          <button
            type="button"
            className="btn-ghost btn-sm w-full mt-2"
            onClick={() => setShowInstructions(false)}
          >
            Hide instructions
          </button>
        </div>
      )}

      {!showInstructions && (
        <button
          type="button"
          className="btn-ghost btn-sm w-full mb-3"
          onClick={() => setShowInstructions(true)}
        >
          Show instructions
        </button>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="authToken">
            auth_token
          </label>
          <input
            id="authToken"
            type="text"
            className="form-input"
            value={authToken}
            onChange={(e) => setAuthToken(e.target.value)}
            placeholder="Paste your auth_token here"
            disabled={loading}
            autoComplete="off"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="csrfToken">
            ct0 (CSRF Token)
          </label>
          <input
            id="csrfToken"
            type="text"
            className="form-input"
            value={csrfToken}
            onChange={(e) => setCsrfToken(e.target.value)}
            placeholder="Paste your ct0 token here"
            disabled={loading}
            autoComplete="off"
          />
        </div>

        <div className="actions-bar">
          <button
            type="button"
            className="btn-secondary"
            onClick={onBack}
            disabled={loading}
          >
            Back
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !authToken.trim() || !csrfToken.trim()}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Connecting...
              </>
            ) : (
              'Connect Account'
            )}
          </button>
        </div>
      </form>

      <div className="divider"></div>

      <div className="message info">
        <span className="message-icon">&#128274;</span>
        <span>Your credentials are only used for this session and are never stored on any server.</span>
      </div>
    </div>
  )
}
