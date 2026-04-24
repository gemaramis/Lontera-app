import React, { useState, useEffect, useRef } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { 
  Hash, 
  Volume2, 
  Settings, 
  Mic, 
  Headphones, 
  Plus, 
  LogOut,
  Video,
  Monitor,
  Search,
  Inbox,
  HelpCircle,
  Bell,
  Users,
  Home,
  Gamepad2,
  Terminal,
  Music,
  Palette,
  ChevronDown,
  Cpu,
  Send,
  MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, setDoc, deleteDoc, getDocs, limit } from 'firebase/firestore';
import { db } from './lib/firebase';


const ServerSettingsModal = ({ isOpen, onClose, server }: { isOpen: boolean, onClose: () => void, server: any }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (server) {
      setName(server.name || '');
      setDescription(server.description || '');
      setStatus(server.status || '');
    }
  }, [server, isOpen]);

  const handleSave = async () => {
    if (!server) return;
    const serverRef = doc(db, 'servers', server.id);
    await setDoc(serverRef, { name, description, status }, { merge: true });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-surface-container-high border border-white/10 rounded-3xl p-8 shadow-2xl"
          >
            <h2 className="text-2xl font-display font-bold text-white mb-6">Server Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-widest mb-2">Server Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-surface-container-highest border-b border-white/10 p-3 rounded-lg text-white outline-none focus:border-primary transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-widest mb-2">Description</label>
                <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-surface-container-highest border-b border-white/10 p-3 rounded-lg text-white outline-none focus:border-primary transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-widest mb-2">Status</label>
                <input value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-surface-container-highest border-b border-white/10 p-3 rounded-lg text-white outline-none focus:border-primary transition-all" />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={handleSave} className="flex-1 bg-primary text-[#310048] font-display font-bold py-3 rounded-xl hover:bg-primary/80 transition-all">Save Changes</button>
              <button onClick={onClose} className="flex-1 bg-white/5 text-white font-display font-bold py-3 rounded-xl hover:bg-white/10 transition-all">Cancel</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const TopNavBar = () => {

  const { user, profileData } = useApp();
  return (
    <header className="h-16 fixed top-0 w-full z-50 glass-surface flex justify-between items-center px-6 shadow-sm shadow-black/20">
      <div className="flex items-center gap-10">
        <div className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-tight">
          Lontera
        </div>
        <nav className="hidden md:flex items-center gap-6">
          {['Explore', 'Friends', 'Library'].map((item) => (
            <a key={item} href="#" className="text-on-surface-variant hover:text-white hover:bg-white/5 transition-all px-3 py-1 rounded-md text-sm font-medium">
              {item}
            </a>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex gap-2">
          <button className="text-on-surface-variant hover:text-white p-2 rounded-full hover:bg-white/5 transition-all"><Bell size="20" /></button>
          <button className="text-on-surface-variant hover:text-white p-2 rounded-full hover:bg-white/5 transition-all"><HelpCircle size="20" /></button>
          <button className="text-on-surface-variant hover:text-white p-2 rounded-full hover:bg-white/5 transition-all"><Settings size="20" /></button>
        </div>
        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <span className="hidden sm:block text-xs font-semibold text-white/50 underline-offset-4 cursor-pointer hover:text-white transition-colors">{profileData?.displayName || user?.email}</span>
          <img 
            src={profileData?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${profileData?.displayName || 'U'}`} 
            className="h-8 w-8 rounded-full border border-outline/50 object-cover" 
            alt="user" 
          />
        </div>
      </div>
    </header>
  );
};

const SidebarServers = () => {
  const { currentServerId, setCurrentServerId, setCurrentChannelId, logout, user } = useApp();
  const [servers, setServers] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'servers'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setServers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Servers snapshot error:", error);
    });
    return unsubscribe;
  }, []);

  const createServer = async () => {
    if (!user) return;
    const name = prompt('Server Name:');
    if (name) {
      try {
        const serverRef = await addDoc(collection(db, 'servers'), {
          name,
          ownerId: user.uid,
          adminIds: [user.uid],
          description: '',
          status: 'Online',
          createdAt: serverTimestamp()
        });
        
        // Add creator to members automatically
        await setDoc(doc(db, `servers/${serverRef.id}/members`, user.uid), {
          uid: user.uid,
          joinedAt: serverTimestamp()
        });

        // Create a default #general channel
        const channelRef = await addDoc(collection(db, `servers/${serverRef.id}/channels`), {
          name: 'general',
          type: 'text',
          serverId: serverRef.id,
          createdAt: serverTimestamp()
        });

        setCurrentServerId(serverRef.id);
        setCurrentChannelId(channelRef.id);
      } catch (err: any) {
        console.error("Create server error:", err);
        alert(`Failed to create server: ${err.message}`);
      }
    }
  };

  return (
    <nav className="fixed left-0 top-16 w-18 h-[calc(100vh-64px)] glass-surface border-r border-white/10 flex flex-col items-center py-4 z-40">
      <div 
        className={`sidebar-icon-v2 mb-2 ${!currentServerId ? 'border-primary grayscale-0 bg-primary/10 shadow-[0_0_15px_rgba(233,179,255,0.2)]' : ''}`} 
        onClick={() => setCurrentServerId(null)}
      >
        <Home size="24" className={!currentServerId ? 'text-primary' : 'text-on-surface-variant'} />
      </div>
      
      <div className="w-8 h-[1px] bg-white/10 mx-auto my-2" />
      
      <div className="flex-1 w-full overflow-y-auto no-scrollbar flex flex-col items-center gap-3">
        {servers.map(server => (
          <div 
            key={server.id} 
            className={`sidebar-icon-v2 group ${currentServerId === server.id ? 'border-primary grayscale-0 ring-1 ring-primary/50' : ''}`}
            onClick={() => setCurrentServerId(server.id)}
          >
            <span className={`font-display font-bold ${currentServerId === server.id ? 'text-primary' : 'text-on-surface-variant'}`}>
              {server.name.charAt(0).toUpperCase()}
            </span>
            <div className="absolute left-0 w-1 h-0 bg-primary rounded-r-full group-hover:h-5 transition-all duration-300" />
          </div>
        ))}
        
        <button onClick={createServer} className="sidebar-icon-v2 text-green-400 border-green-500/20 hover:bg-green-500/10">
          <Plus size="24" />
        </button>
      </div>

      <div className="mt-auto flex flex-col items-center gap-4 pb-4">
        <button className="text-on-surface-variant hover:text-red-400 transition-colors" onClick={logout}>
          <LogOut size="20" />
        </button>
      </div>
    </nav>
  );
};

const SidebarChannels = ({ onOpenSettings }: { onOpenSettings: () => void }) => {
  const { currentServerId, currentChannelId, setCurrentChannelId, currentConversationId, setCurrentConversationId, user } = useApp();
  const [channels, setChannels] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentServer, setCurrentServer] = useState<any>(null);
  const [showServerSettings, setShowServerSettings] = useState(false);

  useEffect(() => {
    const unsubUsers = onSnapshot(query(collection(db, 'users'), limit(50)), (s) => {
      setUsers(s.docs.map(d => ({id: d.id, ...d.data()})));
    });
    if (!currentServerId) {
      if (!user) return unsubUsers;
      const q = query(collection(db, 'conversations'), where('participants', 'array-contains', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setConversations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => { unsubUsers(); unsubscribe(); };
    }
    const q = query(collection(db, `servers/${currentServerId}/channels`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setChannels(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubUsers(); unsubscribe(); };
  }, [currentServerId, user]);

  const createChannel = async (type: 'text' | 'voice') => {
    if (!currentServerId) return;
    const name = prompt(`New ${type} channel name:`);
    if (name) {
      try {
        await addDoc(collection(db, `servers/${currentServerId}/channels`), {
          name,
          type,
          serverId: currentServerId,
          createdAt: serverTimestamp()
        });
      } catch (err: any) {
        console.error("Create channel error:", err);
        alert(`Failed to create channel: ${err.message}`);
      }
    }
  };

  if (!currentServerId) {
    return (
      <div className="w-64 glass-surface border-r border-white/10 h-full flex flex-col p-3">
        <div className="mb-6 mt-4">
          <div className="flex items-center justify-between px-3 mb-2 text-on-surface-variant cursor-pointer hover:text-white transition-colors">
            <span className="text-[10px] font-display font-bold uppercase tracking-wider">Direct Messages</span>
          </div>
          <div className="space-y-0.5">
            {conversations.map(conv => {
              const otherParticipantId = conv.participants.find((p: string) => p !== user?.uid);
              const friend = users.find(u => u.id === otherParticipantId);
              return (
                <div 
                  key={conv.id} 
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer group transition-all ${currentConversationId === conv.id ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'}`}
                  onClick={() => {
                    setCurrentChannelId(null);
                    setCurrentConversationId(conv.id);
                  }}
                >
                  <img src={friend?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${friend?.displayName || 'U'}`} className="h-8 w-8 rounded-full border border-white/10 object-cover" alt="" />
                  <span className="text-sm font-medium truncate">{friend?.displayName || `Friend (${otherParticipantId?.substring(0, 4)})`}</span>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="mt-auto p-3 bg-white/5 border-t border-white/5 -mx-3 flex justify-between items-center">
          <div className="flex gap-1">
            <button className="p-2 rounded-lg text-on-surface-variant hover:text-red-400 hover:bg-white/5 transition-all"><Mic size="18" /></button>
            <button className="p-2 rounded-lg text-on-surface-variant hover:text-red-400 hover:bg-white/5 transition-all"><Headphones size="18" /></button>
          </div>
          <button onClick={onOpenSettings} className="p-2 rounded-lg text-on-surface-variant hover:text-white hover:bg-white/5 transition-all"><Settings size="18" /></button>
        </div>
      </div>
    );
  }

  const isAdmin = currentServer?.adminIds?.includes(user?.uid) || currentServer?.ownerId === user?.uid;

  return (
    <div className="w-64 glass-surface border-r border-white/10 h-full flex flex-col">
      <div className="p-4 pt-6 pb-4 border-b border-white/5 bg-white/5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-center font-display font-bold text-primary">
              {currentServer?.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div>
              <h2 className="font-display font-bold text-white text-sm leading-tight truncate max-w-[120px]">{currentServer?.name || 'Server Name'}</h2>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold truncate max-w-[120px]">{currentServer?.status || 'Online'}</p>
            </div>
          </div>
          {isAdmin && (
            <button onClick={() => setShowServerSettings(true)} className="text-on-surface-variant hover:text-white p-2 rounded-lg hover:bg-white/5 transition-all">
              <Settings size="16" />
            </button>
          )}
        </div>
        <button className="w-full bg-primary hover:bg-primary/80 text-[#310048] font-display font-bold py-2 rounded-lg text-sm transition-all shadow-[0_0_15px_rgba(233,179,255,0.1)]">
          Join Voice
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        <div className="mb-6">
          <div className="flex items-center justify-between px-3 mb-2 text-on-surface-variant cursor-pointer hover:text-white transition-colors">
            <div className="flex items-center gap-1">
              <ChevronDown size="14" />
              <span className="text-[10px] font-display font-bold uppercase tracking-wider">Text Channels</span>
            </div>
            {isAdmin && <Plus size="14" onClick={(e) => { e.stopPropagation(); createChannel('text'); }} className="cursor-pointer hover:text-white transition-colors" />}
          </div>
          <div className="space-y-0.5">
            {channels.filter(c => c.type === 'text').map(channel => (
              <div 
                key={channel.id} 
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group transition-all ${currentChannelId === channel.id ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'}`}
                onClick={() => setCurrentChannelId(channel.id)}
              >
                <Hash size="16" className={currentChannelId === channel.id ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'} />
                <span className="text-sm font-medium">{channel.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between px-3 mb-2 text-on-surface-variant cursor-pointer hover:text-white transition-colors">
            <div className="flex items-center gap-1">
              <ChevronDown size="14" />
              <span className="text-[10px] font-display font-bold uppercase tracking-wider">Voice Channels</span>
            </div>
            {isAdmin && <Plus size="14" onClick={(e) => { e.stopPropagation(); createChannel('voice'); }} className="cursor-pointer hover:text-white transition-colors" />}
          </div>
          <div className="space-y-0.5">
            {channels.filter(c => c.type === 'voice').map(channel => (
              <div 
                key={channel.id} 
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer group transition-all ${currentChannelId === channel.id ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'}`}
                onClick={() => setCurrentChannelId(channel.id)}
              >
                <div className="flex items-center gap-2">
                  <Volume2 size="16" className={currentChannelId === channel.id ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'} />
                  <span className="text-sm font-medium">{channel.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-3 bg-white/5 border-t border-white/5 flex justify-between items-center">
        <div className="flex gap-1">
          <button className="p-2 rounded-lg text-on-surface-variant hover:text-red-400 hover:bg-white/5 transition-all"><Mic size="18" /></button>
          <button className="p-2 rounded-lg text-on-surface-variant hover:text-red-400 hover:bg-white/5 transition-all"><Headphones size="18" /></button>
        </div>
        <button onClick={onOpenSettings} className="p-2 rounded-lg text-on-surface-variant hover:text-white hover:bg-white/5 transition-all"><Settings size="18" /></button>
      </div>
      <ServerSettingsModal isOpen={showServerSettings} onClose={() => setShowServerSettings(false)} server={currentServer} />
    </div>
  );
};

const ChatArea = () => {
  const { currentServerId, currentChannelId, currentConversationId, user, profileData } = useApp();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [channel, setChannel] = useState<any>(null);
  const [conversation, setConversation] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]); // Clear on switch
    if (currentServerId && currentChannelId) {
      const channelRef = doc(db, `servers/${currentServerId}/channels/${currentChannelId}`);
      const unsubChannel = onSnapshot(channelRef, 
        (doc) => setChannel({ id: doc.id, ...doc.data() }),
        (err) => console.error("Channel sub error:", err)
      );

      const q = query(collection(db, `servers/${currentServerId}/channels/${currentChannelId}/messages`));
      const unsubMessages = onSnapshot(q, 
        (snapshot) => {
          const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMessages(msgs.sort((a: any, b: any) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0)));
          setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
        },
        (err) => console.error("Messages sub error:", err)
      );
      return () => {
        unsubChannel();
        unsubMessages();
      };
    } else if (currentConversationId) {
      setChannel(null);
      const convRef = doc(db, 'conversations', currentConversationId);
      const unsubConv = onSnapshot(convRef, 
        (doc) => setConversation({ id: doc.id, ...doc.data() }),
        (err) => console.error("Conv sub error:", err)
      );

      const q = query(collection(db, `conversations/${currentConversationId}/messages`));
      const unsubMessages = onSnapshot(q, 
        (snapshot) => {
          const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMessages(msgs.sort((a: any, b: any) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0)));
          setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
        },
        (err) => console.error("Conv messages sub error:", err)
      );
      return () => {
        unsubConv();
        unsubMessages();
      };
    }
  }, [currentServerId, currentChannelId, currentConversationId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const content = input;
    setInput('');
    
    if (currentServerId && currentChannelId) {
      await addDoc(collection(db, `servers/${currentServerId}/channels/${currentChannelId}/messages`), {
        content,
        authorId: user.uid,
        authorName: profileData?.displayName || user.displayName || 'Unknown',
        authorPhoto: profileData?.photoURL || user.photoURL || '',
        createdAt: serverTimestamp()
      });
    } else if (currentConversationId) {
      await addDoc(collection(db, `conversations/${currentConversationId}/messages`), {
        content,
        authorId: user.uid,
        authorName: profileData?.displayName || user.displayName || 'Unknown',
        authorPhoto: profileData?.photoURL || user.photoURL || '',
        createdAt: serverTimestamp()
      });
      await setDoc(doc(db, 'conversations', currentConversationId), {
        lastMessage: content,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  };

  if (!currentChannelId && !currentConversationId) {
    return (
      <div className="flex-1 flex flex-col bg-background items-center justify-center text-on-surface-variant">
        <div className="p-12 glass-floating rounded-full mb-8 opacity-20 ring-4 ring-primary/10">
          <Hash size="120" className="text-primary" />
        </div>
        <h2 className="text-white text-3xl font-display font-bold mb-2">Welcome to Lontera</h2>
        <p className="text-on-surface-variant max-w-xs text-center">Select a server and channel or a direct message to start your journey.</p>
      </div>
    );
  }

  if (channel?.type === 'voice') {
    return <VoiceArea serverId={currentServerId!} channelId={currentChannelId!} channelName={channel.name} />;
  }

  const headerTitle = channel ? channel.name : (conversation ? 'Private Conversation' : 'Loading...');
  const placeholder = channel ? `Message #${channel.name}` : 'Message Friend';

  return (
    <div className="flex-1 flex flex-col bg-surface-container-low relative">
      <div className="h-14 flex-shrink-0 flex items-center px-6 border-b border-white/10 glass-surface justify-between z-10 transition-all">
        <div className="flex items-center gap-3">
          {channel ? <Hash size="20" className="text-on-surface-variant" /> : <Users size="20" className="text-on-surface-variant" />}
          <h2 className="font-display font-bold text-white tracking-wide">{headerTitle}</h2>
          <div className="h-4 w-[1px] bg-white/10 mx-2" />
          <p className="text-xs text-on-surface-variant truncate max-w-sm">Welcome to the conversation. Keep it clean.</p>
        </div>
        <div className="flex items-center gap-4 text-on-surface-variant">
          <Search size="18" className="cursor-pointer hover:text-white" />
          <Inbox size="18" className="cursor-pointer hover:text-white" />
          <HelpCircle size="18" className="cursor-pointer hover:text-white" />
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col space-y-6 custom-scrollbar">
        <div className="py-12 border-b border-white/5 mb-4">
          <div className="bg-primary/10 h-20 w-20 rounded-2xl flex items-center justify-center mb-6 border border-primary/20 shadow-[0_0_30px_rgba(233,179,255,0.1)]">
            {channel ? <Hash size="44" className="text-primary" /> : <Users size="44" className="text-primary" />}
          </div>
          <h1 className="text-white text-4xl font-display font-bold mb-3 tracking-tight">Welcome to {channel ? `#${channel.name}` : 'the conversation'}!</h1>
          <p className="text-on-surface-variant text-lg">This is the start of the {channel ? `#${channel.name} channel` : 'conversation'}. Let's make it legendary.</p>
        </div>

        <div className="flex flex-col gap-6">
          {messages.map((m) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={m.id} 
              className="flex gap-4 group hover:bg-white/[0.02] -mx-4 px-4 py-2 rounded-xl transition-all"
            >
              <img src={m.authorPhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${m.authorName}`} className="h-10 w-10 rounded-xl mt-1 object-cover border border-white/5" alt="" />
              <div className="flex-1">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-primary font-bold text-sm hover:underline cursor-pointer tracking-wide">{m.authorName}</span>
                  <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tighter opacity-60">
                    {m.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-on-surface chat-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* Example Bot Message from Design */}
          <div className="flex gap-4 group hover:bg-white/[0.02] -mx-4 px-4 py-2 rounded-xl transition-all">
            <div className="w-10 h-10 rounded-xl mt-1 bg-surface-container flex items-center justify-center border border-white/10 relative">
              <div className="absolute -inset-1 rounded-xl bg-secondary/20 blur-sm"></div>
              <Cpu size="20" className="text-secondary relative z-10" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="font-bold text-secondary font-display text-sm flex items-center gap-2">
                  NeonBot
                  <span className="bg-primary/20 text-primary text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm tracking-widest">BOT</span>
                </span>
                <span className="text-on-surface-variant text-[10px] font-bold opacity-60">Today at 10:45 AM</span>
              </div>
              <div className="text-on-surface font-sans text-[15px] leading-relaxed mb-3">
                Check out this crazy screenshot from the new Cyber-punk update. The lighting engine is insane.
              </div>
              <div className="inline-block p-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl max-w-sm overflow-hidden group/img">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCywbjGyg-Q7ftEFPPOjQb2kE_EqfrYdYtNwK3yfJxSasaJJdg8jJYqnSwTziL_6Fhr4hm4hfnMLbJPBtSE7jNPzo3vpJs5OHYK8vxErIQG3cNJmcvaUD2_0261lGeFEPmY8Ya-3s-TX0xwiHuiVPnKY2IScwFGWtrXFzDyTnbHTwhp9ggN61-BbTUnIRYYd4dFyd7sGDLqr0HTyqmepCt7Mu1k0XEfYZQjveZ2VLKtYZJ5MF8hQh8thkBC403EdhXtiR17TvsPzmuI" className="w-full rounded-lg hover:opacity-80 transition-all cursor-zoom-in" alt="attachment" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 pt-0">
        <form onSubmit={sendMessage} className="bg-surface-container-highest rounded-2xl flex items-center px-5 py-3.5 gap-4 shadow-xl border-b-2 border-transparent focus-within:border-secondary transition-all">
          <div className="bg-on-surface-variant/20 hover:bg-primary transition-all h-7 w-7 rounded-full flex items-center justify-center cursor-pointer group">
            <Plus size="18" className="text-on-surface-variant group-hover:text-black" />
          </div>
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder} 
            className="flex-1 bg-transparent outline-none text-on-surface placeholder:text-outline text-[15px] font-medium" 
          />
          <div className="flex items-center gap-4 text-on-surface-variant">
            <Plus size="20" className="cursor-pointer hover:text-white" />
            <Search size="20" className="cursor-pointer hover:text-white" />
            <button type="submit" className="text-primary hover:scale-110 transition-transform">
              <Send size="22" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const peerConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const VideoPlayer = ({ stream, muted = false, className, displayName }: { stream: MediaStream, muted?: boolean, className?: string, displayName?: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);
  return (
    <div className={`relative ${className}`}>
      <video ref={videoRef} autoPlay playsInline muted={muted} className="w-full h-full object-cover" />
      {displayName && (
        <div className="absolute bottom-4 left-4 bg-black/60 shadow-lg px-3 py-1 rounded-lg text-xs font-bold text-white backdrop-blur-md border border-white/10 flex items-center gap-2">
          {displayName}
        </div>
      )}
    </div>
  );
};

const VoiceArea = ({ serverId, channelId, channelName }: { serverId: string, channelId: string, channelName: string }) => {
  const { user, profileData } = useApp();
  const [isVideo, setIsVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [participants, setParticipants] = useState<any[]>([]);
  
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);

  const getCallId = (u1: string, u2: string) => {
    const sorted = [u1, u2].sort();
    return `${serverId}_${channelId}_${sorted[0]}_${sorted[1]}`;
  };

  useEffect(() => {
    let active = true;
    const startStreaming = async () => {
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        } catch (err) {
          console.warn("Could not get video, falling back to audio only", err);
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
        
        // Join channel
        const participantRef = doc(db, `servers/${serverId}/channels/${channelId}/participants/${user?.uid}`);
        await setDoc(participantRef, {
          uid: user?.uid,
          displayName: profileData?.displayName || user?.displayName || 'Unknown',
          photoURL: profileData?.photoURL || user?.photoURL || '',
          joinedAt: serverTimestamp(),
          isMuted: false,
          isStreaming: false
        });

        // Listen for participants
        const participantsQuery = query(collection(db, `servers/${serverId}/channels/${channelId}/participants`));
        const unsubParticipants = onSnapshot(participantsQuery, (snapshot) => {
          const parts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setParticipants(parts);
          
          parts.forEach(async (p: any) => {
            if (p.uid === user?.uid) return;
            if (peerConnections.current[p.uid]) return; // Already connected

            // Create connection
            const pc = new RTCPeerConnection(peerConfig);
            peerConnections.current[p.uid] = pc;

            // Add local tracks
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            // Remote tracks
            pc.ontrack = (event) => {
              setRemoteStreams(prev => ({ ...prev, [p.uid]: event.streams[0] }));
            };

            const callId = getCallId(user!.uid, p.uid);
            const callRef = doc(db, 'calls', callId);

            // ICE Candidates
            pc.onicecandidate = (event) => {
              if (event.candidate) {
                const candColl = user!.uid > p.uid ? 'callerCandidates' : 'receiverCandidates';
                addDoc(collection(callRef, candColl), event.candidate.toJSON());
              }
            };

            // Signaling Logic
            if (user!.uid > p.uid) {
              // I am the caller
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              await setDoc(callRef, {
                callerId: user!.uid,
                receiverId: p.uid,
                serverId,
                channelId,
                offer: { type: offer.type, sdp: offer.sdp },
                updatedAt: serverTimestamp()
              });

              // Listen for answer
              onSnapshot(callRef, async (docSnap) => {
                const data = docSnap.data();
                if (data?.answer && !pc.currentRemoteDescription) {
                  await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                }
              });

              // Listen for receiver candidates
              onSnapshot(collection(callRef, 'receiverCandidates'), (candSnap) => {
                candSnap.docChanges().forEach(async (change) => {
                  if (change.type === 'added') {
                    await pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
                  }
                });
              });
            } else {
              // I am the receiver
              onSnapshot(callRef, async (docSnap) => {
                const data = docSnap.data();
                if (data?.offer && !pc.currentRemoteDescription) {
                  await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                  const answer = await pc.createAnswer();
                  await pc.setLocalDescription(answer);
                  await setDoc(callRef, { answer: { type: answer.type, sdp: answer.sdp } }, { merge: true });
                }
              });

              // Listen for caller candidates
              onSnapshot(collection(callRef, 'callerCandidates'), (candSnap) => {
                candSnap.docChanges().forEach(async (change) => {
                  if (change.type === 'added') {
                    await pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
                  }
                });
              });
            }
          });
        });

        return () => {
          unsubParticipants();
        };
      } catch (err) {
        console.error('WebRTC Error:', err);
      }
    };

    startStreaming();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      deleteDoc(doc(db, `servers/${serverId}/channels/${channelId}/participants/${user?.uid}`));
      Object.values(peerConnections.current).forEach((pc: any) => pc.close());
    };
  }, [serverId, channelId, user?.uid]);

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const leaveCall = () => {
    // This will trigger cleanup in useEffect
    window.location.reload(); // Simple way to leave for now, or just navigate
  };

  return (
    <div className="flex-1 flex flex-col bg-surface-container-low h-screen">
      <div className="h-14 border-b border-white/5 flex items-center px-6 gap-3 shadow-sm bg-surface-container/50 backdrop-blur-md">
        <Volume2 size="20" className="text-on-surface-variant" />
        <h3 className="text-white font-display font-bold tracking-wide">{channelName}</h3>
      </div>
      
      <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto content-start">
        {/* Local Stream */}
        {localStream && (
          <div className="aspect-video bg-surface-container-highest rounded-2xl overflow-hidden relative group ring-2 ring-primary/50 shadow-[0_0_40px_rgba(233,179,255,0.05)]">
            <VideoPlayer 
              stream={localStream} 
              muted={true} 
              className="w-full h-full" 
              displayName="You" 
            />
            {!localStream.getVideoTracks()[0]?.enabled && (
              <div className="absolute inset-0 bg-surface-container flex items-center justify-center">
                 <img src={profileData?.photoURL || user?.photoURL || ''} className="h-24 w-24 rounded-full border-4 border-background shadow-xl" alt="user" />
              </div>
            )}
            <div className="absolute top-4 right-4 bg-black/60 p-2 rounded-full backdrop-blur-md border border-white/10">
              {isMuted ? <Mic size="16" className="text-red-500" /> : <Mic size="16" className="text-green-500" />}
            </div>
          </div>
        )}

        {/* Remote Streams */}
        {Object.entries(remoteStreams).map(([uid, stream]) => {
          const participant = participants.find(p => p.uid === uid);
          return (
            <div key={uid} className="aspect-video bg-surface-container-highest rounded-2xl overflow-hidden relative border border-white/5">
              <VideoPlayer 
                stream={stream as MediaStream} 
                className="w-full h-full" 
                displayName={participant?.displayName || 'Unknown'} 
              />
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center justify-center gap-4 glass-floating p-4 rounded-full z-50 shadow-2xl">
        <button 
          onClick={() => {
            if (localStream) {
              const videoTrack = localStream.getVideoTracks()[0];
              if (videoTrack) videoTrack.enabled = !videoTrack.enabled;
              setIsVideo(videoTrack?.enabled || false);
            }
          }}
          className={`p-4 rounded-full transition-all ${isVideo ? 'bg-primary text-on-primary' : 'bg-white/10 text-white hover:bg-white/20'}`}
        >
          <Video size="22" />
        </button>
        <button className="p-4 bg-white/10 text-white hover:bg-white/20 rounded-full transition-all">
          <Monitor size="22" />
        </button>
        <button 
          onClick={toggleMute}
          className={`p-4 rounded-full transition-all group ${isMuted ? 'bg-error text-on-error' : 'bg-white/10 text-white hover:bg-white/20'}`}
        >
          <Mic size="22" />
        </button>
        <button 
          onClick={leaveCall}
          className="p-4 bg-error text-on-error hover:bg-error-container rounded-full transition-all shadow-lg"
        >
          <LogOut size="22" />
        </button>
      </div>
    </div>
  );
};

const UserList = () => {
  const { currentServerId, user, setCurrentServerId, setCurrentChannelId, setCurrentConversationId } = useApp();
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'users'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  const startConversation = async (otherUserId: string) => {
    if (!user || user.uid === otherUserId) return;
    const sortedIds = [user.uid, otherUserId].sort();
    const convId = sortedIds.join('_');
    const convRef = doc(db, 'conversations', convId);
    await setDoc(convRef, {
      participants: sortedIds,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    setCurrentServerId(null);
    setCurrentChannelId(null);
    setCurrentConversationId(convId);
  };

  const onlineMembers = members.filter(m => m.status === 'online');
  const offlineMembers = members.filter(m => m.status !== 'online');

  return (
    <div className="w-64 glass-surface backdrop-blur-2xl border-l border-white/5 h-full hidden lg:flex flex-col">
      <div className="p-6 pb-4 flex items-center justify-between border-b border-white/5 bg-white/5">
        <h3 className="font-display font-bold text-white text-sm uppercase tracking-widest leading-tight">Members</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
        <div>
          <h4 className="text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-4 pl-2">Online - {onlineMembers.length}</h4>
          <div className="space-y-1">
            {onlineMembers.map(m => (
              <div 
                key={m.uid} 
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer group transition-all"
                onClick={() => startConversation(m.uid)}
              >
                <div className="relative">
                  <img src={m.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${m.displayName}`} className="h-10 w-10 rounded-xl object-cover" alt="" />
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-4 border-[#1e1f22]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-primary text-sm font-bold truncate group-hover:text-on-surface transition-colors">{m.displayName}</span>
                  {m.customStatus && (
                    <span className="text-[10px] text-secondary font-bold truncate flex items-center gap-1">
                      <Gamepad2 size="10" />
                      {m.customStatus}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
           <h4 className="text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-4 pl-2">Offline - {offlineMembers.length}</h4>
           <div className="space-y-1 opacity-50 transition-opacity hover:opacity-80">
              {offlineMembers.map(m => (
                <div 
                  key={m.uid} 
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer group transition-all"
                  onClick={() => startConversation(m.uid)}
                >
                  <div className="relative">
                    <img src={m.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${m.displayName}`} className="h-10 w-10 rounded-xl object-cover grayscale" alt="" />
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-gray-500 rounded-full border-4 border-[#1e1f22]" />
                  </div>
                  <span className="text-on-surface-variant text-sm font-medium truncate">{m.displayName}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

const SettingsModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { profileData, updateProfile } = useApp();
  const [displayName, setDisplayName] = useState('');
  const [customStatus, setCustomStatus] = useState('');
  const [photoURL, setPhotoURL] = useState('');

  useEffect(() => {
    if (profileData) {
      setDisplayName(profileData.displayName || '');
      setCustomStatus(profileData.customStatus || '');
      setPhotoURL(profileData.photoURL || '');
    }
  }, [profileData, isOpen]);

  const handleSave = async () => {
    await updateProfile({
      displayName,
      customStatus,
      photoURL
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl glass-floating rounded-3xl overflow-hidden shadow-2xl flex"
          >
            <div className="w-48 bg-background p-6 border-r border-white/5 flex flex-col gap-2">
              <h3 className="text-xs font-display font-bold text-on-surface-variant uppercase tracking-widest mb-4">User Settings</h3>
              <button className="text-left px-3 py-2 rounded-lg bg-primary/10 text-primary font-bold text-sm">My Account</button>
              <button className="text-left px-3 py-2 rounded-lg text-on-surface-variant hover:bg-white/5 transition-all text-sm font-medium">Privacy & Safety</button>
              <button className="text-left px-3 py-2 rounded-lg text-on-surface-variant hover:bg-white/5 transition-all text-sm font-medium">Appearance</button>
            </div>
            <div className="flex-1 p-8 overflow-y-auto max-h-[80vh] custom-scrollbar">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-display font-bold text-white">My Account</h2>
                <Plus onClick={onClose} className="transform rotate-45 text-on-surface-variant cursor-pointer hover:text-white" />
              </div>

              <div className="space-y-8">
                <div className="bg-surface-container-high p-6 rounded-2xl border border-white/5 flex items-center gap-6">
                  <div className="relative group">
                    <img 
                      src={photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`} 
                      className="h-20 w-20 rounded-2xl object-cover border-2 border-primary/30"
                      alt="avatar"
                    />
                    <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer border-2 border-primary">
                      <Palette size="20" className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-bold text-lg mb-1">{displayName}</h4>
                    <p className="text-on-surface-variant text-xs uppercase tracking-widest font-bold">Online</p>
                  </div>
                  <button className="btn-primary py-2 px-6 text-sm font-bold">Edit Profile</button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-widest mb-2">Display Name</label>
                    <input 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-surface-container-highest border-b border-white/10 p-3 rounded-lg text-white outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-widest mb-2">Custom Status</label>
                    <input 
                      value={customStatus}
                      onChange={(e) => setCustomStatus(e.target.value)}
                      placeholder="What's on your mind?"
                      className="w-full bg-surface-container-highest border-b border-white/10 p-3 rounded-lg text-white outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-widest mb-2">Avatar URL (Optional)</label>
                    <input 
                      value={photoURL}
                      onChange={(e) => setPhotoURL(e.target.value)}
                      placeholder="HTTPS link to image"
                      className="w-full bg-surface-container-highest border-b border-white/10 p-3 rounded-lg text-white outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={handleSave}
                    className="flex-1 bg-primary text-[#310048] font-display font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(233,179,255,0.2)] hover:bg-primary/80 transition-all"
                  >
                    Save Changes
                  </button>
                  <button 
                    onClick={onClose}
                    className="flex-1 bg-white/5 text-white font-display font-bold py-3 rounded-xl hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Auth screen — Register and Login tabs
const AuthScreen = () => {
  const { register, login } = useApp();
  const [tab, setTab] = useState<'register' | 'login'>('register');

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regAvatar, setRegAvatar] = useState('');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const avatarPreview = regAvatar.trim() ||
    `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(regName || 'lontera')}`;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const name = regName.trim();
    if (name.length < 3) { setError('Display name must be at least 3 characters.'); return; }
    if (name.length > 32) { setError('Display name must be 32 characters or fewer.'); return; }
    if (!regEmail.includes('@')) { setError('Please enter a valid email address.'); return; }
    if (regPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (regPassword !== regConfirm) { setError('Passwords do not match.'); return; }
    setSubmitting(true);
    try {
      await register(name, regEmail, regPassword, avatarPreview);
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'That email is already registered. Try logging in.'
        : err.message || 'Something went wrong. Try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!loginEmail || !loginPassword) { setError('Please fill in all fields.'); return; }
    setSubmitting(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      const msg =
        err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
          ? 'Invalid email or password.'
          : err.message || 'Something went wrong. Try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[20%] left-[10%] w-[40vw] h-[40vw] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[30vw] h-[30vw] bg-secondary/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-floating p-10 rounded-3xl w-full max-w-md border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10"
      >
        {/* Logo + title */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl border-2 border-primary/20 flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(233,179,255,0.15)] transform rotate-12 hover:rotate-0 transition-transform duration-500">
            <Cpu size="40" className="text-primary" />
          </div>
          <h1 className="text-white text-3xl font-display font-bold tracking-tighter">Welcome to Lontera</h1>
          <p className="text-on-surface-variant text-sm mt-2 text-center leading-relaxed">
            {tab === 'register' ? 'Create your account to get started.' : 'Sign in to continue your journey.'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-white/5 rounded-xl p-1 mb-6 border border-white/5">
          <button
            id="auth-tab-register"
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-display font-bold transition-all ${
              tab === 'register'
                ? 'bg-primary text-[#310048] shadow-[0_0_15px_rgba(233,179,255,0.2)]'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Register
          </button>
          <button
            id="auth-tab-login"
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-display font-bold transition-all ${
              tab === 'login'
                ? 'bg-primary text-[#310048] shadow-[0_0_15px_rgba(233,179,255,0.2)]'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Log In
          </button>
        </div>

        <AnimatePresence mode="wait">
          {tab === 'register' ? (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleRegister}
              className="flex flex-col gap-4"
            >
              {/* Avatar preview */}
              <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 border border-white/10">
                <img
                  src={avatarPreview}
                  alt="avatar preview"
                  className="h-12 w-12 rounded-xl object-cover border-2 border-primary/30 bg-surface-container flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">Avatar Preview</p>
                  <p className="text-white text-sm font-medium truncate">{regName || 'Your name'}</p>
                  <p className="text-on-surface-variant text-[11px]">Auto-generated · paste URL below to change</p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                  Display Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="register-username"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="e.g. StargazerX"
                  maxLength={32}
                  autoComplete="off"
                  className="w-full bg-surface-container-highest border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-white outline-none transition-all placeholder:text-outline text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  id="register-email"
                  type="email"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full bg-surface-container-highest border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-white outline-none transition-all placeholder:text-outline text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                  Password <span className="text-red-400">*</span>
                </label>
                <input
                  id="register-password"
                  type="password"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className="w-full bg-surface-container-highest border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-white outline-none transition-all placeholder:text-outline text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <input
                  id="register-confirm"
                  type="password"
                  value={regConfirm}
                  onChange={e => setRegConfirm(e.target.value)}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  className="w-full bg-surface-container-highest border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-white outline-none transition-all placeholder:text-outline text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                  Avatar URL <span className="text-on-surface-variant font-normal normal-case tracking-normal">(optional)</span>
                </label>
                <input
                  id="register-avatar"
                  value={regAvatar}
                  onChange={e => setRegAvatar(e.target.value)}
                  placeholder="https://…"
                  className="w-full bg-surface-container-highest border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-white outline-none transition-all placeholder:text-outline text-sm"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm font-medium bg-red-400/10 rounded-xl px-4 py-3 border border-red-400/20">{error}</p>
              )}

              <button
                id="register-submit"
                type="submit"
                disabled={submitting}
                className="w-full btn-primary py-4 font-display font-bold text-base mt-1 shadow-[0_0_25px_rgba(233,179,255,0.1)] active:scale-95 transform transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating account…' : 'Create Account →'}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleLogin}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="block text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full bg-surface-container-highest border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-white outline-none transition-all placeholder:text-outline text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className="w-full bg-surface-container-highest border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-white outline-none transition-all placeholder:text-outline text-sm"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm font-medium bg-red-400/10 rounded-xl px-4 py-3 border border-red-400/20">{error}</p>
              )}

              <button
                id="login-submit"
                type="submit"
                disabled={submitting}
                className="w-full btn-primary py-4 font-display font-bold text-base mt-1 shadow-[0_0_25px_rgba(233,179,255,0.1)] active:scale-95 transform transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Signing in…' : 'Sign In →'}
              </button>

              <p className="text-center text-on-surface-variant text-xs pt-1">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setTab('register'); setError(''); }}
                  className="text-primary hover:underline font-bold"
                >
                  Register here
                </button>
              </p>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-6 pt-5 border-t border-white/5 flex justify-between text-[10px] font-display font-bold uppercase tracking-widest text-on-surface-variant">
          <span className="hover:text-primary cursor-pointer transition-colors">Privacy</span>
          <span className="hover:text-primary cursor-pointer transition-colors">Terms</span>
        </div>
      </motion.div>
    </div>
  );
};

const LonteraApp = () => {
  const { user, loading, needsSetup } = useApp();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-16 w-16 bg-primary/20 rounded-full blur-xl animate-pulse" />
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!user || needsSetup) {
    return <AuthScreen />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background font-sans">
      <TopNavBar />
      <div className="flex-1 flex mt-16 h-[calc(100vh-64px)] overflow-hidden relative">
        <SidebarServers />
        <div className="flex-1 flex ml-18 bg-surface-container-low">
          <SidebarChannels onOpenSettings={() => setIsSettingsOpen(true)} />
          <ChatArea />
          <UserList />
        </div>
      </div>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <LonteraApp />
    </AppProvider>
  );
}
