import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Circle } from 'lucide-react';
import type { Business } from '../types';
import { ImagePlaceholder } from './ImagePlaceholder';
import { VerifiedBadge } from './VerifiedBadge';
import { StarRating } from './StarRating';
import { CATEGORY_LABELS } from '../types';
import { useAuth } from '../hooks/useAuth';
import { favoriteService } from '../services/favoriteService';
import { useAuthGate } from '../hooks/useAuthGate';

export function BusinessCard({ business }: { business: Business }) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { requireAuth } = useAuthGate();
  // Preferimos el logo; si no hay, probamos la foto de portada; si tampoco
  // hay (o la URL falla al cargar), caemos al ícono genérico de categoría.
  const logo = business.logo?.trim() || null;
  const image = logo || business.cover_image?.trim() || null;
  const [imageFailed, setImageFailed] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    favoriteService.isFavorite(profile.id, business.id).then((fav) => {
      if (active) setIsFavorite(fav);
    });
    return () => {
      active = false;
    };
  }, [profile, business.id]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (busy || !requireAuth('guardar tus favoritos') || !profile) return;
    setBusy(true);
    const next = !isFavorite;
    setIsFavorite(next); // optimista
    try {
      if (next) {
        await favoriteService.add(profile.id, business.id);
      } else {
        await favoriteService.remove(profile.id, business.id);
      }
    } catch {
      setIsFavorite(!next); // revertir si falló
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={() => navigate(`/business/${business.id}`)}
      className="group text-left shrink-0 w-44 md:w-52 rounded-card bg-white shadow-card hover:shadow-card-hover overflow-hidden border border-ink/5 transition-all duration-200 ease-out hover:-translate-y-1 active:scale-[0.98] active:shadow-card"
    >
      <div className="relative border-b border-ink/5">
        {image && !imageFailed ? (
          <img
            src={image}
            alt={business.name}
            onError={() => setImageFailed(true)}
            className={logo ? 'h-24 w-full bg-white object-contain p-3' : 'h-24 w-full object-cover'}
          />
        ) : (
          <ImagePlaceholder category={business.category} className="h-24 w-full" iconSize={22} />
        )}
        {Date.now() - new Date(business.created_at).getTime() < 14 * 24 * 60 * 60 * 1000 && (
          <span className="absolute left-0 top-2.5 rounded-r-lg bg-accent py-0.5 pl-2 pr-2.5 text-[11px] font-bold text-ink shadow-card">
            Nuevo
          </span>
        )}
        <span
          role="button"
          onClick={toggleFavorite}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-card backdrop-blur-sm transition-transform active:scale-90"
        >
          <Heart
            size={15}
            className={isFavorite ? 'fill-accent text-accent' : 'text-ink/40'}
          />
        </span>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1 min-w-0">
          <h3 className="text-sm font-semibold text-ink truncate">{business.name}</h3>
          {business.verified && <VerifiedBadge compact />}
        </div>
        <div className="flex items-center gap-1 min-w-0">
          <p className="text-xs text-ink/50 truncate">
            {CATEGORY_LABELS[business.category]}
            {business.available_now && ' ·'}
          </p>
          {business.available_now && (
            <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-green-700">
              <Circle size={6} className="fill-green-600 text-green-600" />
              Abierto
            </span>
          )}
        </div>
        <div className="mt-1.5">
          <StarRating rating={business.rating} size={12} reviewCount={business.review_count} />
        </div>
      </div>
    </button>
  );
}
