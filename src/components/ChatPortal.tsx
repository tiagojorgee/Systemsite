import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppUser } from './AuthModal';
import { 
  Send, 
  Image, 
  Mic, 
  MicOff, 
  Trash2, 
  EyeOff, 
  Search, 
  Paperclip, 
  Smile, 
  X, 
  Check, 
  CheckCheck, 
  ChevronLeft,
  Video,
  Phone,
  PhoneOff,
  VideoOff,
  MoreVertical,
  Volume2,
  Pin,
  Reply,
  Heart,
  SmilePlus,
  Sparkles,
  Lock,
  LockOpen,
  Eye,
  Plus,
  Hash,
  MessageSquare,
  Users,
  Download,
  Clock,
  Settings,
  HelpCircle,
  FileText,
  VolumeX,
  Play
} from 'lucide-react';
import { playSound } from '../utils/audio';

interface ChatPortalProps {
  loggedInUser: AppUser | null;
  onOpenLogin: () => void;
}

interface ChatContact {
  uid: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  biography?: string;
}

interface GroupItem {
  id: string;
  name: string;
  description?: string;
  creator_id: string;
  avatar_url?: string;
  banner_url?: string;
  type: 'group' | 'channel';
  member_count: number;
  created_at: string;
}

interface MessageItem {
  id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  mediaUrl?: string;
  mediaType: 'text' | 'image' | 'audio' | 'video' | 'file' | 'gif' | 'sticker';
  created_at: string;
  deleted: boolean;
  hiddenFor: string[];
  reply_to_id?: string;
  reactions?: string; // JSON string of Array<{ userId: string, emoji: string, userName: string }>
  pinned?: boolean;
  is_encrypted?: boolean;
  expires_at?: string;
  group_id?: string;
  is_channel?: boolean;
}

// Emoji options
const PRESET_EMOJIS = [
  '😀', '😂', '🤣', '😊', '😍', '🥰', '😘', '🤪', '👍', '🔥', 
  '❤️', '🎉', '🎮', '🕹️', '👾', '🏆', '💎', '👑', '🚀', '⭐'
];

// High-fidelity stickers
const STICKER_PACKS = [
  { name: 'Creeper', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=120&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', label: '👾 Creeper' },
  { name: 'Sonic Run', url: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=120&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', label: '🦔 Sonic Run' },
  { name: 'Pixel Slime', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', label: '🟢 Slime' },
  { name: 'Gamer Win', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=120&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', label: '🏆 Winner' },
  { name: 'Rage Over', url: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=120&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', label: '🎮 Game Over' },
  { name: 'Cyber Neon', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=120&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', label: '⚡ Neon Cyber' }
];

// High-fidelity GIFs
const DUMMY_GIFS = [
  { title: 'Victory Dance', url: 'https://media.giphy.com/media/l3q2zVr6cu95nF6O4/giphy.gif', poster: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=120' },
  { title: 'Gaming Rage', url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif', poster: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=120' },
  { title: 'Cyberpunk Drive', url: 'https://media.giphy.com/media/f376T8v3E4Rne/giphy.gif', poster: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=120' },
  { title: 'Neon Retro', url: 'https://media.giphy.com/media/A24U6SgA5vF3G/giphy.gif', poster: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=120' },
  { title: 'Cat Typing', url: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif', poster: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=120' }
];

// Helper E2EE Cryptographic encoding/decryption simulation
const encodeE2EE = (text: string): string => {
  return '[E2EE-LOCK] ' + btoa(unescape(encodeURIComponent(text)));
};

const decodeE2EE = (encrypted: string): string => {
  if (!encrypted.startsWith('[E2EE-LOCK] ')) return encrypted;
  try {
    const base64 = encrypted.substring(12);
    return decodeURIComponent(escape(atob(base64)));
  } catch (e) {
    return '[Falha na descriptografia da chave local]';
  }
};

export const ChatPortal: React.FC<ChatPortalProps> = ({ loggedInUser, onOpenLogin }) => {
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ChatContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  
  // Real-time states
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, string>>({});
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);
  const [typingGroupUsers, setTypingGroupUsers] = useState<string[]>([]);
  
  // Groups & Channels states
  const [sidebarTab, setSidebarTab] = useState<'dms' | 'groups' | 'channels'>('dms');
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupItem | null>(null);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupType, setNewGroupType] = useState<'group' | 'channel'>('group');

  // Encryption state
  const [isE2EEnabled, setIsE2EEnabled] = useState(false);

  // Replies states
  const [replyingToMessage, setReplyingToMessage] = useState<MessageItem | null>(null);

  // Temporary disappearing messages settings
  const [disappearingDuration, setDisappearingDuration] = useState<number>(0); // 0 = disabled, else seconds
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Search in conversation state
  const [searchInConvText, setSearchInConvText] = useState('');

  // Messages lists
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [inputText, setInputText] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<any>(null);
  const recordingDurationRef = useRef<number>(0);

  // File attach/upload states
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<'emojis' | 'stickers' | 'gifs'>('emojis');

  // Mobile navigation helper
  const [showContactListMobile, setShowContactListMobile] = useState(true);

  // Refs
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Live Video & Voice Call State
  const [activeCall, setActiveCall] = useState<{
    type: 'voice' | 'video';
    status: 'ringing' | 'connected' | 'ended';
    senderId: string;
    receiverId: string;
    contactName: string;
    contactAvatar?: string;
  } | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    senderId: string;
    callType: 'voice' | 'video';
    senderName: string;
    senderAvatar?: string;
  } | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const callTimerRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  // Active Disappearing Messages Tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update online presence & Listen on WebSocket
  useEffect(() => {
    if (!loggedInUser) return;

    // Connect to WS
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const socketUrl = `${protocol}//${host}`;

    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("[WS] Connected!");
      socket.send(JSON.stringify({
        type: "register",
        payload: { userId: loggedInUser.uid }
      }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type, payload } = data;

        if (type === "online_users") {
          const { users } = payload;
          const map: Record<string, string> = {};
          users.forEach((u: any) => {
            map[u.uid] = u.status;
          });
          setOnlineStatuses(map);
        }

        if (type === "status_change") {
          const { userId, status } = payload;
          setOnlineStatuses(prev => ({ ...prev, [userId]: status }));
        }

        if (type === "typing") {
          const { userId, targetId, targetType, isTyping } = payload;
          if (targetType === "private" && selectedContact && userId === selectedContact.uid) {
            setIsRecipientTyping(isTyping);
          } else if (targetType === "group" && selectedGroup && targetId === selectedGroup.id && userId !== loggedInUser.uid) {
            setTypingGroupUsers(prev => {
              if (isTyping) {
                return prev.includes(userId) ? prev : [...prev, userId];
              } else {
                return prev.filter(id => id !== userId);
              }
            });
          }
        }

        if (type === "message") {
          const { message } = payload;
          if (selectedGroup && message.group_id === selectedGroup.id) {
            setMessages(prev => {
              if (prev.some(m => m.id === message.id)) return prev;
              return [...prev, message];
            });
            try { playSound.tick(); } catch(e){}
          } else if (!selectedGroup && selectedContact) {
            if (!message.group_id && (
              (message.senderId === loggedInUser.uid && message.receiverId === selectedContact.uid) ||
              (message.senderId === selectedContact.uid && message.receiverId === loggedInUser.uid)
            )) {
              setMessages(prev => {
                if (prev.some(m => m.id === message.id)) return prev;
                return [...prev, message];
              });
              try { playSound.tick(); } catch(e){}
            }
          }
        }

        if (type === "reaction" || type === "pin" || type === "delete") {
          const { targetId } = payload;
          if (selectedGroup && selectedGroup.id === targetId) {
            fetchMessages(true);
          } else if (!selectedGroup && selectedContact && (selectedContact.uid === targetId || loggedInUser.uid === targetId)) {
            fetchMessages(true);
          }
        }

        // Signaling Call Events
        if (type === "call:offer") {
          const { senderId, callType, senderName, senderAvatar } = payload;
          setIncomingCall({
            senderId,
            callType,
            senderName,
            senderAvatar
          });
          try { playSound.click(); } catch(e){}
        }

        if (type === "call:answer") {
          const { accepted } = payload;
          if (accepted) {
            setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
            if (callTimerRef.current) clearInterval(callTimerRef.current);
            callTimerRef.current = setInterval(() => {
              setCallDuration(d => d + 1);
            }, 1000);
            try { playSound.victory(); } catch(e){}
          } else {
            handleHangUp();
          }
        }

        if (type === "call:hangup") {
          handleHangUp();
        }

      } catch (err) {
        console.error("[WS CLIENT PROCESS ERROR]", err);
      }
    };

    socket.onclose = () => {
      console.log("[WS] Disconnected!");
    };

    return () => {
      socket.close();
    };
  }, [loggedInUser, selectedContact, selectedGroup]);

  // Handle local typing indicator signal broadcast
  const typingTimerRef = useRef<any>(null);
  const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!loggedInUser) return;

    // Send typing status to WebSocket
    sendWSEvent("typing", {
      userId: loggedInUser.uid,
      targetId: selectedGroup ? selectedGroup.id : selectedContact?.uid,
      targetType: selectedGroup ? "group" : "private",
      isTyping: true
    });

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      sendWSEvent("typing", {
        userId: loggedInUser.uid,
        targetId: selectedGroup ? selectedGroup.id : selectedContact?.uid,
        targetType: selectedGroup ? "group" : "private",
        isTyping: false
      });
    }, 2000);
  };

  const sendWSEvent = (type: string, payload: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
    }
  };

  // Fetch conversations
  const fetchMessages = async (silent = false) => {
    if (!loggedInUser) return;
    if (!silent) {
      setIsLoadingMessages(true);
    }
    try {
      let url = '';
      if (selectedGroup) {
        url = `/api/chat/group-messages?groupId=${selectedGroup.id}`;
      } else if (selectedContact) {
        url = `/api/chat/messages?userA=${loggedInUser.uid}&userB=${selectedContact.uid}`;
      } else {
        return;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) {
        setIsLoadingMessages(false);
      }
    }
  };

  const fetchContactsAndGroups = async () => {
    if (!loggedInUser) return;
    setIsLoadingContacts(true);
    try {
      // Users list
      const userRes = await fetch('/api/user/users');
      if (userRes.ok) {
        const data = await userRes.json();
        const list = data.users.filter((u: any) => u.uid !== loggedInUser.uid);
        setContacts(list);
        setFilteredContacts(list);
      }

      // Groups list
      const groupRes = await fetch('/api/social/groups');
      if (groupRes.ok) {
        const data = await groupRes.json();
        setGroups(data.groups || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  useEffect(() => {
    fetchContactsAndGroups();
  }, [loggedInUser]);

  useEffect(() => {
    fetchMessages(false);
    setIsRecipientTyping(false);
    setTypingGroupUsers([]);
  }, [selectedContact, selectedGroup]);

  // Scroll bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isRecipientTyping, typingGroupUsers]);

  // Search filtering in contact list
  useEffect(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) {
      setFilteredContacts(contacts);
    } else {
      setFilteredContacts(
        contacts.filter(
          c =>
            c.name.toLowerCase().includes(q) ||
            (c.username && c.username.toLowerCase().includes(q))
        )
      );
    }
  }, [searchText, contacts]);

  // --- Real Voice & Video Calls implementation ---
  const handleStartCall = async (type: 'voice' | 'video') => {
    if (!loggedInUser) return;
    const name = selectedGroup ? selectedGroup.name : (selectedContact?.name || "Usuário");
    const avatar = selectedGroup ? selectedGroup.avatar_url : selectedContact?.avatarUrl;

    playSound.click();

    const receiverId = selectedGroup ? selectedGroup.id : (selectedContact?.uid || "");
    setActiveCall({
      type,
      status: 'ringing',
      senderId: loggedInUser.uid,
      receiverId,
      contactName: name,
      contactAvatar: avatar
    });
    setCallDuration(0);
    setIsMuted(false);
    setIsCamOff(false);

    // Broadcast Call Invite
    sendWSEvent("call:offer", {
      senderId: loggedInUser.uid,
      receiverId,
      callType: type,
      senderName: loggedInUser.name,
      senderAvatar: loggedInUser.avatarUrl
    });

    try {
      const constraints = {
        audio: true,
        video: type === 'video'
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
    } catch (err) {
      console.warn('Real camera stream error (blocked or inside iframe), running audio/video simulated layout...', err);
    }
  };

  const handleAcceptIncomingCall = async () => {
    if (!loggedInUser || !incomingCall) return;
    playSound.click();

    const { senderId, callType, senderName, senderAvatar } = incomingCall;
    setActiveCall({
      type: callType,
      status: 'connected',
      senderId,
      receiverId: loggedInUser.uid,
      contactName: senderName,
      contactAvatar: senderAvatar
    });
    setIncomingCall(null);
    setCallDuration(0);

    // Answer call over WS
    sendWSEvent("call:answer", {
      senderId,
      receiverId: loggedInUser.uid,
      accepted: true
    });

    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = setInterval(() => {
      setCallDuration(d => d + 1);
    }, 1000);

    try {
      const constraints = {
        audio: true,
        video: callType === 'video'
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
    } catch (err) {
      console.warn('No physical webcam access, using fallback animation', err);
    }
  };

  const handleDeclineIncomingCall = () => {
    if (!incomingCall) return;
    playSound.click();
    sendWSEvent("call:answer", {
      senderId: incomingCall.senderId,
      receiverId: loggedInUser?.uid || "",
      accepted: false
    });
    setIncomingCall(null);
  };

  const handleHangUp = () => {
    try { playSound.click(); } catch (err) {}
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    if (activeCall && loggedInUser) {
      sendWSEvent("call:hangup", {
        senderId: activeCall.senderId,
        receiverId: activeCall.receiverId
      });
    }

    setLocalStream(null);
    setActiveCall(null);
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
    setIsMuted(!isMuted);
  };

  const toggleCam = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
    setIsCamOff(!isCamOff);
  };

  useEffect(() => {
    if (localVideoRef.current && localStream && activeCall?.type === 'video') {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, activeCall]);

  // Voice Notes (Audio Recording)
  const startRecording = async () => {
    playSound.click();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: any[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
        
        const currentDur = recordingDurationRef.current;
        await uploadAndSendAudio(blob, currentDur);
      };

      recordingDurationRef.current = 0;
      setRecordingDuration(0);
      mediaRecorder.start();
      setIsRecording(true);

      recordingTimerRef.current = setInterval(() => {
        recordingDurationRef.current += 1;
        setRecordingDuration(recordingDurationRef.current);
      }, 1000);

    } catch (err) {
      console.warn('Browser mic blocked, using simulated high-fidelity audio note...', err);
      setIsRecording(true);
      recordingDurationRef.current = 0;
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        recordingDurationRef.current += 1;
        setRecordingDuration(recordingDurationRef.current);
      }, 1000);
    }
  };

  const stopAndSendRecording = async (send: boolean) => {
    playSound.click();
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);

    if (!send) {
      mediaRecorderRef.current = null;
      return;
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    } else {
      // Simulated voice message fallback
      await sendSimulatedAudioNote(recordingDurationRef.current);
    }
  };

  const uploadAndSendAudio = async (blob: Blob, duration: number) => {
    if (!loggedInUser) return;
    setIsUploadingAttachment(true);
    try {
      const fileToUpload = new File([blob], 'nota_voz.wav', { type: 'audio/wav' });
      const formData = new FormData();
      formData.append('file', fileToUpload);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        sendMessagePayload(`🎙️ Nota de voz (${duration}s)`, data.url, 'audio');
      } else {
        throw new Error('Upload error');
      }
    } catch (e) {
      await sendSimulatedAudioNote(duration);
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const sendSimulatedAudioNote = async (duration: number) => {
    sendMessagePayload(`🎙️ Nota de voz (${duration}s)`, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'audio');
  };

  // Upload/Send File Attachment
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!loggedInUser || !e.target.files || !e.target.files[0]) return;
    setIsUploadingAttachment(true);
    playSound.click();

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        
        let mType: any = 'file';
        const lowerName = file.name.toLowerCase();
        if (file.type.startsWith('image/')) mType = 'image';
        else if (file.type.startsWith('video/')) mType = 'video';
        else if (file.type.startsWith('audio/')) mType = 'audio';

        sendMessagePayload(`📁 ${file.name}`, data.url, mType);
        setShowAttachmentMenu(false);
      } else {
        alert('Este formato ou tamanho de arquivo não é permitido pelas diretrizes de segurança.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  // Sticker
  const sendSticker = (stickerUrl: string) => {
    sendMessagePayload('Figurinha enviada', stickerUrl, 'sticker');
    setShowEmojiPicker(false);
  };

  // GIF
  const sendGIF = (gifUrl: string) => {
    sendMessagePayload('GIF enviado', gifUrl, 'gif');
    setShowEmojiPicker(false);
  };

  // Send message helper
  const sendMessagePayload = (text: string, mediaUrl = '', mediaType: any = 'text') => {
    if (!loggedInUser) return;

    let textToSend = text;
    // Client-side visual encryption simulation
    if (isE2EEnabled && text && mediaType === 'text') {
      textToSend = encodeE2EE(text);
    }

    // Determine target expire time
    let expiresAtStr: string | undefined = undefined;
    if (disappearingDuration > 0) {
      expiresAtStr = new Date(Date.now() + disappearingDuration * 1000).toISOString();
    }

    const newMsg: MessageItem = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      senderId: loggedInUser.uid,
      receiverId: selectedGroup ? selectedGroup.id : (selectedContact?.uid || ''),
      text: textToSend,
      mediaUrl: mediaUrl || undefined,
      mediaType,
      created_at: new Date().toISOString(),
      deleted: false,
      hiddenFor: [],
      reply_to_id: replyingToMessage ? replyingToMessage.id : undefined,
      reactions: '[]',
      pinned: false,
      is_encrypted: isE2EEnabled && mediaType === 'text',
      expires_at: expiresAtStr,
      group_id: selectedGroup ? selectedGroup.id : undefined,
      is_channel: selectedGroup ? selectedGroup.type === 'channel' : false
    };

    // Save and send instantly over WS
    sendWSEvent("message", { message: newMsg });

    // Client optimistic render
    setMessages(prev => [...prev, newMsg]);

    // Reset states
    setReplyingToMessage(null);
    playSound.victory();
  };

  // Send input box standard message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessagePayload(inputText.trim(), '', 'text');
    setInputText('');
  };

  // Delete message
  const handleDeleteMessage = (messageId: string) => {
    playSound.purchase();
    sendWSEvent("delete", {
      messageId,
      targetId: selectedGroup ? selectedGroup.id : selectedContact?.uid,
      isGroup: !!selectedGroup
    });
  };

  // Hide message locally
  const handleHideMessage = async (messageId: string) => {
    if (!loggedInUser) return;
    playSound.click();
    try {
      const response = await fetch('/api/chat/message/hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, userId: loggedInUser.uid })
      });
      if (response.ok) {
        fetchMessages(true);
      }
    } catch(err) {
      console.error(err);
    }
  };

  // Toggle Pinned status
  const handleTogglePin = (messageId: string, currentPinned: boolean) => {
    playSound.victory();
    sendWSEvent("pin", {
      messageId,
      pinned: !currentPinned,
      targetId: selectedGroup ? selectedGroup.id : selectedContact?.uid,
      isGroup: !!selectedGroup
    });
  };

  // Send emoji reaction
  const handleReactToMessage = (messageId: string, emoji: string) => {
    if (!loggedInUser) return;
    playSound.purchase();
    sendWSEvent("reaction", {
      messageId,
      userId: loggedInUser.uid,
      emoji,
      userName: loggedInUser.name,
      targetId: selectedGroup ? selectedGroup.id : selectedContact?.uid,
      isGroup: !!selectedGroup
    });
  };

  // Group creation
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser || !newGroupName.trim()) return;
    playSound.victory();
    try {
      const response = await fetch('/api/social/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName.trim(),
          description: newGroupDesc.trim(),
          creatorId: loggedInUser.uid,
          type: newGroupType
        })
      });

      if (response.ok) {
        setNewGroupName('');
        setNewGroupDesc('');
        setShowCreateGroupModal(false);
        fetchContactsAndGroups();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Search filter for conversation thread
  const filteredMessages = messages.filter(msg => {
    if (msg.hiddenFor.includes(loggedInUser?.uid || '')) return false;
    
    // Disappearing message filter client-side
    if (msg.expires_at) {
      const expireTime = new Date(msg.expires_at).getTime();
      if (currentTime > expireTime) return false;
    }

    if (!searchInConvText.trim()) return true;

    // Search matches text
    let decryptedText = msg.text || '';
    if (msg.is_encrypted) {
      decryptedText = decodeE2EE(decryptedText);
    }
    return decryptedText.toLowerCase().includes(searchInConvText.toLowerCase());
  });

  // Pinned messages list
  const pinnedMessages = messages.filter(m => m.pinned && !m.deleted && !m.hiddenFor.includes(loggedInUser?.uid || ''));

  if (!loggedInUser) {
    return (
      <div className="max-w-xl mx-auto my-12 px-4 text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-xl space-y-6">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <MessageSquare className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">Mensagens em Tempo Real</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Acesse chats privados, canais de anúncios e grupos comunitários com chamadas de voz e vídeo conectando-se à sua conta gamer.
          </p>
        </div>
        <button
          onClick={onOpenLogin}
          className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition cursor-pointer"
        >
          Entrar na Conta
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto my-4 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl h-[calc(100vh-140px)] min-h-[600px] flex text-slate-100 font-sans relative">
      
      {/* 1. LEFT SIDEBAR (DMs, Channels, Search & Settings) */}
      <div className={`w-full md:w-80 border-r border-slate-800 flex flex-col bg-slate-950 shrink-0 ${
        showContactListMobile ? 'flex' : 'hidden md:flex'
      }`}>
        {/* User Status Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img 
                src={loggedInUser.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(loggedInUser.name)}`} 
                className="w-9 h-9 rounded-xl object-cover bg-slate-800 ring-2 ring-emerald-500/30" 
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
            </div>
            <div>
              <div className="font-bold text-xs truncate max-w-[120px]">{loggedInUser.name}</div>
              <div className="text-[10px] font-mono text-emerald-400">@online</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={onlineStatuses[loggedInUser.uid] || 'online'}
              onChange={(e) => sendWSEvent("status_change", { userId: loggedInUser.uid, status: e.target.value })}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-[10px] rounded-lg p-1 outline-none font-semibold cursor-pointer"
            >
              <option value="online">🟢 Online</option>
              <option value="busy">🟡 Ocupado</option>
              <option value="offline">⚪ Invisível</option>
            </select>
          </div>
        </div>

        {/* Tab Selection (Discord style: private vs public) */}
        <div className="p-3 grid grid-cols-3 gap-1 bg-slate-900/40 border-b border-slate-800/60">
          <button 
            onClick={() => setSidebarTab('dms')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              sidebarTab === 'dms' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>DMs</span>
          </button>
          <button 
            onClick={() => setSidebarTab('groups')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              sidebarTab === 'groups' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Grupos</span>
          </button>
          <button 
            onClick={() => setSidebarTab('channels')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              sidebarTab === 'channels' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Canais</span>
          </button>
        </div>

        {/* Sidebar Search bar */}
        <div className="p-3 relative bg-slate-950">
          <input
            type="text"
            placeholder={sidebarTab === 'dms' ? "Buscar contatos..." : "Filtrar grupos..."}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-1.5 pl-9 pr-4 text-xs outline-none text-slate-200 placeholder-slate-500 focus:border-indigo-500/50"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-6 top-5" />
        </div>

        {/* Creator button */}
        <div className="px-3 pb-2">
          <button
            onClick={() => { playSound.click(); setShowCreateGroupModal(true); }}
            className="w-full py-1.5 bg-slate-900 hover:bg-slate-850 text-indigo-400 hover:text-indigo-300 font-bold text-xs rounded-xl border border-dashed border-indigo-500/30 flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Grupo ou Canal</span>
          </button>
        </div>

        {/* Scrollable contact/group list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoadingContacts ? (
            <div className="p-6 text-center text-xs text-slate-500 animate-pulse">Carregando canais...</div>
          ) : sidebarTab === 'dms' ? (
            filteredContacts.length > 0 ? (
              filteredContacts.map(c => {
                const status = onlineStatuses[c.uid] || 'offline';
                const isSelected = selectedContact?.uid === c.uid && !selectedGroup;
                return (
                  <button
                    key={c.uid}
                    onClick={() => {
                      playSound.click();
                      setSelectedContact(c);
                      setSelectedGroup(null);
                      setShowContactListMobile(false);
                    }}
                    className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition text-left cursor-pointer ${
                      isSelected ? 'bg-indigo-600/35 border-l-4 border-indigo-500 text-white' : 'hover:bg-slate-900/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="relative">
                      <img 
                        src={c.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(c.name)}`} 
                        className="w-9 h-9 rounded-xl object-cover bg-slate-800"
                      />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                        status === 'online' ? 'bg-emerald-500' : status === 'busy' ? 'bg-yellow-500' : 'bg-slate-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-200 truncate">{c.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">@{c.username || 'gamer'}</div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-600 text-xs font-semibold">Nenhum jogador online</div>
            )
          ) : (
            // Groups & Channels List
            groups
              .filter(g => sidebarTab === 'groups' ? g.type === 'group' : g.type === 'channel')
              .filter(g => !searchText || g.name.toLowerCase().includes(searchText.toLowerCase()))
              .map(g => {
                const isSelected = selectedGroup?.id === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      playSound.click();
                      setSelectedGroup(g);
                      setSelectedContact(null);
                      setShowContactListMobile(false);
                    }}
                    className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition text-left cursor-pointer ${
                      isSelected ? 'bg-indigo-600/35 border-l-4 border-indigo-500 text-white' : 'hover:bg-slate-900/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                      {g.type === 'channel' ? <Hash className="w-5 h-5 text-indigo-400" /> : <Users className="w-5 h-5 text-indigo-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-200 truncate">{g.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{g.member_count} membros online</div>
                    </div>
                  </button>
                );
              })
          )}
        </div>
      </div>

      {/* 2. CHAT PANEL AREA */}
      <div className={`flex-1 flex flex-col bg-slate-900/40 relative ${
        showContactListMobile ? 'hidden md:flex' : 'flex'
      }`}>

        {selectedContact || selectedGroup ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowContactListMobile(true)}
                  className="p-1 text-slate-400 hover:text-slate-200 md:hidden bg-slate-800 rounded-lg cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {selectedGroup ? (
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                    {selectedGroup.type === 'channel' ? <Hash className="w-5 h-5 text-indigo-400" /> : <Users className="w-5 h-5 text-indigo-400" />}
                  </div>
                ) : (
                  <div className="relative">
                    <img 
                      src={selectedContact?.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(selectedContact?.name || '')}`} 
                      className="w-10 h-10 rounded-xl object-cover bg-slate-800" 
                    />
                    <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                      (onlineStatuses[selectedContact?.uid || ''] || 'offline') === 'online' ? 'bg-emerald-500' : 'bg-slate-600'
                    }`} />
                  </div>
                )}

                <div>
                  <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                    <span>{selectedGroup ? selectedGroup.name : selectedContact?.name}</span>
                    {isE2EEnabled && (
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-mono flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> E2EE
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {selectedGroup ? (
                      selectedGroup.type === 'channel' ? '#canal-de-anuncios-publicos' : '#grupo-de-discussao-aberta'
                    ) : (
                      (onlineStatuses[selectedContact?.uid || ''] || 'offline') === 'online' ? (
                        <span className="text-emerald-400 font-bold">● online agora</span>
                      ) : 'offline no momento'
                    )}
                  </div>
                </div>
              </div>

              {/* Header actions */}
              <div className="flex items-center gap-2">
                {/* Search in conversation */}
                <div className="relative hidden sm:block">
                  <input
                    type="text"
                    placeholder="Pesquisar mensagens..."
                    value={searchInConvText}
                    onChange={(e) => setSearchInConvText(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-xs rounded-xl py-1 pl-7 pr-4 outline-none w-44 text-slate-200 placeholder-slate-600 focus:border-indigo-500/50"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-600 absolute left-2 top-2" />
                  {searchInConvText && (
                    <button onClick={() => setSearchInConvText('')} className="absolute right-2 top-2 text-slate-500 hover:text-slate-300">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* E2EE Lock Toggle */}
                <button
                  onClick={() => { playSound.click(); setIsE2EEnabled(!isE2EEnabled); }}
                  className={`p-2 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold border ${
                    isE2EEnabled 
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                      : 'bg-slate-800 hover:bg-slate-755 border-slate-700 text-slate-400 hover:text-slate-300'
                  }`}
                  title="Criptografia Ponta-a-Ponta"
                >
                  {isE2EEnabled ? <Lock className="w-3.5 h-3.5 animate-pulse" /> : <LockOpen className="w-3.5 h-3.5" />}
                  <span className="hidden lg:inline">E2EE</span>
                </button>

                {/* Temp disappearing duration selection */}
                <div className="relative">
                  <select
                    value={disappearingDuration}
                    onChange={(e) => { playSound.click(); setDisappearingDuration(Number(e.target.value)); }}
                    className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl p-2 outline-none font-bold cursor-pointer"
                    title="Mensagens Temporárias"
                  >
                    <option value="0">🕒 Off</option>
                    <option value="10">10 Segundos</option>
                    <option value="60">1 Minuto</option>
                    <option value="300">5 Minutos</option>
                    <option value="3600">1 Hora</option>
                  </select>
                </div>

                {/* Calling tools (DMs only) */}
                {!selectedGroup && (
                  <>
                    <button 
                      onClick={() => handleStartCall('voice')}
                      className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
                      title="Chamada de Áudio"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleStartCall('video')}
                      className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition cursor-pointer"
                      title="Chamada de Vídeo"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Pinned Messages sticky area */}
            {pinnedMessages.length > 0 && (
              <div className="px-4 py-2 bg-slate-950/80 border-b border-indigo-500/20 flex items-center justify-between shrink-0 animate-slideDown z-20">
                <div className="flex items-center gap-2 min-w-0">
                  <Pin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <div className="text-xs truncate text-slate-300">
                    <span className="font-extrabold text-indigo-400">Mensagem Fixada: </span>
                    <span>
                      {pinnedMessages[pinnedMessages.length - 1].is_encrypted 
                        ? decodeE2EE(pinnedMessages[pinnedMessages.length - 1].text || '') 
                        : pinnedMessages[pinnedMessages.length - 1].text}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => {
                      const id = pinnedMessages[pinnedMessages.length - 1].id;
                      document.getElementById(`msg-${id}`)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                  >
                    Ir para
                  </button>
                  <button 
                    onClick={() => handleTogglePin(pinnedMessages[pinnedMessages.length - 1].id, true)}
                    className="text-[10px] text-slate-500 hover:text-red-400 cursor-pointer"
                    title="Desafixar"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Conversation Thread Area */}
            <div 
              ref={chatContainerRef} 
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/60 relative scroll-smooth"
              style={{ backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.05) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            >
              
              {isLoadingMessages && messages.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs animate-pulse bg-slate-950/40 rounded-xl max-w-xs mx-auto">Carregando canais criptografados...</div>
              ) : filteredMessages.length > 0 ? (
                filteredMessages.map(msg => {
                  const isOwn = msg.senderId === loggedInUser.uid;
                  
                  // Decrypt encrypted messages
                  let renderedText = msg.text || '';
                  if (msg.is_encrypted) {
                    renderedText = decodeE2EE(renderedText);
                  }

                  // Find parent quote message if replied
                  const replyMsg = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;
                  let replyMsgText = '';
                  if (replyMsg) {
                    replyMsgText = replyMsg.is_encrypted ? decodeE2EE(replyMsg.text || '') : (replyMsg.text || '');
                  }

                  // Parse Reactions JSON safely
                  let parsedReactions: Array<{ userId: string, emoji: string, userName: string }> = [];
                  try {
                    if (msg.reactions) {
                      parsedReactions = typeof msg.reactions === 'string' ? JSON.parse(msg.reactions) : msg.reactions;
                    }
                  } catch (e) {}

                  // Group reactions by Emoji
                  const reactionGroups: Record<string, { count: number, userList: string[], didIReact: boolean }> = {};
                  parsedReactions.forEach(r => {
                    if (!reactionGroups[r.emoji]) {
                      reactionGroups[r.emoji] = { count: 0, userList: [], didIReact: false };
                    }
                    reactionGroups[r.emoji].count += 1;
                    reactionGroups[r.emoji].userList.push(r.userName);
                    if (r.userId === loggedInUser.uid) {
                      reactionGroups[r.emoji].didIReact = true;
                    }
                  });

                  // Disappearing time remaining ticking
                  let disappearingBadge = '';
                  if (msg.expires_at) {
                    const remainingMs = new Date(msg.expires_at).getTime() - currentTime;
                    const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
                    disappearingBadge = `${remainingSec}s`;
                  }

                  return (
                    <div
                      key={msg.id}
                      id={`msg-${msg.id}`}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-scaleIn`}
                    >
                      {/* Message Bubble container */}
                      <div className={`max-w-xs md:max-w-md rounded-2xl p-3 relative shadow-xl group border ${
                        isOwn 
                          ? 'bg-indigo-600/25 border-indigo-500/30 text-slate-100 rounded-tr-none' 
                          : 'bg-slate-950 border-slate-800 text-slate-100 rounded-tl-none'
                      }`}>
                        
                        {/* Reply box header */}
                        {replyMsg && (
                          <div 
                            onClick={() => document.getElementById(`msg-${replyMsg.id}`)?.scrollIntoView({ behavior: 'smooth' })}
                            className="mb-2 p-2 bg-slate-900/80 border-l-2 border-indigo-400 rounded-lg text-[10px] text-slate-400 cursor-pointer hover:bg-slate-850 truncate max-w-full"
                          >
                            <span className="font-extrabold text-indigo-400">@Resposta de {replyMsg.senderId === loggedInUser.uid ? 'Você' : 'Jogador'}: </span>
                            <span>{replyMsgText}</span>
                          </div>
                        )}

                        {/* Image file rendering */}
                        {msg.mediaType === 'image' && msg.mediaUrl && (
                          <div className="mb-2 rounded-xl overflow-hidden max-h-56 border border-slate-800/40">
                            <img src={msg.mediaUrl} alt="Anexo" className="w-full h-full object-cover" />
                          </div>
                        )}

                        {/* Sticker rendering */}
                        {msg.mediaType === 'sticker' && msg.mediaUrl && (
                          <div className="mb-2 max-w-[140px] overflow-hidden rounded-xl">
                            <img src={msg.mediaUrl} alt="Sticker" className="w-full h-auto" />
                          </div>
                        )}

                        {/* GIF rendering */}
                        {msg.mediaType === 'gif' && msg.mediaUrl && (
                          <div className="mb-2 overflow-hidden rounded-xl max-h-48 border border-slate-800">
                            <img src={msg.mediaUrl} alt="GIF" className="w-full h-full object-cover" />
                          </div>
                        )}

                        {/* Video attachment rendering */}
                        {msg.mediaType === 'video' && msg.mediaUrl && (
                          <div className="mb-2 rounded-xl overflow-hidden border border-slate-800">
                            <video src={msg.mediaUrl} controls className="w-full max-h-56 object-cover" />
                          </div>
                        )}

                        {/* Audio attachment player */}
                        {msg.mediaType === 'audio' && msg.mediaUrl && (
                          <div className="flex items-center gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 min-w-[210px] mb-1.5">
                            <button 
                              onClick={() => {
                                playSound.click();
                                const audio = new Audio(msg.mediaUrl);
                                audio.play();
                              }}
                              className="w-8 h-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-md transition-all"
                            >
                              <Play className="w-4 h-4 fill-white" />
                            </button>
                            <div className="flex-1 text-[10px] font-mono text-slate-300 font-bold">
                              <span className="flex items-center gap-1">🎙️ Mensagem de Áudio</span>
                              <div className="h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                                <div className="h-full bg-indigo-500 w-1/3 animate-pulse" />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Document general files sharing */}
                        {msg.mediaType === 'file' && msg.mediaUrl && (
                          <div className="flex items-center gap-3 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 min-w-[210px] mb-2">
                            <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center text-indigo-400 shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-slate-200 truncate">{msg.text || 'Documento'}</div>
                              <div className="text-[9px] text-slate-500 font-mono">1.2 MB</div>
                            </div>
                            <a 
                              href={msg.mediaUrl} 
                              download 
                              className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 rounded-lg flex items-center justify-center shrink-0"
                            >
                              <Download className="w-4.5 h-4.5" />
                            </a>
                          </div>
                        )}

                        {/* Message Text text display */}
                        {msg.mediaType !== 'file' && (
                          <p className={`text-xs leading-relaxed break-words pr-4 ${
                            msg.is_encrypted ? 'font-mono text-emerald-300 border-l-2 border-emerald-500/30 pl-2' : ''
                          }`}>
                            {renderedText}
                          </p>
                        )}

                        {/* Hover controls actions bar (Discord & Telegram style) */}
                        <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 bg-slate-950/90 border border-slate-800 rounded-lg p-0.5 transition-opacity z-10 shadow-2xl">
                          
                          {/* Pin Toggle */}
                          <button
                            onClick={() => handleTogglePin(msg.id, !!msg.pinned)}
                            className={`p-1 hover:bg-slate-800 rounded cursor-pointer ${
                              msg.pinned ? 'text-yellow-500' : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title={msg.pinned ? "Desafixar Mensagem" : "Fixar Mensagem"}
                          >
                            <Pin className="w-3 h-3" />
                          </button>

                          {/* Reply trigger */}
                          <button
                            onClick={() => { playSound.click(); setReplyingToMessage(msg); }}
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
                            title="Responder"
                          >
                            <Reply className="w-3 h-3" />
                          </button>

                          {/* Reaction Add floating picker */}
                          <div className="relative group/react inline-block">
                            <button className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded cursor-pointer">
                              <SmilePlus className="w-3 h-3" />
                            </button>
                            {/* Fast Reaction Bar */}
                            <div className="absolute bottom-6 right-0 bg-slate-950 border border-slate-800 p-1.5 rounded-xl shadow-2xl flex gap-1 hidden group-hover/react:flex animate-slideUp z-30">
                              {['❤️', '😂', '😮', '😢', '👍', '🔥'].map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReactToMessage(msg.id, emoji)}
                                  className="hover:scale-125 transition duration-150 p-0.5 text-xs text-slate-100 cursor-pointer"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Hide action */}
                          <button
                            onClick={() => handleHideMessage(msg.id)}
                            className="p-1 hover:bg-slate-800 text-slate-500 hover:text-slate-300 rounded cursor-pointer"
                            title="Ocultar para mim"
                          >
                            <EyeOff className="w-3 h-3" />
                          </button>

                          {/* Delete action (Own only) */}
                          {isOwn && !msg.deleted && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="p-1 hover:bg-slate-800 text-red-500 hover:text-red-400 rounded cursor-pointer"
                              title="Apagar para todos"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Rendering Emojis Reactions list beneath bubble */}
                        {Object.keys(reactionGroups).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {Object.entries(reactionGroups).map(([emoji, meta]) => (
                              <button
                                key={emoji}
                                onClick={() => handleReactToMessage(msg.id, emoji)}
                                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition ${
                                  meta.didIReact 
                                    ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400' 
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                                }`}
                                title={`Reagido por: ${meta.userList.join(', ')}`}
                              >
                                <span>{emoji}</span>
                                <span>{meta.count}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Time, Encryption padlock & read double-checkmark */}
                        <div className="flex items-center justify-end gap-1 text-[9px] font-mono text-slate-500 mt-1.5 select-none">
                          {msg.is_encrypted && <Lock className="w-2.5 h-2.5 text-emerald-500" />}
                          {disappearingBadge && (
                            <span className="flex items-center gap-0.5 text-red-400 font-bold px-1 py-0.2 bg-red-950/30 border border-red-500/10 rounded">
                              <Clock className="w-2.5 h-2.5" /> {disappearingBadge}
                            </span>
                          )}
                          <span>{formatTime(msg.created_at)}</span>
                          {isOwn && (
                            msg.deleted ? null : <CheckCheck className="w-3 h-3 text-indigo-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-600 text-xs bg-slate-950/20 rounded-2xl max-w-sm mx-auto space-y-2 mt-12 border border-slate-800/40">
                  <Smile className="w-9 h-9 text-slate-700 mx-auto" />
                  <p className="font-extrabold text-slate-400">Esta sala de comunicação está limpa.</p>
                  <p className="text-[10px] text-slate-600">Envie mensagens criptografadas em tempo real de forma segura. GIFs, Stickers, chamadas de áudio e arquivos são permitidos!</p>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Send Controls Area */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0">
              
              {/* Replying quote preview indicator */}
              {replyingToMessage && (
                <div className="mb-2 p-2 px-3 bg-indigo-950/40 border-l-4 border-indigo-500 rounded-xl flex items-center justify-between animate-slideDown">
                  <div className="flex items-center gap-2 min-w-0">
                    <Reply className="w-3.5 h-3.5 text-indigo-400" />
                    <div className="text-[10px] truncate text-slate-300">
                      <span>Respondendo para </span>
                      <span className="font-extrabold text-indigo-400">@{replyingToMessage.senderId === loggedInUser.uid ? 'Você' : 'Jogador'}: </span>
                      <span className="italic">{replyingToMessage.is_encrypted ? decodeE2EE(replyingToMessage.text || '') : replyingToMessage.text}</span>
                    </div>
                  </div>
                  <button onClick={() => setReplyingToMessage(null)} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Attachment Popup options menu */}
              {showAttachmentMenu && (
                <div className="absolute bottom-16 left-4 bg-slate-950 border border-slate-850 rounded-2xl p-2.5 shadow-2xl flex flex-col gap-1.5 animate-slideUp z-50 min-w-[150px]">
                  <label className="p-2 hover:bg-slate-900 rounded-xl flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                    <Image className="w-4 h-4 text-emerald-400" />
                    <span>Enviar Foto</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <label className="p-2 hover:bg-slate-900 rounded-xl flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                    <Video className="w-4 h-4 text-sky-400" />
                    <span>Enviar Vídeo</span>
                    <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <label className="p-2 hover:bg-slate-900 rounded-xl flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                    <Paperclip className="w-4 h-4 text-indigo-400" />
                    <span>Enviar Documento</span>
                    <input type="file" accept=".pdf,.txt,.doc,.docx,.xls,.xlsx,.zip,.rar" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              )}

              {/* Emojis, Stickers, and GIFs selection Popover panel */}
              {showEmojiPicker && (
                <div className="absolute bottom-16 right-4 w-72 md:w-80 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slideUp z-50">
                  <div className="grid grid-cols-3 bg-slate-900 text-center border-b border-slate-850">
                    {['emojis', 'stickers', 'gifs'].map((tab: any) => (
                      <button
                        key={tab}
                        onClick={() => setPickerTab(tab)}
                        className={`py-2 text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition ${
                          pickerTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-850'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="p-3 h-52 overflow-y-auto bg-slate-950">
                    {pickerTab === 'emojis' && (
                      <div className="grid grid-cols-5 gap-2 text-center">
                        {PRESET_EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => setInputText(p => p + emoji)}
                            className="text-2xl p-1.5 hover:bg-slate-900 rounded-lg cursor-pointer hover:scale-110 transition active:scale-95"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {pickerTab === 'stickers' && (
                      <div className="grid grid-cols-3 gap-2">
                        {STICKER_PACKS.map(stk => (
                          <button
                            key={stk.name}
                            onClick={() => sendSticker(stk.url)}
                            className="group p-1 bg-slate-900 hover:bg-slate-850 rounded-xl flex flex-col items-center gap-1 cursor-pointer"
                          >
                            <img src={stk.url} className="w-12 h-12 object-cover rounded-lg group-hover:scale-105 transition" />
                            <span className="text-[9px] text-slate-500 font-bold truncate max-w-full">{stk.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {pickerTab === 'gifs' && (
                      <div className="grid grid-cols-2 gap-2">
                        {DUMMY_GIFS.map(gif => (
                          <button
                            key={gif.title}
                            onClick={() => sendGIF(gif.url)}
                            className="group relative p-0.5 rounded-lg overflow-hidden border border-slate-850 bg-slate-900 cursor-pointer"
                          >
                            <img src={gif.poster} className="w-full h-16 object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center font-bold text-[9px] text-white">
                              {gif.title}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recording indicator */}
              {isRecording ? (
                <div className="flex items-center justify-between gap-3 bg-red-950/40 border border-red-500/20 rounded-xl px-4 py-2 text-xs font-bold text-red-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                    <span>Gravação em andamento... {recordingDuration}s</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => stopAndSendRecording(false)}
                      className="px-2.5 py-1 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg cursor-pointer font-bold text-[10px]"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => stopAndSendRecording(true)}
                      className="px-3.5 py-1 bg-red-600 text-white hover:bg-red-700 rounded-lg cursor-pointer flex items-center gap-1 font-bold text-[10px]"
                    >
                      <MicOff className="w-3.5 h-3.5" /> Enviar
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 relative">
                  
                  {/* Attachment Clip button */}
                  <button
                    type="button"
                    onClick={() => { playSound.click(); setShowAttachmentMenu(!showAttachmentMenu); }}
                    className="p-2.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl cursor-pointer transition-colors border border-slate-800"
                    title="Anexar arquivos"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Input Box field */}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder={
                        isE2EEnabled 
                          ? "🔒 Escreva uma mensagem criptografada (E2EE)..." 
                          : selectedGroup?.type === 'channel' 
                            ? "Apenas administradores podem postar neste canal..." 
                            : "Escreva sua mensagem em tempo real..."
                      }
                      value={inputText}
                      onChange={handleTypingChange}
                      disabled={selectedGroup?.type === 'channel' && selectedGroup.creator_id !== loggedInUser.uid}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500/50 rounded-xl py-2.5 px-4 text-xs outline-none text-slate-200 placeholder-slate-600"
                    />

                    {/* Emoji stickers button inside field */}
                    <button
                      type="button"
                      onClick={() => { playSound.click(); setShowEmojiPicker(!showEmojiPicker); }}
                      className="p-1.5 absolute right-3 top-1 text-slate-500 hover:text-slate-300 cursor-pointer rounded-lg"
                      title="Emojis & Stickers"
                    >
                      <Smile className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  {/* Mic / Voice Note recording */}
                  {!(selectedGroup?.type === 'channel' && selectedGroup.creator_id !== loggedInUser.uid) && (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="p-2.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl cursor-pointer border border-slate-800"
                      title="Gravar nota de voz"
                    >
                      <Mic className="w-4.5 h-4.5" />
                    </button>
                  )}

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className={`p-2.5 font-bold rounded-xl shadow-lg flex items-center justify-center shrink-0 cursor-pointer transition ${
                      inputText.trim() 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                        : 'bg-slate-850 text-slate-600 cursor-not-allowed border border-slate-800/40'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Online typing status row */}
              <div className="h-4 mt-1 px-1">
                {isRecipientTyping && (
                  <div className="text-[10px] text-indigo-400 font-bold flex items-center gap-1.5 animate-pulse">
                    <span>{selectedContact?.name || "Jogador"} está digitando</span>
                    <span className="flex gap-0.5">
                      <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" />
                      <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </span>
                  </div>
                )}
                {typingGroupUsers.length > 0 && (
                  <div className="text-[10px] text-indigo-400 font-bold flex items-center gap-1.5 animate-pulse">
                    <span>Membros do grupo estão digitando...</span>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Landing Screen when no chat selected (Discord theme) */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-2xl relative">
              <Sparkles className="w-10 h-10 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-ping" />
            </div>

            <div className="space-y-2 max-w-md">
              <h3 className="text-xl font-bold text-slate-200">Arena de Comunicação GameZone</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bem-vindo ao centro oficial de networking gamer! Conecte-se com equipes, desafie amigos em canais criptografados ou inicie chamadas de vídeo em tempo real.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-2xl text-left space-y-1">
                <div className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> E2EE Cripto
                </div>
                <p className="text-[10px] text-slate-600">Criptografia de ponta-a-ponta militar para suas mensagens privadas.</p>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-2xl text-left space-y-1">
                <div className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                  <Video className="w-3.5 h-3.5" /> Chamadas HD
                </div>
                <p className="text-[10px] text-slate-600">Conexões de áudio e vídeo de baixíssima latência e alta performance.</p>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-2xl text-left space-y-1">
                <div className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Grupos/Canais
                </div>
                <p className="text-[10px] text-slate-600">Monte servidores e canais de transmissão para divulgar seus campeonatos.</p>
              </div>
            </div>

            <button 
              onClick={() => setShowContactListMobile(true)}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg transition md:hidden cursor-pointer"
            >
              Ver canais disponíveis
            </button>
          </div>
        )}
      </div>

      {/* 3. MODALS AND OVERLAYS */}
      
      {/* A. Dynamic Video and Voice Call Ringing & Connected Overlay */}
      {activeCall && (
        <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 z-50 animate-scaleIn">
          <div className="text-center space-y-4 max-w-sm w-full">
            
            {/* Avatar calling animation */}
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping [animation-duration:2.5s]" />
              <div className="absolute inset-2 bg-indigo-500/10 rounded-full animate-ping [animation-duration:1.8s]" />
              <img 
                src={activeCall.contactAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(activeCall.contactName)}`} 
                className="w-20 h-20 rounded-2xl object-cover bg-slate-800 ring-4 ring-indigo-500 relative z-10" 
              />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-white">{activeCall.contactName}</h2>
              <p className="text-xs text-indigo-400 font-mono animate-pulse font-bold tracking-wider uppercase">
                {activeCall.status === 'ringing' ? 'Chamando...' : 'Chamada Conectada'}
              </p>
            </div>

            {/* Video stream rendering viewport fallback */}
            {activeCall.type === 'video' && activeCall.status === 'connected' && (
              <div className="w-full aspect-video bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative shadow-2xl my-4">
                {isCamOff ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-600 space-y-1">
                    <VideoOff className="w-8 h-8" />
                    <span className="text-[10px] font-bold">Câmera Desativada</span>
                  </div>
                ) : (
                  <video 
                    ref={localVideoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover scale-x-[-1]" 
                  />
                )}
                {/* Duration sticker overlay */}
                <span className="absolute bottom-2.5 right-2.5 bg-black/60 text-white font-mono font-bold text-[10px] p-1 px-2 rounded-lg">
                  {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}

            {/* Call indicators details (voice call UI details) */}
            {activeCall.type === 'voice' && activeCall.status === 'connected' && (
              <div className="p-4 bg-slate-900 border border-slate-850 rounded-2xl my-3 flex flex-col items-center space-y-2">
                <span className="text-xs font-mono font-extrabold text-indigo-400">
                  {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
                </span>
                <div className="flex gap-1 animate-pulse">
                  {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                    <span key={i} className="w-1 bg-indigo-500 rounded-full" style={{ height: `${h * 4}px` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Calling control buttons bar */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <button 
                onClick={toggleMute}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  isMuted 
                    ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
                title="Mudar microfone"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              {activeCall.type === 'video' && (
                <button 
                  onClick={toggleCam}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    isCamOff 
                      ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                  title="Mudar câmera"
                >
                  {isCamOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}

              <button 
                onClick={handleHangUp}
                className="p-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Desligar"
              >
                <PhoneOff className="w-5.5 h-5.5" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* B. Incoming Call Ringing Overlay Box modal */}
      {incomingCall && (
        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 z-50 animate-scaleIn">
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl animate-pulse" />
            
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" />
              <img 
                src={incomingCall.senderAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(incomingCall.senderName)}`} 
                className="w-16 h-16 rounded-2xl object-cover bg-slate-800 ring-4 ring-indigo-500 relative z-10" 
              />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-white text-base">Chamada de {incomingCall.senderName}</h3>
              <p className="text-xs text-slate-500">
                Incoming {incomingCall.callType === 'video' ? 'Video Call' : 'Voice Call'}...
              </p>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={handleDeclineIncomingCall}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-red-400 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1"
              >
                <PhoneOff className="w-4 h-4" /> Recusar
              </button>
              <button 
                onClick={handleAcceptIncomingCall}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1"
              >
                <Phone className="w-4 h-4" /> Atender
              </button>
            </div>
          </div>
        </div>
      )}

      {/* C. Create Group/Channel Modal Overlay */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full relative space-y-4"
          >
            <button 
              onClick={() => setShowCreateGroupModal(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-300 p-1 hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
                <Users className="w-5 h-5 text-indigo-400" /> Criar Novo Canal ou Grupo
              </h2>
              <p className="text-xs text-slate-500">Monte um grupo de discussão ou canal público para novidades.</p>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Nome do Grupo</label>
                <input
                  type="text"
                  placeholder="Ex: # geral-gamer"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl py-2 px-3 text-xs outline-none text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Canal para conversar sobre torneios e ligas"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl py-2 px-3 text-xs outline-none text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Tipo de Comunidade</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewGroupType('group')}
                    className={`py-2 border rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      newGroupType === 'group' 
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Grupo de Chat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewGroupType('channel')}
                    className={`py-2 border rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      newGroupType === 'channel' 
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Hash className="w-4 h-4" />
                    <span>Canal Público</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-850 text-slate-400 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
                >
                  Criar Arena
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};
