import React, { useState, useRef, useEffect } from 'react';
import { Agent, Gender } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserPlus, 
  ArrowLeft, 
  ArrowRight, 
  MessageSquare, 
  Plus,
  Trash2,
  Zap,
  Search,
  Upload,
  MoreVertical,
  Check,
  Copy,
  Edit2,
  X,
  FileText,
  ChevronDown,
  Info,
  ShieldAlert,
  Camera,
  Pin,
  PinOff,
  Archive,
  Library,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface PersonaItemProps {
  agent: Agent;
  activePersonaId: string | null;
  activeMenu: string | null;
  setActivePersonaId: (id: string) => void;
  setActiveMenu: (id: string | null) => void;
  handleEdit: (agent: Agent) => void;
  onDeleteAgent: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleArchive: (id: string) => void;
  formData: any;
}

const PersonaItem: React.FC<PersonaItemProps> = ({ 
  agent, 
  activePersonaId, 
  activeMenu, 
  setActivePersonaId, 
  setActiveMenu,
  handleEdit,
  onDeleteAgent,
  onTogglePin,
  onToggleArchive,
  formData
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ x: 4 }}
      onClick={() => setActivePersonaId(agent.id)}
      className={cn(
        "group p-3 sm:p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between relative",
        activePersonaId === agent.id ? "bg-[#FAFAFA] shadow-[0_8px_20px_-10px_rgba(0,0,0,0.05)]" : "hover:bg-[#FAFAFA]/70",
        activeMenu === agent.id && "z-[80]"
      )}
    >
      <div className="flex items-center gap-3 sm:gap-5 min-w-0">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#FAFAFA] flex items-center justify-center overflow-hidden border border-[#F0F0F0] shrink-0 transition-transform group-hover:scale-105 shadow-sm">
          {agent.avatar || formData.profileImage ? (
            <img src={agent.avatar || formData.profileImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-[#CCCCCC]" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h4 className={cn(
              "text-[13px] sm:text-[14px] font-bold truncate transition-colors",
              activePersonaId === agent.id ? "text-black" : "text-[#111111]"
            )}>{agent.name}</h4>
            {agent.isPinned && <Pin className="w-2.5 h-2.5 text-black fill-black" />}
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              (agent.status as string) === 'online' || (agent.status as string) === 'ready' ? "bg-green-500" : 
              (agent.status as string) === 'busy' ? "bg-amber-500" : 
              (agent.status as string) === 'SYNTHESIZING' ? "bg-blue-500 animate-pulse" : "bg-[#DDDDDD]"
            )} />
            <span className="text-[10px] sm:text-[11px] font-medium text-[#888888] truncate">
              {(agent.status as string) === 'SYNTHESIZING' ? 'Synthesizing...' : agent.tagline || 'Persona'}
            </span>
          </div>
        </div>
      </div>
      <div className="relative">
        <button 
          onClick={(e) => { 
            e.preventDefault();
            e.stopPropagation(); 
            setActiveMenu(activeMenu === agent.id ? null : agent.id); 
          }}
          className={cn(
            "p-1.5 sm:p-2 text-[#CCCCCC] hover:text-black transition-all rounded-full hover:bg-gray-200/50",
            activeMenu === agent.id && "bg-gray-200/50 text-black"
          )}
        >
          <MoreVertical className="w-3.5 h-3.5 sm:w-4 h-4" />
        </button>
        <AnimatePresence>
          {activeMenu === agent.id && (
            <>
              {/* Backdrop specialized for this open menu */}
              <div 
                className="fixed inset-0 z-[65]" 
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation(); 
                  setActiveMenu(null); 
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 top-full mt-1 w-40 sm:w-48 bg-white border border-[#E5E7EB] rounded-xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] p-1 z-[80] overflow-hidden origin-top-right"
              >
               {[
                 { label: 'Edit', icon: Edit2, onClick: () => handleEdit(agent) },
                 { label: agent.isPinned ? 'Unpin' : 'Pin', icon: agent.isPinned ? PinOff : Pin, onClick: () => onTogglePin(agent.id) },
                 { label: agent.isArchived ? 'Unarchive' : 'Archive', icon: Archive, onClick: () => onToggleArchive(agent.id) },
                 { label: 'Delete', icon: Trash2, danger: true, onClick: () => { if(window.confirm('Delete this persona?')) { onDeleteAgent(agent.id); } } },
               ].map((item) => (
                 <button
                   key={item.label}
                   onClick={(e) => { 
                     e.preventDefault();
                     e.stopPropagation(); 
                     item.onClick();
                     setActiveMenu(null);
                   }}
                   className={cn(
                     "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[11px] font-bold transition-all text-left",
                     item.danger ? "text-red-500 hover:bg-red-50" : "text-black hover:bg-[#FAFAFA]"
                   )}
                 >
                   <item.icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                   {item.label}
                 </button>
               ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface CreateAgentProps {
  agents: Agent[];
  onAddAgent: (agent: Agent) => void;
  onUpdateAgent: (agent: Agent) => void;
  onDeleteAgent: (agentId: string) => void;
  onTogglePin: (agentId: string) => void;
  onToggleArchive: (agentId: string) => void;
}

const TRAITS = ['Caring', 'Funny', 'Sarcastic', 'Calm', 'Loyal', 'Deep thinker', 'Flirty', 'Serious', 'Stoic', 'Empathetic'];
const RELATIONS = ['Partner', 'Best Friend', 'Soulmate', 'Ex', 'Sibling', 'Parent', 'Mentor', 'Rival'];
const LANGUAGES = ['English', 'Hindi', 'Hinglish'];
const REPLY_SPEEDS = ['Instant', 'Fast', 'Normal', 'Slow', 'Random'];

const STEP_TITLES = [
  '',
  'Identity',
  'Relationship',
  'Communication',
  'Visual Evidence',
  'Profile Identity',
  'Personality Traits',
  'Advanced Mapping',
  'Final Review',
  'Manifestation',
  'Synthesis Complete'
];

const PremiumInput = ({ label, className, ...rest }: React.ComponentProps<typeof Input> & { label: string }) => {
  return (
    <div className="space-y-2.5 group">
      <Label className="text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-[#AAAAAA] ml-1 transition-colors group-focus-within:text-black">
        {label}
      </Label>
      <div className="relative rounded-xl overflow-hidden transition-all bg-white border border-[#E5E7EB] group-focus-within:border-black group-focus-within:shadow-[0_0_0_1px_rgba(0,0,0,1)]">
        <Input 
          {...rest}
          className={cn(
            "h-12 bg-white border-transparent rounded-xl px-5 font-sans font-medium text-[14px] text-black outline-none focus-visible:ring-0 placeholder:text-[#BBBBBB] transition-all",
            className
          )}
        />
      </div>
    </div>
  );
};

const CustomDropdown = ({ value, options, onChange, label }: { value: string, options: string[], onChange: (val: any) => void, label: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <Label className="text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-[#AAAAAA] ml-1 mb-2.5 block">{label}</Label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-12 bg-white border border-[#E5E7EB] rounded-xl px-5 text-[14px] font-sans font-medium text-black flex items-center justify-between transition-all hover:bg-[#FAFAFA] relative overflow-hidden group",
          isOpen && "border-black shadow-[0_0_0_1px_rgba(0,0,0,1)]"
        )}
      >
        <span className="capitalize relative z-10">{value}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-[#AAAAAA] transition-transform duration-300 relative z-10", isOpen && "rotate-180")} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -4 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-[#E5E7EB] rounded-xl shadow-xl shadow-black/5 overflow-hidden py-1"
          >
            {options.map((opt) => (
              <button
                type="button"
                key={opt}
                onClick={() => { onChange(opt.toLowerCase()); setIsOpen(false); }}
                className={cn(
                  "w-full px-5 py-1 text-left text-[14px] font-sans transition-all flex items-center justify-between",
                  value.toLowerCase() === opt.toLowerCase() 
                    ? "bg-[#FAFAFA] text-black font-semibold" 
                    : "text-[#666666] hover:bg-[#FAFAFA] hover:text-black"
                )}
              >
                <span className="capitalize">{opt}</span>
                {value.toLowerCase() === opt.toLowerCase() && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function CreateAgent({ 
  agents, 
  onAddAgent, 
  onUpdateAgent, 
  onDeleteAgent, 
  onTogglePin, 
  onToggleArchive 
}: CreateAgentProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [generatedAgent, setGeneratedAgent] = useState<Agent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'female' as Gender,
    language: 'English',
    relation: 'Partner',
    traits: [] as string[],
    sliders: {
      humor: 50,
      emotion: 50,
    },
    chatHistory: '',
    commMethods: [] as string[], // ['upload', 'paste', 'behavioral']
    behavioralInfo: '',
    autonomousPings: true,
    uploadedFiles: [] as { name: string; size: number }[],
    images: [] as string[],
    profileImage: '' as string,
    behaviorRule: '',
    replySpeed: 'Normal',
    agreed: false
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isStepValid = (step: number) => {
    switch (step) {
      case 1: return !!formData.name && !!formData.age;
      case 2: return !!formData.relation;
      case 3: return formData.commMethods.length > 0;
      case 9: return formData.agreed;
      default: return true;
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setIsEditing(false);
    setEditingAgentId(null);
    setFormData({
      name: '',
      age: '',
      gender: 'female',
      language: 'English',
      relation: 'Partner',
      traits: [],
      sliders: { humor: 50, emotion: 50 },
      chatHistory: '',
      commMethods: [],
      behavioralInfo: '',
      autonomousPings: true,
      uploadedFiles: [],
      images: [],
      profileImage: '',
      behaviorRule: '',
      replySpeed: 'Normal',
      agreed: false
    });
  };

  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const nextStep = () => {
    if (currentStep < 10 && isStepValid(currentStep)) {
      setCurrentStep(currentStep + 1);
      scrollToTop();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      scrollToTop();
    }
  };

  const toggleTrait = (trait: string) => {
    setFormData(prev => ({
      ...prev,
      traits: prev.traits.includes(trait) 
        ? prev.traits.filter(t => t !== trait)
        : [...prev.traits, trait]
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let files: File[] = [];
    if ('files' in e && e.target && (e.target as HTMLInputElement).files) {
      files = Array.from((e.target as HTMLInputElement).files!);
    } else if ('dataTransfer' in e && (e as React.DragEvent).dataTransfer.files) {
      files = Array.from((e as React.DragEvent).dataTransfer.files);
    }

    const validFiles = files.filter(f => f.name.endsWith('.txt') || f.name.endsWith('.csv') || f.name.endsWith('.pdf'));
    setFormData(prev => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, ...validFiles.map(f => ({ name: f.name, size: f.size }))]
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImages = files.map(f => URL.createObjectURL(f as File));
      setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
    }
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setFormData(prev => ({ ...prev, profileImage: url }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = () => {
    if (!formData.agreed) return;
    setIsLoading(true);
    setTimeout(() => {
      const agentData: Agent = {
        id: isEditing && editingAgentId ? editingAgentId : Date.now().toString(),
        name: formData.name || 'Untitled Persona',
        gender: formData.gender,
        personality: formData.traits.join(', ') || 'Custom',
        avatar: formData.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`,
        tagline: `${formData.relation} • ${formData.language}`,
        description: `Custom personality-driven companion synthesized through linguistic logs and behavioral mapping.`,
        status: 'online',
        age: parseInt(formData.age) || 25,
        theme: {
          primary: '#000000',
          secondary: '#FF7EB3',
          gradient: 'linear-gradient(135deg, #FF7EB3 0%, #7EA8FF 100%)',
          vibe: 'premium'
        }
      };

      if (isEditing) {
        onUpdateAgent(agentData);
      } else {
        onAddAgent(agentData);
      }
      
      setGeneratedAgent(agentData);
      setIsLoading(false);
      setIsEditing(false);
      setEditingAgentId(null);
      setCurrentStep(10); // Completion step
    }, 2800);
  };

  const handleEdit = (agent: Agent) => {
    setIsEditing(true);
    setEditingAgentId(agent.id);
    setCurrentStep(1);
    
    // Parse personality and tagline to restore form data as much as possible
    const taglineParts = (agent.tagline || '').split(' • ');
    
    setFormData({
      name: agent.name,
      age: agent.age?.toString() || '',
      gender: (agent.gender === 'Boy' ? 'male' : agent.gender === 'Girl' ? 'female' : agent.gender) as Gender,
      language: taglineParts[1] || 'English',
      relation: taglineParts[0] || 'Partner',
      traits: agent.personality.split(', ').filter(t => t.length > 0),
      sliders: { humor: 50, emotion: 50 },
      chatHistory: '',
      commMethods: ['behavioral'],
      behavioralInfo: agent.description || '',
      autonomousPings: true,
      uploadedFiles: [],
      images: [],
      profileImage: agent.avatar,
      behaviorRule: '',
      replySpeed: 'Normal',
      agreed: false
    });
    setActiveMenu(null);
  };

  const COMM_METHODS = [
    { id: 'upload', label: 'UPLOAD FILE', desc: 'TXT, CSV, PDF logs', icon: Upload },
    { id: 'paste', label: 'PASTE TEXT', desc: 'Raw chat history', icon: Copy },
    { id: 'behavioral', label: 'BEHAVIORAL', desc: 'Speech patterns', icon: MessageSquare },
  ];
  return (
    <div className="flex h-full bg-white font-sans overflow-hidden">
      
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[40] lg:hidden"
          />
        )}
      </AnimatePresence>
      
      {/* Left Sidebar */}
      <aside className={cn(
        "w-[300px] border-r border-[#F0F0F0] flex flex-col h-full bg-white shrink-0 z-[45] transition-all duration-500 ease-[0.16, 1, 0.3, 1]",
        "lg:translate-x-0 lg:shadow-none bg-white",
        isSidebarOpen ? "fixed inset-y-0 left-0 translate-x-0 shadow-2xl" : "fixed inset-y-0 left-0 -translate-x-full lg:static lg:flex"
      )}>
        <div className="p-8 pb-6 shrink-0 space-y-6">
           <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-serif font-black text-black tracking-tight uppercase">Personas</h2>
              <div className="text-[9px] font-sans font-black text-black/40 border border-black/5 px-2.5 py-1 rounded-full uppercase tracking-widest bg-[#FAFAFA]">{agents.length} TOTAL</div>
           </div>
           <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#CCCCCC] transition-colors group-focus-within:text-black" strokeWidth={2.5} />
              <input 
                type="text"
                placeholder="Search matrix..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-11 bg-[#FAFAFA] hover:bg-[#F5F5F5] border-none rounded-2xl pl-10 pr-4 text-[13px] font-sans font-medium outline-none transition-all focus:bg-white focus:ring-1 focus:ring-black/5 placeholder:text-[#DDDDDD]"
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-5 space-y-10 pb-10">
           {/* Pinned Section */}
           {agents.filter(a => a.isPinned && !a.isArchived).length > 0 && (
             <div className="space-y-3">
               <div className="flex items-center justify-between px-3 text-[10px] font-black text-[#BBBBBB] uppercase tracking-[0.2em]">
                 <span>Pinned</span>
                 <Pin className="w-3 h-3 opacity-30" />
               </div>
               <div className="space-y-1 sm:space-y-2">
                 <AnimatePresence>
                   {agents.filter(a => a.isPinned && !a.isArchived && a.name.toLowerCase().includes(searchQuery.toLowerCase())).map((agent) => (
                     <PersonaItem 
                      key={agent.id} 
                      agent={agent} 
                      activePersonaId={activePersonaId} 
                      activeMenu={activeMenu}
                      setActivePersonaId={(id) => { setActivePersonaId(id); setIsSidebarOpen(false); }}
                      setActiveMenu={setActiveMenu}
                      handleEdit={(agent) => { handleEdit(agent); setIsSidebarOpen(false); }}
                      onDeleteAgent={onDeleteAgent}
                      onTogglePin={onTogglePin}
                      onToggleArchive={onToggleArchive}
                      formData={formData}
                     />
                    ))}
                 </AnimatePresence>
               </div>
             </div>
           )}

           {/* Active Section */}
           <div className="space-y-3">
             <div className="px-3 text-[10px] font-black text-[#BBBBBB] uppercase tracking-[0.2em]">
               Active
             </div>
             <div className="space-y-1 sm:space-y-2">
               <AnimatePresence>
                 {agents.filter(a => !a.isPinned && !a.isArchived && a.name.toLowerCase().includes(searchQuery.toLowerCase())).map((agent) => (
                   <PersonaItem 
                    key={agent.id} 
                    agent={agent} 
                    activePersonaId={activePersonaId} 
                    activeMenu={activeMenu}
                    setActivePersonaId={(id) => { setActivePersonaId(id); setIsSidebarOpen(false); }}
                    setActiveMenu={setActiveMenu}
                    handleEdit={(agent) => { handleEdit(agent); setIsSidebarOpen(false); }}
                    onDeleteAgent={onDeleteAgent}
                    onTogglePin={onTogglePin}
                    onToggleArchive={onToggleArchive}
                    formData={formData}
                   />
                 ))}
                 {activePersonaId && !agents.find(a => a.id === activePersonaId) && (
                   <PersonaItem 
                    agent={{ id: activePersonaId, name: formData.name || 'Untitled', status: 'SYNTHESIZING', avatar: '' } as any} 
                    activePersonaId={activePersonaId} 
                    activeMenu={activeMenu}
                    setActivePersonaId={(id) => { setActivePersonaId(id); setIsSidebarOpen(false); }}
                    setActiveMenu={setActiveMenu}
                    handleEdit={(agent) => { handleEdit(agent); setIsSidebarOpen(false); }}
                    onDeleteAgent={onDeleteAgent}
                    onTogglePin={onTogglePin}
                    onToggleArchive={onToggleArchive}
                    formData={formData}
                   />
                 )}
               </AnimatePresence>
             </div>
           </div>

           {/* Archived Section */}
           {agents.filter(a => a.isArchived).length > 0 && (
             <div className="space-y-3">
               <div className="px-3 text-[10px] font-black text-[#BBBBBB] uppercase tracking-[0.2em]">
                 Archived
               </div>
               <div className="space-y-1 sm:space-y-2">
                 <AnimatePresence>
                   {agents.filter(a => a.isArchived && a.name.toLowerCase().includes(searchQuery.toLowerCase())).map((agent) => (
                     <PersonaItem 
                      key={agent.id} 
                      agent={agent} 
                      activePersonaId={activePersonaId} 
                      activeMenu={activeMenu}
                      setActivePersonaId={(id) => { setActivePersonaId(id); setIsSidebarOpen(false); }}
                      setActiveMenu={setActiveMenu}
                      handleEdit={(agent) => { handleEdit(agent); setIsSidebarOpen(false); }}
                      onDeleteAgent={onDeleteAgent}
                      onTogglePin={onTogglePin}
                      onToggleArchive={onToggleArchive}
                      formData={formData}
                     />
                   ))}
                 </AnimatePresence>
               </div>
             </div>
           )}
        </div>

        <div className="p-6 shrink-0 border-t border-[#F5F5F7] bg-[#FAFAFA]/50 backdrop-blur-md">
           <Button 
            onClick={() => { resetForm(); setIsSidebarOpen(false); }}
            variant="ghost"
            className="w-full h-11 bg-white border border-[#E5E7EB] text-black rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] transition-all hover:bg-black hover:text-white hover:border-black flex items-center justify-center gap-2 group shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-lg hover:shadow-black/10 active:scale-[0.98]"
           >
             <Plus className="w-3.5 h-3.5 transition-transform group-hover:rotate-90" strokeWidth={3} />
             New Persona
           </Button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
        {/* Header - Mobile Optimized */}
        <header className="h-14 sm:h-20 px-3 sm:px-16 border-b border-[#F0F0F0] flex items-center justify-between bg-white shrink-0 z-20">
           <div className="flex items-center gap-2 sm:gap-10 overflow-hidden">
              <Button 
                variant="ghost" 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden px-2.5 h-9 rounded-xl text-[#111111] hover:bg-[#F7F7F8] active:scale-95 transition-all flex items-center gap-2 group border border-[#F0E7FF] bg-white shadow-sm"
              >
                <Library className="w-4 h-4 text-primary" />
                <span className="text-[9px] font-black uppercase tracking-[0.1em] hidden xs:block">Models</span>
              </Button>
              <h1 className="text-[18px] sm:text-[28px] font-serif font-black tracking-tighter text-black shrink-0">Rekindle.</h1>
              <div className="h-5 sm:h-8 w-px bg-[#F5F5F5] hidden sm:block" />
              <div className="flex items-center gap-2 sm:gap-6 overflow-hidden">
                 {isEditing && (
                    <div className="flex items-center gap-2 shrink-0">
                       <Button 
                         variant="ghost" 
                         onClick={resetForm}
                         className="hidden sm:flex text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-widest text-[#AAAAAA] hover:text-red-500 hover:bg-red-50 px-2 sm:px-4 h-7 sm:h-8 rounded-lg"
                       >
                         Cancel
                       </Button>
                       <Button 
                         onClick={handleSubmit}
                         className="text-[9px] sm:text-[11px] px-2.5 sm:px-5 h-7 sm:h-9 rounded-lg font-sans font-black uppercase tracking-widest bg-black text-white hover:bg-black/90 shadow-lg shadow-black/10 transition-all flex items-center gap-1.5 hover:-translate-y-0.5"
                       >
                         <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                         Update
                       </Button>
                    </div>
                 )}
                 <span className="text-[8px] sm:text-[11px] font-sans font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-[#CCCCCC] truncate max-w-[60px] sm:max-w-none">{STEP_TITLES[currentStep]}</span>
                 <div className="h-0.5 w-8 sm:w-20 bg-[#F5F5F5] rounded-full overflow-hidden shrink-0 hidden min-[400px]:block">
                    <motion.div 
                      className="h-full bg-black shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                      animate={{ width: `${(currentStep / 10) * 100}%` }}
                      transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                    />
                 </div>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end leading-tight mr-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-black">Preview</span>
                <span className="text-[8px] font-medium text-[#AAAAAA]">Auto-save active</span>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#F7F7F8] border border-[#EEEEEE] flex items-center justify-center text-black overflow-hidden hover:scale-105 transition-transform cursor-pointer group">
                  <div className="w-full h-full bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center group-hover:from-purple-100 group-hover:to-pink-100 transition-colors">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  </div>
              </div>
           </div>
        </header>

        {/* Builder Area - Mobile Friendly Padding */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth bg-white">
           <div className="max-w-[1100px] w-full pt-8 sm:pt-12 pb-32 px-6 sm:px-16 relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 30, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-10 sm:space-y-16"
                >
                  
                  {/* Step 1: Identity */}
                  {currentStep === 1 && (
                    <section className="space-y-8 sm:space-y-12 max-w-3xl">
                      <div className="space-y-4 sm:space-y-6">
                        <motion.h2 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-[28px] sm:text-[32px] font-serif font-black tracking-tight text-black"
                        >
                          Identity
                        </motion.h2>
                        <motion.p 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          className="text-[15px] sm:text-[17px] font-sans font-bold text-muted-foreground leading-relaxed italic border-l-4 border-black pl-4 sm:pl-6"
                        >
                          Tell us who this person is.
                        </motion.p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 sm:gap-y-8">
                        <PremiumInput label="NAME" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Persona name" />
                        <PremiumInput label="AGE" type="text" inputMode="numeric" placeholder="Age" value={formData.age} onChange={e => setFormData(p => ({ ...p, age: e.target.value.replace(/\D/g, '') }))} />
                        <CustomDropdown label="GENDER" value={formData.gender} options={['Female', 'Male', 'Non-Binary']} onChange={val => setFormData(p => ({ ...p, gender: val }))} />
                        <CustomDropdown label="LANGUAGE" value={formData.language} options={LANGUAGES} onChange={val => setFormData(p => ({ ...p, language: val }))} />
                      </div>
                    </section>
                  )}

                  {/* Step 2: Relationship */}
                  {currentStep === 2 && (
                    <section className="space-y-8 sm:space-y-10 max-w-3xl">
                      <div className="space-y-4">
                        <h2 className="text-[24px] sm:text-[28px] font-serif font-black tracking-tight text-black uppercase">Relationship</h2>
                        <b className="text-[14px] sm:text-[15px] font-sans text-muted-foreground leading-relaxed block">What is your relation with them?</b>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                        <CustomDropdown label="BOND TYPE" value={formData.relation} options={RELATIONS} onChange={val => setFormData(p => ({ ...p, relation: val }))} />
                        <div className="p-6 sm:p-8 border border-[#F0F0F0] rounded-2xl flex flex-col gap-3 sm:gap-4 bg-[#FAFAFA]">
                           <span className="text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-widest text-[#999999]">Contextual Note</span>
                           <p className="text-[12px] sm:text-[13px] font-sans text-muted-foreground leading-relaxed">This parameter influences the emotional proximity and linguistic familiarity used during synthesis.</p>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Step 3: Communication */}
                  {currentStep === 3 && (
                    <section className="space-y-8 sm:space-y-10 max-w-2xl">
                      <div className="space-y-4">
                        <h2 className="text-[24px] sm:text-[28px] font-serif font-black tracking-tight text-black uppercase">Communication</h2>
                        <b className="text-[14px] sm:text-[16px] font-sans text-black leading-relaxed block tracking-tight">Share patterns to map linguistic DNA.</b>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3 sm:gap-4">
                        {COMM_METHODS.map((method, i) => (
                           <motion.button
                             key={method.id}
                             initial={{ opacity: 0, x: -10 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ delay: i * 0.1 }}
                             type="button"
                             onClick={() => setFormData(p => ({ 
                               ...p, 
                               commMethods: p.commMethods.includes(method.id) ? p.commMethods.filter(id => id !== method.id) : [...p.commMethods, method.id]
                             }))}
                             className={cn(
                               "p-4 sm:p-6 rounded-xl border transition-all flex items-center justify-between text-left group hover:-translate-y-0.5",
                               formData.commMethods.includes(method.id) 
                                ? "bg-black text-white border-black shadow-lg shadow-black/10" 
                                : "bg-white border-[#E5E7EB] hover:border-black/20"
                             )}
                           >
                              <div className="flex items-center gap-4 sm:gap-6">
                                 <div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all", formData.commMethods.includes(method.id) ? "bg-white/20" : "bg-gray-50 group-hover:bg-[#FAFAFA]")}>
                                   <method.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                 </div>
                                 <div className="min-w-0">
                                   <span className="text-[12px] sm:text-[14px] font-sans font-semibold block truncate uppercase tracking-[0.15em]">{method.label}</span>
                                   <span className={cn("text-[10px] sm:text-[12px] font-sans block mt-0.5", formData.commMethods.includes(method.id) ? "text-[#AAAAAA]" : "text-muted-foreground/60")}>{method.desc}</span>
                                 </div>
                              </div>
                              <div className={cn("w-4 h-4 sm:w-5 sm:h-5 rounded-full border flex items-center justify-center transition-all shrink-0", formData.commMethods.includes(method.id) ? "bg-white border-white" : "border-[#E5E7EB] group-hover:border-[#AAAAAA]")}>
                                {formData.commMethods.includes(method.id) && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black" strokeWidth={3} />}
                              </div>
                           </motion.button>
                        ))}
                      </div>

                      <div className="space-y-6 sm:space-y-8 mt-8 sm:mt-12 max-w-2xl">
                         <AnimatePresence>
                           {formData.commMethods.includes('upload') && (
                             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-4">
                                <div 
                                  className={cn(
                                    "w-full h-32 sm:h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 sm:gap-3 transition-all relative overflow-hidden",
                                    isDragging ? "bg-[#FAFAFA] border-black" : "bg-white border-[#F0F0F0] hover:border-[#AAAAAA]"
                                  )}
                                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                  onDragLeave={() => setIsDragging(false)}
                                  onDrop={e => { e.preventDefault(); setIsDragging(false); handleFileUpload(e); }}
                                >
                                   <input type="file" multiple hidden id="file-up" onChange={handleFileUpload} />
                                   <label htmlFor="file-up" className="absolute inset-0 cursor-pointer" />
                                   <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-[#CCCCCC]" />
                                   <p className="text-[12px] text-[#AAAAAA]">Click or drop logs here</p>
                                </div>
                                {formData.uploadedFiles.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                     {formData.uploadedFiles.map((file, i) => (
                                       <div key={i} className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#FAFAFA] border border-[#F0F0F0] rounded-xl">
                                          <span className="text-[10px] sm:text-[11px] font-medium text-black">{file.name}</span>
                                          <button onClick={() => setFormData(p => ({ ...p, uploadedFiles: p.uploadedFiles.filter((_, idx) => idx !== i) }))} className="text-[#CCCCCC] hover:text-red-500"><X className="w-3 h-3" /></button>
                                       </div>
                                     ))}
                                  </div>
                                )}
                             </motion.div>
                           )}

                           {formData.commMethods.includes('paste') && (
                             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-2">
                                <Label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#AAAAAA] ml-1">PASTE INTERACTIONS</Label>
                                <textarea 
                                  value={formData.chatHistory} 
                                  onChange={e => setFormData(p => ({ ...p, chatHistory: e.target.value }))} 
                                  placeholder="Insert message logs..." 
                                  className="w-full h-32 sm:h-40 bg-white border border-[#F0F0F0] rounded-2xl p-4 sm:p-6 font-sans text-[13px] sm:text-[14px] resize-none outline-none focus:border-[#AAAAAA] transition-colors" 
                                />
                             </motion.div>
                           )}

                           {formData.commMethods.includes('behavioral') && (
                             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-2">
                                <Label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#AAAAAA] ml-1">BEHAVIORAL NUANCE</Label>
                                <textarea 
                                  value={formData.behavioralInfo} 
                                  onChange={e => setFormData(p => ({ ...p, behavioralInfo: e.target.value }))} 
                                  placeholder="Describe patterns, slang, or tone..." 
                                  className="w-full h-32 sm:h-40 bg-white border border-[#F0F0F0] rounded-2xl p-4 sm:p-6 font-sans text-[13px] sm:text-[14px] resize-none outline-none focus:border-[#AAAAAA] transition-colors" 
                                />
                             </motion.div>
                           )}
                         </AnimatePresence>
                      </div>
                    </section>
                  )}

                  {/* Step 4: Visual Evidence */}
                  {currentStep === 4 && (
                    <section className="space-y-8 sm:space-y-10 max-w-3xl">
                      <div className="space-y-3 sm:space-y-4">
                        <h2 className="text-[24px] sm:text-[28px] font-serif font-black tracking-tight text-black uppercase">Visuals</h2>
                        <b className="text-[14px] sm:text-[15px] font-sans text-muted-foreground leading-relaxed block">Upload some photos if you have any.</b>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                        {formData.images.map((img, i) => (
                           <motion.div 
                             key={i} 
                             initial={{ opacity: 0, scale: 0.9 }}
                             animate={{ opacity: 1, scale: 1 }}
                             transition={{ delay: i * 0.05 }}
                             className="relative aspect-square rounded-2xl overflow-hidden group border border-[#F0F0F0] shadow-sm"
                           >
                              <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                              <button onClick={() => removeImage(i)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                           </motion.div>
                        ))}
                        <label className="aspect-square rounded-2xl border border-dashed border-[#E5E7EB] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#FAFAFA] hover:border-black/20 transition-all group">
                           <Plus className="w-5 h-5 text-[#CCCCCC] group-hover:rotate-90 transition-transform" />
                           <span className="text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-widest text-[#AAAAAA]">Attach</span>
                           <input type="file" multiple hidden onChange={handleImageUpload} accept="image/*" />
                        </label>
                      </div>
                    </section>
                  )}

                  {/* Step 5: Profile Identity */}
                  {currentStep === 5 && (
                    <section className="space-y-8 sm:space-y-10 max-w-3xl">
                      <div className="space-y-3 sm:space-y-4">
                        <h2 className="text-[24px] sm:text-[28px] font-serif font-black tracking-tight text-black uppercase">Avatar</h2>
                        <b className="text-[14px] sm:text-[15px] font-sans text-muted-foreground leading-relaxed block">Pick a profile photo for the persona.</b>
                      </div>
                      <div className="flex flex-col items-center sm:items-start gap-8 sm:gap-10">
                         <div className="relative group w-40 h-40 sm:w-48 sm:h-48">
                            <div className="w-full h-full rounded-2xl overflow-hidden border border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-center relative shadow-sm group-hover:shadow-md transition-shadow">
                               {formData.profileImage ? (
                                  <img src={formData.profileImage} className="w-full h-full object-cover" />
                               ) : (
                                  <UserPlus className="w-8 h-8 text-[#DDDDDD]" />
                               )}
                            </div>
                            <label className="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-[2px]">
                               <Camera className="w-6 h-6 text-white mb-2" />
                               <span className="text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-widest text-white">Upload</span>
                               <input type="file" hidden onChange={handleProfileImageUpload} accept="image/*" />
                            </label>
                         </div>
                         <div className="max-w-xs space-y-2 text-center sm:text-left">
                           <p className="text-[12px] sm:text-[13px] font-sans text-muted-foreground leading-relaxed italic">Select a high-resolution image that aligns with the persona's vibe.</p>
                         </div>
                      </div>
                    </section>
                  )}

                  {/* Step 6: Personality Traits */}
                  {currentStep === 6 && (
                    <section className="space-y-8 sm:space-y-10 max-w-3xl">
                      <div className="space-y-3 sm:space-y-4">
                        <h2 className="text-[24px] sm:text-[28px] font-serif font-black tracking-tight text-black uppercase">Personality</h2>
                        <b className="text-[14px] sm:text-[16px] font-sans text-black leading-relaxed block">Select how they behave and think.</b>
                      </div>
                      <div className="space-y-8 sm:space-y-12">
                         <div className="flex flex-wrap gap-2 sm:gap-2.5">
                            {TRAITS.map(t => (
                              <button
                                key={t}
                                onClick={() => toggleTrait(t)}
                                className={cn(
                                  "px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-widest border transition-all",
                                  formData.traits.includes(t) 
                                    ? "bg-black text-white border-black shadow-md shadow-black/5" 
                                    : "bg-white text-[#AAAAAA] border-[#E5E7EB] hover:text-black hover:border-black/20"
                                )}
                              >
                                {t}
                              </button>
                            ))}
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 sm:gap-y-10 bg-[#FAFAFA] border border-[#F0F0F0] p-6 sm:p-8 rounded-2xl shadow-sm">
                            {[
                               { id: 'humor', label: 'Humor Density' },
                               { id: 'emotion', label: 'Resonance Depth' },
                            ].map(slider => (
                              <div key={slider.id} className="space-y-4 sm:space-y-6">
                                 <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-[#999999]">
                                    <span>{slider.label}</span>
                                    <span className="text-black font-semibold">{formData.sliders[slider.id as keyof typeof formData.sliders]}%</span>
                                 </div>
                                 <div className="relative h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-visible">
                                     <motion.div className="h-full bg-black rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]" animate={{ width: `${formData.sliders[slider.id as keyof typeof formData.sliders]}%` }} />
                                     <input type="range" min="0" max="100" value={formData.sliders[slider.id as keyof typeof formData.sliders]} onChange={e => setFormData(p => ({ ...p, sliders: { ...p.sliders, [slider.id]: parseInt(e.target.value) } }))} className="absolute inset-0 opacity-0 cursor-pointer h-full w-full" />
                                     <div 
                                       className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white border-2 border-black rounded-full shadow-md pointer-events-none transition-transform group-active:scale-110" 
                                       style={{ left: `calc(${formData.sliders[slider.id as keyof typeof formData.sliders]}% - 7px)` }}
                                     />
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>
                    </section>
                  )}

                  {/* Step 7: Advanced Mapping */}
                  {currentStep === 7 && (
                    <section className="space-y-8 sm:space-y-10 max-w-3xl">
                       <div className="space-y-3 sm:space-y-4">
                        <h2 className="text-[24px] sm:text-[28px] font-serif font-bold tracking-tight text-black uppercase">Advanced Mapping</h2>
                        <p className="text-[14px] sm:text-[15px] font-sans font-semibold text-muted-foreground leading-relaxed">Set some special rules and reply speed.</p>
                      </div>
                      <div className="space-y-8 sm:space-y-12">
                        <div className="space-y-3 sm:space-y-4">
                           <Label className="text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-[#AAAAAA] ml-1">DIRECTIVE INTERFACE</Label>
                           <textarea 
                             value={formData.behaviorRule} 
                             onChange={e => setFormData(p => ({ ...p, behaviorRule: e.target.value }))} 
                             placeholder="Ex: Never use emojis, keep replies concise and analytical..." 
                             className="w-full h-32 sm:h-40 bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-6 font-sans text-[13px] sm:text-[14px] font-medium text-black resize-none outline-none focus:border-black transition-colors placeholder:text-[#BBBBBB]" 
                           />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-start">
                          <CustomDropdown label="TEMPORAL CADENCE" value={formData.replySpeed} options={REPLY_SPEEDS} onChange={val => setFormData(p => ({ ...p, replySpeed: val }))} />
                           <div className="space-y-3 sm:space-y-4">
                              <Label className="text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-[#AAAAAA] ml-1">AUTONOMY NODE</Label>
                              <div className="flex items-center justify-between p-4 sm:p-6 bg-[#FAFAFA] rounded-2xl border border-[#F0F0F0]">
                                 <div className="space-y-0.5">
                                    <span className="text-[13px] sm:text-[14px] font-sans font-semibold block">Autonomous Pings</span>
                                    <p className="text-[11px] sm:text-[12px] font-sans text-muted-foreground">Allow persona to initiate interactions.</p>
                                 </div>
                                 <Switch 
                                   className="data-[state=checked]:bg-black scale-90 sm:scale-100" 
                                   checked={formData.autonomousPings}
                                   onCheckedChange={(val) => setFormData(p => ({ ...p, autonomousPings: val }))}
                                  />
                              </div>
                           </div>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Step 8: Final Review */}
                  {currentStep === 8 && (
                    <section className="space-y-8 sm:space-y-10 max-w-3xl">
                       <div className="space-y-3 sm:space-y-4">
                        <h2 className="text-[24px] sm:text-[28px] font-serif font-bold tracking-tight text-black uppercase">Review</h2>
                        <p className="text-[14px] sm:text-[15px] font-sans font-semibold text-muted-foreground leading-relaxed">Check everything before we start.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 sm:gap-y-10">
                         {[
                           { label: 'Identity', value: `${formData.name}, ${formData.age}, ${formData.gender}` },
                           { label: 'Bond', value: formData.relation },
                           { label: 'Language', value: formData.language },
                           { label: 'Traits', value: formData.traits.join(', ') || 'Default' },
                           { label: 'Synthesis', value: `${formData.commMethods.length} Sources` },
                           { label: 'Cadence', value: `${formData.replySpeed}` },
                         ].map((item, i) => (
                           <div key={i} className="space-y-1.5 sm:space-y-2 border-b border-[#F5F5F5] pb-4 sm:pb-6">
                              <p className="text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-widest text-[#CCCCCC]">{item.label}</p>
                              <p className="text-[14px] sm:text-[16px] font-sans font-semibold text-black truncate">{item.value}</p>
                           </div>
                         ))}
                      </div>
                    </section>
                  )}
                   {/* Step 9: Manifestation */}
                   {currentStep === 9 && (
                     <section className="space-y-8 sm:space-y-12 py-4 sm:py-10 w-full animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <div className="space-y-4 sm:space-y-6">
                           <h2 className="text-[28px] sm:text-[32px] font-serif font-black tracking-tight text-black uppercase">Manifestation</h2>
                           <b className="text-[14px] sm:text-[16px] font-sans text-black leading-relaxed italic block">Please read and agree to these rules before we begin.</b>
                        </div>
 
                       <div className="space-y-8 sm:space-y-10 w-full max-w-none">
                          <div className="p-6 sm:p-12 bg-black text-white rounded-[32px] sm:rounded-[48px] text-[14px] sm:text-[16px] font-sans font-medium leading-relaxed space-y-6 sm:space-y-8 max-h-[400px] sm:max-h-[550px] overflow-y-auto no-scrollbar scroll-smooth shadow-2xl">
                            <p>1. This AI persona is a digital approximation derived from historical interaction data and behavioral modeling.</p>
                            <p>2. You confirm that you have the ethical right or explicit permission to recreate this specific identity matrix.</p>
                            <p>3. The manifestation is intended for therapeutic, nostalgic, or creative use and must not be used for malicious impersonation.</p>
                            <p>4. Emotional boundary acknowledgment: This simulation does not possess real consciousness or persistent physical existence.</p>
                            <p>5. Data usage: All provided logs are processed locally for synthesis and handled according to privacy protocols.</p>
                            <p>6. You agree to hold the platform harmless from any emotional impact or dependency resulting from the simulation.</p>
                          </div>
 
                          <div className="space-y-6">
                              <div 
                                className="flex items-center gap-4 sm:gap-5 cursor-pointer group"
                                onClick={() => setFormData(p => ({ ...p, agreed: !p.agreed }))}
                              >
                                 <div className={cn(
                                   "w-6 h-6 rounded-lg border transition-all flex items-center justify-center shrink-0",
                                   formData.agreed ? "bg-black border-black" : "border-[#E5E7EB] group-hover:border-[#AAAAAA]"
                                 )}>
                                    {formData.agreed && <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" strokeWidth={4} />}
                                 </div>
                                 <span className={cn("text-[11px] sm:text-[13px] font-sans font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-colors leading-tight", formData.agreed ? "text-black" : "text-[#CCCCCC]")}>I confirm ethical synthesis, data permissions and simulation nature</span>
                              </div>
                          </div>
 
                          <Button 
                            className="w-full h-14 sm:h-16 bg-black text-white rounded-2xl font-sans font-bold uppercase text-[11px] sm:text-[12px] tracking-[0.2em] sm:tracking-[0.3em] transition-all hover:bg-black/90 active:scale-[0.98] disabled:opacity-20 mt-4 sm:mt-8 shadow-xl shadow-black/10"
                            onClick={handleSubmit}
                            disabled={!formData.agreed || isLoading}
                          >
                            {isLoading ? 'Synthesizing...' : 'Initialize Synthesis'}
                          </Button>
 
                          {isLoading && (
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex items-center justify-center gap-3"
                            >
                               <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-black animate-bounce [animation-delay:-0.3s]" />
                               <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-black animate-bounce [animation-delay:-0.15s]" />
                               <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-black animate-bounce" />
                            </motion.div>
                          )}
                       </div>
                    </section>
                  )}
                  {/* Step 10: Synthesis Complete */}
                  {currentStep === 10 && (
                    <section className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] py-10 sm:py-20 w-full animate-in fade-in zoom-in duration-700">
                       <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-full max-w-md bg-white border border-[#F0F0F0] rounded-[32px] sm:rounded-[40px] p-8 sm:p-12 flex flex-col items-center text-center space-y-8 sm:space-y-10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] relative overflow-hidden"
                       >
                          <div className="absolute top-0 left-0 w-full h-1.5 sm:h-2 bg-black" />
                          
                          <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', damping: 12, delay: 0.3 }}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-[24px] sm:rounded-[28px] bg-black flex items-center justify-center relative shadow-xl shadow-black/20"
                          >
                             <Check className="w-6 h-6 sm:w-8 sm:h-8 text-white" strokeWidth={4} />
                          </motion.div>

                          <div className="space-y-3 sm:space-y-4">
                             <h2 className="text-[28px] sm:text-[36px] font-serif font-black tracking-tight text-black">Manifested.</h2>
                             <b className="text-[15px] sm:text-[18px] font-sans text-muted-foreground leading-relaxed block px-2 sm:px-4">
                                The persona <span className="text-black underline decoration-black/20 underline-offset-8">{formData.name}</span> is ready for interaction.
                             </b>
                          </div>

                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="w-full pt-2 sm:pt-4"
                          >
                            <Button 
                              onClick={() => generatedAgent && onAddAgent(generatedAgent)}
                              className="w-full h-14 sm:h-16 bg-black text-white hover:bg-black/90 rounded-2xl font-sans font-bold uppercase text-[11px] sm:text-[12px] tracking-[0.3em] sm:tracking-[0.4em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-black/20"
                            >
                               Launch Persona
                            </Button>
                          </motion.div>
                       </motion.div>
                    </section>
                  )}
                </motion.div>
              </AnimatePresence>
           </div>
        </div>

        {/* Action Bar - Mobile Optimized */}
        <footer className="h-20 sm:h-24 px-6 sm:px-16 border-t border-[#F5F5F5] flex items-center justify-between bg-white z-20 shrink-0">
           <Button 
            onClick={prevStep} 
            disabled={currentStep === 1 || currentStep === 10 || isLoading} 
            variant="ghost" 
            className="h-10 sm:h-12 rounded-xl px-4 sm:px-10 text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-[0.2em] text-[#AAAAAA] hover:text-black hover:bg-[#FAFAFA] transition-all"
           >
              Back
           </Button>
           
           <div className="flex-1 flex justify-center sm:justify-start sm:pl-12 sm:pr-12">
              <div className="flex gap-1.5 sm:gap-2">
                 {Array.from({ length: 10 }).map((_, i) => (
                   <div 
                    key={i} 
                    className={cn(
                      "h-1 rounded-full transition-all duration-700",
                      currentStep === i + 1 ? "bg-black w-6 sm:w-10 shadow-[0_0_8px_rgba(0,0,0,0.1)]" : i + 1 < currentStep ? "bg-black/10 w-2 sm:w-4" : "bg-[#F0F0F0] w-2 sm:w-4"
                    )} 
                   />
                 ))}
              </div>
           </div>

           <Button 
            onClick={nextStep} 
            disabled={!isStepValid(currentStep) || currentStep >= 9 || isLoading} 
            className={cn(
              "h-10 sm:h-12 bg-black text-white rounded-xl px-6 sm:px-12 text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] transition-all hover:bg-black/90 active:scale-95 shadow-xl shadow-black/10 disabled:opacity-20",
              (currentStep >= 9 || !isStepValid(currentStep)) && "opacity-20"
            )}
           >
              {currentStep === 9 ? 'Initialize' : 'Continue'}
           </Button>
        </footer>
      </main>
    </div>
  );
}
