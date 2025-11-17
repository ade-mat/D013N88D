import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface AuthPanelProps {
  onSkip?: () => void;
}

type AuthMode = 'signIn' | 'signUp';

const AuthPanel = ({ onSkip }: AuthPanelProps) => {
  const { signIn, signUp, sendPasswordReset } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (submitting) {
      return;
    }

    setError(null);
    const normalisedEmail = email.trim();
    if (!normalisedEmail) {
      setError('Email is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (mode === 'signUp' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      if (mode === 'signIn') {
        await signIn(normalisedEmail, password);
      } else {
        await signUp(normalisedEmail, password);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Authentication request failed.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'signIn' ? 'signUp' : 'signIn'));
    setError(null);
    setConfirmPassword('');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>{mode === 'signIn' ? 'Log in to Emberfall Ascent' : 'Create your Emberfall account'}</h2>
          <p>Sync your hero&apos;s story and continue the adventure from any device.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
              required
            />
          </label>
          {mode === 'signUp' && (
            <label>
              <span>Confirm password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
            </label>
          )}

          {mode === 'signIn' && (
            <button
              type="button"
              className="auth-forgot"
              onClick={async () => {
                if (!email.trim()) {
                  setError('Enter your email to reset your password.');
                  return;
                }
                try {
                  setSubmitting(true);
                  await sendPasswordReset(email.trim());
                  setError('Password reset email sent. Check your inbox.');
                } catch (err) {
                  const message =
                    err instanceof Error ? err.message : 'Failed to send reset email.';
                  setError(message);
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              Forgot your password?
            </button>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting
              ? 'Please wait…'
              : mode === 'signIn'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        <div className="auth-divider" />

        <button className="auth-toggle" type="button" onClick={toggleMode}>
          {mode === 'signIn'
            ? 'Need an account? Create one now.'
            : 'Already have an account? Sign in.'}
        </button>

        {onSkip && (
          <button className="auth-skip" type="button" onClick={onSkip}>
            Continue without an account
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthPanel;
