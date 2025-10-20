import React from 'react';
import { useAuth } from '../hooks/useAuth';

type Props = {
  children: React.ReactNode;
};

export default function AuthGate({ children }: Props) {
  const { user, loading, error, signIn } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white shadow-lg rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-charcoal mb-2">Sign in required</h1>
          <p className="text-gray-medium mb-6">Please sign in with Google to continue.</p>
          <button
            onClick={() => signIn()}
            className="px-6 py-3 rounded-xl bg-purple hover:bg-purple/80 font-bold text-cream transition-all"
          >
            Sign in with Google
          </button>
          {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}


