'use client';

import React, { useState, type FormEvent } from 'react';
import { Input } from '@flexcms/ui';
import { Label } from '@flexcms/ui';

// ---------------------------------------------------------------------------
// LoginPage — FlexCMS Admin authentication page
//
// Design reference: Design/UI/stitch_flexcms_admin_ui_requirements_summary/login_page/
// ---------------------------------------------------------------------------

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Redirect to the configured IdP's OAuth2 authorization endpoint.
      // In production this will be handled by NextAuth.js or a custom OAuth flow.
      window.location.href = `/api/auth/login?hint=${encodeURIComponent(email)}`;
    } catch {
      setError('Unable to sign in. Please check your credentials and try again.');
      setLoading(false);
    }
  }

  function handleSsoLogin() {
    window.location.href = '/api/auth/sso';
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden"
      style={{ backgroundColor: '#131313', color: '#e5e2e1' }}
    >
      {/* Ambient background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full blur-[120px]"
          style={{ background: 'rgba(176, 198, 255, 0.05)' }}
        />
        <div
          className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full blur-[120px]"
          style={{ background: 'rgba(0, 88, 204, 0.10)' }}
        />
      </div>

      {/* Desktop side decorative panel */}
      <div
        className="hidden lg:block fixed right-0 top-0 w-1/3 h-screen"
        style={{ opacity: 0.4 }}
        aria-hidden="true"
      >
        <div className="w-full h-full relative">
          {/* Gradient overlay so the image fades into the background */}
          <div
            className="absolute inset-0 z-10"
            style={{ background: 'linear-gradient(to left, transparent, #131313 80%)' }}
          />
          {/* Abstract architectural decoration */}
          <div
            className="w-full h-full"
            style={{
              background: 'linear-gradient(135deg, #1c1b1b 0%, #0e0e0e 50%, #201f1f 100%)',
              filter: 'grayscale(1)',
            }}
          />
        </div>
      </div>

      {/* Main login container */}
      <main className="relative w-full max-w-[440px] z-10">

        {/* Logo section */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(135deg, #b0c6ff 0%, #0058cc 100%)',
              boxShadow: '0 20px 40px rgba(176, 198, 255, 0.2)',
            }}
            aria-hidden="true"
          >
            <LogoIcon />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">FlexCMS</h1>
          <p className="text-sm font-medium tracking-wide" style={{ color: '#c3c6d6' }}>
            ENTERPRISE CONTENT ORCHESTRATION
          </p>
        </div>

        {/* Login card */}
        <div
          className="rounded-xl p-8 relative overflow-hidden"
          style={{
            background: 'rgba(32, 31, 31, 0.8)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 32px 64px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Top inner border glow */}
          <div
            className="absolute top-0 left-0 w-full h-px"
            style={{ background: 'linear-gradient(to right, transparent, rgba(176, 198, 255, 0.2), transparent)' }}
            aria-hidden="true"
          />

          <div className="space-y-6">
            {/* Card heading */}
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-white">Sign In</h2>
              <p className="text-sm" style={{ color: '#c3c6d6' }}>
                Enter your credentials to access the console
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div
                className="rounded-lg px-4 py-3 text-sm"
                role="alert"
                style={{ background: 'rgba(147, 0, 10, 0.3)', color: '#ffdad6', border: '1px solid rgba(255, 180, 171, 0.2)' }}
              >
                {error}
              </div>
            )}

            {/* Credentials form */}
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-xs font-bold uppercase tracking-widest ml-1"
                  style={{ color: '#c3c6d6' }}
                >
                  Email Address
                </Label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full py-3 px-4 rounded-lg text-sm outline-none transition-all duration-300"
                    style={{
                      background: '#353534',
                      color: '#e5e2e1',
                      border: 'none',
                      borderBottom: '2px solid transparent',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = '#b0c6ff')}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}
                  />
                  <div
                    className="absolute inset-x-0 bottom-0 h-px"
                    style={{ background: 'rgba(66, 70, 84, 0.2)' }}
                    aria-hidden="true"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <Label
                    htmlFor="password"
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: '#c3c6d6' }}
                  >
                    Password
                  </Label>
                  <a
                    href="/login/forgot-password"
                    className="text-[11px] font-bold uppercase tracking-tight transition-colors"
                    style={{ color: '#b0c6ff' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#d9e2ff')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#b0c6ff')}
                  >
                    Forgot Password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full py-3 px-4 rounded-lg text-sm outline-none transition-all duration-300"
                    style={{
                      background: '#353534',
                      color: '#e5e2e1',
                      border: 'none',
                      borderBottom: '2px solid transparent',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = '#b0c6ff')}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}
                  />
                  <div
                    className="absolute inset-x-0 bottom-0 h-px"
                    style={{ background: 'rgba(66, 70, 84, 0.2)' }}
                    aria-hidden="true"
                  />
                </div>
              </div>

              {/* Sign In button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-lg font-bold flex items-center justify-center gap-2 mt-4 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed group"
                style={{
                  background: 'linear-gradient(135deg, #b0c6ff 0%, #0058cc 100%)',
                  color: '#002d6f',
                  boxShadow: '0 8px 24px rgba(176, 198, 255, 0.1)',
                }}
              >
                {loading ? (
                  <SpinnerIcon />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRightIcon className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* SSO divider */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow h-px" style={{ background: 'rgba(66, 70, 84, 0.15)' }} />
              <span
                className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: '#c3c6d6' }}
              >
                Enterprise SSO
              </span>
              <div className="flex-grow h-px" style={{ background: 'rgba(66, 70, 84, 0.15)' }} />
            </div>

            {/* SSO button */}
            <button
              type="button"
              onClick={handleSsoLogin}
              className="w-full py-3 rounded-lg flex items-center justify-center gap-3 font-semibold text-sm transition-all duration-200"
              style={{
                background: '#2a2a2a',
                border: '1px solid rgba(66, 70, 84, 0.1)',
                color: '#e5e2e1',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#353534')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#2a2a2a')}
            >
              <OktaLogo />
              <span>Continue with Okta</span>
            </button>
          </div>
        </div>

        {/* Footer links */}
        <footer className="mt-8 flex justify-center gap-6 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#c3c6d6' }}>
          <a
            href="/privacy"
            className="transition-colors hover:text-white"
          >
            Privacy Policy
          </a>
          <span className="w-1 h-1 rounded-full mt-1.5" style={{ background: 'rgba(66, 70, 84, 0.3)' }} aria-hidden="true" />
          <a
            href="/status"
            className="transition-colors hover:text-white"
          >
            Service Status
          </a>
          <span className="w-1 h-1 rounded-full mt-1.5" style={{ background: 'rgba(66, 70, 84, 0.3)' }} aria-hidden="true" />
          <a
            href="/support"
            className="transition-colors hover:text-white"
          >
            Contact Support
          </a>
        </footer>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function LogoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={{ color: '#002d6f' }}
    >
      {/* Dataset icon (simplified) */}
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-spin"
      aria-label="Loading"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function OktaLogo() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-label="Okta">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 18c-3.315 0-6-2.685-6-6s2.685-6 6-6 6 2.685 6 6-2.685 6-6 6z" fill="#007DC1" />
    </svg>
  );
}
