import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Agent, ChatSimulationSettings, Message, Space } from '../types';
import { SPACES } from '../constants';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Paperclip, Search, Phone, ChevronLeft, Info, Smile, X, ChevronUp, ChevronDown, Palette, Pin, Archive, MoreVertical, PinOff, Trash2 } from 'lucide-react';
import { getChatHistory, sendChatMessage } from '@/src/services/chatService';

interface ChatTheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  gradient: string;
}

const APP_THEMES: ChatTheme[] = [
  { id: 'blush', name: 'Blush Calm', primary: '#FFB6C1', secondary: '#FFD1DC', gradient: 'linear-gradient(135deg, #FFF5F7 0%, #FFE4E8 100%)' },
  { id: 'sunset', name: 'Sunset Mood', primary: '#FF7E5F', secondary: '#FEB47B', gradient: 'linear-gradient(135deg, #FFF1EB 0%, #ACE0F9 100%)' },
  { id: 'ocean', name: 'Ocean Air', primary: '#4facfe', secondary: '#00f2fe', gradient: 'linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)' },
  { id: 'night', name: 'Night Pulse', primary: '#667eea', secondary: '#764ba2', gradient: 'linear-gradient(135deg, #E8EAF6 0%, #C5CAE9 100%)' },
  { id: 'mint', name: 'Fresh Mint', primary: '#00b09b', secondary: '#96c93d', gradient: 'linear-gradient(135deg, #F1F8E9 0%, #DCEDC8 100%)' },
  { id: 'cloud', name: 'Cloud Soft', primary: '#e6e9f0', secondary: '#eef1f5', gradient: 'linear-gradient(135deg, #F5F7FA 0%, #C3CFE2 100%)' },
  { id: 'violet', name: 'Violet Dream', primary: '#6a11cb', secondary: '#2575fc', gradient: 'linear-gradient(135deg, #F3E5F5 0%, #EDE7F6 100%)' },
  { id: 'peach', name: 'Peach Glow', primary: '#ff9a9e', secondary: '#fad0c4', gradient: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)' },
  { id: 'neon', name: 'Neon Pop', primary: '#00f2fe', secondary: '#4facfe', gradient: 'linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 100%)' },
  { id: 'golden', name: 'Golden Hour', primary: '#f6d365', secondary: '#fda085', gradient: 'linear-gradient(135deg, #FFFDE7 0%, #FFF9C4 100%)' },
  { id: 'ice', name: 'Ice Blue', primary: '#a1c4fd', secondary: '#c2e9fb', gradient: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)' },
  { id: 'dual', name: 'Dual Tone', primary: '#cfd9df', secondary: '#e2ebf0', gradient: 'linear-gradient(135deg, #E1E1E1 0%, #F5F5F5 100%)' },
];
import { cn } from '@/lib/utils';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

interface ChatProps {
  agents: Agent[];
  activeAgentId: string | null;
  chatSettings: ChatSimulationSettings;
  onAgentSelect: (agentId: string) => void;
  activeSpaceId?: string | null;
  onDeleteAgent: (agentId: string) => void;
  onTogglePin: (agentId: string) => void;
  onToggleArchive: (agentId: string) => void;
  onBack?: () => void;
}

interface ChatListItemProps {
  agent: Agent;
  isActive: boolean;
  onSelect: () => void;
  onPin: (e: React.MouseEvent) => void;
  onArchive: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onPreview: () => void;
}

function buildClientMessageId(prefix: string, index?: number) {
  return `${prefix}-${Date.now()}${typeof index === 'number' ? `-${index}` : ''}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeRemoteMessageId(
  message: { messageId?: string; timestamp: string; role: string; personaId?: string; text: string },
  index: number
) {
  return (
    message.messageId?.trim() ||
    `${message.personaId || 'persona'}-${message.role}-${message.timestamp}-${index}`.replace(/\s+/g, '-')
  );
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function dedupeMessages(input: Message[]) {
  const unique = new Map<string, Message>();
  for (const message of input) {
    const timestampIso =
      message.timestamp instanceof Date ? message.timestamp.toISOString() : new Date(message.timestamp).toISOString();
    const key = `${message.id}|${message.sender}|${message.agentId || ''}|${message.spaceId || ''}|${timestampIso}`;
    unique.set(key, message);
  }
  return Array.from(unique.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

const ChatListItem: React.FC<ChatListItemProps> = ({ agent, isActive, onSelect, onPin, onArchive, onDelete, onPreview }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left relative group cursor-pointer",
        isActive ? "shadow-sm" : "hover:bg-[#F7F7F8]"
      )}
      style={isActive ? { 
        backgroundColor: `${agent.theme.primary}15`,
        color: agent.theme.primary
      } : {}}
    >
      <div className="relative shrink-0">
        <Avatar 
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className="w-12 h-12 border border-white shadow-sm transition-transform duration-500 group-hover:scale-110 cursor-zoom-in"
        >
          <AvatarImage src={agent.avatar} className="object-cover" />
          <AvatarFallback className="bg-muted text-white font-bold">{agent.name[0]}</AvatarFallback>
        </Avatar>
        <div className="absolute bottom-0 right-0">
          {agent.status === 'online' ? (
            <motion.div 
              animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }} 
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-3.5 h-3.5 rounded-full border-2 border-white bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
            />
          ) : (
            <div className={cn(
              "w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm",
              agent.status === 'busy' ? "bg-amber-500" : "bg-[#9CA3AF]"
            )} />
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-2 truncate">
            <h3 className="text-[15px] font-black truncate transition-colors font-sans tracking-tight" style={{ color: isActive ? agent.theme.primary : '#111111' }}>{agent.name}</h3>
            {agent.isPinned && <Pin className="w-3 h-3 text-[#FF2E93] shrink-0 fill-[#FF2E93]" />}
          </div>
          <span className="text-[10px] font-bold text-[#6B7280]/40 font-sans">19:35</span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-medium text-[#6B7280] truncate leading-snug font-sans italic opacity-80 max-w-[85%]">
            {agent.tagline || (agent.status === 'online' ? 'Ready to reply' : agent.status)}
          </p>
          {agent.status === 'online' && !isActive && (
            <div className="w-2 h-2 rounded-full bg-[#FF2E93] shadow-[0_0_8px_rgba(255,46,147,0.4)]" />
          )}
        </div>
      </div>

      {/* Hover Options Menu */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/80 backdrop-blur-sm p-1 rounded-full shadow-sm border border-[#F0F0F0]">
        <Button variant="ghost" size="icon" title={agent.isPinned ? "Unpin" : "Pin"} className="w-7 h-7 rounded-full text-[#6B7280] hover:text-[#FF2E93]" onClick={onPin}>
          {agent.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
        </Button>
        <Button variant="ghost" size="icon" title={agent.isArchived ? "Unarchive" : "Archive"} className="w-7 h-7 rounded-full text-[#6B7280] hover:text-[#FF2E93]" onClick={onArchive}>
          <Archive className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" title="Delete" className="w-7 h-7 rounded-full text-[#6B7280] hover:text-red-500" onClick={onDelete}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
      
      {isActive && (
        <motion.div 
          layoutId="active-indicator"
          className="absolute left-0 w-1.5 h-1/2 rounded-r-full"
          style={{ backgroundColor: agent.theme.primary }}
        />
      )}
    </motion.div>
  );
};

export default function Chat({ 
  agents, 
  activeAgentId, 
  chatSettings,
  onAgentSelect, 
  activeSpaceId: activeSpaceIdProp,
  onDeleteAgent,
  onTogglePin,
  onToggleArchive,
  onBack
}: ChatProps) {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingAgents, setTypingAgents] = useState<string[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHeaderSearch, setShowHeaderSearch] = useState(false);
  const [msgSearchQuery, setMsgSearchQuery] = useState('');
  const [msgSearchResults, setMsgSearchResults] = useState<number[]>([]);
  const [currentMsgResultIndex, setCurrentMsgResultIndex] = useState(-1);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [customThemes, setCustomThemes] = useState<Record<string, ChatTheme>>({});
  const [sidebarWidth, setSidebarWidth] = useState(330);
  const [isResizing, setIsResizing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; msgId: string } | null>(null);
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(activeSpaceIdProp || null);

  useEffect(() => {
    setActiveSpaceId(activeSpaceIdProp || null);
  }, [activeSpaceIdProp]);
  
  const activeSpace = SPACES.find(s => s.id === activeSpaceId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const loadRequestRef = useRef(0);
  const shouldStickToBottomRef = useRef(true);
  const isSendingRef = useRef(false);
  const typingAgentsRef = useRef<string[]>([]);
  const pendingAssistantIdRef = useRef<string | null>(null);
  const deletedIdsRef = useRef<Set<string>>(new Set());
  const messageQueueRef = useRef<string[]>([]);
  const debounceTimerRef = useRef<number | null>(null);
  const spontaneousTimerRef = useRef<number | null>(null);
  const lastUserActivityRef = useRef<number>(Date.now());

  const activeAgent = agents.find(a => a.id === activeAgentId) || agents[0] || null;

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
  const showChatListOnMobile = isMobile && !activeAgentId && !activeSpaceId;
  const showChatViewOnMobile = isMobile && (activeAgentId || activeSpaceId);

  const handlePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePin(id);
  };

  const handleArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleArchive(id);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this persona?')) {
      onDeleteAgent(id);
    }
  };

  const currentTheme = activeAgent ? customThemes[activeAgent.id] || {
    id: 'default',
    name: 'Agent Default',
    primary: activeAgent.theme.primary,
    secondary: activeAgent.theme.secondary,
    gradient: activeAgent.theme.gradient
  } : {
    id: 'default',
    name: 'Default',
    primary: '#111111',
    secondary: '#DDDDDD',
    gradient: 'linear-gradient(135deg, #FAFAFA 0%, #F2F4F7 100%)',
  };

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const resize = (e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth > 200 && newWidth < 600) {
        setSidebarWidth(newWidth);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing]);

  // Handle textarea auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);
  
  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (a.tagline || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToBottom = (force = false) => {
    if (messagesContainerRef.current) {
      if (!force && (!chatSettings.autoScrollToLatest || !shouldStickToBottomRef.current)) {
        return;
      }
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingAgents, chatSettings.autoScrollToLatest]);

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) {
      return;
    }

    const handleScroll = () => {
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      shouldStickToBottomRef.current = distanceFromBottom < 120;
    };

    handleScroll();
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeAgent?.id, activeSpace?.id]);

  useEffect(() => {
    shouldStickToBottomRef.current = true;
    window.setTimeout(() => {
      scrollToBottom(true);
    }, 0);
  }, [activeAgent?.id, activeSpace?.id]);

  useEffect(() => {
    if (activeSpace && !messages.some(m => m.spaceId === activeSpace.id && m.sender === 'system')) {
      const systemMessage: Message = {
        id: `sys-${activeSpace.id}`,
        spaceId: activeSpace.id,
        sender: 'system',
        text: `Welcome to ${activeSpace.name}! ${activeSpace.description}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, systemMessage]);
    }
  }, [activeSpace, activeSpaceId]);

  // Keep refs in sync so the polling effect doesn't need these as dependencies
  useEffect(() => { isSendingRef.current = isSending; }, [isSending]);
  useEffect(() => { typingAgentsRef.current = typingAgents; }, [typingAgents]);

  useEffect(() => {
    let mounted = true;
    let pollingTimer: number | null = null;

    async function loadConversation(showLoading = false) {
      if (!activeAgent || activeSpace) {
        return;
      }

      // Skip poll ticks while sending / typing (checked via refs to avoid dep churn)
      if (!showLoading && (isSendingRef.current || typingAgentsRef.current.length > 0)) {
        return;
      }

      const requestId = ++loadRequestRef.current;
      if (showLoading) {
        setIsHistoryLoading(true);
      }
      setChatError(null);

      try {
        const response = await getChatHistory(activeAgent.id);
        if (!mounted || requestId !== loadRequestRef.current) {
          return;
        }

        setMessages(previous => {
          const nonDirectMessages = previous.filter(message => message.spaceId);
          const conversationMessages = response.messages
            .map((message, index) => ({
              id: normalizeRemoteMessageId(message, index),
              agentId: message.personaId,
              text: message.text,
              sender: message.role === 'assistant' ? 'agent' : 'user',
              timestamp: new Date(message.timestamp),
            }))
            .filter(m => !deletedIdsRef.current.has(m.id)) as Message[];

          return dedupeMessages([...nonDirectMessages, ...conversationMessages]);
        });
      } catch (error) {
        if (mounted) {
          setChatError(error instanceof Error ? error.message : 'Failed to load chat history');
        }
      } finally {
        if (mounted && showLoading) {
          setIsHistoryLoading(false);
        }
      }
    }

    void loadConversation(true);
    if (activeAgent && !activeSpace) {
      pollingTimer = window.setInterval(() => {
        void loadConversation(false);
      }, 3000);
    }

    return () => {
      mounted = false;
      if (pollingTimer) {
        window.clearInterval(pollingTimer);
      }
    };
  }, [activeAgent?.id, activeSpace]);

  const computePersonaDelay = (agent: Agent | null, backendDelay = 1500) => {
    if (!chatSettings.realisticMode || !agent) {
      return Math.max(500, Math.min(5000, backendDelay));
    }

    // Ensure seconds are sane — clamp min to [1,30] and max to [min,30]
    const clampedMin = Math.max(1, Math.min(30, chatSettings.minResponseDelaySeconds));
    const clampedMax = Math.max(clampedMin, Math.min(30, chatSettings.maxResponseDelaySeconds));
    const minMs = clampedMin * 1000;
    const maxMs = clampedMax * 1000;
    const speed = (agent.responseSpeed || '').toLowerCase();

    let normalized = 0.55;
    if (speed.includes('instant')) normalized = 0.1;
    else if (speed.includes('fast')) normalized = 0.25;
    else if (speed.includes('normal')) normalized = 0.45;
    else if (speed.includes('slow')) normalized = 0.8;
    else if (speed.includes('random')) normalized = Math.random();

    const windowDelay = minMs + normalized * (maxMs - minMs);
    const jitter = Math.random() * Math.min(3000, (maxMs - minMs) * 0.15);
    // Never wait longer than 8s total regardless of settings
    return Math.round(Math.min(8000, Math.max(windowDelay + jitter, backendDelay)));
  };

  // Process the message queue: combines all queued user messages, sends last one to API
  const processMessageQueue = useCallback(async () => {
    if (!activeAgent || activeSpace) return;
    const queue = [...messageQueueRef.current];
    messageQueueRef.current = [];
    if (queue.length === 0) return;

    // The message sent to AI is the LAST one (backend loads recent history to see all of them)
    const lastMessage = queue[queue.length - 1];

    setTypingAgents([activeAgent.name]);
    isSendingRef.current = true;
    setIsSending(true);
    setChatError(null);

    try {
      const response = await sendChatMessage({
        personaId: activeAgent.id,
        conversationId: activeAgent.id,
        message: lastMessage,
      });
      pendingAssistantIdRef.current = response.assistantMessage.messageId;

      // Brief natural typing delay (1-3s) — feels human, not robotic
      const typingDelay = Math.round(800 + Math.random() * 2200);
      await wait(typingDelay);

      setMessages(prev => {
        // Remove all pending client-side user messages for this batch
        const clientPendingIds = new Set(
          prev.filter(m => m.sender === 'user' && m.id.startsWith('user-') && m.agentId === activeAgent.id).map(m => m.id)
        );
        const cleaned = prev.filter(m => !clientPendingIds.has(m.id) || !m.id.startsWith('user-'));

        // Add server-saved user message (from last msg in queue — DB has all of them via individual saves)
        const savedUser: Message | null = response.userMessage ? {
          id: response.userMessage.messageId || buildClientMessageId('user'),
          agentId: activeAgent.id,
          sender: 'user',
          text: response.userMessage.text,
          timestamp: new Date(response.userMessage.timestamp),
        } : null;

        const botResponse: Message = {
          id: response.assistantMessage.messageId || buildClientMessageId('assistant'),
          agentId: activeAgent.id,
          sender: 'agent',
          text: response.assistantMessage.text,
          timestamp: new Date(response.assistantMessage.timestamp),
        };

        const newMessages = savedUser ? [...cleaned, savedUser, botResponse] : [...cleaned, botResponse];
        return dedupeMessages(newMessages.filter(m => !deletedIdsRef.current.has(m.id)));
      });
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      pendingAssistantIdRef.current = null;
      setTypingAgents([]);
      isSendingRef.current = false;
      setIsSending(false);
      lastUserActivityRef.current = Date.now();
    }
  }, [activeAgent, activeSpace, chatSettings]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (!activeSpace && !activeAgent) {
      return;
    }

    const messageText = inputText.trim();
    const pendingMessageId = buildClientMessageId('user');
    const newMessage: Message = {
      id: pendingMessageId,
      agentId: activeSpace ? undefined : activeAgent?.id,
      spaceId: activeSpace?.id,
      sender: 'user',
      text: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    shouldStickToBottomRef.current = true;
    lastUserActivityRef.current = Date.now();
    
    if (activeSpace) {
      const spaceAgents = agents.filter(a => activeSpace.agents.includes(a.id));
      const chosenAgents = [...spaceAgents]
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 2) + 2);

      chosenAgents.forEach((agent, index) => {
        const delay = 1500 * (index + 1) + Math.random() * 2000;
        
        setTimeout(() => {
          setTypingAgents(prev => [...new Set([...prev, agent.name])]);
        }, delay - 1000);

        setTimeout(() => {
          setTypingAgents(prev => prev.filter(name => name !== agent.name));
          const botResponse: Message = {
            id: `bot-${Date.now()}-${index}`,
            agentId: agent.id,
            spaceId: activeSpace.id,
            sender: 'agent',
            text: index === 0 
              ? `That's an interesting point about "${messageText}". I think we should explore it more.`
              : index === 1 
                ? `I agree with ${chosenAgents[0].name}. Also, from my perspective, this adds a whole new dimension.`
                : `Wait, let me jump in! Have we considered how this fits into the bigger picture?`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
        }, delay);
      });
    } else {
      // Queue the message — debounce: wait 3s after last message before triggering AI
      messageQueueRef.current.push(messageText);

      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = window.setTimeout(() => {
        debounceTimerRef.current = null;
        void processMessageQueue();
      }, 3000);
    }
  };

  const currentChatMessages = activeSpace 
    ? messages.filter(m => m.spaceId === activeSpace.id)
    : activeAgent
      ? messages.filter(m => m.agentId === activeAgent.id && !m.spaceId && !deletedIdsRef.current.has(m.id))
      : [];

  const handleMsgSearch = (query: string) => {
    setMsgSearchQuery(query);
    if (!query.trim()) {
      setMsgSearchResults([]);
      setCurrentMsgResultIndex(-1);
      return;
    }

    const results: number[] = [];
    currentChatMessages.forEach((msg, idx) => {
      if (msg.text.toLowerCase().includes(query.toLowerCase())) {
        results.push(idx);
      }
    });

    setMsgSearchResults(results);
    setCurrentMsgResultIndex(results.length > 0 ? results.length - 1 : -1);
  };

  const navigateSearch = (direction: 'up' | 'down') => {
    if (msgSearchResults.length === 0) return;
    
    let newIndex = currentMsgResultIndex;
    if (direction === 'up') {
      newIndex = currentMsgResultIndex > 0 ? currentMsgResultIndex - 1 : msgSearchResults.length - 1;
    } else {
      newIndex = currentMsgResultIndex < msgSearchResults.length - 1 ? currentMsgResultIndex + 1 : 0;
    }
    
    setCurrentMsgResultIndex(newIndex);
    
    // Scroll to the message
    const msgIndex = msgSearchResults[newIndex];
    const msgElement = document.getElementById(`msg-${currentChatMessages[msgIndex].id}`);
    if (msgElement) {
      msgElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setInputText(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // "Delete for me" — remove from local state AND add to blacklist so polling doesn't restore it
  const handleDeleteForMe = useCallback((msgId: string) => {
    deletedIdsRef.current.add(msgId);
    setMessages(prev => prev.filter(m => m.id !== msgId));
    setContextMenu(null);
  }, []);

  // Close context menu on any click
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [contextMenu]);

  // Spontaneous message timer — persona randomly reaches out
  useEffect(() => {
    if (!activeAgent || activeSpace) return;

    function scheduleSpontaneous() {
      // Random delay: 60-180 seconds after last user activity
      const delay = 60000 + Math.random() * 120000;
      spontaneousTimerRef.current = window.setTimeout(async () => {
        // Only fire if user hasn't been active recently and we're not already sending
        const idleTime = Date.now() - lastUserActivityRef.current;
        if (idleTime < 45000 || isSendingRef.current || typingAgentsRef.current.length > 0) {
          scheduleSpontaneous(); // reschedule
          return;
        }

        try {
          setTypingAgents([activeAgent.name]);
          // Brief typing indicator
          await wait(1200 + Math.random() * 1800);

          const response = await sendChatMessage({
            personaId: activeAgent.id,
            conversationId: activeAgent.id,
            message: '',
            spontaneous: true,
          });

          const botMsg: Message = {
            id: response.assistantMessage.messageId || buildClientMessageId('spontaneous'),
            agentId: activeAgent.id,
            sender: 'agent',
            text: response.assistantMessage.text,
            timestamp: new Date(response.assistantMessage.timestamp),
          };

          setMessages(prev => dedupeMessages([...prev, botMsg]));
        } catch (_err) {
          // Silently fail — spontaneous messages are optional
        } finally {
          setTypingAgents([]);
          lastUserActivityRef.current = Date.now();
          scheduleSpontaneous(); // schedule next one
        }
      }, delay);
    }

    scheduleSpontaneous();

    return () => {
      if (spontaneousTimerRef.current) {
        window.clearTimeout(spontaneousTimerRef.current);
      }
    };
  }, [activeAgent?.id, activeSpace]);

  if (!activeSpace && !activeAgent) {
    return (
      <div className="flex h-full items-center justify-center bg-[#FAFAFE] px-8">
        <div className="max-w-md rounded-[32px] border border-[#ECECF2] bg-white px-8 py-10 text-center shadow-[0_30px_80px_-50px_rgba(24,39,75,0.45)]">
          <h2 className="text-[28px] font-serif font-black tracking-tight text-black">No persona selected</h2>
          <p className="mt-3 text-[14px] leading-7 text-[#667085]">
            Create a persona or choose one from the dashboard to start a persistent conversation with memory-aware replies.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-white text-[#111111] font-sans">
      {/* Sidebar - Resizable (and Mobile List) */}
      <aside 
        style={{ width: isMobile ? '100%' : sidebarWidth }}
        className={cn(
          "flex-shrink-0 border-r border-[#EEEEEE] flex flex-col h-full bg-white relative z-20 overflow-hidden transition-all duration-500",
          isMobile ? (showChatListOnMobile ? "flex" : "hidden") : "flex"
        )}
      >
        <div className="p-6 pb-2 shrink-0 bg-white">
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <h1 className="text-2xl font-black italic text-primary tracking-tighter">Revia.</h1>
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl bg-[#F7F7F8]">
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
          <div className="relative group mb-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]/30 group-focus-within:text-[#FF2E93] transition-colors" />
            <input 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-5 py-3 bg-[#F7F7F8] border border-transparent rounded-xl text-[13px] font-medium focus:outline-none focus:bg-white focus:border-[#FF2E93]/20 transition-all font-sans" 
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-2">
          <div className="space-y-6">
            {/* Pinned Section */}
            {agents.some(a => a.isPinned && !a.isArchived) && (
              <div className="space-y-2">
                <div className="px-4 flex items-center justify-between text-[11px] font-black text-[#6B7280]/40 uppercase tracking-[0.1em]">
                  <span>Pinned</span>
                  <Pin className="w-3 h-3" />
                </div>
                <AnimatePresence mode="popLayout">
                  {filteredAgents.filter(a => a.isPinned && !a.isArchived).map((agent) => (
                    <ChatListItem 
                      key={agent.id} 
                      agent={agent} 
                      isActive={agent.id === activeAgentId}
                      onSelect={() => onAgentSelect(agent.id)}
                      onPin={(e) => handlePin(agent.id, e)}
                      onArchive={(e) => handleArchive(agent.id, e)}
                      onDelete={(e) => handleDelete(agent.id, e)}
                      onPreview={() => setPreviewImage(agent.avatar)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Active Section */}
            <div className="space-y-2">
              <div className="px-4 text-[11px] font-black text-[#6B7280]/40 uppercase tracking-[0.1em]">
                Active Chats
              </div>
              <AnimatePresence mode="popLayout">
                {filteredAgents.filter(a => !a.isPinned && !a.isArchived).map((agent) => (
                  <ChatListItem 
                    key={agent.id} 
                    agent={agent} 
                    isActive={agent.id === activeAgentId}
                    onSelect={() => onAgentSelect(agent.id)}
                    onPin={(e) => handlePin(agent.id, e)}
                    onArchive={(e) => handleArchive(agent.id, e)}
                    onDelete={(e) => handleDelete(agent.id, e)}
                    onPreview={() => setPreviewImage(agent.avatar)}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Archived Section Toggle */}
            <div className="space-y-2 pt-2 border-t border-[#F0F0F0]">
              <button 
                onClick={() => setShowArchived(!showArchived)}
                className="w-full px-4 flex items-center justify-between text-[11px] font-black text-[#6B7280]/40 uppercase tracking-[0.1em] hover:text-[#FF2E93] transition-colors"
              >
                <span>Archived ({agents.filter(a => a.isArchived).length})</span>
                {showArchived ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              
              <AnimatePresence mode="popLayout">
                {showArchived && agents.some(a => a.isArchived) && (
                  <div className="space-y-1">
                    {filteredAgents.filter(a => a.isArchived).map((agent) => (
                      <ChatListItem 
                        key={agent.id} 
                        agent={agent} 
                        isActive={agent.id === activeAgentId}
                        onSelect={() => onAgentSelect(agent.id)}
                        onPin={(e) => handlePin(agent.id, e)}
                        onArchive={(e) => handleArchive(agent.id, e)}
                        onDelete={(e) => handleDelete(agent.id, e)}
                        onPreview={() => setPreviewImage(agent.avatar)}
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </aside>

      {/* Resize Handle - Desktop Only */}
      {!isMobile && (
        <div 
          onMouseDown={startResizing}
          className={cn(
            "w-1 hover:w-1.5 transition-all cursor-col-resize z-50 bg-[#EEEEEE] hover:bg-[#FF2E93]/30",
            isResizing && "w-1.5 bg-[#FF2E93]/50"
          )}
        />
      )}

      {/* Main Chat Area */}
      <main className={cn(
        "flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-500",
        isMobile && showChatListOnMobile ? "hidden" : "flex"
      )}>
        {/* Dynamic Background */}
        <div 
          className="absolute inset-0 z-0 transition-all duration-1000 opacity-30"
          style={{ background: currentTheme.gradient }}
        />
        
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, -30, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[100px] opacity-20"
            style={{ backgroundColor: currentTheme.primary }}
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              x: [0, -50, 0],
              y: [0, 30, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-20"
            style={{ backgroundColor: currentTheme.secondary }}
          />
        </div>

        {/* Chat Header - Fixed */}
        <header className={cn(
          "h-[80px] px-4 sm:px-6 border-b border-[#F0E7FF]/50 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-xl transition-all sticky top-0",
          showThemePanel ? "z-50" : "z-10"
        )}>
          <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onBack}
              className="lg:hidden text-[#111111] hover:bg-[#F7F7F8] rounded-xl shrink-0"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="relative group cursor-pointer shrink-0" onClick={() => setShowInfo(true)}>
              {activeSpace ? (
                <div className="flex -space-x-3">
                  {agents.filter(a => activeSpace.agents.includes(a.id)).slice(0, 3).map((a, i) => (
                    <Avatar 
                      key={a.id}
                      className="w-10 h-10 sm:w-11 sm:h-11 border-[2.5px] border-white shadow-md ring-1 ring-black/[0.03] shrink-0"
                      style={{ zIndex: 3 - i }}
                    >
                      <AvatarImage src={a.avatar} className="object-cover" />
                      <AvatarFallback className="bg-muted text-[10px]">{a.name[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Avatar 
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewImage(activeAgent.avatar);
                      }}
                      className="w-10 h-10 sm:w-11 sm:h-11 border-[2.5px] border-white shadow-md transition-transform hover:scale-105 cursor-zoom-in ring-1 ring-black/[0.03]"
                    >
                      <AvatarImage src={activeAgent.avatar} className="object-cover" />
                      <AvatarFallback className="bg-[#6B7280] text-white font-black">{activeAgent.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5">
                      {activeAgent.status === 'online' ? (
                        <motion.div 
                          animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }} 
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="w-3.5 h-3.5 rounded-full border-[2.5px] border-white bg-[#10B981] shadow-lg" 
                        />
                      ) : (
                        <div className={cn(
                          "w-3.5 h-3.5 rounded-full border-[2.5px] border-white shadow-sm",
                          activeAgent.status === 'busy' ? "bg-amber-500" :
                          activeAgent.status === 'sleeping' ? "bg-blue-400" :
                          "bg-gray-500"
                        )} />
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-col min-w-0 cursor-pointer" onClick={() => setShowInfo(true)}>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] sm:text-[17px] font-black text-[#111111] truncate font-sans tracking-tight">
                  {activeSpace ? activeSpace.name : activeAgent.name}
                </h2>
                {activeSpace && <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />}
              </div>
              <div className="flex items-center gap-1.5 overflow-hidden">
                <p className="text-[10px] sm:text-[11px] font-bold text-[#6B7280]/60 -mt-0.5 font-sans truncate tracking-wide">
                  {activeSpace ? `${activeSpace.memberCount} members` : (
                    <span className="flex items-center gap-1.5">
                      {activeAgent.status === 'online' ? 'Always listening' : activeAgent.status}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowHeaderSearch(!showHeaderSearch)}
              className={cn(
                "w-10 h-10 rounded-xl transition-all text-[#6B7280] hover:bg-[#F7F7F8]",
                showHeaderSearch && "bg-[#F7F7F8]"
              )}
            >
              <Search className="w-5 h-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowThemePanel(!showThemePanel)}
              className={cn(
                "w-10 h-10 rounded-xl transition-all text-[#6B7280] hover:bg-[#F7F7F8]",
                showThemePanel && "bg-accent text-white"
              )}
            >
              <Palette className="w-5 h-5" />
            </Button>

            <AnimatePresence>
              {showThemePanel && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] bg-black/5 backdrop-blur-[2px]" 
                    onClick={() => setShowThemePanel(false)} 
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute right-4 sm:right-6 top-20 w-[calc(100vw-32px)] sm:w-80 bg-white rounded-[28px] sm:rounded-[32px] shadow-2xl border border-[#F0E7FF]/50 p-4 sm:p-6 z-[70] flex flex-col"
                    style={{ maxHeight: 'calc(100vh - 120px)' }}
                  >
                    <div className="flex items-center justify-between mb-4 sm:mb-5 shrink-0">
                      <h4 className="text-[11px] sm:text-[13px] font-black text-[#111111] uppercase tracking-[0.2em] font-sans">Chat Themes</h4>
                      <button onClick={() => setShowThemePanel(false)} className="text-[#6B7280] hover:text-[#FF2E93] p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-4 overflow-y-auto no-scrollbar pr-1 py-1">
                      {APP_THEMES.map((theme) => (
                        <motion.button
                          key={theme.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomThemes(prev => ({ ...prev, [activeAgent.id]: theme }));
                            setShowThemePanel(false);
                          }}
                          className={cn(
                            "group flex flex-col text-left transition-all",
                          )}
                        >
                          <div 
                            className={cn(
                              "w-full h-10 sm:h-16 rounded-xl sm:rounded-2xl mb-1 sm:mb-2.5 shadow-sm overflow-hidden border-2 transition-all duration-300",
                              currentTheme.id === theme.id ? "border-accent scale-105" : "border-white group-hover:border-[#F0E7FF]"
                            )}
                            style={{ background: theme.gradient }}
                          />
                          <p className="text-[9px] sm:text-[11px] font-black text-[#111111] font-sans px-1 truncate">{theme.name}</p>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <Button variant="ghost" size="icon" className="hidden sm:flex w-10 h-10 rounded-xl text-[#6B7280] hover:bg-[#F7F7F8]"><Phone className="w-5 h-5" /></Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowInfo(!showInfo)}
              className={cn(
                "w-10 h-10 rounded-xl transition-all text-[#6B7280] hover:bg-[#F7F7F8]",
                showInfo && "bg-black text-white hover:bg-black/80"
              )}
            >
              <Info className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Inline Header Search - Slide down */}
        <AnimatePresence>
          {showHeaderSearch && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white/80 backdrop-blur-xl border-b border-[#F0E7FF]/50 px-6 py-4 overflow-hidden z-20"
            >
              <div className="relative max-w-2xl mx-auto flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]/40" />
                  <input 
                    autoFocus
                    placeholder="Search messages..." 
                    value={msgSearchQuery}
                    onChange={(e) => handleMsgSearch(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-[#F7F7F8] border-none rounded-xl text-[13px] font-medium focus:ring-2 focus:ring-black/5 outline-none transition-all font-sans"
                  />
                  {msgSearchQuery && (
                    <button 
                      onClick={() => handleMsgSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]/40 hover:text-black"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {msgSearchResults.length > 0 && (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-black text-[#6B7280]/40 uppercase tracking-widest font-sans">
                      {currentMsgResultIndex + 1}/{msgSearchResults.length}
                    </span>
                    <div className="flex bg-[#F7F7F8] rounded-xl overflow-hidden border border-[#EEEEEE]">
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none hover:bg-white" onClick={() => navigateSearch('up')}>
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <div className="w-[1px] bg-[#EEEEEE]" />
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none hover:bg-white" onClick={() => navigateSearch('down')}>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto no-scrollbar px-4 relative z-10"
        >
          <div className="max-w-4xl mx-auto py-12 px-2 space-y-10 flex flex-col">
            {chatError && (
              <div className="rounded-2xl border border-[#F3D7DA] bg-[#FFF7F7] px-4 py-3 text-[12px] text-[#8E4047]">
                {chatError}
              </div>
            )}

            {isHistoryLoading && (
              <div className="rounded-2xl border border-[#ECECF2] bg-white/80 px-4 py-3 text-[12px] text-[#667085] shadow-sm">
                Restoring conversation history...
              </div>
            )}

            <AnimatePresence initial={false}>
              {currentChatMessages.length > 0 && (
                <React.Fragment key="chat-message-list">
                  {currentChatMessages.reduce((acc: any[], msg, idx) => {
                    const dateObj = new Date(msg.timestamp);
                    const msgDate = dateObj.toLocaleDateString();
                    const prevMsgDate = idx > 0 ? new Date(currentChatMessages[idx - 1].timestamp).toLocaleDateString() : null;
                    const safeMessageKey =
                      msg.id?.trim() ||
                      `${msg.sender}-${msg.agentId || msg.spaceId || 'chat'}-${dateObj.toISOString()}-${idx}`;
                    const renderKey = `${safeMessageKey}-${idx}`;
                    
                    if (msgDate !== prevMsgDate) {
                      const today = new Date();
                      const yesterday = new Date();
                      yesterday.setDate(today.getDate() - 1);
                      
                      let dateLabel = dateObj.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
                      if (msgDate === today.toLocaleDateString()) dateLabel = "Today";
                      else if (msgDate === yesterday.toLocaleDateString()) dateLabel = "Yesterday";

                      acc.push(
                        <div key={`date-${renderKey}`} className="flex justify-center my-8 sticky top-4 z-10">
                          <span className="px-6 py-2 rounded-2xl bg-white/60 backdrop-blur-xl text-[10px] font-black text-[#6B7280] uppercase tracking-[0.2em] shadow-xl shadow-black/[0.02] border border-white/50 select-none font-sans">
                            {dateLabel}
                          </span>
                        </div>
                      );
                    }

                    if (msg.sender === 'system') {
                      acc.push(
                        <div key={renderKey} className="flex justify-center my-6">
                          <span className="px-5 py-2 rounded-xl bg-[#F7F7F8]/80 backdrop-blur-sm text-[10px] font-black text-[#6B7280] uppercase tracking-widest text-center max-w-[85%] border border-[#EEEEEE]/50 font-sans leading-relaxed">
                            {msg.text}
                          </span>
                        </div>
                      );
                      return acc;
                    }

                    const messageAgent = msg.agentId ? agents.find(a => a.id === msg.agentId) : null;
                    const showAgentInfo = activeSpace && msg.sender === 'agent';
                    const isLastFromSender = idx === currentChatMessages.length - 1 || currentChatMessages[idx + 1].sender !== msg.sender;

                    acc.push(
                      <motion.div
                        key={renderKey}
                        id={`msg-${safeMessageKey}`}
                        initial={{ opacity: 0, y: 15, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className={cn(
                          "flex flex-col group/msg gap-1 relative",
                          msg.sender === 'user' ? "items-end" : "items-start"
                        )}
                      >
                        <div className={cn(
                          "flex gap-3 max-w-[85%] sm:max-w-[75%] items-end",
                          msg.sender === 'user' ? "flex-row-reverse" : "flex-row"
                        )}>
                          {(showAgentInfo || !activeSpace) && msg.sender === 'agent' && (
                            <Avatar className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 border-2 border-white shadow-md mb-1 ring-1 ring-black/[0.02]">
                              <AvatarImage src={messageAgent?.avatar} className="object-cover" />
                              <AvatarFallback className="text-[10px] font-bold">{messageAgent?.name[0]}</AvatarFallback>
                            </Avatar>
                          )}
                          <div className={cn("flex flex-col relative", msg.sender === 'user' ? "items-end" : "items-start")}>
                            {showAgentInfo && (
                              <span className="text-[9px] font-black text-[#111111]/30 uppercase tracking-[0.15em] mb-1.5 ml-1 font-sans">
                                {messageAgent?.name}
                              </span>
                            )}
                            <div
                              onContextMenu={(e) => {
                                e.preventDefault();
                                setContextMenu({ x: e.clientX, y: e.clientY, msgId: msg.id });
                              }}
                              className={cn(
                                "px-5 py-3.5 sm:px-6 sm:py-4 rounded-[26px] text-[14px] sm:text-[15px] font-medium leading-relaxed font-sans shadow-sm transition-all duration-500 cursor-default select-text",
                                msg.sender === 'user' 
                                  ? "text-white shadow-xl shadow-black/[0.05]"
                                  : "bg-white/80 backdrop-blur-xl text-[#111111] border border-white/50 shadow-xl shadow-black/[0.02]",
                                msg.sender === 'user' ? "rounded-br-none" : "rounded-bl-none",
                                msgSearchQuery && msg.text.toLowerCase().includes(msgSearchQuery.toLowerCase()) && 
                                currentMsgResultIndex !== -1 && currentChatMessages[msgSearchResults[currentMsgResultIndex]].id === msg.id
                                  ? "ring-4 ring-black/5 scale-[1.02]" 
                                  : ""
                              )}
                              style={msg.sender === 'user' ? { 
                                background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.primary}ee 100%)`,
                                boxShadow: `0 10px 30px -10px ${currentTheme.primary}40`
                              } : {}}
                            >
                              {msgSearchQuery ? (
                                msg.text.split(new RegExp(`(${msgSearchQuery})`, 'gi')).map((part, i) => 
                                  part.toLowerCase() === msgSearchQuery.toLowerCase() ? (
                                    <span 
                                      key={i} 
                                      className={cn(
                                        "rounded-sm px-0.5 font-black transition-colors duration-300",
                                        msg.sender === 'user' 
                                          ? "bg-green-400/40 text-white" 
                                          : "bg-green-100 text-[#059669] border border-[#10B981]/20 shadow-sm"
                                      )}
                                    >
                                      {part}
                                    </span>
                                  ) : part
                                )
                              ) : msg.text}
                            </div>

                            {/* Delete-for-me hover button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setContextMenu({ x: e.clientX, y: e.clientY, msgId: msg.id });
                              }}
                              className={cn(
                                "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow-md border border-[#EEEEEE] flex items-center justify-center hover:bg-red-50 hover:border-red-200 hover:text-red-500 text-[#9CA3AF] z-10",
                                msg.sender === 'user' ? "-left-9" : "-right-9"
                              )}
                              title="Options"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {isLastFromSender && (
                          <span className="text-[10px] font-bold text-[#6B7280]/30 font-sans tracking-wide mx-2 mt-1 px-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </motion.div>
                    );
                    return acc;
                  }, [])}
                </React.Fragment>
              )}

              {!isHistoryLoading && currentChatMessages.length === 0 && !typingAgents.length && (
                <motion.div
                  key="chat-empty-state"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-auto max-w-xl rounded-[28px] border border-[#ECECF2] bg-white/80 px-8 py-10 text-center shadow-[0_25px_60px_-44px_rgba(24,39,75,0.45)]"
                >
                  <h3 className="text-[20px] font-serif font-black tracking-tight text-black">
                    Start the first real conversation
                  </h3>
                  <p className="mt-3 text-[13px] leading-7 text-[#667085]">
                    Revia will load persona traits, recent chat context, and lightweight memories before generating each reply.
                  </p>
                </motion.div>
              )}
              
                {typingAgents.length > 0 && currentChatMessages.every(message => message.id !== pendingAssistantIdRef.current) && (
                <motion.div
                  key="chat-typing-state"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex items-start gap-3 mb-4"
                >
                  {activeAgent && (
                    <Avatar className="w-8 h-8 shrink-0 border-2 border-white shadow-md ring-1 ring-black/[0.02]">
                      <AvatarImage src={activeAgent.avatar} className="object-cover" />
                      <AvatarFallback className="text-[10px] font-bold">{activeAgent.name[0]}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="bg-white/80 backdrop-blur-xl px-5 py-4 rounded-[22px] rounded-bl-none border border-white/50 shadow-lg shadow-black/[0.02]">
                    <div className="flex gap-1.5 items-center">
                      {[0, 1, 2].map(i => (
                        <motion.div 
                          key={i}
                          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }} 
                          transition={{ repeat: Infinity, duration: 1, delay: i * 0.15 }} 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: currentTheme.primary }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} className="h-10" />
          </div>
        </div>

        {/* Improved Input Bar - Floating Style for Mobile */}
        <footer className="w-full px-4 sm:px-8 py-3 sm:py-8 shrink-0 bg-transparent z-10 relative">
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full left-4 sm:left-8 mb-4 z-50 shadow-2xl rounded-[28px] sm:rounded-3xl overflow-hidden border border-[#F0E7FF]/50"
              >
                <EmojiPicker 
                  onEmojiClick={onEmojiClick} 
                  theme={Theme.LIGHT}
                  width={window.innerWidth < 640 ? window.innerWidth - 32 : 320}
                  height={window.innerWidth < 640 ? 250 : 380}
                  previewConfig={{ showPreview: false }}
                  skinTonesDisabled
                  searchDisabled={true}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.form 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            onSubmit={handleSendMessage}
            className="w-full max-w-5xl mx-auto flex gap-2 sm:gap-4 items-center"
          >
            <div 
              className="flex-1 bg-white border border-[#F0E7FF] rounded-[24px] sm:rounded-[32px] flex items-center px-3 sm:px-6 min-h-[46px] sm:min-h-[72px] transition-all duration-500 shadow-xl shadow-black/[0.03] group relative overflow-hidden"
            >
              <div 
                className="absolute inset-0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{ background: `linear-gradient(to right, ${currentTheme.primary}05, transparent, ${currentTheme.primary}05)` }}
              />
              
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={cn(
                  "text-[#6B7280] transition-all rounded-full shrink-0 h-8 w-8 sm:h-12 sm:w-12 relative z-10",
                  showEmojiPicker && "bg-[#F7F7F8] text-primary"
                )}
              >
                <Smile className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
              
              <textarea 
                ref={textareaRef}
                placeholder="Write your response..." 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e as any);
                  }
                }}
                rows={1}
                className="flex-1 border-none bg-transparent focus:outline-none text-[#111111] placeholder:text-[#6B7280]/20 text-[12px] sm:text-[16px] font-medium px-2 sm:px-4 font-sans py-2.5 sm:py-4 resize-none min-h-[40px] sm:min-h-[64px] overflow-hidden leading-relaxed relative z-10 scrollbar-none"
              />
              
              <Button type="button" variant="ghost" size="icon" className="text-[#6B7280] hover:text-[#FF2E93] transition-all rounded-full shrink-0 h-8 w-8 sm:h-12 sm:w-12 relative z-10">
                <Paperclip className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={!inputText.trim()}
              className="text-white w-[46px] h-[46px] sm:w-[72px] sm:h-[72px] rounded-full flex items-center justify-center p-0 transition-all active:scale-95 disabled:opacity-30 shrink-0 shadow-2xl relative overflow-hidden group/send"
              style={{ 
                backgroundColor: currentTheme.primary, 
                boxShadow: `0 10px 25px -10px ${currentTheme.primary}60` 
              }}
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/send:translate-y-0 transition-transform duration-500" />
              <Send className="w-5 h-5 sm:w-7 sm:h-7 ml-0.4 sm:ml-1 relative z-10 transition-transform group-hover/send:-rotate-12" />
            </Button>
          </motion.form>
        </footer>

        {/* Info Panel Overlay */}
        <AnimatePresence>
          {showInfo && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowInfo(false)}
                className="absolute inset-0 bg-black/5 backdrop-blur-[2px] z-30"
              />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute top-0 right-0 h-full w-full sm:w-[380px] bg-white border-l border-[#EEEEEE] z-40 shadow-2xl flex flex-col"
              >
                <div className="p-8 pb-4 flex justify-between items-center">
                  <h4 className="text-[18px] font-serif font-bold tracking-tight text-[#111111]">Contact Info</h4>
                  <Button variant="ghost" size="icon" onClick={() => setShowInfo(false)} className="rounded-full hover:bg-secondary"><X className="w-5 h-5 font-bold" /></Button>
                </div>

                <div className="flex flex-col items-center text-center p-8 space-y-6 overflow-y-auto custom-scrollbar">
                  <div className="relative mb-2">
                    <Avatar 
                      onClick={() => setPreviewImage(activeAgent.avatar)}
                      className="w-44 h-44 border-4 border-[#F7F7F8] shadow-xl cursor-zoom-in group"
                    >
                      <AvatarImage src={activeAgent.avatar} className="object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                        <Search className="text-white opacity-0 group-hover:opacity-100 w-8 h-8 transition-opacity" />
                      </div>
                    </Avatar>
                    <div className={cn(
                      "absolute -bottom-2 left-1/2 -translate-x-1/2 text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg border-2 border-white font-sans",
                      activeAgent.status === 'online' ? "bg-green-500" :
                      activeAgent.status === 'busy' ? "bg-amber-500" :
                      activeAgent.status === 'sleeping' ? "bg-blue-400" :
                      "bg-gray-400"
                    )}>
                      {activeAgent.status}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-2xl font-serif font-bold text-[#111111]">{activeAgent.name}</h2>
                    <p className="text-[13px] font-medium text-[#6B7280] italic font-sans px-4">"{activeAgent.tagline}"</p>
                  </div>

                  <div className="w-full grid grid-cols-2 gap-3 pt-4 font-sans">
                    <div className="bg-[#F7F7F8] p-4 rounded-2xl text-left border border-[#EEEEEE]">
                       <p className="text-[10px] font-bold text-[#6B7280]/60 uppercase tracking-widest mb-1">Trait</p>
                       <p className="text-[13px] font-black text-[#111111]">Empathetic</p>
                    </div>
                    <div className="bg-[#F7F7F8] p-4 rounded-2xl text-left border border-[#EEEEEE]">
                       <p className="text-[10px] font-bold text-[#6B7280]/60 uppercase tracking-widest mb-1">Gender</p>
                       <p className="text-[13px] font-black text-[#111111] capitalize">{activeAgent.gender}</p>
                    </div>
                  </div>

                  <div className="w-full text-left bg-[#FF2E93]/5 p-5 rounded-3xl border border-[#FF2E93]/10">
                     <p className="text-[13px] font-medium text-[#FF2E93] leading-relaxed italic font-sans">
                       {activeAgent.personality}
                     </p>
                  </div>

                  <div className="w-full pt-4 space-y-3">
                     <Button className="w-full bg-[#111111] hover:bg-[#FF2E93] h-14 rounded-2xl text-[13px] font-bold transition-all shadow-lg shadow-black/10 font-sans">Archive Connection</Button>
                     <Button variant="ghost" className="w-full h-14 rounded-2xl text-[13px] font-bold text-[#ef4444] hover:bg-red-50 font-sans">Report Companion</Button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Image Preview Modal */}
        <AnimatePresence>
          {previewImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-10"
              onClick={() => setPreviewImage(null)}
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-6 right-6 text-white hover:bg-white/10 rounded-full z-[110]"
                onClick={() => setPreviewImage(null)}
              >
                <X className="w-8 h-8" />
              </Button>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25 }}
                className="relative max-w-full max-h-full"
                onClick={(e) => e.stopPropagation()}
              >
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Floating Context Menu for Delete-for-me */}
        <AnimatePresence>
          {contextMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="fixed z-[200] min-w-[180px] bg-white rounded-2xl shadow-2xl border border-[#EEEEEE] py-2 overflow-hidden"
              style={{ top: contextMenu.y, left: contextMenu.x }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => handleDeleteForMe(contextMenu.msgId)}
                className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors font-sans"
              >
                <Trash2 className="w-4 h-4" />
                Delete for me
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
