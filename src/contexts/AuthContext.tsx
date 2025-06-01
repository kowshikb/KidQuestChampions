import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  onAuthStateChanged,
  User,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, getBasePath } from '../firebase/config';
import { useModal } from './ModalContext';
import { useSound } from './SoundContext';

const AVATAR_OPTIONS = [
  'https://images.pexels.com/photos/1416736/pexels-photo-1416736.jpeg?auto=compress&cs=tinysrgb&w=150',
  'https://images.pexels.com/photos/3608439/pexels-photo-3608439.jpeg?auto=compress&cs=tinysrgb&w=150',
  'https://images.pexels.com/photos/3662845/pexels-photo-3662845.jpeg?auto=compress&cs=tinysrgb&w=150',
  'https://images.pexels.com/photos/4588465/pexels-photo-4588465.jpeg?auto=compress&cs=tinysrgb&w=150',
  'https://images.pexels.com/photos/4010442/pexels-photo-4010442.jpeg?auto=compress&cs=tinysrgb&w=150',
  'https://images.pexels.com/photos/1643457/pexels-photo-1643457.jpeg?auto=compress&cs=tinysrgb&w=150',
];

interface UserProfile {
  username: string;
  avatarUrl: string;
  coins: number;
  location: {
    city: string;
    state: string;
    country: string;
  };
  completedTasks: string[];
  friendsList: string[];
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInAnonymously: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithPhone: (phoneNumber: string, appVerifier: any) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  addCompletedTask: (taskId: string, coinsEarned: number) => Promise<void>;
  addFriend: (friendId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
}

const defaultUserProfile: UserProfile = {
  username: "New Explorer",
  avatarUrl: AVATAR_OPTIONS[0],
  coins: 0,
  location: {
    city: "Adventure City",
    state: "Questland",
    country: "Imagination",
  },
  completedTasks: [],
  friendsList: [],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { showModal } = useModal();
  const { playSound } = useSound();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserProfile(userSnap.data() as UserProfile);
      } else {
        const newProfile = {
          ...defaultUserProfile,
          username: `Explorer${Math.floor(Math.random() * 10000)}`,
          avatarUrl: AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)],
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error("Fetch profile error:", error);
      showModal({
        title: "Oops!",
        message: "Failed to fetch your profile. Please try again!",
        type: "error",
      });
    }
  };

  const signInAnonymouslyHandler = async () => {
    try {
      setLoading(true);
      await signInAnonymously(auth);
      playSound('success');
    } catch (error) {
      console.error("Anonymous sign-in error:", error);
      showModal({
        title: "Login Failed",
        message: "Could not enter anonymously. Try again!",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      playSound('success');
    } catch (error: any) {
      console.error("Email login error:", error);
      showModal({
        title: "Login Error",
        message: error.message || "Failed to log in with email.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      playSound('success');
    } catch (error: any) {
      console.error("Signup error:", error);
      showModal({
        title: "Signup Error",
        message: error.message || "Could not create account.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const signInWithPhone = async (phoneNumber: string, appVerifier: any) => {
    try {
      setLoading(true);
      await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      playSound('success');
    } catch (error: any) {
      console.error("Phone login error:", error);
      showModal({
        title: "Phone Login Failed",
        message: error.message || "Could not log in with phone number.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      playSound('click');
    } catch (error) {
      console.error("Sign out error:", error);
      showModal({
        title: "Sign Out Failed",
        message: "Could not close your session. Try again!",
        type: "error",
      });
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, `${getBasePath()}/users/${currentUser.uid}`);
      await updateDoc(userRef, data);
      setUserProfile(prev => prev ? { ...prev, ...data } : null);
      playSound('success');
    } catch (error) {
      console.error("Profile update error:", error);
      showModal({
        title: "Update Failed",
        message: "Could not update your profile.",
        type: "error",
      });
    }
  };

  const addCompletedTask = async (taskId: string, coinsEarned: number) => {
    if (!currentUser || !userProfile) return;
    try {
      if (userProfile.completedTasks.includes(taskId)) return;

      const updatedTasks = [...userProfile.completedTasks, taskId];
      const updatedCoins = userProfile.coins + coinsEarned;
      const userRef = doc(db, `${getBasePath()}/users/${currentUser.uid}`);

      await updateDoc(userRef, {
        completedTasks: updatedTasks,
        coins: updatedCoins,
      });

      setUserProfile(prev => prev ? {
        ...prev,
        completedTasks: updatedTasks,
        coins: updatedCoins,
      } : null);

      playSound('coin');
    } catch (error) {
      console.error("Task completion error:", error);
      showModal({
        title: "Task Error",
        message: "Could not mark task as completed.",
        type: "error",
      });
    }
  };

  const addFriend = async (friendId: string) => {
    if (!currentUser || !userProfile) return;
    try {
      if (userProfile.friendsList.includes(friendId)) return;

      const updatedFriends = [...userProfile.friendsList, friendId];
      const userRef = doc(db, `${getBasePath()}/users/${currentUser.uid}`);

      await updateDoc(userRef, {
        friendsList: updatedFriends,
      });

      setUserProfile(prev => prev ? {
        ...prev,
        friendsList: updatedFriends,
      } : null);

      playSound('success');
    } catch (error) {
      console.error("Add friend error:", error);
      showModal({
        title: "Friend Error",
        message: "Could not add friend.",
        type: "error",
      });
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!currentUser || !userProfile) return;
    try {
      const updatedFriends = userProfile.friendsList.filter(id => id !== friendId);
      const userRef = doc(db, `${getBasePath()}/users/${currentUser.uid}`);

      await updateDoc(userRef, {
        friendsList: updatedFriends,
      });

      setUserProfile(prev => prev ? {
        ...prev,
        friendsList: updatedFriends,
      } : null);

      playSound('click');
    } catch (error) {
      console.error("Remove friend error:", error);
      showModal({
        title: "Friend Removal Failed",
        message: "Could not remove friend.",
        type: "error",
      });
    }
  };

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    signInAnonymously: signInAnonymouslyHandler,
    signInWithEmail,
    signUpWithEmail,
    signInWithPhone,
    signOut,
    updateProfile,
    addCompletedTask,
    addFriend,
    removeFriend,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
















// import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { 
//   signInAnonymously, 
//   onAuthStateChanged, 
//   User,
//   signOut as firebaseSignOut
// } from 'firebase/auth';
// import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
// import { auth, db, getBasePath } from '../firebase/config';
// import { useModal } from './ModalContext';
// import { useSound } from './SoundContext';

// // Define avatar options
// const AVATAR_OPTIONS = [
//   'https://images.pexels.com/photos/1416736/pexels-photo-1416736.jpeg?auto=compress&cs=tinysrgb&w=150',
//   'https://images.pexels.com/photos/3608439/pexels-photo-3608439.jpeg?auto=compress&cs=tinysrgb&w=150',
//   'https://images.pexels.com/photos/3662845/pexels-photo-3662845.jpeg?auto=compress&cs=tinysrgb&w=150',
//   'https://images.pexels.com/photos/4588465/pexels-photo-4588465.jpeg?auto=compress&cs=tinysrgb&w=150',
//   'https://images.pexels.com/photos/4010442/pexels-photo-4010442.jpeg?auto=compress&cs=tinysrgb&w=150',
//   'https://images.pexels.com/photos/1643457/pexels-photo-1643457.jpeg?auto=compress&cs=tinysrgb&w=150',
// ];

// interface UserProfile {
//   username: string;
//   avatarUrl: string;
//   coins: number;
//   location: {
//     city: string;
//     state: string;
//     country: string;
//   };
//   completedTasks: string[];
//   friendsList: string[];
// }

// interface AuthContextType {
//   currentUser: User | null;
//   userProfile: UserProfile | null;
//   loading: boolean;
//   signIn: () => Promise<void>;
//   signOut: () => Promise<void>;
//   updateProfile: (data: Partial<UserProfile>) => Promise<void>;
//   addCompletedTask: (taskId: string, coinsEarned: number) => Promise<void>;
//   addFriend: (friendId: string) => Promise<void>;
//   removeFriend: (friendId: string) => Promise<void>;
// }

// const defaultUserProfile: UserProfile = {
//   username: "New Explorer",
//   avatarUrl: AVATAR_OPTIONS[0],
//   coins: 0,
//   location: {
//     city: "Adventure City",
//     state: "Questland",
//     country: "Imagination"
//   },
//   completedTasks: [],
//   friendsList: []
// };

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// }

// interface AuthProviderProps {
//   children: ReactNode;
// }

// export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
//   const [currentUser, setCurrentUser] = useState<User | null>(null);
//   const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
//   const [loading, setLoading] = useState(true);
//   const { showModal } = useModal();
//   const { playSound } = useSound();

//   // Fetch user profile from Firestore
//   const fetchUserProfile = async (userId: string) => {
//     try {
//       const userRef = doc(db, `${getBasePath()}/users/${userId}`);
//       const userSnap = await getDoc(userRef);
      
//       if (userSnap.exists()) {
//         setUserProfile(userSnap.data() as UserProfile);
//       } else {
//         // Create new profile if it doesn't exist
//         const newProfile = {
//           ...defaultUserProfile,
//           username: `Explorer${Math.floor(Math.random() * 10000)}`,
//           avatarUrl: AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)]
//         };
//         await setDoc(userRef, newProfile);
//         setUserProfile(newProfile);
//       }
//     } catch (error) {
//       console.error("Error fetching user profile:", error);
//       showModal({
//         title: "Magical Mishap!",
//         message: "We couldn't fetch your explorer profile. Let's try again!",
//         type: "error"
//       });
//     }
//   };

//   // Handle auth state changes
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (user) => {
//       setCurrentUser(user);
//       if (user) {
//         await fetchUserProfile(user.uid);
//       } else {
//         setUserProfile(null);
//       }
//       setLoading(false);
//     });

//     return unsubscribe;
//   }, []);

//   // Sign in anonymously
//   const signIn = async () => {
//     try {
//       setLoading(true);
//       // Check if there's an initial auth token
//       const initialToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
      
//       if (initialToken) {
//         // Implementation would use the token
//         console.log("Using initial auth token");
//       } else {
//         await signInAnonymously(auth);
//       }
//       playSound('success');
//     } catch (error) {
//       console.error("Error signing in:", error);
//       showModal({
//         title: "Magical Portal Failed!",
//         message: "We couldn't open the portal to KidQuest. Let's try again!",
//         type: "error"
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Sign out
//   const signOut = async () => {
//     try {
//       await firebaseSignOut(auth);
//       playSound('click');
//     } catch (error) {
//       console.error("Error signing out:", error);
//       showModal({
//         title: "Portal Closing Error",
//         message: "We had trouble closing your magical portal. Try again?",
//         type: "error"
//       });
//     }
//   };

//   // Update user profile
//   const updateProfile = async (data: Partial<UserProfile>) => {
//     if (!currentUser) return;
    
//     try {
//       const userRef = doc(db, `${getBasePath()}/users/${currentUser.uid}`);
//       await updateDoc(userRef, data);
//       setUserProfile(prev => prev ? { ...prev, ...data } : null);
//       playSound('success');
//     } catch (error) {
//       console.error("Error updating profile:", error);
//       showModal({
//         title: "Profile Update Failed",
//         message: "Your magical profile couldn't be updated. Let's try again!",
//         type: "error"
//       });
//     }
//   };

//   // Add completed task and earn coins
//   const addCompletedTask = async (taskId: string, coinsEarned: number) => {
//     if (!currentUser || !userProfile) return;
    
//     try {
//       // Check if task is already completed
//       if (userProfile.completedTasks.includes(taskId)) return;
      
//       const updatedTasks = [...userProfile.completedTasks, taskId];
//       const updatedCoins = userProfile.coins + coinsEarned;
      
//       const userRef = doc(db, `${getBasePath()}/users/${currentUser.uid}`);
//       await updateDoc(userRef, {
//         completedTasks: updatedTasks,
//         coins: updatedCoins
//       });
      
//       setUserProfile(prev => prev ? {
//         ...prev,
//         completedTasks: updatedTasks,
//         coins: updatedCoins
//       } : null);
      
//       playSound('coin');
//     } catch (error) {
//       console.error("Error completing task:", error);
//       showModal({
//         title: "Task Completion Error",
//         message: "We couldn't mark your quest as complete. Try again, brave explorer!",
//         type: "error"
//       });
//     }
//   };

//   // Add friend
//   const addFriend = async (friendId: string) => {
//     if (!currentUser || !userProfile) return;
    
//     try {
//       if (userProfile.friendsList.includes(friendId)) return;
      
//       const updatedFriends = [...userProfile.friendsList, friendId];
      
//       const userRef = doc(db, `${getBasePath()}/users/${currentUser.uid}`);
//       await updateDoc(userRef, {
//         friendsList: updatedFriends
//       });
      
//       setUserProfile(prev => prev ? {
//         ...prev,
//         friendsList: updatedFriends
//       } : null);
      
//       playSound('success');
//     } catch (error) {
//       console.error("Error adding friend:", error);
//       showModal({
//         title: "Friend Request Error",
//         message: "We couldn't add this friend to your alliance. Try again later!",
//         type: "error"
//       });
//     }
//   };

//   // Remove friend
//   const removeFriend = async (friendId: string) => {
//     if (!currentUser || !userProfile) return;
    
//     try {
//       const updatedFriends = userProfile.friendsList.filter(id => id !== friendId);
      
//       const userRef = doc(db, `${getBasePath()}/users/${currentUser.uid}`);
//       await updateDoc(userRef, {
//         friendsList: updatedFriends
//       });
      
//       setUserProfile(prev => prev ? {
//         ...prev,
//         friendsList: updatedFriends
//       } : null);
      
//       playSound('click');
//     } catch (error) {
//       console.error("Error removing friend:", error);
//       showModal({
//         title: "Friend Removal Error",
//         message: "We couldn't remove this friend from your alliance. Try again later!",
//         type: "error"
//       });
//     }
//   };

//   const value = {
//     currentUser,
//     userProfile,
//     loading,
//     signIn,
//     signOut,
//     updateProfile,
//     addCompletedTask,
//     addFriend,
//     removeFriend
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

