import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';

const functions = getFunctions(app);

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
let functionsInitialized = false;

export async function getOAuthTokenClient(provider: 'calendar' | 'photos') {
  // Check if we've already determined this function is not available
  if (functionAvailabilityCache.get(provider) === false) {
    throw new Error('OAuth function not available');
  }
  
  // If functions haven't been initialized yet, don't call them
  if (!functionsInitialized) {
    functionsInitialized = true;
    throw new Error('OAuth functions not initialized');
  }
  
  try {
    const callable = httpsCallable(functions, 'getOAuthToken');
    const res = await callable({ provider });
    // @ts-ignore
    return res.data?.accessToken as string;
  } catch (error) {
    // If it's a 404 or function not found, cache that it's not available
    if (error instanceof Error && (error.message.includes('404') || error.message.includes('not found'))) {
      functionAvailabilityCache.set(provider, false);
    }
    throw error;
  }
}


