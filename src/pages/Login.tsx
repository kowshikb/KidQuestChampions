import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Phone, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSound } from '../contexts/SoundContext';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../firebase/config';

const Login: React.FC = () => {
  const { currentUser, signInWithEmail, signUpWithEmail, signInWithPhone, signInAnonymously, loading } = useAuth();
  const { playSound } = useSound();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!recaptchaVerifier) {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal',
        callback: () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
        'expired-callback': () => {
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

  const handleEmailAuth = async () => {
    playSound('click');
    setError('');

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError('Passwords do not match!');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long!');
        return;
      }
      try {
        await signUpWithEmail(email, password);
      } catch (err: any) {
        setError(err.message);
      }
    } else {
      try {
        await signInWithEmail(email, password);
      } catch (err: any) {
        setError(err.message);
      }
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

  const toggleAuthMode = () => {
    playSound('click');
    setIsSignUp(!isSignUp);
    setError('');
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
          <h2 className="text-2xl font-bold text-center text-purple-900 mb-6">
            {isSignUp ? 'Create Your Account' : 'Choose Your Portal'}
          </h2>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Email Auth */}
          <div className="mb-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                placeholder="Email"
                className="w-full p-3 pl-10 mb-2 border rounded-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 mb-2 border rounded-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {isSignUp && (
              <input
                type="password"
                placeholder="Confirm Password"
                className="w-full p-3 mb-2 border rounded-lg"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            )}
            <button 
              onClick={handleEmailAuth} 
              disabled={loading} 
              className="btn-magic w-full py-2 mb-2"
            >
              <span className="flex items-center justify-center">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {isSignUp ? 'Creating Account...' : 'Logging in...'}
                  </>
                ) : (
                  <>
                    {isSignUp ? <UserPlus size={18} className="mr-2" /> : <Mail size={18} className="mr-2" />}
                    {isSignUp ? 'Sign Up with Email' : 'Login with Email'}
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Toggle Auth Mode */}
          <button
            onClick={toggleAuthMode}
            className="w-full text-purple-600 hover:text-purple-800 text-sm mb-4"
          >
            {isSignUp ? 'Already have an account? Log in' : 'Need an account? Sign up'}
          </button>

          {!isSignUp && (
            <>
              {/* Phone Sign-in */}
              <div className="mb-4">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="tel"
                    placeholder="+1234567890"
                    className="w-full p-3 pl-10 mb-2 border rounded-lg"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <button onClick={handlePhoneLogin} disabled={loading} className="btn-magic w-full py-2 mb-2">
                  <span className="flex items-center justify-center">
                    <Phone size={18} className="mr-2" />
                    {loading ? 'Sending code...' : 'Login with Phone'}
                  </span>
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
            </>
          )}

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