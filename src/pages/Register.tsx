import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Eye, EyeOff, Check, MailCheck } from 'lucide-react';
import { Button } from '../components/Button';
import { Input, Select } from '../components/Input';
import { authService } from '../services/authService';
import { universityService } from '../services/universityService';
import { useAuth } from '../hooks/useAuth';
import type { Faculty, University } from '../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOTAL_STEPS = 3;

export function Register() {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const [universities, setUniversities] = useState<University[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);

  const [step, setStep] = useState(1);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [universityId, setUniversityId] = useState('');
  const [facultyId, setFacultyId] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Cuando la cuenta se crea pero falta confirmar el correo, guardamos a qué
  // correo se envió el enlace para mostrar la pantalla "Revisa tu correo".
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    universityService.listUniversities().then((list) => {
      setUniversities(list);
      if (list.length > 0) setUniversityId(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!universityId) return;
    universityService.listFaculties(universityId).then((list) => {
      setFaculties(list);
      if (list.length > 0) setFacultyId(list[0].id);
    });
  }, [universityId]);

  const selectedUniversity = universities.find((u) => u.id === universityId);

  const emailFormatValid = EMAIL_REGEX.test(email);
  const emailDomainValid = selectedUniversity
    ? email.toLowerCase().endsWith('@' + selectedUniversity.domain.toLowerCase())
    : true;
  const emailFullyValid = email.length > 0 && emailFormatValid && emailDomainValid;

  const emailError = useMemo(() => {
    if (!emailTouched || email.length === 0) return undefined;
    if (!emailFormatValid) return 'Ingresa un correo válido.';
    if (!emailDomainValid) return `Debe terminar en @${selectedUniversity?.domain}`;
    return undefined;
  }, [emailTouched, email, emailFormatValid, emailDomainValid, selectedUniversity]);

  const canContinueStep1 = Boolean(universityId && facultyId);
  const canContinueStep2 = fullName.trim().length > 0 && emailFullyValid;

  const goNext = () => {
    if (step === 1 && !canContinueStep1) return;
    if (step === 2) {
      setEmailTouched(true);
      if (!canContinueStep2) return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedUniversity) {
      setError('Universidad no válida.');
      return;
    }

    setLoading(true);
    const { error, needsConfirmation } = await authService.register({
      full_name: fullName,
      email,
      password,
      university: selectedUniversity,
      faculty_id: facultyId,
      role: 'comprador',
    });
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }

    if (needsConfirmation) {
      // No hay sesión todavía: la persona debe abrir el enlace del correo.
      setSentTo(email);
      setCooldown(60);
      return;
    }

    await refresh();
    navigate('/explore');
  };

  const handleResend = async () => {
    if (!sentTo || cooldown > 0) return;
    setResending(true);
    setResendMsg(null);
    const { error } = await authService.resendConfirmation(sentTo);
    setResending(false);
    if (error) {
      setResendMsg('No pudimos reenviar el correo. Intenta de nuevo en un minuto.');
      return;
    }
    setResendMsg('Listo, te enviamos otro correo.');
    setCooldown(60);
  };

  if (sentTo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-primary">
            <MailCheck size={30} />
          </div>
          <h1 className="text-xl font-bold text-ink">Revisa tu correo</h1>
          <p className="mt-2 text-sm text-ink/60">
            Te enviamos un enlace de confirmación a <strong className="text-ink">{sentTo}</strong>. Ábrelo para activar tu cuenta.
          </p>

          <div className="mt-5 rounded-control bg-secondary-light px-4 py-3 text-left text-xs text-secondary">
            <p className="font-semibold">¿No lo ves?</p>
            <p className="mt-1">
              Puede tardar un par de minutos. Revisa también la carpeta de <strong>spam o no deseados</strong>. Si lo encuentras allí, márcalo como "No es spam".
            </p>
          </div>

          {resendMsg && <p className="mt-4 text-sm text-ink/60">{resendMsg}</p>}

          <div className="mt-5 flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              fullWidth
              loading={resending}
              disabled={cooldown > 0}
              onClick={handleResend}
            >
              {cooldown > 0 ? `Reenviar correo (${cooldown}s)` : 'Reenviar correo'}
            </Button>
            <Link to="/login">
              <Button type="button" size="lg" fullWidth>
                Ya lo confirmé, iniciar sesión
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
            <ShoppingBag size={22} />
          </div>
          <h1 className="text-xl font-bold text-ink">Crea tu cuenta</h1>
          <p className="mt-1 text-sm text-ink/50">Únete a la comunidad emprendedora de tu universidad</p>
        </div>

        <div className="mb-6 flex items-center gap-1.5">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-ink/10'}`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {step === 1 && (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-ink/40">Paso 1 de 3 · Tu universidad</p>

              <Select label="Universidad" value={universityId} onChange={(e) => setUniversityId(e.target.value)}>
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>

              <Select label="Facultad" value={facultyId} onChange={(e) => setFacultyId(e.target.value)}>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </Select>

              <Button type="button" size="lg" fullWidth className="mt-1" disabled={!canContinueStep1} onClick={goNext}>
                Continuar
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-ink/40">Paso 2 de 3 · Tus datos</p>

              <Input
                label="Nombre completo"
                placeholder="Tu nombre y apellido"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              <Input
                label="Correo institucional"
                type="email"
                placeholder={selectedUniversity ? `nombre@${selectedUniversity.domain}` : 'nombre@universidad.edu.co'}
                hint={selectedUniversity ? `Debe terminar en @${selectedUniversity.domain}` : undefined}
                error={emailError}
                success={emailFullyValid ? 'Correo institucional válido' : undefined}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                rightElement={
                  emailFullyValid ? (
                    <div className="flex h-8 w-8 items-center justify-center text-green-600">
                      <Check size={18} />
                    </div>
                  ) : undefined
                }
              />

              <div className="mt-1 flex gap-2">
                <Button type="button" variant="outline" size="lg" onClick={goBack}>
                  Atrás
                </Button>
                <Button type="button" size="lg" fullWidth disabled={!canContinueStep2} onClick={goNext}>
                  Continuar
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-ink/40">Paso 3 de 3 · Contraseña</p>

              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-ink/40 transition-colors hover:text-ink/70"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="mt-1 flex gap-2">
                <Button type="button" variant="outline" size="lg" onClick={goBack}>
                  Atrás
                </Button>
                <Button type="submit" size="lg" fullWidth loading={loading}>
                  Crear cuenta
                </Button>
              </div>
            </>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-ink/50">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
