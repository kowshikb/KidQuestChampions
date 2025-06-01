import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSound } from '../contexts/SoundContext';

const Login: React.FC = () => {
  const { currentUser, signIn, loading } = useAuth();
  const { playSound } = useSound();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  // Handle login button click
  const handleSignIn = async () => {
    playSound('click');
    await signIn();
  };

  // Floating elements animation
  const floatingElements = Array.from({ length: 10 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 50 + 20,
    delay: Math.random() * 2,
    duration: Math.random() * 5 + 5,
  }));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated Background Elements */}
      {floatingElements.map((element) => (
        <motion.div
          key={element.id}
          className="absolute rounded-full bg-purple-200 opacity-30"
          style={{
            width: element.size,
            height: element.size,
            left: `${element.x}%`,
            top: `${element.y}%`,
            zIndex: 0,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            delay: element.delay,
            duration: element.duration,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      ))}

      {/* Login Content */}
      <motion.div
        className="relative z-10 max-w-md w-full mx-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-block bg-purple-600 text-white p-6 rounded-full mb-4 shadow-lg"
            whileHover={{ rotate: 5, scale: 1.1 }}
          >
            <Sparkles size={48} />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold text-purple-800 mb-2">KidQuest Champions</h1>
          <p className="text-lg text-purple-600">Begin Your Magical Adventure</p>
        </div>

        {/* Login Card */}
        <motion.div
          className="bg-white rounded-3xl shadow-xl p-8 border-4 border-purple-300"
          whileHover={{ y: -5 }}
        >
          <h2 className="text-2xl font-bold text-center text-purple-900 mb-6">Ready for Adventure?</h2>
          
          <p className="text-gray-600 mb-8 text-center">
            Join KidQuest Champions to embark on exciting quests, make new friends, and learn amazing skills!
          </p>

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="btn-magic w-full mb-4 py-4 text-lg"
          >
            <span className="flex items-center justify-center">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Opening Portal...
                </>
              ) : (
                <>
                  <Sparkles size={18} className="mr-2" />
                  Start Your Quest
                </>
              )}
            </span>
          </button>

          <p className="text-sm text-gray-500 text-center">
            By entering, you agree to be awesome and have fun!
          </p>
        </motion.div>

        {/* Magical decorations */}
        <div className="flex justify-center mt-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.div
              key={star}
              className="text-yellow-400 mx-1"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, 0, -10, 0],
              }}
              transition={{
                duration: 2,
                delay: star * 0.2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              ✨
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Login;