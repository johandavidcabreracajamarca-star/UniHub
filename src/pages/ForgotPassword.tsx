import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { authService } from '../services/authService';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await authService.requestPasswordReset(email);
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 py-12">
      <div className="w-full max-w-sm">
        <Link to="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink/60">
          <ArrowLeft size={16} />
          Volver a inicio de sesión
        </Link>

        {sent ? (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
              <MailCheck size={22} />
            </div>
            <h1 className="text-lg font-bold text-ink">Revisa tu correo</h1>
            <p className="mt-1.5 text-sm text-ink/50">
              Si <strong>{email}</strong> está registrado, te enviamos un enlace para restablecer tu
              contraseña.
            </p>
          </div>
        ) : (
          <>
            <h1 className="mb-1 text-xl font-bold text-ink">¿Olvidaste tu contraseña?</h1>
            <p className="mb-6 text-sm text-ink/50">
              Ingresa tu correo institucional y te enviaremos instrucciones para restablecerla.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Correo institucional"
                type="email"
                placeholder="nombre@universidadean.edu.co"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" size="lg" fullWidth loading={loading}>
                Enviar instrucciones
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
