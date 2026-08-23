import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { authService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export function Login() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await authService.login(email, password);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    await refresh();
    navigate('/explore');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
            <ShoppingBag size={22} />
          </div>
          <h1 className="text-xl font-bold text-ink">Bienvenido de nuevo</h1>
          <p className="mt-1 text-sm text-ink/50">Inicia sesión con tu correo institucional</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-control bg-secondary-light px-3.5 py-2.5 text-xs text-secondary">
            Modo demo: usa <strong>yohan.demo@universidadean.edu.co</strong> / <strong>demo1234</strong>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Correo institucional"
            type="email"
            placeholder="nombre@universidadean.edu.co"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Link to="/forgot-password" className="self-end text-sm font-medium text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>

          <Button type="submit" size="lg" fullWidth loading={loading}>
            Iniciar sesión
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink/50">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}
