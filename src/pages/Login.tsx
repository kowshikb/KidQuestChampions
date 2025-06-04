import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSound } from '../contexts/SoundContext';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../firebase/config';

const Login: React.FC = () => {
  const { currentUser, signInWithEmail, signInWithPhone, signInAnonymously, loading } = useAuth();
  const { playSound } = useSound();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    // Initialize reCAPTCHA verifier
    if (!recaptchaVerifier) {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal',
        callback: () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
          setError('reCAPTCHA expired. Please try again.');
        }
      });
      setRecaptchaVerifier(verifier);
    }

    return () => {
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
      }
    };
  }, []);

  const handleAnonymousLogin = async () => {
    playSound('click');
    setError('');
    try {
      await signInAnonymously();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEmailLogin = async () => {
    playSound('click');
    setError('');
    try {
      await signInWithEmail(email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePhoneLogin = async () => {
    playSound('click');
    setError('');
    try {
      if (!recaptchaVerifier) {
        throw new Error('reCAPTCHA not initialized');
      }
      await signInWithPhone(phone, recaptchaVerifier);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated Background Elements */}
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-purple-200 opacity-30"
          style={{
            width: Math.random() * 50 + 20,
            height: Math.random() * 50 + 20,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            zIndex: 0,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            delay: Math.random() * 2,
            duration: Math.random() * 5 + 5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      ))}

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

        <motion.div className="bg-white rounded-3xl shadow-xl p-8 border-4 border-purple-300" whileHover={{ y: -5 }}>
          <h2 className="text-2xl font-bold text-center text-purple-900 mb-6">Choose Your Portal</h2>

          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

          {/* Email Sign-in */}
          <div className="mb-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 mb-2 border rounded-lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 mb-2 border rounded-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleEmailLogin} disabled={loading} className="btn-magic w-full py-2 mb-2">
              {loading ? 'Logging in...' : 'Login with Email'}
            </button>
          </div>

          {/* Phone Sign-in */}
          <div className="mb-4">
            <input
              type="tel"
              placeholder="+1234567890"
              className="w-full p-3 mb-2 border rounded-lg"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button onClick={handlePhoneLogin} disabled={loading} className="btn-magic w-full py-2 mb-2">
              {loading ? 'Sending code...' : 'Login with Phone'}
            </button>
            <div id="recaptcha-container" className="flex justify-center mt-2" />
          </div>

          {/* Anonymous Sign-in */}
          <button
            onClick={handleAnonymousLogin}
            disabled={loading}
            className="btn-magic w-full py-4 text-lg mt-4"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Opening Portal...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Sparkles size={18} className="mr-2" />
                Continue Anonymously
              </span>
            )}
          </button>

          <p className="text-sm text-gray-500 text-center mt-4">
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