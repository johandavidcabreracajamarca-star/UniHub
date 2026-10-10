import { useEffect, useState } from 'react';
import { Lock, Wallet } from 'lucide-react';
import type { Business, PaymentMethod } from '../../types';
import { Button } from '../../components/Button';
import { useToast } from '../../hooks/useToast';
import { normalizePhone, paymentService, type PaymentDetails } from '../../services/paymentService';
import { PAYMENT_METHODS, PAYMENT_METHOD_ORDER } from '../../utils/paymentMethods';

/** "Cómo recibes los pagos" en el panel del emprendedor. */
export function PaymentSettings({ business, onSaved }: { business: Business; onSaved: () => void }) {
  const { showToast } = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>(business.payment_methods ?? []);
  const [details, setDetails] = useState<PaymentDetails>({ nequi_phone: null, daviplata_phone: null, transfer_details: null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    paymentService.getDetails(business.id).then((d) => active && setDetails(d));
    return () => {
      active = false;
    };
  }, [business.id]);

  const toggle = (method: PaymentMethod) => {
    setMethods((current) => (current.includes(method) ? current.filter((m) => m !== method) : [...current, method]));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const ordered = PAYMENT_METHOD_ORDER.filter((m) => methods.includes(m));
    const { error: saveError } = await paymentService.saveSettings(business.id, ordered, {
      nequi_phone: details.nequi_phone ? normalizePhone(details.nequi_phone) : null,
      daviplata_phone: details.daviplata_phone ? normalizePhone(details.daviplata_phone) : null,
      transfer_details: details.transfer_details,
    });
    setSaving(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    showToast('Medios de pago guardados');
    onSaved();
  };

  const inputClass =
    'mt-1.5 w-full rounded-control border border-ink/12 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary';

  return (
    <div className="mt-4 rounded-card border border-ink/8 bg-white p-4 shadow-card">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-control bg-primary-light text-primary">
          <Wallet size={18} />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">Cómo recibes los pagos</p>
          <p className="text-xs text-ink/50">Tus compradores ven estas opciones al hacer el pedido.</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {PAYMENT_METHOD_ORDER.map((m) => {
          const { label, hint, Icon } = PAYMENT_METHODS[m];
          const on = methods.includes(m);
          return (
            <button
              key={m}
              type="button"
              onClick={() => toggle(m)}
              aria-pressed={on}
              className={`flex items-center gap-2 rounded-control border p-2.5 text-left transition-colors ${
                on ? 'border-primary bg-primary-light' : 'border-ink/12 bg-white hover:bg-ink/5'
              }`}
            >
              <Icon size={18} className={on ? 'text-primary' : 'text-ink/40'} />
              <span className="min-w-0">
                <span className={`block text-sm font-semibold ${on ? 'text-primary-dark' : 'text-ink'}`}>{label}</span>
                <span className="block truncate text-[11px] text-ink/45">{hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      {methods.includes('nequi') && (
        <label className="mt-3 block text-xs font-medium text-ink/70">
          Número de Nequi
          <input
            inputMode="tel"
            placeholder="300 123 4567"
            value={details.nequi_phone ?? ''}
            onChange={(e) => setDetails({ ...details, nequi_phone: e.target.value })}
            className={inputClass}
          />
        </label>
      )}
      {methods.includes('daviplata') && (
        <label className="mt-3 block text-xs font-medium text-ink/70">
          Número de Daviplata
          <input
            inputMode="tel"
            placeholder="300 123 4567"
            value={details.daviplata_phone ?? ''}
            onChange={(e) => setDetails({ ...details, daviplata_phone: e.target.value })}
            className={inputClass}
          />
        </label>
      )}
      {methods.includes('transferencia') && (
        <label className="mt-3 block text-xs font-medium text-ink/70">
          Llave Bre-B o datos de tu cuenta
          <input
            placeholder="Ej: @camila.dulce o Bancolombia ahorros 123-456789-00"
            maxLength={160}
            value={details.transfer_details ?? ''}
            onChange={(e) => setDetails({ ...details, transfer_details: e.target.value })}
            className={inputClass}
          />
          <span className="mt-1 block text-[11px] font-normal text-ink/45">
            Consejo: una llave Bre-B con alias o correo no muestra tu número de celular.
          </span>
        </label>
      )}

      {methods.some((m) => m !== 'efectivo') && (
        <p className="mt-3 flex items-start gap-1.5 text-[11px] text-ink/50">
          <Lock size={12} className="mt-0.5 shrink-0" />
          Estos datos no son públicos: solo los ve quien te compra, y solo después de que confirmes su pedido.
        </p>
      )}

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      <Button size="sm" className="mt-4" loading={saving} onClick={save}>
        Guardar medios de pago
      </Button>
    </div>
  );
}
