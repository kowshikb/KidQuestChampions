import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Copy, 
  ArrowRight, 
  Users, 
  Clock,
  MessageSquare
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { db, getBasePath } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useSound } from '../contexts/SoundContext';
import { useModal } from '../contexts/ModalContext';

interface Room {
  id: string;
  player1Id: string;
  player1Name?: string;
  player2Id: string | null;
  player2Name?: string;
  status: 'waiting' | 'active' | 'completed';
  createdAt: number;
  messages: Array<{
    senderId: string;
    text: string;
    timestamp: number;
  }>;
  currentChallenge: {
    themeId: string;
    taskId: string;
    challengerId: string;
    challengedId: string;
    status: 'pending' | 'accepted' | 'rejected' | 'completed';
    winnerId: string | null;
    suggestedAt: number;
  } | null;
}

const RoomsPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { playSound } = useSound();
  const { showModal } = useModal();
  const navigate = useNavigate();
  
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch user's rooms
  useEffect(() => {
    const fetchRooms = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        const roomsRef = collection(db, `${getBasePath()}/rooms`);
        const q = query(
          roomsRef,
          where('player1Id', '==', currentUser.uid)
        );
        const q2 = query(
          roomsRef,
          where('player2Id', '==', currentUser.uid)
        );
        
        const [snapshot1, snapshot2] = await Promise.all([
          getDocs(q),
          getDocs(q2)
        ]);
        
        const rooms: Room[] = [];
        
        // Process rooms where user is player1
        for (const docSnap of snapshot1.docs) {
          const roomData = docSnap.data() as Room;
          
          // If there's a player2, fetch their username
          let player2Name = null;
          if (roomData.player2Id) {
            try {
              const player2Ref = doc(db, `${getBasePath()}/users/${roomData.player2Id}`);
              const player2Snap = await getDoc(player2Ref);
              if (player2Snap.exists()) {
                player2Name = player2Snap.data().username;
              }
            } catch (error) {
              console.error("Error fetching player2 data:", error);
            }
          }
          
          rooms.push({
            id: docSnap.id,
            ...roomData,
            player1Name: userProfile?.username || 'You',
            player2Name: player2Name || 'Waiting...'
          });
        }
        
        // Process rooms where user is player2
        for (const docSnap of snapshot2.docs) {
          const roomData = docSnap.data() as Room;
          
          // Fetch player1's username
          let player1Name = null;
          try {
            const player1Ref = doc(db, `${getBasePath()}/users/${roomData.player1Id}`);
            const player1Snap = await getDoc(player1Ref);
            if (player1Snap.exists()) {
              player1Name = player1Snap.data().username;
            }
          } catch (error) {
            console.error("Error fetching player1 data:", error);
          }
          
          rooms.push({
            id: docSnap.id,
            ...roomData,
            player1Name: player1Name || 'Unknown',
            player2Name: userProfile?.username || 'You'
          });
        }
        
        // Sort rooms by creation time (newest first)
        rooms.sort((a, b) => b.createdAt - a.createdAt);
        
        setMyRooms(rooms);
      } catch (error) {
        console.error("Error fetching rooms:", error);
        showModal({
          title: "Room Fetch Error",
          message: "We couldn't load your challenge rooms. Please try again!",
          type: "error"
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser && userProfile) {
      fetchRooms();
    }
  }, [currentUser, userProfile]);

  // Create a new room
  const createRoom = async () => {
    if (!currentUser) return;
    
    try {
      playSound('click');
      
      const roomsRef = collection(db, `${getBasePath()}/rooms`);
      const newRoom = {
        player1Id: currentUser.uid,
        player2Id: null,
        status: 'waiting',
        createdAt: Date.now(),
        messages: [],
        currentChallenge: null
      };
      
      const docRef = await addDoc(roomsRef, newRoom);
      playSound('success');
      
      // Navigate to the new room
      navigate(`/rooms/${docRef.id}`);
    } catch (error) {
      console.error("Error creating room:", error);
      showModal({
        title: "Room Creation Failed",
        message: "We couldn't create your challenge room. Please try again!",
        type: "error"
      });
    }
  };

  // Join an existing room
  const joinRoom = async () => {
    if (!currentUser || !joinRoomId.trim()) return;
    
    try {
      playSound('click');
      
      // Check if room exists
      const roomRef = doc(db, `${getBasePath()}/rooms/${joinRoomId.trim()}`);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        showModal({
          title: "Room Not Found",
          message: "This challenge room doesn't exist. Check the ID and try again!",
          type: "error"
        });
        return;
      }
      
      const roomData = roomSnap.data() as Room;
      
      // Check if user is already in the room
      if (roomData.player1Id === currentUser.uid || roomData.player2Id === currentUser.uid) {
        // Navigate to the room
        navigate(`/rooms/${joinRoomId.trim()}`);
        return;
      }
      
      // Check if room is full
      if (roomData.player2Id !== null) {
        showModal({
          title: "Room is Full",
          message: "This challenge room already has two players!",
          type: "warning"
        });
        return;
      }
      
      // Navigate to the room (joining will happen in the room detail page)
      navigate(`/rooms/${joinRoomId.trim()}`);
    } catch (error) {
      console.error("Error joining room:", error);
      showModal({
        title: "Room Join Failed",
        message: "We couldn't join this challenge room. Please try again!",
        type: "error"
      });
    }
  };

  // Copy room ID to clipboard
  const copyRoomId = (roomId: string) => {
    navigator.clipboard.writeText(roomId);
    playSound('click');
    showModal({
      title: "Room ID Copied!",
      message: "You can now share this with a friend to join your challenge room!",
      type: "success"
    });
  };

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  // Get room status display
  const getRoomStatusDisplay = (room: Room) => {
    if (room.status === 'waiting' && !room.player2Id) {
      return {
        text: 'Waiting for player',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100'
      };
    } else if (room.status === 'waiting' && room.player2Id) {
      return {
        text: 'Ready to start',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      };
    } else if (room.status === 'active') {
      return {
        text: 'In progress',
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      };
    } else {
      return {
        text: 'Completed',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100'
      };
    }
  };

  return (
    <div className="py-6">
      <div className="mb-8 text-center">
        <motion.h1 
          className="text-3xl md:text-4xl font-bold text-purple-900 mb-2"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          Challenge Rooms
        </motion.h1>
        <motion.p 
          className="text-purple-600"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Create or join rooms to challenge friends!
        </motion.p>
      </div>

      {/* Create/Join Room Section */}
      <motion.div 
        className="bg-white rounded-2xl shadow-md p-6 mb-8 border-2 border-purple-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Room */}
          <div>
            <h2 className="text-xl font-bold text-purple-900 mb-4">Create a Challenge Room</h2>
            <p className="text-gray-600 mb-4">Start a new room and invite a friend to join you for magical challenges!</p>
            <button
              onClick={createRoom}
              className="btn-magic w-full"
            >
              <span className="flex items-center justify-center">
                <Plus size={18} className="mr-2" />
                Create New Room
              </span>
            </button>
          </div>

          {/* Join Room */}
          <div className="md:border-l md:pl-6 md:border-purple-100">
            <h2 className="text-xl font-bold text-purple-900 mb-4">Join a Challenge Room</h2>
            <p className="text-gray-600 mb-4">Enter a room ID to join a friend's challenge room.</p>
            <div className="flex">
              <input
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="Enter Room ID"
                className="storybook-input flex-1 rounded-r-none"
              />
              <button
                onClick={joinRoom}
                disabled={!joinRoomId.trim()}
                className="px-4 py-3 bg-purple-600 text-white rounded-r-full hover:bg-purple-700 transition-colors duration-300 disabled:bg-purple-300"
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* My Rooms */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-2xl font-bold text-purple-900 mb-4">My Challenge Rooms</h2>
        
        {loading ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-purple-600">Loading your magical rooms...</p>
          </div>
        ) : myRooms.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-8 text-center border-2 border-purple-100">
            <div className="inline-block p-4 rounded-full bg-purple-100 mb-4">
              <MessageSquare size={32} className="text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-purple-900 mb-2">No Rooms Yet</h3>
            <p className="text-purple-600 mb-6">Create a room or join one to start challenging friends!</p>
            <button
              onClick={createRoom}
              className="btn-magic"
            >
              <span className="flex items-center justify-center">
                <Plus size={18} className="mr-2" />
                Create Your First Room
              </span>
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {myRooms.map((room) => {
              const status = getRoomStatusDisplay(room);
              return (
                <motion.div
                  key={room.id}
                  className="bg-white rounded-2xl shadow-md overflow-hidden border-2 border-purple-100"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-purple-900">Challenge Room</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center">
                        <Users size={18} className="text-purple-500 mr-2" />
                        <div>
                          <div className="text-sm text-gray-500">Players</div>
                          <div className="font-medium">
                            {room.player1Name} vs {room.player2Name}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Clock size={18} className="text-purple-500 mr-2" />
                        <div>
                          <div className="text-sm text-gray-500">Created</div>
                          <div className="font-medium">{formatDate(room.createdAt)}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/rooms/${room.id}`)}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors duration-300"
                      >
                        Enter Room
                      </button>
                      <button
                        onClick={() => copyRoomId(room.id)}
                        className="p-2 bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors duration-300"
                        aria-label="Copy Room ID"
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default RoomsPage;