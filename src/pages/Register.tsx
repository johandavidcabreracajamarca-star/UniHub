import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { Button } from '../components/Button';
import { Input, Select } from '../components/Input';
import { authService } from '../services/authService';
import { universityService } from '../services/universityService';
import { useAuth } from '../hooks/useAuth';
import type { Faculty, University, UserRole } from '../types';

export function Register() {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const [universities, setUniversities] = useState<University[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await authService.register({
      full_name: fullName,
      email,
      password,
      university_id: universityId,
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
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
            <ShoppingBag size={22} />
          </div>
          <h1 className="text-xl font-bold text-ink">Crea tu cuenta</h1>
          <p className="mt-1 text-sm text-ink/50">Únete a la comunidad emprendedora de tu universidad</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nombre completo"
            placeholder="Tu nombre y apellido"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

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

          <Input
            label="Correo institucional"
            type="email"
            placeholder={selectedUniversity ? `nombre@${selectedUniversity.domain}` : 'nombre@universidad.edu.co'}
            hint={selectedUniversity ? `Debe terminar en @${selectedUniversity.domain}` : undefined}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Contraseña"
            type="password"
            placeholder="Mínimo 6 caracteres"
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div>
            <span className="mb-1.5 block text-sm font-medium text-ink">Quiero usar UniHub para</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('comprador')}
                className={`rounded-control border px-3 py-2.5 text-sm font-medium transition-colors ${
                  role === 'comprador'
                    ? 'border-primary bg-primary-light text-primary-dark'
                    : 'border-ink/15 text-ink/60'
                }`}
              >
                Comprar
              </button>
              <button
                type="button"
                onClick={() => setRole('emprendedor')}
                className={`rounded-control border px-3 py-2.5 text-sm font-medium transition-colors ${
                  role === 'emprendedor'
                    ? 'border-primary bg-primary-light text-primary-dark'
                    : 'border-ink/15 text-ink/60'
                }`}
              >
                Vender
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" size="lg" fullWidth loading={loading} className="mt-1">
            Crear cuenta
          </Button>
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
