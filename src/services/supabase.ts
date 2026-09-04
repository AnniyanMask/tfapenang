import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const AVATAR_BUCKET = 'shivafamily_avatar';

export interface SupabaseCredentials {
  url: string;
  anonKey: string;
}

export function getSupabaseCredentials(): SupabaseCredentials {
  try {
    const local = localStorage.getItem('temple_supabase_config_v1');
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed?.url && parsed?.anonKey) {
        return {
          url: parsed.url.trim(),
          anonKey: parsed.anonKey.trim()
        };
      }
    }
  } catch {}

  return {
    url: (import.meta.env.VITE_SUPABASE_URL || '').trim(),
    anonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(
    url && 
    anonKey && 
    url.startsWith('https://') &&
    anonKey.length > 15
  );
}

let activeClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();
  if (url && anonKey && url.startsWith('https://') && anonKey.length > 15) {
    if (!activeClient || lastUrl !== url || lastKey !== anonKey) {
      activeClient = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
      lastUrl = url;
      lastKey = anonKey;
    }
    return activeClient;
  }
  return null;
}

export function setSupabaseConfig(url: string, anonKey: string) {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();
  localStorage.setItem('temple_supabase_config_v1', JSON.stringify({ url: cleanUrl, anonKey: cleanKey }));
  activeClient = createClient(cleanUrl, cleanKey);
  lastUrl = cleanUrl;
  lastKey = cleanKey;
}

export function clearSupabaseConfig() {
  localStorage.removeItem('temple_supabase_config_v1');
  activeClient = null;
  lastUrl = '';
  lastKey = '';
}

// Proxied supabase client export for backward compatibility
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    if (!client) {
      return undefined;
    }
    const val = (client as any)[prop];
    if (typeof val === 'function') {
      return val.bind(client);
    }
    return val;
  }
});

/**
 * Optimizes an image file by resizing via canvas to a maximum dimension of 400x400
 * and returning a compressed JPEG blob and base64 string.
 */
export async function optimizeImage(file: File | Blob): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 400;
        let { width, height } = img;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({ blob: file, dataUrl: e.target?.result as string });
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
            if (blob) {
              resolve({ blob, dataUrl });
            } else {
              resolve({ blob: file, dataUrl });
            }
          },
          'image/jpeg',
          0.88
        );
      };
      img.onerror = () => {
        resolve({ blob: file, dataUrl: e.target?.result as string });
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a devotee avatar to the Supabase Storage bucket 'shivafamily_avatar'.
 * If Supabase is not configured or an error occurs, falls back to the compressed base64 data URL
 * ensuring instant functionality across all environments.
 */
export async function uploadAvatar(
  file: File | Blob,
  userId: string
): Promise<{ success: boolean; url: string; isRemote: boolean; message?: string }> {
  try {
    const { blob, dataUrl } = await optimizeImage(file);

    if (supabase) {
      const ext = file instanceof File && file.name.includes('.') 
        ? file.name.split('.').pop()?.toLowerCase() || 'jpg' 
        : 'jpg';
      const cleanUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
      const filePath = `avatars/${cleanUserId}-${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (!error && data) {
        const { data: publicData } = supabase.storage
          .from(AVATAR_BUCKET)
          .getPublicUrl(filePath);

        if (publicData?.publicUrl) {
          return {
            success: true,
            url: publicData.publicUrl,
            isRemote: true,
            message: 'Picture Uploaded'
          };
        }
      } else {
        console.warn('Supabase storage upload attempt error:', error);
      }
    }

    // Resilient local fallback: persistent compressed Data URL
    return {
      success: true,
      url: dataUrl,
      isRemote: false,
      message: 'Saved avatar locally (will sync automatically)'
    };
  } catch (err: any) {
    console.error('Error during avatar optimization/upload:', err);
    return {
      success: false,
      url: '',
      isRemote: false,
      message: err?.message || 'Failed to process avatar'
    };
  }
}
