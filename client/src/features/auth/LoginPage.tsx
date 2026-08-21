import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { ApiError } from '../../lib/apiClient';
import { IconAlert, IconBowl, IconEye, IconEyeOff } from '../../components/Icons';

// The admin login form at /admin/login.
// Flow: form submit -> useAuth().login() -> authService -> apiClient POST
// /auth/login -> backend controller/service verifies the password and sets
// the JWT auth cookie -> AuthContext stores the returned user -> this page
// navigates to the dashboard.
export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Holds the message shown in the form when login fails (e.g. wrong
  // credentials); cleared on each new submit attempt.
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If the session check already found a logged-in user, skip the login
  // form entirely and go straight to the dashboard.
  if (!loading && user) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      // ApiError carries the backend's actual message (e.g. "Invalid email
      // or password"); anything else falls back to a generic message so no
      // unexpected technical error ever reaches the user.
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="hero-icon">
            <IconBowl />
          </div>
          <h1>Canteen Management</h1>
          <p>Sign in to manage sales, menu and inventory.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="form-alert" role="alert">
              <IconAlert />
              <span>{error}</span>
            </div>
          )}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input
                id="password"
                className="input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
