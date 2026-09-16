import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import type { Business } from '../types';
import { useAuth } from '../hooks/useAuth';
import { favoriteService } from '../services/favoriteService';
import { BusinessCard } from '../components/BusinessCard';
import { EmptyState } from '../components/StateViews';

export function FavoritosPage() {
  const { profile } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    favoriteService.listFavoriteBusinesses(profile.id).then((list) => {
      setBusinesses(list);
      setLoading(false);
    });
  }, [profile]);

  return (
    <div className="px-4 pt-4 pb-8 md:px-6 md:pt-6 md:max-w-2xl md:mx-auto">
      <h1 className="mb-5 font-serif text-2xl font-semibold text-ink">Favoritos</h1>

      {loading && (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-card bg-white/60" />
          ))}
        </div>
      )}

      {!loading && businesses.length === 0 && (
        <EmptyState
          icon={<Heart size={22} />}
          title="Aún no tienes favoritos."
          description="Toca el corazón en cualquier emprendimiento para guardarlo aquí."
        />
      )}

      {!loading && businesses.length > 0 && (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
          {businesses.map((b) => (
            <div key={b.id} className="w-full [&>button]:w-full">
              <BusinessCard business={b} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
