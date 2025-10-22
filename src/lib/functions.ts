import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';

// Explicitly use the default deployed region
const functions = getFunctions(app, 'us-central1');

export async function storeOAuthTokenClient(params: {
  provider: 'calendar' | 'photos';
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}) {
  const callable = httpsCallable(functions, 'storeOAuthToken');
  return await callable(params);
}

// Cache to track if functions are available
const functionAvailabilityCache = new Map<string, boolean>();

export async function getOAuthTokenClient(provider: 'calendar' | 'photos') {
  // Check if we've already determined this function is not available
  if (functionAvailabilityCache.get(provider) === false) {
    throw new Error('OAuth function not available');
  }
  
  try {
    const callable = httpsCallable(functions, 'getOAuthToken');
    const res = await callable({ provider });
    // @ts-ignore
    return res.data?.accessToken as string;
  } catch (error) {
    // Only mark unavailable if the callable itself truly doesn't exist.
    // Do NOT mark unavailable for domain-specific 404s like 'Integration not found'.
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      const isFunctionMissing = msg.includes('the requested function does not exist')
        || msg.includes('function not found')
        || (msg.includes('404') && !msg.includes('integration not found'));
      if (isFunctionMissing) {
        functionAvailabilityCache.set(provider, false);
      }
    }
    throw error;
  }
}

export async function serveGooglePhotoClient(params: { photoUrl: string }) {
  try {
    const callable = httpsCallable(functions, 'serveGooglePhoto');
    const res = await callable(params);
    // @ts-ignore
    return res.data as { imageData: string; contentType: string };
  } catch (error) {
    console.error('Error calling serveGooglePhoto:', error);
    throw error;
  }
}

export async function convertPhotosToBase64Client(params: { mediaItems: any[]; accessToken: string; targetWidth?: number; targetHeight?: number; crop?: boolean }) {
  try {
    const callable = httpsCallable(functions, 'convertPhotosToBase64');
    const res = await callable(params);
    // @ts-ignore
    return res.data as { 
      results: Array<{ id: string; base64Data: string; mimeType: string; filename: string; success: boolean }>;
      failed: Array<{ id: string; error: string; success: boolean }>;
      successCount: number;
      totalCount: number;
    };
  } catch (error) {
    console.error('Error calling convertPhotosToBase64:', error);
    throw error;
  }
}


