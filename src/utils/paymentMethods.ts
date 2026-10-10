import { Banknote, Landmark, Smartphone, type LucideIcon } from 'lucide-react';
import type { PaymentMethod } from '../types';

export const PAYMENT_METHODS: Record<PaymentMethod, { label: string; hint: string; Icon: LucideIcon }> = {
  efectivo: { label: 'Efectivo', hint: 'Pagas al recibir', Icon: Banknote },
  nequi: { label: 'Nequi', hint: 'Desde tu celular', Icon: Smartphone },
  daviplata: { label: 'Daviplata', hint: 'Desde tu celular', Icon: Smartphone },
  transferencia: { label: 'Transferencia', hint: 'Bre-B o cuenta bancaria', Icon: Landmark },
};

export const PAYMENT_METHOD_ORDER: PaymentMethod[] = ['efectivo', 'nequi', 'daviplata', 'transferencia'];

/** Medios que necesitan datos (número o cuenta) para pagar */
export function needsPaymentDetails(method: PaymentMethod | null | undefined): boolean {
  return method === 'nequi' || method === 'daviplata' || method === 'transferencia';
}
