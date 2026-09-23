import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { confirmPasswordReset, requestPasswordReset } from '@/src/services/authService';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onNavigateToRegister: () => void;
}

export default function Login({ onLogin, onNavigateToRegister }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [hasSentOtp, setHasSentOtp] = useState(false);
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);

  const forgotPasswordChecks = {
    minLength: forgotNewPassword.length >= 8,
    uppercase: /[A-Z]/.test(forgotNewPassword),
    lowercase: /[a-z]/.test(forgotNewPassword),
    number: /\d/.test(forgotNewPassword),
  };

  const isForgotPasswordValid = Object.values(forgotPasswordChecks).every(Boolean);

  const getFriendlyPasswordError = (message: string) => {
    if (message.toLowerCase().includes('password does not meet cognito policy requirements')) {
      return 'Password must be at least 8 characters and include 1 uppercase letter, 1 lowercase letter, and 1 number.';
    }

    return message;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 1;
      });
    }, 20);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordRequest = async () => {
    setForgotError('');
    setForgotSuccess('');
    setIsForgotSubmitting(true);

    try {
      await requestPasswordReset(forgotEmail || email);
      setHasSentOtp(true);
      setForgotSuccess('OTP sent to your email.');
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  const handleForgotPasswordConfirm = async () => {
    setForgotError('');
    setForgotSuccess('');

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match');
      return;
    }

    if (!isForgotPasswordValid) {
      setForgotError('Password must be at least 8 characters and include 1 uppercase letter, 1 lowercase letter, and 1 number.');
      return;
    }

    setIsForgotSubmitting(true);

    try {
      await confirmPasswordReset(forgotEmail || email, forgotOtp, forgotNewPassword);
      setForgotSuccess('Password reset successful. You can log in now.');
      setTimeout(() => {
        setIsForgotPasswordOpen(false);
        setHasSentOtp(false);
        setForgotOtp('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
        setForgotError('');
      }, 1200);
    } catch (err) {
      setForgotError(
        err instanceof Error
          ? getFriendlyPasswordError(err.message)
          : 'Failed to reset password'
      );
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] font-sans selection:bg-white selection:text-black antialiased">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black px-6"
          >
            {/* Grid Background in Loader */}
            <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
            
            <div className="max-w-xl w-full text-center space-y-8 relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-white/80"
              >
                <span className="text-xs font-black uppercase tracking-[0.35em]">Revia</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-2xl md:text-3xl font-light tracking-tight text-white/90"
              >
                Talk to Someone Who <span className="text-neutral-500">Understands</span> You
              </motion.h2>
              
              <div className="w-full max-w-xs mx-auto h-[1px] bg-white/10 relative overflow-hidden">
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-[#8B5CF6]"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="min-h-screen flex flex-col lg:flex-row bg-[#08090E] relative overflow-hidden text-white selection:bg-[#FF2E93] selection:text-white"
          >
            {/* Ambient Aurora Glow Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-gradient-to-br from-[#FF2E93]/20 via-[#A855F7]/15 to-transparent rounded-full blur-[140px] animate-pulse" />
              <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#06B6D4]/15 via-[#6366F1]/15 to-transparent rounded-full blur-[140px]" />
              <div className="absolute -bottom-32 left-1/4 w-[700px] h-[500px] bg-gradient-to-t from-[#FF2E93]/10 via-[#8B5CF6]/10 to-transparent rounded-full blur-[160px]" />
              <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:4rem_4rem]" />
            </div>

            {/* LEFT SIDE: Visual Showcase & Brand Narrative */}
            <section className="relative w-full lg:w-[54%] min-h-[50vh] lg:min-h-screen flex flex-col justify-between p-8 sm:p-12 lg:p-16 z-10">
              {/* Brand Header */}
              <div className="flex items-center justify-between">
                <motion.div
                  initial={{ opacity: 0, y: -15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 backdrop-blur-xl shadow-[0_0_20px_rgba(255,46,147,0.15)]"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF2E93] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF2E93]"></span>
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-[0.28em] text-white/90">
                    Revia · Synthetic Consciousness
                  </span>
                </motion.div>
                
                <span className="hidden sm:inline-block text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                  v2.4 Live
                </span>
              </div>

              {/* Center Hero Narrative & Floating Chat Simulation */}
              <div className="my-auto py-10 space-y-8 max-w-xl">
                <div className="space-y-4">
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="text-4xl sm:text-5xl lg:text-6xl font-serif font-black italic tracking-tighter leading-[1.08] text-white"
                  >
                    Not an assistant. <br />
                    <span className="premium-text-gradient not-italic font-sans font-black tracking-tight">
                      Someone texting back.
                    </span>
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-slate-400 text-sm sm:text-base lg:text-lg leading-relaxed font-medium"
                  >
                    Experience emotionally intelligent companions with human texting rhythms — realistic reply delays, late-night bursts, dynamic moods, and persistent memories.
                  </motion.p>
                </div>

                {/* Floating Realistic Chat Teaser Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#FF2E93]/50 to-transparent" />
                  
                  {/* Persona Mini Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF2E93] to-[#8B5CF6] p-[1.5px]">
                        <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center text-xs font-black text-white overflow-hidden">
                          <img 
                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" 
                            alt="Zara" 
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as any).style.display = 'none'; }}
                          />
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#08090E]" />
                      </div>
                      <div>
                        <div className="text-xs font-black tracking-wide text-white flex items-center gap-2">
                          Zara
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-[#FF2E93]/20 text-[#FF2E93]">Intuitive</span>
                        </div>
                        <div className="text-[10px] text-emerald-400/80 font-medium">active just now</div>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                      01:42 AM
                    </span>
                  </div>

                  {/* Messages Flow */}
                  <div className="pt-4 space-y-3">
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      className="flex flex-col items-start gap-1"
                    >
                      <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-2.5 bg-white/[0.08] text-white text-xs sm:text-sm leading-relaxed border border-white/5">
                        heyy... were you sleeping? 🌙
                      </div>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 }}
                      className="flex flex-col items-start gap-1"
                    >
                      <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-2.5 bg-gradient-to-r from-[#FF2E93]/20 to-[#8B5CF6]/15 text-white text-xs sm:text-sm leading-relaxed border border-[#FF2E93]/30 shadow-[0_4px_20px_rgba(255,46,147,0.12)]">
                        was just thinking about what you told me earlier... promise me you won't overwork yourself tonight 🤍
                      </div>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.3 }}
                      className="flex justify-end"
                    >
                      <div className="max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-white text-black font-medium text-xs sm:text-sm shadow-md">
                        thank you, that genuinely means so much.
                      </div>
                    </motion.div>

                    {/* Typing Indicator */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.7 }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/[0.06] border border-white/5 w-fit"
                    >
                      <span className="text-[10px] text-slate-400 font-medium mr-1">Zara is typing</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF2E93] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Feature Badges */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {[
                    '✧ Organic Pacing',
                    '✧ Contextual Memory',
                    '✧ Multi-Message Bursts',
                    '✧ Late-Night Frequency'
                  ].map((feature, idx) => (
                    <span 
                      key={idx}
                      className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-slate-300 backdrop-blur-md hover:border-[#FF2E93]/40 transition-colors"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer Quote */}
              <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
                © 2026 Revia Intelligence Platform · Designed for genuine emotional connection.
              </div>
            </section>

            {/* RIGHT SIDE: High-Tech Glass Authentication Card */}
            <section className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-16 z-10">
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-full max-w-md rounded-[2.5rem] border border-white/10 bg-white/[0.03] backdrop-blur-3xl p-8 sm:p-10 shadow-[0_20px_70px_rgba(0,0,0,0.7)] relative overflow-hidden"
              >
                {/* Top Border Glow Highlight */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF2E93] to-transparent opacity-80" />

                <div className="space-y-8">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FF2E93]">
                      Welcome Back
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black italic tracking-tight text-white font-serif">
                      Resume Transmission
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm font-medium">
                      Enter your credentials to reconnect with your companions.
                    </p>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-300">
                          Email Address
                        </Label>
                        <Input 
                          id="email" 
                          type="email" 
                          autoComplete="email"
                          autoCapitalize="none"
                          autoCorrect="off"
                          placeholder="name@example.com" 
                          className="h-13 rounded-2xl bg-white/[0.05] border-white/10 px-4 text-sm text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-[#FF2E93] focus:border-[#FF2E93] transition-all"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password" className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-300">
                            Password
                          </Label>
                          <button
                            type="button"
                            className="text-[10px] uppercase tracking-wider text-[#FF2E93] hover:text-white transition-colors font-bold"
                            onClick={() => {
                              setForgotEmail(email);
                              setIsForgotPasswordOpen(true);
                            }}
                          >
                            Forgot?
                          </button>
                        </div>
                        <div className="relative">
                          <Input 
                            id="password" 
                            type={showPassword ? "text" : "password"} 
                            autoComplete="current-password"
                            placeholder="••••••••••••"
                            className="h-13 rounded-2xl bg-white/[0.05] border-white/10 px-4 pr-12 text-sm text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-[#FF2E93] focus:border-[#FF2E93] transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                          >
                            {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400 font-medium leading-relaxed"
                      >
                        {error}
                      </motion.div>
                    )}
                    
                    <div className="space-y-5 pt-2">
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="group w-full h-13 rounded-2xl bg-gradient-to-r from-[#FF2E93] via-[#D9267B] to-[#8B5CF6] hover:brightness-110 text-white font-extrabold text-xs uppercase tracking-[0.2em] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_30px_rgba(255,46,147,0.35)] relative overflow-hidden cursor-pointer"
                      >
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                        {isSubmitting ? (
                          <div className="flex items-center gap-3">
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span className="tracking-widest uppercase text-[10px]">Connecting...</span>
                          </div>
                        ) : (
                          "Enter Revia"
                        )}
                      </Button>
                      
                      <div className="text-[12px] text-center font-medium text-slate-400">
                        <span>New to Revia? </span>
                        <button 
                          type="button"
                          onClick={onNavigateToRegister}
                          className="text-white font-bold hover:text-[#FF2E93] transition-colors underline underline-offset-4 ml-1 cursor-pointer"
                        >
                          Create an account
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </motion.div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="max-w-md rounded-[28px] border border-white/10 bg-[#111111] p-0 text-white shadow-2xl">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-xl font-semibold text-white">Reset Password</DialogTitle>
            <DialogDescription className="text-sm text-neutral-400">
              Get an OTP on email and reset your password securely.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 pt-2 space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Email</Label>
              <Input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-neutral-600"
                placeholder="name@example.com"
              />
            </div>

            {!hasSentOtp ? (
              <Button
                type="button"
                onClick={handleForgotPasswordRequest}
                disabled={isForgotSubmitting}
                className="w-full h-12 rounded-2xl bg-white text-black hover:bg-neutral-200 font-bold"
              >
                {isForgotSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send OTP'}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">OTP</Label>
                  <Input
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-neutral-600"
                    placeholder="Enter OTP"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">New Password</Label>
                  <Input
                    type="password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-neutral-600"
                    placeholder="New password"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Confirm Password</Label>
                  <Input
                    type="password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-neutral-600"
                    placeholder="Confirm password"
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-2">
                    Password Requirements
                  </p>
                  <div className="space-y-1 text-[11px] font-medium">
                    <p className={forgotPasswordChecks.minLength ? 'text-emerald-400' : 'text-neutral-500'}>
                      At least 8 characters
                    </p>
                    <p className={forgotPasswordChecks.uppercase ? 'text-emerald-400' : 'text-neutral-500'}>
                      At least 1 uppercase letter
                    </p>
                    <p className={forgotPasswordChecks.lowercase ? 'text-emerald-400' : 'text-neutral-500'}>
                      At least 1 lowercase letter
                    </p>
                    <p className={forgotPasswordChecks.number ? 'text-emerald-400' : 'text-neutral-500'}>
                      At least 1 number
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleForgotPasswordRequest}
                    disabled={isForgotSubmitting}
                    className="flex-1 h-12 rounded-2xl border-white/10 bg-transparent text-white hover:bg-white/5"
                  >
                    Resend OTP
                  </Button>
                  <Button
                    type="button"
                    onClick={handleForgotPasswordConfirm}
                    disabled={isForgotSubmitting}
                    className="flex-1 h-12 rounded-2xl bg-white text-black hover:bg-neutral-200 font-bold"
                  >
                    {isForgotSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Password'}
                  </Button>
                </div>
              </div>
            )}

            {forgotError && <p className="text-sm text-red-400 font-medium">{forgotError}</p>}
            {forgotSuccess && <p className="text-sm text-emerald-400 font-medium">{forgotSuccess}</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
