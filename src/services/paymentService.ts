import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { demoDb } from '../data/demoDb';
import type { PaymentMethod } from '../types';

// ============================================================================
// MEDIOS DE PAGO
// ============================================================================
// Qué medios acepta cada emprendimiento es público (businesses.payment_methods).
// El número de Nequi/Daviplata y los datos de transferencia son privados
// (business_payment_details): solo los ve el dueño y, mediante
// get_order_payment_info, el comprador de un pedido ya aceptado.
// Ver supabase/migrations/20261009_medios_de_pago.sql.
// ============================================================================

export interface PaymentDetails {
  nequi_phone: string | null;
  daviplata_phone: string | null;
  transfer_details: string | null;
}

export interface OrderPaymentInfo {
  method: PaymentMethod;
  account: string;
}

const DEMO_DETAILS_KEY = 'unihub_demo_payment_details';
// En el modo demo, Dulce EAN recibe por Nequi (número ficticio)
const DEMO_DEFAULT_DETAILS: Record<string, PaymentDetails> = {
  'biz-dulce-ean': { nequi_phone: '3001234567', daviplata_phone: null, transfer_details: null },
};

function loadDemoDetails(): Record<string, PaymentDetails> {
  try {
    return { ...DEMO_DEFAULT_DETAILS, ...JSON.parse(localStorage.getItem(DEMO_DETAILS_KEY) ?? '{}') };
  } catch {
    return { ...DEMO_DEFAULT_DETAILS };
  }
}

/** "3001234567" → "300 123 4567" */
export function formatPhone(phone: string): string {
  return phone.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3');
}

/** Deja solo dígitos; acepta "300 123 4567", "+57 300…", etc. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('57') ? digits.slice(2) : digits;
}

export const paymentService = {
  /** Datos privados del emprendimiento (solo su dueño). */
  async getDetails(businessId: string): Promise<PaymentDetails> {
    const empty: PaymentDetails = { nequi_phone: null, daviplata_phone: null, transfer_details: null };
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('business_payment_details')
        .select('nequi_phone, daviplata_phone, transfer_details')
        .eq('business_id', businessId)
        .maybeSingle();
      return (data as PaymentDetails | null) ?? empty;
    }
    return loadDemoDetails()[businessId] ?? empty;
  },

  async saveSettings(
    businessId: string,
    methods: PaymentMethod[],
    details: PaymentDetails
  ): Promise<{ error: string | null }> {
    if (methods.includes('nequi') && !/^3\d{9}$/.test(details.nequi_phone ?? '')) {
      return { error: 'Escribe tu número de Nequi (10 dígitos, empieza por 3).' };
    }
    if (methods.includes('daviplata') && !/^3\d{9}$/.test(details.daviplata_phone ?? '')) {
      return { error: 'Escribe tu número de Daviplata (10 dígitos, empieza por 3).' };
    }
    if (methods.includes('transferencia') && !details.transfer_details?.trim()) {
      return { error: 'Escribe tu llave Bre-B o los datos de tu cuenta para transferencias.' };
    }
    // Solo guardamos los datos de los medios que están activos
    const clean: PaymentDetails = {
      nequi_phone: methods.includes('nequi') ? details.nequi_phone : null,
      daviplata_phone: methods.includes('daviplata') ? details.daviplata_phone : null,
      transfer_details: methods.includes('transferencia') ? details.transfer_details?.trim().slice(0, 160) ?? null : null,
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('businesses').update({ payment_methods: methods }).eq('id', businessId);
      if (error) return { error: error.message };
      const { error: detailsError } = await supabase
        .from('business_payment_details')
        .upsert({ business_id: businessId, ...clean, updated_at: new Date().toISOString() });
      return { error: detailsError ? detailsError.message : null };
    }

    const businesses = demoDb.getBusinesses();
    const idx = businesses.findIndex((b) => b.id === businessId);
    if (idx === -1) return { error: 'Emprendimiento no encontrado.' };
    businesses[idx] = { ...businesses[idx], payment_methods: methods };
    demoDb.saveBusinesses(businesses);
    try {
      localStorage.setItem(DEMO_DETAILS_KEY, JSON.stringify({ ...loadDemoDetails(), [businessId]: clean }));
    } catch {
      // ignorar
    }
    return { error: null };
  },

  /** Datos para pagar un pedido: solo su comprador y solo si ya fue aceptado. */
  async getOrderPaymentInfo(orderId: string): Promise<OrderPaymentInfo | null> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.rpc('get_order_payment_info', { p_order_id: orderId });
      const row = Array.isArray(data) ? (data[0] as OrderPaymentInfo | undefined) : undefined;
      return row ?? null;
    }
    const order = demoDb.getOrders().find((o) => o.id === orderId);
    if (!order?.payment_method || order.payment_method === 'efectivo') return null;
    if (!['confirmado', 'en_preparacion', 'completado'].includes(order.status)) return null;
    const details = loadDemoDetails()[order.business_id];
    const account =
      order.payment_method === 'nequi'
        ? details?.nequi_phone
        : order.payment_method === 'daviplata'
          ? details?.daviplata_phone
          : details?.transfer_details;
    return account ? { method: order.payment_method, account } : null;
  },
};
