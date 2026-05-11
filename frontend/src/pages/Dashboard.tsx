import { useState, useMemo } from 'react';
import { Agent, User } from '@/src/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight,
  Search,
  MessageSquare,
  PlusCircle,
  Info,
  Shield,
  HelpCircle,
  Mail,
  Globe,
  Star,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PersonaAvatarImage from '@/src/components/PersonaAvatarImage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

interface DashboardProps {
  user: User;
  agents: Agent[];
  onStartChat: (agentId: string) => void;
  onNavigateToCreate: () => void;
  onNavigateToSpaces: (spaceId: string) => void;
}

export default function Dashboard({ user, agents, onStartChat, onNavigateToCreate, onNavigateToSpaces }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewingAgent, setViewingAgent] = useState<Agent | null>(null);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const firstName = user.name?.trim()?.split(' ')[0] || user.username?.trim() || 'User';

  const toggleAccordion = (id: string) => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };

  const categories = [
    { id: 'female', spaceId: 's1', name: 'Her Frequency', tagline: 'Emotionally aware. Intuitive. Always listening.', color: 'text-[#FF2E93]', hoverColor: 'group-hover:text-[#FF2E93]', bg: 'bg-[#FF2E93]/5', border: 'border-[#FF2E93]/20' },
    { id: 'male', spaceId: 's2', name: 'The Brotherhood', tagline: 'Straight talk. No filters. Just real conversations.', color: 'text-[#06B6D4]', hoverColor: 'group-hover:text-[#06B6D4]', bg: 'bg-[#06B6D4]/5', border: 'border-[#06B6D4]/20' },
    { id: 'non-binary', spaceId: 's3', name: 'Equilibrium', tagline: 'Balanced minds. Thoughtful conversations.', color: 'text-[#111111]', hoverColor: 'group-hover:text-[#FF2E93]', bg: 'bg-zinc-50', border: 'border-zinc-200' },
  ];

  const filteredAgents = useMemo(() => {
    let result = agents;
    
    if (selectedCategory) {
      result = result.filter(agent => agent.gender === selectedCategory);
    }

    if (searchQuery) {
      result = result.filter(agent => 
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.personality.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return result;
  }, [agents, searchQuery, selectedCategory]);

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-[#FAFAFE] text-foreground font-sans">
      {/* PERSONALIZED GREETING */}
      <div className="px-8 pt-12 pb-2">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-2"
          >
            <div className="flex items-end gap-3 translate-x-1">
              <h1 className={cn(
                "text-5xl font-serif font-black italic tracking-tighter",
                user.gender === 'male' ? "text-[#06B6D4]" : "text-primary"
              )}>
                Hello, {firstName}
              </h1>
              <div className={cn(
                "w-2 h-2 rounded-full mb-2 animate-pulse",
                user.gender === 'male' ? "bg-[#06B6D4]" : "bg-accent"
              )} />
            </div>
            <div className="pl-1">
              <h2 className="text-xl font-black italic text-muted-foreground/60 tracking-tight uppercase">Conversation Spaces</h2>
              <p className="text-xs font-bold text-muted-foreground/40 italic">Select a realm to find your companion.</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
            className="flex flex-col items-end"
          >
            <Button 
              className="bg-black hover:bg-[#FF2E93] text-white rounded-2xl px-10 h-14 font-black uppercase text-xs tracking-[0.3em] transition-all duration-500 shadow-xl shadow-black/10 hover:shadow-[#FF2E93]/20 hover:scale-[1.05] active:scale-95 group relative flex items-center gap-3 overflow-hidden"
              onClick={onNavigateToCreate}
            >
              <motion.div
                initial={false}
                animate={{ x: 0 }}
                whileHover={{ rotate: 180 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <PlusCircle className="w-5 h-5" />
              </motion.div>
              
              <span className="relative z-10">REKINDLE</span>
              
              {/* Animated Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
            </Button>
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              whileHover={{ opacity: 1, y: 5 }}
              className="text-[10px] font-bold text-[#111111] italic mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Start your own journey here...
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* CATEGORY SELECTOR */}
      <div className="px-8 pt-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat, i) => (
            <motion.div 
              key={cat.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: "easeOut" }}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={cn(
                "group relative h-48 rounded-[2rem] overflow-hidden border cursor-pointer hover:scale-[1.05] transition-all duration-500",
                cat.bg,
                selectedCategory === cat.id ? "ring-4 ring-offset-2 ring-accent border-accent" : cat.border
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
              <div className="p-8 h-full flex flex-col justify-center gap-2 relative z-10 transition-transform duration-500 group-hover:translate-x-2">
                <h3 className={cn("text-4xl font-serif font-black italic tracking-tighter leading-none transition-all duration-500", cat.color, cat.hoverColor)}>
                  {cat.name}
                </h3>
                <p className={cn(
                  "text-[11px] font-bold tracking-tight transition-all duration-300",
                  selectedCategory === cat.id ? "opacity-100 text-primary" : "opacity-60 group-hover:opacity-100 group-hover:text-primary"
                )}>
                  {cat.tagline}
                </p>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToSpaces(cat.spaceId);
                  }}
                  className="mt-2 w-fit text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all bg-white shadow-sm border border-[#F0F0F0] rounded-full px-4 h-8"
                >
                  Enter Space
                </Button>
              </div>
              <div className={cn(
                "absolute inset-0 transition-colors duration-500",
                selectedCategory === cat.id ? "bg-accent/5" : "bg-black/0 group-hover:bg-black/[0.03]"
              )} />
            </motion.div>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-8 py-16 space-y-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[#F0E7FF] pb-10">
          <motion.div 
            initial={{ opacity: 0, x: -15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
            className="space-y-1"
          >
             <h2 className="text-3xl font-black text-[#111111] italic tracking-tight">
               {selectedCategory ? `${categories.find(c => c.id === selectedCategory)?.name} Members` : 'Active Companions'}
             </h2>
             <p className="text-muted-foreground text-sm font-medium flex items-center gap-2">
               Synthesized frequencies ready for transmission.
             </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-4"
          >
            {selectedCategory && (
              <Button 
                variant="ghost" 
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-[#06B6D4] transition-colors"
                onClick={() => setSelectedCategory(null)}
              >
                Clear Filter
              </Button>
            )}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <input 
                type="text" 
                placeholder="Seek a voice..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-5 py-3 bg-white border border-[#F0E7FF] rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#06B6D4] transition-all w-64 shadow-sm"
              />
            </div>
          </motion.div>
        </div>

        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredAgents.map((agent, index) => (
              <motion.div 
                key={agent.id} 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.03,
                  ease: "easeOut"
                }}
                whileHover={{ y: -5 }}
                className="h-full"
              >
                <Card 
                   className={cn(
                    "bg-white border border-[#F0E7FF] shadow-sm transition-all duration-500 cursor-pointer overflow-hidden group h-full flex flex-col rounded-[2rem] relative",
                    agent.gender === 'female' ? "hover:border-[#EC4899]/30 hover:shadow-[0_20px_40px_rgba(236,72,153,0.12)] hover:bg-[#EC4899]/5" : 
                    agent.gender === 'male' ? "hover:border-[#06B6D4]/30 hover:shadow-[0_20px_40px_rgba(6,182,212,0.12)] hover:bg-[#06B6D4]/5" :
                    "hover:border-accent/30 hover:shadow-accent/10 hover:bg-zinc-50"
                  )}
                >
                  <CardContent className="p-0 flex-1 flex flex-col">
                    <div className="p-2">
                      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem]">
                        <PersonaAvatarImage
                          src={agent.avatar}
                          name={agent.name}
                          className="w-full h-full"
                          imgClassName="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                          fallbackClassName="w-full h-full flex items-center justify-center bg-[#FAFAFA]"
                        />
                        <div className="absolute top-3 right-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full backdrop-blur-md border border-white/20 shadow-lg shadow-black/5 bg-black/10">
                            {agent.status === 'online' ? (
                              <motion.div 
                                animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }} 
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" 
                              />
                            ) : (
                              <div className={cn(
                                "w-2.5 h-2.5 rounded-full",
                                agent.status === 'busy' ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-gray-400"
                              )} />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-5 pb-5 pt-1 space-y-3 flex-1 flex flex-col">
                      <div className="space-y-0.5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className={cn(
                            "text-xl font-serif font-black italic text-[#111111] transition-colors duration-500 tracking-tighter leading-none",
                            agent.gender === 'female' ? "group-hover:text-[#EC4899]" : 
                            agent.gender === 'male' ? "group-hover:text-[#06B6D4]" : "group-hover:text-accent"
                          )}>
                            {agent.name}
                          </h3>
                          {agent.age !== undefined && (
                            <span className="shrink-0 rounded-full border border-[#ECE8F7] bg-[#FAFAFE] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#7E7B8E]">
                              {agent.age}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic">
                          {agent.personality.split(' • ')[0]} • {agent.language}
                        </p>
                      </div>

                      <div className="p-3 bg-[#F8F7FF] rounded-xl border border-[#F0E7FF]/30">
                        <p className="text-[11px] text-muted-foreground/80 font-medium italic leading-snug line-clamp-2">
                          "{agent.tagline}"
                        </p>
                      </div>

                      <div className="pt-3 flex flex-col gap-3 mt-auto border-t border-[#F5F3FF]">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                             <span className={cn(
                               "text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-secondary/50",
                               agent.gender === 'female' ? "text-[#EC4899]" : 
                               agent.gender === 'male' ? "text-[#06B6D4]" : "text-accent"
                             )}>{agent.personality.split(' • ')[0]}</span>
                          </div>
                          
                          <Dialog>
                            <DialogTrigger 
                              className="text-[8px] font-black text-muted-foreground/40 hover:text-[#06B6D4] uppercase tracking-widest flex items-center gap-1 transition-colors"
                            >
                              <Info className="w-3 h-3" /> INFO
                            </DialogTrigger>
                            <DialogContent showCloseButton={false} className="max-w-[720px] p-0 overflow-hidden border-none rounded-[24px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] bg-white h-[560px]">
                              <motion.div 
                                initial={{ x: 100, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="flex h-full"
                              >
                                {/* LEFT IMAGE SECTION (40%) */}
                                <div className="w-[40%] relative">
                                  <PersonaAvatarImage
                                    src={agent.avatar}
                                    name={agent.name}
                                    className="w-full h-full"
                                    imgClassName="w-full h-full object-cover"
                                    fallbackClassName="w-full h-full flex items-center justify-center bg-[#FAFAFA]"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                  
                                  <div className="absolute bottom-8 left-6 right-6 text-white space-y-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      {agent.status === 'online' ? (
                                        <motion.div 
                                          animate={{ opacity: [1, 0.5, 1], scale: [1, 1.2, 1] }}
                                          transition={{ duration: 1.5, repeat: Infinity }}
                                          className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" 
                                        />
                                      ) : (
                                        <div className={cn(
                                          "w-2 h-2 rounded-full",
                                          agent.status === 'busy' ? "bg-amber-400" : "bg-gray-400"
                                        )} />
                                      )}
                                    </div>
                                    <h2 className="text-3xl font-serif font-black italic tracking-tighter leading-none">{agent.name}</h2>
                                    <p className="text-white/70 text-xs font-medium italic leading-relaxed line-clamp-2">{agent.tagline}</p>
                                  </div>
                                </div>

                                {/* RIGHT CONTENT SECTION (60%) */}
                                <div className="w-[60%] flex flex-col p-8 bg-white relative">
                                  <DialogClose className="absolute right-4 top-4 p-2.5 text-muted-foreground/30 hover:text-primary transition-all duration-300 hover:bg-zinc-50 rounded-full group z-50">
                                    <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                                  </DialogClose>

                                  <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pr-1">
                                    {/* Header info */}
                                    <div className="flex items-center justify-between">
                                      <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                      >
                                        <div className="flex items-start gap-3">
                                          <h3 className="text-xl font-serif font-black italic text-primary">{agent.name}</h3>
                                          {agent.age !== undefined && (
                                            <span className="mt-0.5 shrink-0 rounded-full border border-[#E9E4F4] bg-[#FAFAFE] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#7E7B8E]">
                                              {agent.age}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{agent.language}</p>
                                      </motion.div>
                                      {agent.status === 'online' ? (
                                        <motion.div 
                                          animate={{ opacity: [1, 0.4, 1] }} 
                                          transition={{ duration: 1.5, repeat: Infinity }}
                                          className="px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20 flex items-center gap-2"
                                        >
                                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]" />
                                          <span className="text-[9px] font-black uppercase tracking-widest text-green-600">Active</span>
                                        </motion.div>
                                      ) : (
                                        <div 
                                          className={cn(
                                            "px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-2",
                                            agent.status === 'busy' ? "bg-amber-500/10 border-amber-500/20 text-amber-600" : "bg-secondary/50 border-secondary text-muted-foreground"
                                          )}
                                        >
                                          <div className={cn("w-1.5 h-1.5 rounded-full", agent.status === 'busy' ? "bg-amber-500" : "bg-gray-400")} />
                                          <span>{agent.status}</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Tags */}
                                    <motion.div 
                                      initial={{ y: 20, opacity: 0 }}
                                      animate={{ y: 0, opacity: 1 }}
                                      transition={{ delay: 0.4 }}
                                      className="flex flex-wrap gap-2"
                                    >
                                      {agent.personality.split(' • ').map(trait => (
                                        <span key={trait} className="px-3 py-1 bg-blue-50 text-[10px] font-bold text-blue-600 rounded-full border border-blue-100">
                                          {trait}
                                        </span>
                                      ))}
                                    </motion.div>

                                    {/* Description */}
                                    <motion.p 
                                      initial={{ y: 20, opacity: 0 }}
                                      animate={{ y: 0, opacity: 1 }}
                                      transition={{ delay: 0.5 }}
                                      className="text-sm text-muted-foreground/80 leading-relaxed font-medium"
                                    >
                                      {agent.description}
                                    </motion.p>

                                    {/* Conversation Style */}
                                    <motion.div 
                                      initial={{ y: 20, opacity: 0 }}
                                      animate={{ y: 0, opacity: 1 }}
                                      transition={{ delay: 0.6 }}
                                      className="space-y-2"
                                    >
                                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#06B6D4]">Conversation Style</h4>
                                      <ul className="grid grid-cols-2 gap-2">
                                        {agent.conversationStyle?.map((style, idx) => (
                                          <li key={idx} className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                            <div className="w-1 h-1 bg-accent rounded-full" />
                                            {style}
                                          </li>
                                        ))}
                                      </ul>
                                    </motion.div>
                                  </div>

                                  <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.7 }}
                                  >
                                    <Button 
                                      className="mt-6 w-full bg-black hover:bg-zinc-800 text-white rounded-xl h-12 font-bold text-sm tracking-tight transition-all duration-300 shadow-xl"
                                      onClick={() => onStartChat(agent.id)}
                                    >
                                      Begin Conversation
                                    </Button>
                                  </motion.div>
                                </div>
                              </motion.div>
                            </DialogContent>
                          </Dialog>
                        </div>

                        <Button 
                          className={cn(
                            "w-full rounded-xl h-10 font-serif font-black italic text-sm tracking-tighter transition-all duration-300 group/btn shadow-lg",
                            agent.gender === 'female' ? "bg-[#EC4899] hover:bg-[#D43D87] text-white shadow-[#EC4899]/20" : 
                            agent.gender === 'male' ? "bg-[#06B6D4] hover:bg-[#0891B2] text-white shadow-[#06B6D4]/20" : "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartChat(agent.id);
                          }}
                        >
                          Chat <MessageSquare className="w-4 h-4 ml-1.5 group-hover/btn:translate-x-1 group-hover/btn:scale-110 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* MODERN INTERACTIVE FOOTER */}
      <footer className="pt-24 pb-12 mt-20 border-t border-[#F0E7FF] bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            {/* Brand Column */}
            <div className="space-y-6">
              <span className="text-4xl font-serif font-black italic tracking-tighter text-black">Revia.</span>
              <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                Experience meaningful AI conversations. Real voices, real connection.
              </p>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#FFF0F6] flex items-center justify-center text-[#FF2E93] hover:bg-[#FF2E93] hover:text-white transition-all duration-300 cursor-pointer border border-[#FFD6EA]">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#FFF0F6] flex items-center justify-center text-[#FF2E93] hover:bg-[#FF2E93] hover:text-white transition-all duration-300 cursor-pointer border border-[#FFD6EA]">
                  <Mail className="w-5 h-5" />
                </div>
              </div>
            </div>
            
            {/* Support Column */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[#3ABEFF]">
                <HelpCircle className="w-4 h-4" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Support</h4>
              </div>
              <div className="space-y-1">
                {[
                  { id: 'faq', label: 'FAQ Center', content: (
                    <div className="space-y-3 pt-2">
                       {[
                         { q: "What is Revia?", a: "A next-gen platform for meaningful AI connections." },
                         { q: "How do coins work?", a: "Coins enable seamless soul transmissions." },
                         { q: "Is this AI real?", a: "Advanced neural simulations for deep connection." },
                         { q: "Can I create own souls?", a: "Yes, via the Rekender tool in your dashboard." }
                       ].map((item, i) => (
                         <div key={i} className="space-y-1 group/faq cursor-pointer">
                           <p className="text-[10px] font-black text-primary group-hover/faq:text-[#FF2E93] transition-colors">• {item.q}</p>
                           <p className="text-[10px] text-muted-foreground/70 pl-2 leading-relaxed font-medium italic">{item.a}</p>
                         </div>
                       ))}
                    </div>
                  )},
                  { id: 'status', label: 'Platform Status', content: (
                    <div className="space-y-2 pt-2">
                       <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /><span className="text-[11px] font-medium text-muted-foreground/80">All systems operational</span></div>
                       <p className="text-[11px] font-medium text-muted-foreground/80">Avg response time: Fast</p>
                       <p className="text-[11px] font-medium text-muted-foreground/80">Uptime: 99.9%</p>
                    </div>
                  )},
                  { id: 'contact', label: 'Contact Humans', content: (
                    <div className="space-y-3 pt-2">
                       <p className="text-[11px] font-medium text-muted-foreground/80 uppercase">Email: support@revia.ai</p>
                       <p className="text-[11px] font-medium text-muted-foreground/80">Response: within 24 hours</p>
                       <Button size="sm" className="h-8 text-[9px] bg-primary hover:bg-[#FF2E93] rounded-lg uppercase font-black tracking-widest">Send Message</Button>
                    </div>
                  )}
                ].map(item => (
                  <div key={item.id} className={cn("rounded-xl transition-all duration-300", activeAccordion === item.id ? "bg-[#FFF0F6] border border-[#FFD6EA]" : "border-transparent")}>
                    <button 
                      onClick={() => toggleAccordion(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 text-left transition-colors",
                        activeAccordion === item.id ? "text-[#FF2E93]" : "text-muted-foreground hover:text-[#FF2E93]"
                      )}
                    >
                      <ChevronRight className={cn("w-4 h-4 transition-transform duration-300", activeAccordion === item.id && "rotate-90")} />
                      <span className="text-sm font-bold">{item.label}</span>
                    </button>
                    <AnimatePresence>
                      {activeAccordion === item.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-4">
                            {item.content}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Legal Column */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[#3ABEFF]">
                <Shield className="w-4 h-4" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Legal</h4>
              </div>
              <div className="space-y-1">
                {[
                  { id: 'privacy', label: 'Privacy Protocols', content: (
                    <ul className="space-y-2 pt-2 text-[11px] font-medium text-muted-foreground/80 lowercase italic">
                      <li>• Your data is encrypted</li>
                      <li>• No chat data is shared</li>
                      <li>• Full user control over data</li>
                    </ul>
                  )},
                  { id: 'terms', label: 'Terms of Service', content: (
                    <ul className="space-y-2 pt-2 text-[11px] font-medium text-muted-foreground/80 lowercase italic">
                      <li>• Use respectfully</li>
                      <li>• No misuse of AI personas</li>
                      <li>• Platform rights and guidelines</li>
                    </ul>
                  )},
                  { id: 'safety', label: 'Safety Guide', content: (
                    <ul className="space-y-2 pt-2 text-[11px] font-medium text-muted-foreground/80 lowercase italic">
                      <li>• AI is a simulation</li>
                      <li>• Avoid emotional dependency</li>
                      <li>• Reach out to real people when needed</li>
                    </ul>
                  )}
                ].map(item => (
                  <div key={item.id} className={cn("rounded-xl transition-all duration-300", activeAccordion === item.id ? "bg-[#FFF0F6] border border-[#FFD6EA]" : "border-transparent")}>
                    <button 
                      onClick={() => toggleAccordion(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 text-left transition-colors",
                        activeAccordion === item.id ? "text-[#FF2E93]" : "text-muted-foreground hover:text-[#FF2E93]"
                      )}
                    >
                      <ChevronRight className={cn("w-4 h-4 transition-transform duration-300", activeAccordion === item.id && "rotate-90")} />
                      <span className="text-sm font-bold">{item.label}</span>
                    </button>
                    <AnimatePresence>
                      {activeAccordion === item.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-4">
                            {item.content}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Community Column */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[#3ABEFF]">
                <Star className="w-4 h-4" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Community</h4>
              </div>
              <div className="space-y-1">
                {[
                  { id: 'discord', label: 'Discord Hub', content: (
                    <div className="space-y-2 pt-2 text-[11px] font-medium text-muted-foreground/80">
                      <p>Join community discussions, meet other users, and share experiences in our specialized channels.</p>
                    </div>
                  )},
                  { id: 'feedback', label: 'Feedback Loop', content: (
                    <div className="space-y-2 pt-2 text-[11px] font-medium text-muted-foreground/80">
                      <p>Submit feedback, suggest new personas, and report issues directly to our synthesizer team.</p>
                    </div>
                  )},
                  { id: 'ambassadors', label: 'Ambassadors', content: (
                    <div className="space-y-2 pt-2 text-[11px] font-medium text-muted-foreground/80">
                      <p>Become a community leader. Early feature access and special rewards for top-tier members.</p>
                    </div>
                  )}
                ].map(item => (
                  <div key={item.id} className={cn("rounded-xl transition-all duration-300", activeAccordion === item.id ? "bg-[#FFF0F6] border border-[#FFD6EA]" : "border-transparent")}>
                    <button 
                      onClick={() => toggleAccordion(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 text-left transition-colors",
                        activeAccordion === item.id ? "text-[#FF2E93]" : "text-muted-foreground hover:text-[#FF2E93]"
                      )}
                    >
                      <ChevronRight className={cn("w-4 h-4 transition-transform duration-300", activeAccordion === item.id && "rotate-90")} />
                      <span className="text-sm font-bold">{item.label}</span>
                    </button>
                    <AnimatePresence>
                      {activeAccordion === item.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-4">
                            {item.content}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-[#F0E7FF] flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              © 2026 Revia AI Systems. All rights reserved.
            </p>
            <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span>Systems Optimal</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
