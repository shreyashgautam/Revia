import { ReactNode } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Activity, 
  User, 
  Settings, 
  PlusCircle, 
  History as HistoryIcon,
  LogOut,
  Coins,
  ChevronRight,
  LayoutGrid,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { User as UserType } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'motion/react';

interface ShellProps {
  children: ReactNode;
  currentPage: string;
  currentUser: UserType | null;
  onNavigate: (page: any) => void;
  onLogout: () => void;
}

export default function Shell({ children, currentPage, currentUser, onNavigate, onLogout }: ShellProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'DASHBOARD' },
    { id: 'chat', icon: MessageSquare, label: 'CHATS' },
    { id: 'spaces', icon: LayoutGrid, label: 'SPACES' },
    { id: 'create-agent', icon: PlusCircle, label: 'REKINDLE' },
  ];

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setIsMenuOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#FAFAFE] font-sans text-foreground overflow-hidden">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#F0E7FF] px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-12">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => onNavigate('dashboard')}
          >
            <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tighter italic text-black group-hover:text-accent transition-all duration-300 group-hover:scale-110">
              Revia.
            </h1>
          </div>

          <nav className="hidden lg:flex items-center gap-8">
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={cn(
                  "text-[10px] font-black tracking-[0.2em] transition-all duration-500 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-accent hover:to-cyan-400 relative py-2 scale-100 hover:scale-110 active:scale-95 cursor-pointer",
                  currentPage === item.id ? "text-primary" : "text-muted-foreground"
                )}
                onClick={() => handleNavigate(item.id)}
              >
                {item.label}
                {currentPage === item.id && (
                  <motion.div 
                    layoutId="nav-underline" 
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {currentUser && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-[#F7F7F8] border border-[#EEEEEE] text-primary transition-all duration-300 hover:bg-white hover:shadow-lg active:scale-90"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-3">
                <div 
                  className="hidden sm:flex flex-col items-end leading-none cursor-pointer group/user"
                  onClick={() => handleNavigate('profile')}
                >
                  <span className="text-xs font-black italic text-primary group-hover/user:text-accent transition-colors">{currentUser.name}</span>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">@{currentUser.username}</span>
                </div>
                <div 
                  className="w-10 h-10 rounded-xl border border-[#F0E7FF] overflow-hidden shadow-sm hover:scale-105 hover:ring-2 hover:ring-accent transition-all cursor-pointer"
                  onClick={() => handleNavigate('profile')}
                >
                  <img src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.name}&background=EC4899&color=fff`} className="w-full h-full object-cover" />
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hidden sm:flex text-muted-foreground hover:text-red-500 rounded-xl"
                  onClick={onLogout}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-[72px] left-4 right-4 lg:hidden bg-white/95 backdrop-blur-3xl rounded-[28px] border border-[#F0E7FF] shadow-2xl shadow-black/10 overflow-hidden z-[100]"
            >
              <div className="p-4 space-y-1.5">
                {menuItems.map((item, idx) => (
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 + 0.1, duration: 0.5 }}
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-300 group",
                      currentPage === item.id 
                        ? "bg-black text-white shadow-lg shadow-black/10" 
                        : "hover:bg-[#F7F7F8] text-[#666666] hover:text-black"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-9 h-9 rounded-[14px] flex items-center justify-center transition-all duration-300",
                        currentPage === item.id ? "bg-white/10" : "bg-[#FAFAFA] shadow-sm border border-[#EEEEEE] group-hover:scale-110"
                      )}>
                        <item.icon className={cn("w-4.5 h-4.5", currentPage === item.id ? "text-white" : "text-primary")} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em]">{item.label}</span>
                    </div>
                    <ChevronRight className={cn(
                      "w-3.5 h-3.5 transition-transform duration-300",
                      currentPage === item.id ? "translate-x-0" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                    )} />
                  </motion.button>
                ))}
                
                <Separator className="my-3 bg-[#F0E7FF]/50" />
                
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl text-red-500 hover:bg-red-50 transition-all duration-300"
                >
                  <div className="w-9 h-9 rounded-[14px] bg-white shadow-sm border border-red-50 flex items-center justify-center">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em]">LOGOUT SESSION</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden bg-[#FAFAFE] relative">
        {children}
      </main>
    </div>
  );
}
