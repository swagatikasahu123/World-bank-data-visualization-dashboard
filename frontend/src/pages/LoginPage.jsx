import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Globe } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
    } catch {
      setError('Invalid username or password. Try demo / demo123');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <Globe size={18} color="#0a0a0a" strokeWidth={2.5} />
          </div>
          <h1>Global<span>Pulse</span></h1>
        </div>

        <h2>Welcome back</h2>
        <p>Sign in to access the World Bank dashboard</p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="demo"
              value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required
            />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        <div className="login-hint">
          <p>Demo credentials: <strong>demo</strong> / <strong>demo123</strong></p>
          <p style={{ marginTop: '4px' }}>Admin: <strong>admin</strong> / <strong>admin123</strong></p>
        </div>
      </div>
    </div>
  );
}
