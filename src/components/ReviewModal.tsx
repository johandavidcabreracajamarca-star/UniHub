import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { Button } from './Button';
import { Textarea } from './Input';
import { reviewService } from '../services/reviewService';
import { useAuth } from '../hooks/useAuth';
import type { Order } from '../types';

interface ReviewModalProps {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewModal({ order, onClose, onSuccess }: ReviewModalProps) {
  const { profile } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    const { error } = await reviewService.create({
      order_id: order.id,
      buyer_id: profile.id,
      business_id: order.business_id,
      rating,
      comment,
    });
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 md:items-center">
      <div className="w-full max-w-app rounded-t-card bg-white p-5 pb-7 md:rounded-card md:max-w-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Califica tu pedido</h2>
          <button onClick={onClose} className="text-ink/50 hover:text-ink" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-ink/50">{order.business?.name}</p>

        <div className="mt-4 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} aria-label={`${n} estrellas`}>
              <Star
                size={32}
                className={n <= rating ? 'fill-accent text-accent' : 'fill-transparent text-ink/20'}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>

        <div className="mt-5">
          <Textarea
            label="Comentario (opcional)"
            placeholder="Cuéntale a la comunidad cómo fue tu experiencia..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <Button fullWidth size="lg" className="mt-5" loading={loading} onClick={handleSubmit}>
          Enviar reseña
        </Button>
      </div>
    </div>
  );
}
