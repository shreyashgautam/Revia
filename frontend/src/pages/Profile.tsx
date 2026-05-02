import React, { useEffect, useState } from 'react';
import { User } from '@/src/types';
import {
  changePassword,
  confirmDeleteAccount,
  requestDeleteAccountOtp,
  updateProfile,
} from '@/src/services/authService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  Crown, 
  Camera, 
  MapPin, 
  CheckCircle2, 
  BadgeCheck, 
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface ProfileProps {
  user: User;
  onUpdate: (user: User) => void;
  onLogout: () => void;
}

export default function Profile({ user, onUpdate, onLogout }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [deleteOtpSent, setDeleteOtpSent] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user.name,
    username: user.username,
    email: user.email,
    gender: user.gender,
    age: String(user.age),
    bio: user.bio || 'Digital explorer passionate about technology and meaningful conversations.',
    avatar: user.avatar
  });

  useEffect(() => {
      setFormData({
        name: user.name,
        username: user.username,
        email: user.email,
        gender: user.gender,
        age: String(user.age),
        bio: user.bio || 'Digital explorer passionate about technology and meaningful conversations.',
        avatar: user.avatar,
      });
  }, [user]);

  const changePasswordChecks = {
    minLength: changePasswordData.newPassword.length >= 8,
    uppercase: /[A-Z]/.test(changePasswordData.newPassword),
    lowercase: /[a-z]/.test(changePasswordData.newPassword),
    number: /\d/.test(changePasswordData.newPassword),
  };

  const isChangePasswordValid = Object.values(changePasswordChecks).every(Boolean);

  const getFriendlyPasswordError = (message: string) => {
    if (message.toLowerCase().includes('password does not meet cognito policy requirements')) {
      return 'Password must be at least 8 characters and include 1 uppercase letter, 1 lowercase letter, and 1 number.';
    }

    return message;
  };

  const handleSave = async () => {
    setIsLoading(true);
    setProfileError('');
    try {
      const response = await updateProfile({
        name: formData.name,
        username: formData.username.replace('@', ''),
        gender: String(formData.gender).toLowerCase(),
        age: Number(formData.age),
        bio: formData.bio,
        avatar: formData.avatar,
      });

      onUpdate({
        ...user,
        userId: response.user.userId,
        name: response.user.name,
        username: response.user.username,
        email: response.user.email,
        gender: response.user.gender as any,
        age: Number(response.user.age),
        avatar: response.user.avatar,
        bio: response.user.bio,
        createdAt: response.user.createdAt,
      });
      setIsLoading(false);
      setIsEditing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Profile update failed', error);
      setProfileError(error instanceof Error ? error.message : 'Failed to update profile');
      setIsLoading(false);
    }
  };

  const handleAvatarChange = () => {
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`;
    setFormData(prev => ({ ...prev, avatar: newAvatar }));
  };

  const handleChangePassword = async () => {
    setChangePasswordError('');
    setChangePasswordSuccess('');

    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      setChangePasswordError('Passwords do not match');
      return;
    }

    if (!isChangePasswordValid) {
      setChangePasswordError('Password must be at least 8 characters and include 1 uppercase letter, 1 lowercase letter, and 1 number.');
      return;
    }

    setIsChangingPassword(true);

    try {
      await changePassword(
        changePasswordData.currentPassword,
        changePasswordData.newPassword
      );
      setChangePasswordSuccess('Password changed successfully.');
      setChangePasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setChangePasswordError(
        error instanceof Error
          ? getFriendlyPasswordError(error.message)
          : 'Failed to change password'
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRequestDeleteOtp = async () => {
    setDeleteError('');
    setDeleteSuccess('');
    setIsDeletingAccount(true);

    try {
      await requestDeleteAccountOtp();
      setDeleteOtpSent(true);
      setDeleteSuccess('OTP sent to your email.');
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to send OTP');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    setDeleteError('');
    setDeleteSuccess('');
    setIsDeletingAccount(true);

    try {
      await confirmDeleteAccount(deleteOtp);
      setDeleteSuccess('Account deleted successfully.');
      setTimeout(() => {
        onLogout();
      }, 800);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-[#FAFAFE]">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.15,
              delayChildren: 0.1
            }
          }
        }}
        className="max-w-6xl mx-auto px-6 py-12 space-y-10"
      >
        
        {/* Success Alert */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-white border border-[#10B981]/20 shadow-2xl rounded-2xl p-4 flex items-center gap-3 pr-8"
            >
              <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-[#111111]">Profile Updated</p>
                <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Profile updated successfully</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Header */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, x: -20 },
            visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
          }}
          className="flex items-center justify-between group"
        >
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-5xl font-serif font-black italic tracking-tighter text-black">Profile</h2>
            <p className="text-[10px] sm:text-[12px] font-black text-black/40 uppercase tracking-[0.22em] sm:tracking-[0.3em] italic">Manage your account and personal details</p>
          </div>
          {!isEditing && (
            <Button 
              onClick={() => setIsEditing(true)}
              className={cn(
                "text-white h-11 sm:h-14 rounded-2xl px-5 sm:px-10 font-black uppercase text-[9px] sm:text-[11px] tracking-[0.14em] sm:tracking-[0.2em] transition-all duration-500 shadow-2xl shadow-black/20 hover:scale-105 active:scale-95",
                formData.gender?.toLowerCase() === 'male' ? "bg-black hover:bg-blue-600" : "bg-black hover:bg-[#FF2E93]"
              )}
            >
              Update Profile
            </Button>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Sidebar Info */}
          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 1, ease: "easeOut" } }
            }}
            className="md:col-span-4 space-y-8"
          >
            <Card className="bg-white border-[#F0E7FF] shadow-2xl shadow-black/[0.02] rounded-[32px] overflow-hidden">
               <div className={cn(
                 "h-28 relative transition-colors duration-700",
                 formData.gender?.toLowerCase() === 'male' ? "bg-gradient-to-br from-blue-600 to-blue-400" : "bg-gradient-to-br from-[#FF2E93] to-[#FF2E93]/70"
               )}>
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
               </div>
               <div className="px-5 sm:px-8 pb-8 sm:pb-10 pt-0 flex flex-col items-center">
                 <div className="relative -mt-14 mb-6">
                    <div className="w-28 h-28 rounded-[40px] border-4 border-white shadow-2xl overflow-hidden ring-1 ring-black/5 relative group cursor-pointer" onClick={handleAvatarChange}>
                      <img src={formData.avatar} className="w-full h-full object-cover bg-white" alt="Avatar" />
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className={cn(
                      "absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-white shadow-xl flex items-center justify-center border border-[#F0E7FF] transition-colors",
                      formData.gender?.toLowerCase() === 'male' ? "text-blue-600" : "text-[#FF2E93]"
                    )}>
                       <BadgeCheck className="w-6 h-6" />
                    </div>
                 </div>

                 <div className="text-center space-y-2">
                   <h3 className="text-2xl sm:text-3xl font-serif font-black italic tracking-tighter text-black">{formData.name}</h3>
                   <div className="flex items-center justify-center gap-3">
                     <p className="text-[9px] sm:text-[11px] font-black text-black/30 uppercase tracking-[0.15em] sm:tracking-[0.2em]">@{formData.username}</p>
                     <div className={cn(
                       "w-1.5 h-1.5 rounded-full animate-pulse",
                       formData.gender?.toLowerCase() === 'male' ? "bg-blue-500" : "bg-[#FF2E93]"
                     )} />
                     <p className={cn(
                       "text-[9px] sm:text-[11px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em]",
                       formData.gender?.toLowerCase() === 'male' ? "text-blue-500" : "text-[#FF2E93]"
                     )}>Verified</p>
                   </div>
                 </div>

                 <motion.div 
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.6, duration: 0.8 }}
                   className="w-full mt-10 space-y-4"
                 >
                    <div className="flex items-center gap-4 p-3 bg-[#F7F7F8] rounded-2xl border border-[#EEEEEE]">
                      <div className={cn(
                        "w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm",
                        formData.gender?.toLowerCase() === 'male' ? "text-blue-500" : "text-[#FF2E93]"
                      )}>
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[8px] font-black text-[#6B7280]/40 uppercase tracking-widest">Email Address</p>
                        <p className="text-[11px] sm:text-xs font-bold text-[#111111] truncate">{formData.email}</p>
                      </div>
                    </div>
                 </motion.div>
               </div>
            </Card>
          </motion.div>

          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 1, ease: "easeOut", delay: 0.2 } }
            }}
            className="md:col-span-8"
          >
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <Card className="bg-white border-[#F0E7FF] shadow-2xl shadow-black/[0.02] rounded-[32px] p-5 sm:p-8">
                    <div className="flex items-center gap-4 mb-10">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setIsEditing(false)}
                        className="rounded-full w-10 h-10 hover:bg-[#F7F7F8] shrink-0"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                      <h4 className="text-lg sm:text-xl font-serif font-black italic tracking-tight text-[#111111]">Edit Profile</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest ml-1">Name</Label>
                        <Input 
                          value={formData.name} 
                          onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                          className="h-12 sm:h-14 bg-[#F7F7F8] border-none rounded-2xl px-4 sm:px-6 font-bold text-[13px] sm:text-sm focus:ring-2 focus:ring-blue-600/10" 
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest ml-1">Username</Label>
                        <Input 
                          value={formData.username} 
                          onChange={e => setFormData(p => ({ ...p, username: e.target.value }))}
                          className="h-12 sm:h-14 bg-[#F7F7F8] border-none rounded-2xl px-4 sm:px-6 font-bold text-[13px] sm:text-sm focus:ring-2 focus:ring-blue-600/10" 
                        />
                      </div>
                      <div className="space-y-3 sm:col-span-2">
                        <Label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest ml-1">Email Address</Label>
                        <Input 
                          value={formData.email} 
                          onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                          className="h-12 sm:h-14 bg-[#F7F7F8] border-none rounded-2xl px-4 sm:px-6 font-bold text-[13px] sm:text-sm focus:ring-2 focus:ring-blue-600/10" 
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest ml-1">Gender</Label>
                        <Input 
                          value={formData.gender} 
                          onChange={e => setFormData(p => ({ ...p, gender: e.target.value as any }))}
                          className="h-12 sm:h-14 bg-[#F7F7F8] border-none rounded-2xl px-4 sm:px-6 font-bold text-[13px] sm:text-sm focus:ring-2 focus:ring-blue-600/10" 
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest ml-1">Age</Label>
                        <Input 
                          type="text"
                          inputMode="numeric"
                          value={formData.age} 
                          onChange={e =>
                            setFormData(p => ({
                              ...p,
                              age: e.target.value.replace(/\D/g, ''),
                            }))
                          }
                          className="h-12 sm:h-14 bg-[#F7F7F8] border-none rounded-2xl px-4 sm:px-6 font-bold text-[13px] sm:text-sm focus:ring-2 focus:ring-blue-600/10" 
                        />
                      </div>
                      <div className="space-y-3 sm:col-span-2">
                        <Label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest ml-1">Biography</Label>
                        <textarea 
                          value={formData.bio} 
                          onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
                          className="w-full h-28 sm:h-32 bg-[#F7F7F8] border-none rounded-2xl p-4 sm:p-6 font-bold text-[13px] sm:text-sm focus:ring-2 focus:ring-blue-600/10 resize-none outline-none" 
                        />
                      </div>
                    </div>

                    <div className="mt-12 flex gap-4">
                      <Button 
                        onClick={() => setIsEditing(false)}
                        variant="ghost"
                        className="flex-1 h-12 sm:h-14 rounded-2xl font-black uppercase text-[9px] sm:text-[10px] tracking-[0.14em] sm:tracking-widest text-[#6B7280] transition-colors duration-500 hover:bg-[#F7F7F8]"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSave}
                        disabled={isLoading}
                        className={cn(
                          "flex-[2] h-12 sm:h-14 text-white rounded-2xl font-black uppercase text-[9px] sm:text-[10px] tracking-[0.14em] sm:tracking-widest transition-all duration-500 shadow-xl shadow-black/10 group overflow-hidden relative",
                          formData.gender?.toLowerCase() === 'male' ? "bg-black hover:bg-blue-600" : "bg-black hover:bg-[#FF2E93]"
                        )}
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <span className="relative z-10">Save Changes</span>
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                          </>
                        )}
                      </Button>
                    </div>
                    {profileError && (
                      <p className="mt-4 text-sm text-red-500 font-medium">{profileError}</p>
                    )}
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="view"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  <Card className="bg-white border-[#F0E7FF] shadow-2xl shadow-black/[0.02] rounded-[32px] p-5 sm:p-10">
                    <h4 className={cn(
                      "text-[10px] font-black uppercase tracking-[0.3em] mb-4",
                      formData.gender?.toLowerCase() === 'male' ? "text-blue-600" : "text-[#FF2E93]"
                    )}>Profile Information</h4>
                    <div className="space-y-10">
                       <motion.div 
                         initial={{ opacity: 0, x: -20 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: 0.3, duration: 0.8 }}
                         className="space-y-4"
                       >
                         <h5 className="text-2xl sm:text-3xl font-serif font-black italic tracking-tighter text-[#111111]">About Me</h5>
                         <p className={cn(
                           "text-[13px] sm:text-sm font-medium text-[#6B7280] leading-relaxed italic border-l-4 pl-4 sm:pl-6 py-2 transition-colors duration-500",
                           formData.gender?.toLowerCase() === 'male' ? "border-blue-600/20" : "border-[#FF2E93]/20"
                         )}>
                           "{formData.bio}"
                         </p>
                       </motion.div>

                       <motion.div 
                         initial={{ opacity: 0, x: -20 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: 0.4, duration: 0.8 }}
                         className="grid grid-cols-2 gap-6 sm:gap-12"
                       >
                          <div className="space-y-2">
                            <p className="text-[9px] font-black text-[#6B7280]/40 uppercase tracking-widest">Gender</p>
                            <p className="text-base sm:text-lg font-serif font-black italic tracking-tight text-[#111111]">{formData.gender}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[9px] font-black text-[#6B7280]/40 uppercase tracking-widest">Current Age</p>
                            <p className="text-base sm:text-lg font-serif font-black italic tracking-tight text-[#111111]">{formData.age} Years</p>
                          </div>
                       </motion.div>

                       <motion.div 
                         initial={{ opacity: 0, x: -20 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: 0.5, duration: 0.8 }}
                         className="pt-8 border-t border-[#F7F7F8] space-y-6"
                       >
                         <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                           <h5 className="text-[10px] font-black text-[#111111] uppercase tracking-widest">Account Settings</h5>
                           <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                             <button className={cn(
                               "text-[9px] sm:text-[10px] font-black uppercase tracking-[0.14em] sm:tracking-widest transition-all duration-700 hover:scale-[1.05] sm:hover:scale-[1.2] origin-center",
                               formData.gender?.toLowerCase() === 'male' ? "text-blue-600" : "text-[#FF2E93]"
                             )} onClick={() => setIsChangePasswordOpen(true)}>Change Password</button>
                             <div className="w-1 h-1 rounded-full bg-[#EEEEEE]" />
                             <button className="text-[9px] sm:text-[10px] font-black text-red-500 uppercase tracking-[0.14em] sm:tracking-widest transition-all duration-700 hover:scale-[1.05] sm:hover:scale-[1.2] origin-center" onClick={() => setIsDeleteAccountOpen(true)}>Delete Account</button>
                           </div>
                         </div>
                       </motion.div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>

      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent className="max-w-md rounded-[28px] border border-[#F0E7FF] bg-white p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-xl font-black italic text-[#111111]">Change Password</DialogTitle>
            <DialogDescription className="text-sm text-[#6B7280]">
              Update your password securely for this account.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Current Password</Label>
              <Input
                type="password"
                value={changePasswordData.currentPassword}
                onChange={(e) =>
                  setChangePasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                }
                className="h-12 rounded-2xl bg-[#F7F7F8] border-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">New Password</Label>
              <Input
                type="password"
                value={changePasswordData.newPassword}
                onChange={(e) =>
                  setChangePasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                }
                className="h-12 rounded-2xl bg-[#F7F7F8] border-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Confirm Password</Label>
              <Input
                type="password"
                value={changePasswordData.confirmPassword}
                onChange={(e) =>
                  setChangePasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
                className="h-12 rounded-2xl bg-[#F7F7F8] border-none"
              />
            </div>

            <div className="rounded-2xl border border-[#F0E7FF] bg-[#FAFAFE] px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6B7280] mb-2">
                Password Requirements
              </p>
              <div className="space-y-1 text-[11px] font-medium">
                <p className={changePasswordChecks.minLength ? 'text-emerald-600' : 'text-[#6B7280]'}>
                  At least 8 characters
                </p>
                <p className={changePasswordChecks.uppercase ? 'text-emerald-600' : 'text-[#6B7280]'}>
                  At least 1 uppercase letter
                </p>
                <p className={changePasswordChecks.lowercase ? 'text-emerald-600' : 'text-[#6B7280]'}>
                  At least 1 lowercase letter
                </p>
                <p className={changePasswordChecks.number ? 'text-emerald-600' : 'text-[#6B7280]'}>
                  At least 1 number
                </p>
              </div>
            </div>

            {changePasswordError && <p className="text-sm text-red-500 font-medium">{changePasswordError}</p>}
            {changePasswordSuccess && <p className="text-sm text-emerald-600 font-medium">{changePasswordSuccess}</p>}

            <Button
              type="button"
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="w-full h-12 rounded-2xl bg-black text-white hover:bg-black/90"
            >
              {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteAccountOpen} onOpenChange={setIsDeleteAccountOpen}>
        <DialogContent className="max-w-md rounded-[28px] border border-[#F0E7FF] bg-white p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-xl font-black italic text-[#111111]">Delete Account</DialogTitle>
            <DialogDescription className="text-sm text-[#6B7280]">
              We will send an OTP to your email before deleting your account permanently.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-4">
            {!deleteOtpSent ? (
              <Button
                type="button"
                onClick={handleRequestDeleteOtp}
                disabled={isDeletingAccount}
                className="w-full h-12 rounded-2xl bg-red-500 text-white hover:bg-red-600"
              >
                {isDeletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Delete OTP'}
              </Button>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">OTP</Label>
                  <Input
                    value={deleteOtp}
                    onChange={(e) => setDeleteOtp(e.target.value)}
                    className="h-12 rounded-2xl bg-[#F7F7F8] border-none"
                    placeholder="Enter OTP from email"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRequestDeleteOtp}
                    disabled={isDeletingAccount}
                    className="flex-1 h-12 rounded-2xl"
                  >
                    Resend OTP
                  </Button>
                  <Button
                    type="button"
                    onClick={handleConfirmDeleteAccount}
                    disabled={isDeletingAccount}
                    className="flex-1 h-12 rounded-2xl bg-red-500 text-white hover:bg-red-600"
                  >
                    {isDeletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Now'}
                  </Button>
                </div>
              </>
            )}

            {deleteError && <p className="text-sm text-red-500 font-medium">{deleteError}</p>}
            {deleteSuccess && <p className="text-sm text-emerald-600 font-medium">{deleteSuccess}</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
