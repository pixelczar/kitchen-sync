import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
      gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 404s or auth errors
        if (error?.message?.includes('404') || error?.message?.includes('auth')) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false, // Disable aggressive refetching
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
  },
});

