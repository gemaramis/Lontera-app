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
  PhoneOff,
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
  Trash2,
  Shield,
  MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, setDoc, deleteDoc, getDoc, getDocs, limit } from 'firebase/firestore';
import { db } from './lib/firebase';


const ChannelSettingsModal = ({ isOpen, onClose, channel, serverId }: { isOpen: boolean, onClose: () => void, channel: any, serverId: string }) => {
  const { user, currentServer } = useApp();
  const [name, setName] = useState('');
  useEffect(() => { if (channel) setName(channel.name); }, [channel, isOpen]);

  const isAdmin = currentServer?.adminIds?.includes(user?.uid) || currentServer?.ownerId === user?.uid;

  const handleSave = async () => {
    if (!channel || !serverId || !isAdmin) return;
    const channelRef = doc(db, `servers/${serverId}/channels`, channel.id);
    await setDoc(channelRef, { name }, { merge: true });
    onClose();
  };

  const handleDelete = async () => {
    if (!channel || !serverId || !isAdmin || !window.confirm('Delete this channel?')) return;
    const channelRef = doc(db, `servers/${serverId}/channels`, channel.id);
    await deleteDoc(channelRef);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md glass-floating rounded-3xl p-8 shadow-2xl">
            <h2 className="text-xl font-display font-bold text-white mb-6">Channel Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-widest mb-2">Channel Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} disabled={!isAdmin} className="w-full bg-surface-container-highest border-b border-white/10 p-3 rounded-lg text-white outline-none focus:border-primary transition-all disabled:opacity-50" />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              {isAdmin && (
                <>
                  <button onClick={handleSave} className="flex-1 btn-primary py-2.5 rounded-xl text-sm">Save</button>
                  <button onClick={handleDelete} className="p-2.5 bg-error/20 text-error rounded-xl hover:bg-error/30 transition-all"><Trash2 size="18" /></button>
                </>
              )}
              <button onClick={onClose} className="flex-1 bg-white/5 text-white py-2.5 rounded-xl text-sm">Cancel</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};


const ServerSettingsModal = ({ isOpen, onClose, server }: { isOpen: boolean, onClose: () => void, server: any }) => {
  const { user } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [tab, setTab] = useState<'general' | 'members'>('general');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<{ type: 'error' | 'success', msg: string } | null>(null);

  useEffect(() => {
    if (server && isOpen) {
      const unsub = onSnapshot(collection(db, `servers/${server.id}/members`), async (snap) => {
        const mData = await Promise.all(snap.docs.map(async (mDoc) => {
          const uSnap = await getDoc(doc(db, 'users', mDoc.id));
          return { id: mDoc.id, ...mDoc.data(), ...(uSnap.data() || {}) };
        }));
        setMembers(mData);
      });
      return () => unsub();
    }
  }, [server, isOpen]);

  useEffect(() => {
    if (server) {
      setName(server.name || '');
      setDescription(server.description || '');
      setStatus(server.status || '');
    }
  }, [server, isOpen]);

  const isAdmin = server?.adminIds?.includes(user?.uid) || server?.ownerId === user?.uid;

  const handleSave = async () => {
    if (!server) return;
    const serverRef = doc(db, 'servers', server.id);
    await setDoc(serverRef, { name, description, status }, { merge: true });
    onClose();
  };

  const handleDeleteServer = async () => {
    if (!server || !window.confirm(`Are you sure you want to delete "${server.name}"? This cannot be undone.`)) return;
    await deleteDoc(doc(db, 'servers', server.id));
    onClose();
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteStatus(null);
    if (!inviteEmail.includes('@')) {
      setInviteStatus({ type: 'error', msg: 'Please enter a valid email.' });
      return;
    }
    try {
      const q = query(collection(db, 'users'), where('email', '==', inviteEmail), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) {
        setInviteStatus({ type: 'error', msg: 'User not found.' });
        return;
      }
      const newUser = snap.docs[0];
      await setDoc(doc(db, `servers/${server.id}/members`, newUser.id), {
        uid: newUser.id,
        joinedAt: serverTimestamp()
      });
      setInviteStatus({ type: 'success', msg: `Added ${newUser.data().displayName}!` });
      setInviteEmail('');
    } catch (err: any) {
      setInviteStatus({ type: 'error', msg: err.message });
    }
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
            className="relative w-full max-w-2xl glass-floating rounded-3xl overflow-hidden shadow-2xl flex h-[520px]"
          >
            <div className="w-52 bg-white/5 p-6 border-r border-white/10 flex flex-col gap-2 flex-shrink-0">
              <h3 className="text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-widest mb-4">Management</h3>
              <button onClick={() => setTab('general')} className={`text-left px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'general' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-white/5'}`}>Overview</button>
              <button onClick={() => setTab('members')} className={`text-left px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'members' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-white/5'}`}>Members</button>
            </div>
            <div className="flex-1 p-8 flex flex-col min-w-0">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-display font-bold text-white tracking-tight">{tab === 'general' ? 'Server Overview' : 'Members'}</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                {tab === 'general' ? (
                  <div className="space-y-5">
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                      <label className="block text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-widest mb-2.5">Server Name</label>
                      <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-surface-container-highest border border-white/10 p-3 rounded-xl text-white outline-none focus:border-primary transition-all text-sm font-semibold" />
                    </div>
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                      <label className="block text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-widest mb-2.5">Description</label>
                      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-surface-container-highest border border-white/10 p-3 rounded-xl text-white outline-none focus:border-primary transition-all resize-none text-sm" />
                    </div>
                    {(server.ownerId === user?.uid || server.name === 'Test Server') && (
                      <div className="pt-4">
                        <button 
                          onClick={handleDeleteServer}
                          className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-xs font-bold uppercase tracking-widest"
                        >
                          <Trash2 size="14" />
                          Delete Server {server.name === 'Test Server' && '(Force)'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <form onSubmit={handleInvite} className="bg-white/5 p-5 rounded-2xl border border-white/5">
                      <label className="block text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-widest mb-3">Invite by Email</label>
                      <div className="flex gap-2">
                        <input 
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="friend@example.com"
                          className="flex-1 bg-surface-container-highest border border-white/10 p-2.5 rounded-xl text-white outline-none focus:border-primary transition-all text-sm"
                        />
                        <button type="submit" className="bg-primary text-[#310048] px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-all">Add</button>
                      </div>
                      {inviteStatus && (
                        <p className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${inviteStatus.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{inviteStatus.msg}</p>
                      )}
                    </form>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-widest px-2">Member List</label>
                      {members.map(m => (
                        <div key={m.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-all">
                          <div className="flex items-center gap-3">
                            <img src={m.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${m.displayName}`} className="h-9 w-9 rounded-xl border border-white/10" />
                            <div>
                              <p className="font-bold text-white text-sm leading-tight">{m.displayName}</p>
                              <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-widest leading-tight">{server.ownerId === m.id ? 'Owner' : (server.adminIds?.includes(m.id) ? 'Admin' : 'Member')}</p>
                            </div>
                          </div>
                          {server.ownerId === user?.uid && m.id !== user?.uid && (
                            <button 
                              onClick={async () => {
                                const newAdmins = server.adminIds?.includes(m.id) 
                                  ? server.adminIds.filter((id: string) => id !== m.id)
                                  : [...(server.adminIds || []), m.id];
                                await setDoc(doc(db, 'servers', server.id), { adminIds: newAdmins }, { merge: true });
                              }}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${server.adminIds?.includes(m.id) ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:bg-white/20'}`}
                              title={server.adminIds?.includes(m.id) ? 'Remove Admin' : 'Make Admin'}
                            >
                              <span className="text-[9px] font-bold uppercase tracking-widest hidden group-hover:block">{server.adminIds?.includes(m.id) ? 'Revoke Admin' : 'Promote to Admin'}</span>
                              <Shield size="16" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                {isAdmin ? (
                  <button onClick={handleSave} className="flex-1 btn-primary py-3 rounded-xl text-sm">Save Changes</button>
                ) : (
                  <div className="flex-1" />
                )}
                <button onClick={onClose} className="flex-1 bg-white/5 text-white py-3 rounded-xl text-sm hover:bg-white/10 transition-all font-bold">Cancel</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const TopNavBar = ({ onOpenProfile, activeView, onViewChange }: { onOpenProfile: () => void, activeView: string, onViewChange: (v: string) => void }) => {

  const { user, profileData } = useApp();
  return (
    <header className="h-16 fixed top-0 w-full z-50 glass-surface flex justify-between items-center px-6 shadow-sm shadow-black/20">
      <div className="flex items-center gap-10">
        <div className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-tight">
          Lontera
        </div>
        <nav className="hidden md:flex items-center gap-6">
          {[
            { id: 'explore', label: 'Explore', icon: Compass },
            { id: 'friends', label: 'Friends', icon: Users },
            { id: 'library', label: 'Library', icon: Library }
          ].map((item) => (
            <button 
              key={item.id} 
              onClick={() => onViewChange(item.id)}
              className={`flex items-center gap-2 transition-all px-3 py-1.5 rounded-lg text-sm font-bold uppercase tracking-widest ${activeView === item.id ? 'bg-primary text-[#310048] shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:text-white hover:bg-white/5'}`}
            >
              <item.icon size="16" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex gap-2">
          <button className="text-on-surface-variant hover:text-white p-2 rounded-full hover:bg-white/5 transition-all"><Bell size="20" /></button>
          <button className="text-on-surface-variant hover:text-white p-2 rounded-full hover:bg-white/5 transition-all"><HelpCircle size="20" /></button>
          <button className="text-on-surface-variant hover:text-white p-2 rounded-full hover:bg-white/5 transition-all"><Settings size="20" /></button>
        </div>
        <div onClick={onOpenProfile} className="flex items-center gap-3 pl-4 border-l border-white/10 cursor-pointer group">
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

const SidebarChannels = ({ onOpenSettings, onOpenServerSettings, onOpenChannelSettings, onOpenUserDirectory }: { onOpenSettings: () => void, onOpenServerSettings: () => void, onOpenChannelSettings: (c: any) => void, onOpenUserDirectory: () => void }) => {
  const { currentServerId, currentServer, currentChannelId, setCurrentChannelId, currentConversationId, setCurrentConversationId, user } = useApp();
  const [channels, setChannels] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

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
          <div className="flex items-center justify-between px-3 mb-2 text-on-surface-variant">
            <span className="text-[10px] font-display font-bold uppercase tracking-wider">Direct Messages</span>
            <button onClick={onOpenUserDirectory} className="hover:text-white transition-colors p-1 rounded-md hover:bg-white/5"><Plus size="14" /></button>
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
            <button onClick={onOpenServerSettings} className="text-on-surface-variant hover:text-white p-2 rounded-lg hover:bg-white/5 transition-all">
              <ChevronDown size="18" />
            </button>
          )}
        </div>
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
                <span className="text-sm font-medium flex-1">{channel.name}</span>
                {isAdmin && (
                  <Settings size="14" className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition-all" onClick={(e) => { e.stopPropagation(); onOpenChannelSettings(channel); }} />
                )}
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
                <div className="flex items-center gap-2 flex-1">
                  <Volume2 size="16" className={currentChannelId === channel.id ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'} />
                  <span className="text-sm font-medium">{channel.name}</span>
                </div>
                {isAdmin && (
                  <Settings size="14" className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition-all" onClick={(e) => { e.stopPropagation(); onOpenChannelSettings(channel); }} />
                )}
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
        {isAdmin && (
          <button onClick={onOpenServerSettings} className="p-2 rounded-lg text-on-surface-variant hover:text-white hover:bg-white/5 transition-all">
            <Settings size="18" />
          </button>
        )}
      </div>
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
          <p className="text-on-surface-variant text-lg">This is the beginning of your legendary journey here. Type a message below to start chatting.</p>
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
          <PhoneOff size="22" />
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
                  <div className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-[3px] border-[#1e1f22] ${m.status === 'online' ? 'bg-green-500' : m.status === 'idle' ? 'bg-yellow-500' : m.status === 'dnd' ? 'bg-red-500' : 'bg-gray-500'}`} />
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
                    <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-gray-500 rounded-full border-[3px] border-[#1e1f22]" />
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
  const [status, setStatus] = useState('online');
  const [photoURL, setPhotoURL] = useState('');

  useEffect(() => {
    if (profileData) {
      setDisplayName(profileData.displayName || '');
      setCustomStatus(profileData.customStatus || '');
      setStatus(profileData.status || 'online');
      setPhotoURL(profileData.photoURL || '');
    }
  }, [profileData, isOpen]);

  const handleSave = async () => {
    await updateProfile({
      displayName,
      customStatus,
      status,
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
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${status === 'online' ? 'bg-green-500' : status === 'idle' ? 'bg-yellow-500' : status === 'dnd' ? 'bg-red-500' : 'bg-gray-500'}`} />
                      <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">{status}</p>
                    </div>
                  </div>
                  <button disabled className="btn-primary py-2 px-6 text-sm font-bold opacity-50 cursor-default">Preview</button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-widest mb-3">Presence Status</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'online', label: 'Online', color: 'bg-green-500' },
                        { id: 'idle', label: 'Idle', color: 'bg-yellow-500' },
                        { id: 'dnd', label: 'Do Not Disturb', color: 'bg-red-500' },
                        { id: 'offline', label: 'Invisible', color: 'bg-gray-500' }
                      ].map(s => (
                        <button 
                          key={s.id}
                          onClick={() => setStatus(s.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-[11px] font-bold ${status === s.id ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/5 text-on-surface-variant hover:bg-white/10'}`}
                        >
                          <div className={`h-2 w-2 rounded-full ${s.color}`} />
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-widest mb-2">Display Name</label>
                    <input 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-surface-container-highest border-b border-white/10 p-3 rounded-lg text-white outline-none focus:border-primary transition-all text-sm font-semibold"
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

const FriendsView = () => {
  const { user, setCurrentServerId, setCurrentChannelId, setCurrentConversationId } = useApp();
  const [activeTab, setActiveTab] = useState<'online' | 'all' | 'pending' | 'add'>('online');
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;
    
    // Listen for friends
    const unsubFriends = onSnapshot(collection(db, `users/${user.uid}/friends`), (snap) => {
      const friendIds = snap.docs.map(d => d.id);
      if (friendIds.length > 0) {
        const q = query(collection(db, 'users'), where('uid', 'in', friendIds));
        onSnapshot(q, (s) => setFriends(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      } else {
        setFriends([]);
      }
    });

    // Listen for incoming requests
    const unsubReq = onSnapshot(collection(db, `users/${user.uid}/friendRequests`), (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Listen for all users (for discovery)
    const unsubUsers = onSnapshot(query(collection(db, 'users'), limit(50)), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.id !== user.uid));
    });

    return () => { unsubFriends(); unsubReq(); unsubUsers(); };
  }, [user]);

  const sendRequest = async (toId: string) => {
    if (!user) return;
    await setDoc(doc(db, `users/${toId}/friendRequests`, user.uid), {
      fromId: user.uid,
      status: 'pending',
      timestamp: serverTimestamp(),
      displayName: user.displayName || 'Unknown',
      photoURL: user.photoURL || ''
    });
  };

  const acceptRequest = async (fromId: string) => {
    if (!user) return;
    // Add to my friends
    await setDoc(doc(db, `users/${user.uid}/friends`, fromId), { uid: fromId, since: serverTimestamp() });
    // Add me to their friends
    await setDoc(doc(db, `users/${fromId}/friends`, user.uid), { uid: user.uid, since: serverTimestamp() });
    // Delete request
    await deleteDoc(doc(db, `users/${user.uid}/friendRequests`, fromId));
  };

  const declineRequest = async (fromId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/friendRequests`, fromId));
  };

  const startChat = (friendId: string) => {
    if (!user) return;
    const sortedIds = [user.uid, friendId].sort();
    const convId = sortedIds.join('_');
    setCurrentServerId(null);
    setCurrentChannelId(null);
    setCurrentConversationId(convId);
  };

  const filteredUsers = users.filter(u => u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) && !friends.some(f => f.id === u.id));
  const onlineFriends = friends.filter(f => f.status === 'online');
  const pendingIncoming = requests.filter(r => r.status === 'pending');

  return (
    <div className="flex-1 flex flex-col bg-surface-container-low h-full overflow-hidden">
      <div className="h-16 border-b border-white/5 flex items-center px-6 gap-6 bg-surface-container/30 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 pr-6 border-r border-white/10">
          <Users size="20" className="text-on-surface-variant" />
          <h2 className="text-white font-display font-bold tracking-tight">Friends</h2>
        </div>
        
        <nav className="flex items-center gap-1">
          {[
            { id: 'online', label: `Online${onlineFriends.length > 0 ? ` (${onlineFriends.length})` : ''}` },
            { id: 'all', label: 'All' },
            { id: 'pending', label: `Pending${pendingIncoming.length > 0 ? ` (${pendingIncoming.length})` : ''}` },
            { id: 'add', label: 'Add Friend', highlight: true }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                  ? (tab.highlight ? 'bg-green-500 text-black' : 'bg-white/10 text-white') 
                  : (tab.highlight ? 'text-green-500 hover:bg-green-500/10' : 'text-on-surface-variant hover:text-white hover:bg-white/5')
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {activeTab === 'add' ? (
          <div className="max-w-2xl">
            <h3 className="text-white font-display font-bold text-lg mb-2">Add Friend</h3>
            <p className="text-on-surface-variant text-sm mb-6">You can add friends with their Lontera username or email.</p>
            <div className="relative mb-8">
              <input 
                placeholder="Search Lontera users..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface-container-highest border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-primary transition-all pr-12 shadow-xl"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size="20" />
            </div>

            <div className="space-y-3">
              {filteredUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <img src={u.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${u.displayName}`} className="h-12 w-12 rounded-2xl object-cover" alt="" />
                    <div>
                      <h4 className="text-white font-bold text-sm leading-tight">{u.displayName}</h4>
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mt-0.5">{u.status || 'Offline'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => sendRequest(u.id)}
                    className="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-primary hover:text-black transition-all"
                  >
                    Send Friend Request
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'pending' ? (
          <div className="space-y-8">
            <div>
              <h4 className="text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-4 pl-2">Friend Requests — {pendingIncoming.length}</h4>
              <div className="space-y-2">
                {pendingIncoming.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group transition-all">
                    <div className="flex items-center gap-4">
                      <img src={r.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${r.displayName}`} className="h-12 w-12 rounded-2xl object-cover" alt="" />
                      <div>
                        <h4 className="text-white font-bold text-sm leading-tight">{r.displayName}</h4>
                        <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mt-0.5">Incoming Request</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => acceptRequest(r.id)} className="p-2.5 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-black transition-all"><Check size="20" /></button>
                      <button onClick={() => declineRequest(r.id)} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-black transition-all"><X size="20" /></button>
                    </div>
                  </div>
                ))}
                {pendingIncoming.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant opacity-50">
                    <Mail size="48" className="mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest">No pending requests</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {(activeTab === 'online' ? onlineFriends : friends).map(f => (
              <div 
                key={f.id} 
                className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all cursor-pointer"
                onClick={() => startChat(f.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={f.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${f.displayName}`} className="h-12 w-12 rounded-2xl object-cover" alt="" />
                    <div className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-[3px] border-[#1e1f22] ${f.status === 'online' ? 'bg-green-500' : f.status === 'idle' ? 'bg-yellow-500' : f.status === 'dnd' ? 'bg-red-500' : 'bg-gray-500'}`} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm leading-tight">{f.displayName}</h4>
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mt-0.5">{f.customStatus || f.status || 'Offline'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button onClick={(e) => { e.stopPropagation(); startChat(f.id); }} className="p-2.5 bg-white/5 text-on-surface-variant rounded-xl hover:text-white transition-all"><MessageSquare size="20" /></button>
                   <button className="p-2.5 bg-white/5 text-on-surface-variant rounded-xl hover:text-red-400 transition-all"><MoreVertical size="20" /></button>
                </div>
              </div>
            ))}
            {friends.length === 0 && (
              <div className="flex flex-col items-center justify-center py-40 text-on-surface-variant opacity-50">
                <Users size="64" className="mb-4" />
                <p className="text-lg font-bold uppercase tracking-[0.2em] mb-2">No friends yet</p>
                <button onClick={() => setActiveTab('add')} className="text-primary hover:underline text-sm font-bold">Try adding someone!</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const UserDirectoryModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { user, setCurrentServerId, setCurrentChannelId, setCurrentConversationId } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const q = query(collection(db, 'users'), limit(50));
    const unsubscribe = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.id !== user?.uid));
    });
    return unsubscribe;
  }, [isOpen, user]);

  const startConversation = async (otherUserId: string) => {
    if (!user) return;
    const sortedIds = [user.uid, otherUserId].sort();
    const convId = sortedIds.join('_');
    await setDoc(doc(db, 'conversations', convId), {
      participants: sortedIds,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    setCurrentServerId(null);
    setCurrentChannelId(null);
    setCurrentConversationId(convId);
    onClose();
  };

  const filtered = users.filter(u => u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-xl glass-floating rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[70vh]">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-xl font-display font-bold text-white mb-4">Discover Friends</h2>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size="18" />
                <input 
                  autoFocus
                  placeholder="Search by username or email..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 p-3 pl-12 rounded-xl text-white outline-none focus:border-primary transition-all"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {filtered.map(u => (
                <div 
                  key={u.id}
                  onClick={() => startConversation(u.id)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img src={u.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${u.displayName}`} className="h-12 w-12 rounded-2xl object-cover" alt="" />
                      <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[#1e1f22] ${u.status === 'online' ? 'bg-green-500' : u.status === 'idle' ? 'bg-yellow-500' : u.status === 'dnd' ? 'bg-red-500' : 'bg-gray-500'}`} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm leading-tight group-hover:text-primary transition-colors">{u.displayName}</h4>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mt-0.5">{u.status || 'Offline'}</p>
                    </div>
                  </div>
                  <button className="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all">Message</button>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-on-surface-variant text-sm font-medium">No users found matching "{searchTerm}"</p>
                </div>
              )}
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
  const { user, loading, needsSetup, currentServer, currentServerId, currentChannelId, currentConversationId } = useApp();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isServerSettingsOpen, setIsServerSettingsOpen] = useState(false);
  const [isUserDirectoryOpen, setIsUserDirectoryOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<any>(null);
  const [activeView, setActiveView] = useState('explore');

  // Auto-switch to chat view when a channel or conversation is selected
  useEffect(() => {
    if (currentChannelId || currentConversationId) {
      setActiveView('chat');
    }
  }, [currentChannelId, currentConversationId]);

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
      <TopNavBar 
        onOpenProfile={() => setIsSettingsOpen(true)} 
        activeView={activeView}
        onViewChange={(v) => {
          setActiveView(v);
          // Optional: clear selections if switching to explore/friends? 
          // Usually better to keep them in background.
        }}
      />
      <div className="flex-1 flex mt-16 h-[calc(100vh-64px)] overflow-hidden relative">
        <SidebarServers />
        <div className="flex-1 flex ml-18 bg-surface-container-low">
          <SidebarChannels 
            onOpenSettings={() => setIsSettingsOpen(true)} 
            onOpenServerSettings={() => setIsServerSettingsOpen(true)}
            onOpenChannelSettings={(c) => setEditingChannel(c)}
            onOpenUserDirectory={() => setIsUserDirectoryOpen(true)}
          />
          {activeView === 'friends' ? (
            <FriendsView />
          ) : activeView === 'explore' ? (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant font-display font-bold uppercase tracking-[0.2em] animate-pulse">
              Explore coming soon...
            </div>
          ) : (
            <ChatArea />
          )}
          <UserList />
        </div>
      </div>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <UserDirectoryModal isOpen={isUserDirectoryOpen} onClose={() => setIsUserDirectoryOpen(false)} />
      <ServerSettingsModal isOpen={isServerSettingsOpen} onClose={() => setIsServerSettingsOpen(false)} server={currentServer} />
      <ChannelSettingsModal isOpen={!!editingChannel} onClose={() => setEditingChannel(null)} channel={editingChannel} serverId={currentServerId || ''} />
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
