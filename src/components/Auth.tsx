import React from 'react';
import { auth, googleProvider, signInWithPopup, db, doc, setDoc, getDoc, Timestamp } from '../firebase';
import { GraduationCap, Chrome } from 'lucide-react';
import { motion } from 'motion/react';

export const Auth: React.FC = () => {
  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user profile exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        // Create profile
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: user.email === 'sindhus8012@gmail.com' ? 'admin' : 'student',
          createdAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-indigo-100/50 p-8 border border-indigo-50"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-200">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to EmoLearn</h1>
          <p className="text-gray-500">
            The next generation of adaptive learning powered by emotion AI.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 text-gray-700 font-semibold py-4 px-6 rounded-2xl transition-all duration-200 group"
          >
            <Chrome className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
            Continue with Google
          </button>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-50 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-4">Features</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-indigo-50/50 rounded-xl">
              <p className="text-xs font-semibold text-indigo-700">Emotion Detection</p>
            </div>
            <div className="p-3 bg-violet-50/50 rounded-xl">
              <p className="text-xs font-semibold text-violet-700">Adaptive Content</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
