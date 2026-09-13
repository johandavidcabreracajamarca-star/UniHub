// ============================================================================
// SUBIDA DE FOTOS DESDE EL DISPOSITIVO
// ============================================================================
// Convierte una foto elegida por el usuario (cámara o galería) en una imagen
// comprimida lista para guardar. Las fotos de celular suelen pesar varios MB
// — sin comprimir, harían la app lenta y ocuparían mucho espacio. Reducimos
// el tamaño y la calidad a algo razonable para mostrar en tarjetas de
// producto, sin perder nitidez visible.
//
// Devolvemos DOS formatos de la misma imagen ya comprimida:
// - dataUrl: para la vista previa inmediata en el formulario (no requiere
//   subir nada a ningún lado, se ve al instante).
// - blob: el archivo real ya comprimido, listo para subirlo a Supabase
//   Storage (ver src/services/storageService.ts). En modo demo simplemente
//   no se usa y se sigue guardando el dataUrl como antes.
// ============================================================================

const MAX_DIMENSION = 900; // px — suficiente para verse nítido en cualquier tarjeta
const JPEG_QUALITY = 0.8;
const MAX_ORIGINAL_SIZE_MB = 15;

export interface ImageProcessResult {
  dataUrl: string | null;
  blob: Blob | null;
  error: string | null;
}

export function processUploadedImage(file: File): Promise<ImageProcessResult> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve({
        dataUrl: null,
        blob: null,
        error: 'Ese archivo no es una imagen. Elige una foto (JPG, PNG, etc.).',
      });
      return;
    }
    if (file.size > MAX_ORIGINAL_SIZE_MB * 1024 * 1024) {
      resolve({
        dataUrl: null,
        blob: null,
        error: `La foto es muy pesada (máximo ${MAX_ORIGINAL_SIZE_MB}MB).`,
      });
      return;
    }

    const reader = new FileReader();
    reader.onerror = () =>
      resolve({ dataUrl: null, blob: null, error: 'No se pudo leer la foto. Intenta de nuevo.' });
    reader.onload = () => {
      const img = new Image();
      img.onerror = () =>
        resolve({ dataUrl: null, blob: null, error: 'No se pudo procesar la foto. Intenta con otra.' });
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dataUrl: null, blob: null, error: 'Tu navegador no permite procesar imágenes.' });
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        canvas.toBlob(
          (blob) => resolve({ dataUrl, blob, error: null }),
          'image/jpeg',
          JPEG_QUALITY
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
