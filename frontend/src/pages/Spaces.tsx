import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SPACES as INITIAL_SPACES } from '../constants';
import { Agent, Message, Space } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Plus, Search, Send, Paperclip, Smile, MoreVertical, 
  Info, Phone, ChevronLeft, LayoutGrid, Users, Zap, X, Loader2, CheckCircle2,
  ChevronUp, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';

interface SpacesProps {
  onNavigateToChat: (id: string, spaceId?: string) => void;
  agents: Agent[];
  activeSpaceId?: string | null;
  onBack?: () => void;
}

interface SpaceListItemProps {
  space: Space;
  isActive: boolean;
  onSelect: () => void;
}

const SpaceListItem: React.FC<SpaceListItemProps> = ({ space, isActive, onSelect }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-[24px] transition-all duration-500 text-left relative group cursor-pointer border border-transparent",
        isActive 
          ? "bg-white shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1)] ring-1 ring-[#F0E7FF]" 
          : "hover:bg-[#F7F7F8]/80"
      )}
    >
      <div className="relative shrink-0">
        <div 
          className="w-13 h-13 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl transform transition-transform duration-500 group-hover:scale-105" 
          style={{ background: space.theme.gradient || 'linear-gradient(135deg, #FF2E93 0%, #D41B72 100%)' }}
        >
          {space.name[0]}
        </div>
        <div className="absolute -bottom-1 -right-1">
          <motion.div 
            animate={space.isActive ? { opacity: [1, 0.4, 1], scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={cn(
              "w-4 h-4 rounded-full border-2 border-white shadow-md",
              space.isActive ? "bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-gray-400"
            )} 
          />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="text-[15px] font-black truncate transition-colors font-sans tracking-tight text-[#111111]">
            {space.name}
          </h3>
          <span className="text-[10px] font-bold text-[#6B7280]/40 font-sans uppercase tracking-wider">19:35</span>
        </div>
        <p className="text-[12px] font-medium text-[#6B7280] truncate font-sans italic opacity-60 leading-tight pr-4">
          {isActive ? "Collective resonance active..." : space.description}
        </p>
      </div>
      {isActive && (
        <motion.div 
          layoutId="active-indicator"
          className="w-2 h-2 rounded-full bg-[#FF2E93] shrink-0 ml-1 shadow-[0_0_8px_rgba(255,46,147,0.4)]" 
        />
      )}
    </motion.div>
  );
};

export default function Spaces({ onNavigateToChat, agents, activeSpaceId: activeSpaceIdProp, onBack }: SpacesProps) {
  const [localSpaces, setLocalSpaces] = useState<Space[]>(INITIAL_SPACES);
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(activeSpaceIdProp || null);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingAgents, setTypingAgents] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [showHeaderSearch, setShowHeaderSearch] = useState(false);
  const [msgSearchQuery, setMsgSearchQuery] = useState('');
  const [msgSearchResults, setMsgSearchResults] = useState<number[]>([]);
  const [currentMsgResultIndex, setCurrentMsgResultIndex] = useState(-1);
  const [sidebarWidth, setSidebarWidth] = useState(330);
  const [isResizing, setIsResizing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
  const showSpaceListOnMobile = isMobile && !activeSpaceId;
  const showSpaceViewOnMobile = isMobile && activeSpaceId;

  useEffect(() => {
    if (activeSpaceIdProp) {
      setActiveSpaceId(activeSpaceIdProp);
    }
  }, [activeSpaceIdProp]);
  
  // New Space Modal State
  const [newSpaceName, setNewSpaceName] = useState('');
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);

  const activeSpace = localSpaces.find(s => s.id === activeSpaceId) || localSpaces[0];
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const stopResizing = () => setIsResizing(false);

  const resize = (e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth > 250 && newWidth < 500) {
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

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, typingAgents]);

  // Initial welcome message for the space
  useEffect(() => {
    if (!activeSpaceId) return;
    
    setMessages(prev => {
      // Check if system message for this space already exists
      if (prev.some(m => m.spaceId === activeSpaceId && m.sender === 'system')) {
        return prev;
      }

      const currentSpace = localSpaces.find(s => s.id === activeSpaceId);
      if (!currentSpace) return prev;

      const systemMessage: Message = {
        id: `sys-${activeSpaceId}`,
        spaceId: activeSpaceId,
        sender: 'system',
        text: `${currentSpace.name} space is active. ${currentSpace.description}`,
        timestamp: new Date()
      };
      return [...prev, systemMessage];
    });
  }, [activeSpaceId, localSpaces]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      spaceId: activeSpace.id,
      sender: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Logic for multiple agent responses
    const spaceAgents = agents.filter(a => activeSpace.agents.includes(a.id));
    const chosenAgents = [...spaceAgents]
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 2) + 2);

    chosenAgents.forEach((agent, index) => {
      const typingDelay = 1000 + (index * 1500) + Math.random() * 1000;
      const messageDelay = typingDelay + 1500 + Math.random() * 1000;

      setTimeout(() => {
        setTypingAgents(prev => [...new Set([...prev, agent.name])]);
      }, typingDelay);

      setTimeout(() => {
        setTypingAgents(prev => prev.filter(name => name !== agent.name));
        
        // Random "Joined" or "Reacted" message occasionally
        if (Math.random() > 0.8) {
          const sysMsg: Message = {
            id: `sys-reaction-${Date.now()}-${index}`,
            spaceId: activeSpace.id,
            sender: 'system',
            text: Math.random() > 0.5 ? `${agent.name} reacted ❤️ to your message` : `${agent.name} is deeply considering your point...`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, sysMsg]);
        }

        const botMsg: Message = {
          id: `bot-${Date.now()}-${index}`,
          agentId: agent.id,
          spaceId: activeSpace.id,
          sender: 'agent',
          text: index === 0 
            ? `I've been thinking about "${inputText}". It opens up so many possibilities!`
            : index === 1 
              ? `Totally agree! Plus, if we look at it from another angle, there's even more to discover.`
              : `Wait, don't forget the collective impact of what we're discussing here.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMsg]);
      }, messageDelay);
    });
  };

  const handleMsgSearch = (query: string) => {
    setMsgSearchQuery(query);
    const spaceMessages = messages.filter(m => m.spaceId === activeSpace.id);
    if (!query.trim()) {
      setMsgSearchResults([]);
      setCurrentMsgResultIndex(-1);
      return;
    }

    const results: number[] = [];
    spaceMessages.forEach((msg, idx) => {
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
    
    const spaceMessages = messages.filter(m => m.spaceId === activeSpace.id);
    const msgIndex = msgSearchResults[newIndex];
    const msgElement = document.getElementById(`msg-${spaceMessages[msgIndex].id}`);
    if (msgElement) {
      msgElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleCreateSpace = () => {
    if (!newSpaceName.trim() || selectedAgentIds.length === 0) return;

    setIsCreating(true);
    
    // Simulate API call for creating a space
    setTimeout(() => {
      const newSpace: Space = {
        id: `custom-${Date.now()}`,
        name: newSpaceName,
        description: `A custom space for discussing ${newSpaceName.toLowerCase()}.`,
        theme: {
          primary: '#FF2E93',
          secondary: '#FFFFFF',
          gradient: `linear-gradient(135deg, ${['#FF2E93', '#06B6D4', '#8B5CF6', '#F59E0B'][Math.floor(Math.random() * 4)]} 0%, #111111 200%)`
        },
        memberCount: 1,
        isActive: true,
        agents: selectedAgentIds
      };

      setLocalSpaces(prev => [newSpace, ...prev]);
      setIsCreating(false);
      setCreateSuccess(true);
      setActiveSpaceId(newSpace.id);

      setTimeout(() => {
        setIsModalOpen(false);
        setCreateSuccess(false);
        setNewSpaceName('');
        setSelectedAgentIds([]);
      }, 1500);
    }, 2000);
  };

  const filteredSpaces = localSpaces.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-full overflow-hidden bg-white text-[#111111] font-sans">
      {/* Sidebar - Resizable (and Mobile List) */}
      <aside 
        style={{ width: isMobile ? '100%' : sidebarWidth }}
        className={cn(
          "flex-shrink-0 border-r border-[#EEEEEE] flex flex-col h-full bg-white relative z-20 overflow-hidden transition-all duration-500",
          isMobile ? (showSpaceListOnMobile ? "flex" : "hidden") : "flex"
        )}
      >
        <div className="p-6 shrink-0 bg-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-[28px] font-black italic tracking-tighter text-primary">
                Spaces.
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7F7F8] text-primary transition-all shadow-sm hover:bg-primary hover:text-white">
                  <Plus className="w-5 h-5" />
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl p-8 bg-white overflow-hidden">
                  <AnimatePresence mode="wait">
                    {!createSuccess ? (
                      <motion.div
                        key="create-form"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                      >
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-black tracking-tight">Summon Collective</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                          <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-[#6B7280]/60 ml-1">Realm Name</label>
                            <Input 
                              placeholder="e.g. Creative Minds" 
                              value={newSpaceName}
                              onChange={(e) => setNewSpaceName(e.target.value)}
                              disabled={isCreating}
                              className="h-12 rounded-xl bg-[#F7F7F8] border-none focus:ring-2 ring-primary/20"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-[#6B7280]/60 ml-1">Select Agents</label>
                            <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-2 border border-[#F0F0F0] rounded-xl no-scrollbar">
                              {agents.map((agent) => (
                                <div 
                                  key={agent.id}
                                  onClick={() => {
                                    if (isCreating) return;
                                    setSelectedAgentIds(prev => 
                                      prev.includes(agent.id) ? prev.filter(id => id !== agent.id) : [...prev, agent.id]
                                    );
                                  }}
                                  className={cn(
                                    "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all",
                                    selectedAgentIds.includes(agent.id) ? "bg-[#FFF0F6] text-primary" : "hover:bg-[#F7F7F8]"
                                  )}
                                >
                                  <Avatar className="w-7 h-7">
                                    <AvatarImage src={agent.avatar} />
                                    <AvatarFallback className="text-[8px] font-black">{agent.name[0]}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-[12px] font-bold truncate">{agent.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            className="w-full h-12 rounded-xl bg-primary hover:bg-[#D41B72] text-white font-bold transition-all flex items-center justify-center gap-2" 
                            onClick={handleCreateSpace}
                            disabled={isCreating || !newSpaceName.trim() || selectedAgentIds.length === 0}
                          >
                            {isCreating ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Forging Realm...</span>
                              </>
                            ) : (
                              <span>Forging Realm</span>
                            )}
                          </Button>
                        </DialogFooter>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="success-message"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-12 text-center"
                      >
                        <div className="w-20 h-20 rounded-full bg-[#10B981]/10 flex items-center justify-center mb-6">
                          <CheckCircle2 className="w-10 h-10 text-[#10B981]" />
                        </div>
                        <h3 className="text-2xl font-black tracking-tight mb-2">Realm Manifested</h3>
                        <p className="text-[#6B7280] font-sans">Entering the collective resonance...</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </DialogContent>
              </Dialog>
              
              {isMobile && (
                <Button variant="ghost" size="icon" onClick={onBack} className="w-10 h-10 rounded-xl bg-[#F7F7F8]">
                  <ChevronLeft className="w-5 h-5 text-[#6B7280]" />
                </Button>
              )}
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]/20 group-focus-within:text-primary transition-colors" />
            <input 
              placeholder="Search realms..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-5 py-3.5 bg-[#F7F7F8] border border-transparent rounded-2xl text-[13.5px] font-medium focus:outline-none focus:bg-white focus:border-primary/20 transition-all font-sans" 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-3">
          <div className="space-y-3 pb-6">
            <div className="px-5 text-[10px] font-black text-[#6B7280]/30 uppercase tracking-[0.2em] mb-4">
              Manifested Realms
            </div>
            <AnimatePresence mode="popLayout">
              {filteredSpaces.map((space) => (
                <SpaceListItem 
                  key={space.id} 
                  space={space} 
                  isActive={space.id === activeSpaceId} 
                  onSelect={() => setActiveSpaceId(space.id)}
                />
              ))}
            </AnimatePresence>
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
        "flex-1 flex h-full overflow-hidden relative transition-all duration-500",
        isMobile && showSpaceListOnMobile ? "hidden" : "flex"
      )}>
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, -30, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[100px] opacity-10"
            style={{ backgroundColor: activeSpace.theme.primary }}
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              x: [0, -50, 0],
              y: [0, 30, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-10"
            style={{ backgroundColor: activeSpace.theme.secondary || '#F5F5F7' }}
          />
        </div>

        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F7F7F8]/30 backdrop-blur-[2px] relative z-10">
          <header className="h-[70px] sm:h-[80px] px-4 sm:px-8 border-b border-[#EEEEEE] flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-xl z-20 sticky top-0">
            <div className="flex items-center gap-3 sm:gap-4 truncate">
              {isMobile && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setActiveSpaceId(null)}
                  className="rounded-xl bg-[#F7F7F8] shrink-0"
                >
                  <ChevronLeft className="w-6 h-6 text-[#111111]" />
                </Button>
              )}
              <div className="flex items-center gap-3 cursor-pointer group truncate" onClick={() => setShowInfo(!showInfo)}>
                <div className="flex -space-x-3 sm:-space-x-4 shrink-0">
                  {agents.filter(a => activeSpace.agents.includes(a.id)).slice(0, 3).map((a, i) => (
                    <Avatar key={a.id} className="w-8 h-8 sm:w-11 sm:h-11 border-2 border-white shadow-md ring-1 ring-black/[0.03]" style={{ zIndex: 3 - i }}>
                      <AvatarImage src={a.avatar} className="object-cover" />
                      <AvatarFallback className="text-[10px] sm:text-[12px] font-black">{a.name[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <div className="flex flex-col truncate">
                  <h2 className="text-[14px] sm:text-[17px] font-black text-[#111111] group-hover:text-primary transition-all duration-300 tracking-tight truncate">{activeSpace.name}</h2>
                  <div className="flex items-center gap-1.5 -mt-0.5">
                    <motion.div 
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.3)]" 
                    />
                    <p className="text-[9px] sm:text-[11px] font-bold text-[#10B981] uppercase tracking-[0.1em] font-sans">12 Agents active</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowHeaderSearch(!showHeaderSearch)}
                className={cn(
                  "w-10 h-10 rounded-xl transition-all text-[#6B7280]",
                  showHeaderSearch && "bg-[#F7F7F8] text-primary shadow-inner"
                )}
              >
                <Search className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
              {!isMobile && <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-[#6B7280] hover:bg-[#F7F7F8]"><Phone className="w-5 h-5" /></Button>}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowInfo(!showInfo)}
                className={cn(
                  "w-10 h-10 rounded-xl transition-all text-[#6B7280]",
                  showInfo && "bg-primary text-white shadow-lg"
                )}
              >
                <Info className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </div>
          </header>

          {/* Inline Header Search */}
          <AnimatePresence>
            {showHeaderSearch && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-white border-b border-[#EEEEEE] px-6 py-3.5 overflow-hidden shadow-sm z-20"
              >
                <div className="relative max-w-2xl mx-auto flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]/40" />
                    <input 
                      autoFocus
                      placeholder="Search messages in this space..." 
                      value={msgSearchQuery}
                      onChange={(e) => handleMsgSearch(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-[#F7F7F8] border-none rounded-xl text-sm focus:ring-1 focus:ring-[#FF2E93]/20 outline-none transition-all font-sans"
                    />
                    {msgSearchQuery && (
                      <button 
                        onClick={() => handleMsgSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]/40 hover:text-[#FF2E93]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {msgSearchResults.length > 0 && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-bold text-[#6B7280] font-sans">
                        {currentMsgResultIndex + 1} of {msgSearchResults.length}
                      </span>
                      <div className="flex bg-[#F7F7F8] rounded-lg">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white" onClick={() => navigateSearch('up')}>
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white" onClick={() => navigateSearch('down')}>
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-8">
              <AnimatePresence initial={false}>
                {messages.filter(m => m.spaceId === activeSpace.id).reduce((acc: any[], msg, idx, array) => {
                  const dateObj = new Date(msg.timestamp);
                  const msgDate = dateObj.toLocaleDateString();
                  const prevMsgDate = idx > 0 ? new Date(array[idx - 1].timestamp).toLocaleDateString() : null;
                  
                  if (msgDate !== prevMsgDate) {
                    const today = new Date();
                    const yesterday = new Date();
                    yesterday.setDate(today.getDate() - 1);
                    
                    let dateLabel = dateObj.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
                    if (msgDate === today.toLocaleDateString()) dateLabel = "Today";
                    else if (msgDate === yesterday.toLocaleDateString()) dateLabel = "Yesterday";

                    acc.push(
                      <div key={`date-${msg.id}`} className="flex justify-center my-8 sticky top-2 z-10">
                        <span className="px-5 py-1.5 rounded-full bg-white/60 backdrop-blur-md text-[10px] font-black text-[#6B7280] uppercase tracking-[0.2em] shadow-sm border border-white font-sans">
                          {dateLabel}
                        </span>
                      </div>
                    );
                  }

                  if (msg.sender === 'system') {
                    acc.push(
                      <motion.div 
                        key={msg.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex justify-center my-4"
                      >
                        <span className="px-6 py-2 rounded-full bg-white/40 backdrop-blur-sm text-[10px] font-black text-[#6B7280]/60 uppercase tracking-[0.2em] text-center border border-white/50 shadow-sm shadow-black/[0.02]">
                          {msg.text}
                        </span>
                      </motion.div>
                    );
                    return acc;
                  }

                  const msgAgent = msg.agentId ? agents.find(a => a.id === msg.agentId) : null;
                  const isUser = msg.sender === 'user';

                  acc.push(
                    <motion.div
                      key={msg.id}
                      id={`msg-${msg.id}`}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className={cn("flex flex-col group", isUser ? "items-end" : "items-start")}
                    >
                      {!isUser && msgAgent && (
                        <span className="text-[10px] font-black text-[#111111]/40 uppercase tracking-widest mb-1 ml-10 font-sans">
                          {msgAgent.name}
                        </span>
                      )}
                      <div className={cn(
                        "flex gap-3 max-w-[85%] items-end",
                        msgSearchQuery && msg.text.toLowerCase().includes(msgSearchQuery.toLowerCase()) ? "ring-2 ring-[#FF2E93]/20 rounded-[24px] p-0.5" : ""
                      )}>
                        {!isUser && (
                          <Avatar className="w-8 h-8 shrink-0 border border-white shadow-sm mb-1 cursor-zoom-in" onClick={() => setPreviewImage(msgAgent?.avatar || null)}>
                            <AvatarImage src={msgAgent?.avatar} />
                            <AvatarFallback className="text-[10px]">{msgAgent?.name[0]}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className={cn(
                          "px-5 py-3.5 rounded-[22px] text-[13.5px] font-medium leading-relaxed font-sans shadow-sm transition-all duration-300",
                          isUser 
                            ? "bg-[#FF2E93] text-white rounded-tr-none shadow-md"
                            : "bg-white/70 backdrop-blur-md text-[#111111] rounded-tl-none border border-white/40 shadow-xl"
                        )}>
                          {msgSearchQuery ? (
                            msg.text.split(new RegExp(`(${msgSearchQuery})`, 'gi')).map((part, i) => 
                              part.toLowerCase() === msgSearchQuery.toLowerCase() ? (
                                <span 
                                  key={i} 
                                  className={cn(
                                    "rounded-sm px-0.5 font-black transition-colors duration-300",
                                    isUser 
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
                      </div>
                      <span className="text-[10px] mt-2 font-medium text-[#6B7280]/40 font-sans mx-2">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </motion.div>
                  );
                  return acc;
                }, [])}

                {typingAgents.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="flex flex-col items-start gap-2 mb-2"
                  >
                    <div className="bg-white/70 backdrop-blur-md px-5 py-4 rounded-[22px] rounded-tl-none border border-white/40 shadow-xl flex items-center gap-3">
                      <span className="text-[13px] font-medium text-[#6B7280] font-sans">
                        {typingAgents.length > 1 
                          ? `${typingAgents.slice(0, 2).join(', ')}${typingAgents.length > 2 ? ' and others' : ''} are typing`
                          : `${typingAgents[0]} is typing`}
                      </span>
                      <div className="flex gap-1.5 pt-0.5">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                            transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: activeSpace.theme.primary }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Action Bar */}
          <footer className="px-4 sm:px-8 py-3 sm:py-8 shrink-0 bg-transparent z-10 relative">
            <form onSubmit={handleSendMessage} className="w-full max-w-5xl mx-auto flex gap-2 sm:gap-4 items-center">
              <div className="flex-1 bg-white border border-[#F0E7FF] rounded-[24px] sm:rounded-[32px] flex items-center px-3 sm:px-6 min-h-[46px] sm:min-h-[72px] transition-all duration-500 shadow-xl shadow-black/[0.03] group relative overflow-hidden">
                <Button type="button" variant="ghost" size="icon" className="text-[#6B7280] transition-all rounded-full shrink-0 h-8 w-8 sm:h-12 sm:w-12 relative z-10">
                  <Smile className="w-4 h-4 sm:w-6 sm:h-6" />
                </Button>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Manifest response..."
                  className="flex-1 border-none bg-transparent focus:outline-none text-[#111111] placeholder:text-[#6B7280]/20 text-[12px] sm:text-[16px] font-medium px-2 sm:px-4 font-sans py-2.5 sm:py-4 resize-none min-h-[40px] sm:min-h-[64px] overflow-hidden leading-relaxed relative z-10 scrollbar-none"
                />
                <Button type="button" variant="ghost" size="icon" className="text-[#6B7280] hover:text-primary transition-all rounded-full shrink-0 h-8 w-8 sm:h-12 sm:w-12 relative z-10">
                  <Paperclip className="w-4 h-4 sm:w-6 sm:h-6" />
                </Button>
              </div>

              <Button 
                type="submit" 
                disabled={!inputText.trim()}
                className="text-white w-[46px] h-[46px] sm:w-[72px] sm:h-[72px] rounded-full flex items-center justify-center p-0 transition-all active:scale-95 disabled:opacity-30 shrink-0 shadow-2xl relative overflow-hidden group/send"
                style={{ 
                  backgroundColor: activeSpace.theme.primary, 
                  boxShadow: `0 10px 25px -10px ${activeSpace.theme.primary}60` 
                }}
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/send:translate-y-0 transition-transform duration-500" />
                <Send className="w-5 h-5 sm:w-7 sm:h-7 ml-0.5 sm:ml-1 relative z-10 transition-transform group-hover/send:-rotate-12" />
              </Button>
            </form>
          </footer>
        </div>

        {/* Space Info Sidebar */}
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
              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute top-0 right-0 w-80 sm:w-[380px] h-full bg-white border-l border-[#EEEEEE] flex flex-col shrink-0 z-40 shadow-2xl"
              >
                <div className="p-8 pb-4 flex items-center justify-between">
                  <h3 className="text-[18px] font-serif font-black italic tracking-tight text-[#111111] font-sans">Space Details</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowInfo(false)} className="w-9 h-9 rounded-full text-[#6B7280] hover:text-[#FF2E93] hover:bg-[#FFF0F6]">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10 flex flex-col items-center">
                  <div className="flex flex-col items-center text-center space-y-4 w-full">
                    <div className="w-32 h-32 rounded-[40px] flex items-center justify-center text-white text-5xl font-serif italic font-black shadow-2xl ring-4 ring-white" style={{ background: activeSpace.theme.gradient }}>
                      {activeSpace.name[0]}
                    </div>
                    <div>
                      <h4 className="text-2xl font-serif font-black italic tracking-tight text-[#111111]">{activeSpace.name}</h4>
                      <p className="text-[11px] font-bold text-[#10B981] uppercase tracking-[0.2em] mt-1 bg-[#10B981]/5 px-4 py-1 rounded-full border border-[#10B981]/10">Collective Resonance</p>
                    </div>
                  </div>

                  <div className="w-full space-y-3 bg-[#F7F7F8] p-6 rounded-[24px] border border-[#EEEEEE]">
                    <h5 className="text-[11px] font-black uppercase tracking-widest text-[#6B7280]/60 flex items-center gap-2">
                       <LayoutGrid className="w-3 h-3" />
                       About This Space
                    </h5>
                    <p className="text-[13.5px] text-[#111111]/80 leading-relaxed font-sans italic">"{activeSpace.description}"</p>
                  </div>

                  <div className="w-full space-y-5">
                    <h5 className="text-[11px] font-black uppercase tracking-widest text-[#10B981] ml-1 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Manifested Agents ({activeSpace.agents.length})
                    </h5>
                    <div className="grid grid-cols-1 gap-4">
                      {agents.filter(a => activeSpace.agents.includes(a.id)).map((agent) => (
                        <div key={agent.id} className="flex items-center gap-4 group cursor-pointer bg-white p-3 rounded-2xl border border-transparent hover:border-[#F0F0F0] hover:shadow-sm transition-all" onClick={() => onNavigateToChat(agent.id)}>
                          <div className="relative">
                            <Avatar className="w-12 h-12 border border-[#F0F0F0] group-hover:scale-105 transition-transform" onClick={(e) => { e.stopPropagation(); setPreviewImage(agent.avatar); }}>
                              <AvatarImage src={agent.avatar} />
                              <AvatarFallback>{agent.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="absolute bottom-0 right-0">
                               {agent.status === 'online' ? (
                                 <motion.div 
                                   animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }}
                                   transition={{ duration: 1.5, repeat: Infinity }}
                                   className="w-3 h-3 rounded-full border-2 border-white bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" 
                                 />
                               ) : (
                                 <div className={cn(
                                   "w-3 h-3 rounded-full border-2 border-white",
                                   agent.status === 'busy' ? "bg-amber-500" : "bg-gray-400"
                                 )} />
                               )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-bold text-[#111111] truncate font-sans group-hover:text-[#FF2E93] transition-colors">{agent.name}</p>
                            <p className="text-[11px] text-[#6B7280]/70 truncate font-sans italic opacity-80">{agent.tagline}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="w-full pt-4">
                     <Button className="w-full bg-[#111111] hover:bg-[#FF2E93] h-14 rounded-2xl text-[13px] font-bold transition-all shadow-lg shadow-black/10 font-sans">Mute Flux</Button>
                  </div>
                </div>
              </motion.aside>
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
              className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 md:p-10"
              onClick={() => setPreviewImage(null)}
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-6 right-6 text-white hover:bg-white/10 rounded-full z-[210]"
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
                  className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl border-4 border-white/10"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
