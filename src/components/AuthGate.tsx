import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

type Props = {
  children: React.ReactNode;
};

export default function AuthGate({ children }: Props) {
  const { user, loading, error, signIn } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          {/* KitchenSync Logo/Brand */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-6 bg-yellow rounded-full flex items-center justify-center"
          >
            <span className="text-2xl font-handwritten text-charcoal">KS</span>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-charcoal font-semibold"
          >
            Loading KitchenSync...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 30,
            duration: 0.6 
          }}
          className="bg-white shadow-2xl rounded-3xl p-8 text-center max-w-md w-full"
        >
          {/* KitchenSync Branding */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
            className="mb-8"
          >
            <div className="w-20 h-20 mx-auto mb-4 bg-blue rounded-full flex items-center justify-center shadow-lg">
              <span className="text-3xl font-handwritten text-charcoal">KS</span>
            </div>
            <h1 className="text-3xl font-black text-charcoal mb-2">KitchenSync</h1>
            <p className="text-gray-medium text-lg">Your family's command center</p>
          </motion.div>

          {/* Welcome Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-charcoal mb-3">Welcome back!</h2>
            <p className="text-gray-medium leading-relaxed">
              Sign in to access your family's calendar, chores, and memories.
            </p>
          </motion.div>

          {/* Sign In Button */}
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => signIn()}
            className="w-full px-8 py-4 rounded-2xl bg-blue hover:bg-blue/90 font-bold text-cream text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-center gap-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </div>
          </motion.button>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red/10 border border-red/20 rounded-xl"
            >
              <p className="text-red text-sm font-medium">{error}</p>
            </motion.div>
          )}

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 pt-6 border-t border-gray-light"
          >
            <p className="text-sm text-gray-medium">
              Keep your family connected and organized
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}


