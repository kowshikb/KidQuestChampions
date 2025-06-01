import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signInAnonymously, 
  onAuthStateChanged, 
  User,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, getBasePath } from '../firebase/config';
import { useModal } from './ModalContext';
import { useSound } from './SoundContext';

// Define avatar options
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
  signIn: () => Promise<void>;
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
    country: "Imagination"
  },
  completedTasks: [],
  friendsList: []
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
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

  // Fetch user profile from Firestore
  const fetchUserProfile = async (userId: string) => {
    try {
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        setUserProfile(userSnap.data() as UserProfile);
      } else {
        // Create new profile if it doesn't exist
        const newProfile = {
          ...defaultUserProfile,
          username: `Explorer${Math.floor(Math.random() * 10000)}`,
          avatarUrl: AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)]
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      showModal({
        title: "Magical Mishap!",
        message: "We couldn't fetch your explorer profile. Let's try again!",
        type: "error"
      });
    }
  };

  // Handle auth state changes
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

  // Sign in anonymously
  const signIn = async () => {
    try {
      setLoading(true);
      // Check if there's an initial auth token
      const initialToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
      
      if (initialToken) {
        // Implementation would use the token
        console.log("Using initial auth token");
      } else {
        await signInAnonymously(auth);
      }
      playSound('success');
    } catch (error) {
      console.error("Error signing in:", error);
      showModal({
        title: "Magical Portal Failed!",
        message: "We couldn't open the portal to KidQuest. Let's try again!",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      playSound('click');
    } catch (error) {
      console.error("Error signing out:", error);
      showModal({
        title: "Portal Closing Error",
        message: "We had trouble closing your magical portal. Try again?",
        type: "error"
      });
    }
  };

  // Update user profile
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, `${getBasePath()}/users/${currentUser.uid}`);
      await updateDoc(userRef, data);
      setUserProfile(prev => prev ? { ...prev, ...data } : null);
      playSound('success');
    } catch (error) {
      console.error("Error updating profile:", error);
      showModal({
        title: "Profile Update Failed",
        message: "Your magical profile couldn't be updated. Let's try again!",
        type: "error"
      });
    }
  };

  // Add completed task and earn coins
  const addCompletedTask = async (taskId: string, coinsEarned: number) => {
    if (!currentUser || !userProfile) return;
    
    try {
      // Check if task is already completed
      if (userProfile.completedTasks.includes(taskId)) return;
      
      const updatedTasks = [...userProfile.completedTasks, taskId];
      const updatedCoins = userProfile.coins + coinsEarned;
      
      const userRef = doc(db, `${getBasePath()}/users/${currentUser.uid}`);
      await updateDoc(userRef, {
        completedTasks: updatedTasks,
        coins: updatedCoins
      });
      
      setUserProfile(prev => prev ? {
        ...prev,
        completedTasks: updatedTasks,
        coins: updatedCoins
      } : null);
      
      playSound('coin');
    } catch (error) {
      console.error("Error completing task:", error);
      showModal({
        title: "Task Completion Error",
        message: "We couldn't mark your quest as complete. Try again, brave explorer!",
        type: "error"
      });
    }
  };

  // Add friend
  const addFriend = async (friendId: string) => {
    if (!currentUser || !userProfile) return;
    
    try {
      if (userProfile.friendsList.includes(friendId)) return;
      
      const updatedFriends = [...userProfile.friendsList, friendId];
      
      const userRef = doc(db, `${getBasePath()}/users/${currentUser.uid}`);
      await updateDoc(userRef, {
        friendsList: updatedFriends
      });
      
      setUserProfile(prev => prev ? {
        ...prev,
        friendsList: updatedFriends
      } : null);
      
      playSound('success');
    } catch (error) {
      console.error("Error adding friend:", error);
      showModal({
        title: "Friend Request Error",
        message: "We couldn't add this friend to your alliance. Try again later!",
        type: "error"
      });
    }
  };

  // Remove friend
  const removeFriend = async (friendId: string) => {
    if (!currentUser || !userProfile) return;
    
    try {
      const updatedFriends = userProfile.friendsList.filter(id => id !== friendId);
      
      const userRef = doc(db, `${getBasePath()}/users/${currentUser.uid}`);
      await updateDoc(userRef, {
        friendsList: updatedFriends
      });
      
      setUserProfile(prev => prev ? {
        ...prev,
        friendsList: updatedFriends
      } : null);
      
      playSound('click');
    } catch (error) {
      console.error("Error removing friend:", error);
      showModal({
        title: "Friend Removal Error",
        message: "We couldn't remove this friend from your alliance. Try again later!",
        type: "error"
      });
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    signIn,
    signOut,
    updateProfile,
    addCompletedTask,
    addFriend,
    removeFriend
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};