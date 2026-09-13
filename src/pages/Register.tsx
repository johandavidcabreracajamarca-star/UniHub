import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Eye, EyeOff, Check } from 'lucide-react';
import { Button } from '../components/Button';
import { Input, Select } from '../components/Input';
import { authService } from '../services/authService';
import { universityService } from '../services/universityService';
import { useAuth } from '../hooks/useAuth';
import type { Faculty, University, UserRole } from '../types';

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
  const [role, setRole] = useState<UserRole>('comprador');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    const { error } = await authService.register({
      full_name: fullName,
      email,
      password,
      university: selectedUniversity,
      faculty_id: facultyId,
      role,
    });
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
              <p className="text-xs font-medium uppercase tracking-wide text-ink/40">Paso 3 de 3 · Contraseña y rol</p>

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

              <div>
                <span className="mb-1.5 block text-sm font-medium text-ink">Quiero usar UniHub para</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('comprador')}
                    className={`rounded-control border px-3 py-2.5 text-sm font-medium transition-colors ${
                      role === 'comprador' ? 'border-primary bg-primary-light text-primary-dark' : 'border-ink/15 text-ink/60'
                    }`}
                  >
                    Comprar
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('emprendedor')}
                    className={`rounded-control border px-3 py-2.5 text-sm font-medium transition-colors ${
                      role === 'emprendedor' ? 'border-primary bg-primary-light text-primary-dark' : 'border-ink/15 text-ink/60'
                    }`}
                  >
                    Vender
                  </button>
                </div>
              </div>

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
