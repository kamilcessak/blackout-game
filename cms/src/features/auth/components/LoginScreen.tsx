import { useState, type FormEvent } from 'react';
import { Zap, LogIn } from 'lucide-react';
import axios from 'axios';
import { login } from '../../../api/client';
import { styles } from '../../../styles/shared';

interface LoginScreenProps {
  onSuccess: () => void;
}

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      onSuccess();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? 'Nieprawidłowy email lub hasło.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Logowanie nie powiodło się.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ ...styles.card, width: '100%', maxWidth: 380 }}>
        <div style={styles.cardHeader}>
          <div style={styles.logoBox}>
            <Zap size={20} color="#fff" />
          </div>
          <div>
            <h1 style={styles.cardTitle}>Blackout — Panel Zarządzania</h1>
            <p style={styles.headerSub}>Zaloguj się jako administrator</p>
          </div>
        </div>

        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="password">
              Hasło
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            style={{ ...styles.submitBtn, opacity: submitting ? 0.6 : 1 }}
            disabled={submitting}
          >
            <LogIn size={16} />
            {submitting ? 'Logowanie…' : 'Zaloguj się'}
          </button>
        </form>
      </div>
    </div>
  );
}
