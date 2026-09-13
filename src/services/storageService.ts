import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

// ============================================================================
// SUPABASE STORAGE — fotos de productos y emprendimientos
// ============================================================================
// Antes, las fotos se guardaban como texto base64 directo en la fila de la
// base de datos (columnas products.image, businesses.logo/cover_image). Eso
// funciona para pocas fotos, pero cada foto de ~200-400KB en base64 hace más
// pesada y lenta CADA consulta que trae esa fila (listar productos, buscar,
// etc.), incluso cuando no se necesita mostrar la imagen todavía.
//
// Ahora subimos la foto ya comprimida a un bucket de Supabase Storage y
// guardamos solo el enlace público (una URL corta) en la base de datos.
// ============================================================================

export type ImageBucket = 'product-images' | 'business-images';

export const storageService = {
  /**
   * Sube una foto ya comprimida (ver processUploadedImage) al bucket indicado,
   * dentro de una carpeta con el id del usuario dueño (así las políticas de
   * seguridad en Supabase pueden verificar que cada quien solo suba a su
   * propia carpeta). Devuelve la URL pública lista para guardar en la base
   * de datos.
   *
   * En modo demo (sin Supabase configurado) no hay Storage real: devuelve
   * url: null sin error, y el formulario sigue usando el dataUrl local como
   * hacía antes.
   */
  async uploadImage(
    bucket: ImageBucket,
    ownerId: string,
    blob: Blob
  ): Promise<{ url: string | null; error: string | null }> {
    if (!isSupabaseConfigured || !supabase) {
      return { url: null, error: null };
    }

    const path = `${ownerId}/${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage.from(bucket).upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    });
    if (error) {
      return { url: null, error: error.message };
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  },
};
