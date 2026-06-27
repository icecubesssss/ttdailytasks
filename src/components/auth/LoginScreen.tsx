import React, { useState } from 'react';
import { supabase } from '../../supabase';
import { ShieldAlert, Zap, Lock, User, Heart } from 'lucide-react';

interface LoginScreenProps {
  authError?: string | null;
}

const ALLOWED_USERS = {
  tit: {
    email: 'dinhthai.ctv@gmail.com',
    name: 'Tit',
    photo: 'https://api.dicebear.com/7.x/bottts/svg?seed=Tit&backgroundColor=b6e3f4'
  },
  tun: {
    email: 'transontruc.03@gmail.com',
    name: 'Tun',
    photo: 'https://api.dicebear.com/7.x/bottts/svg?seed=Tun&backgroundColor=ffdfbf'
  }
};

const SECRET_PASS = '04102023';

export default function LoginScreen({ authError }: LoginScreenProps) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setIsLoading(true);

    const userKey = username.trim().toLowerCase();
    const allowed = ALLOWED_USERS[userKey as keyof typeof ALLOWED_USERS];

    if (!allowed) {
       setLocalError('Sai tên đăng nhập! Chỉ có Tit và Tun mới được vào Nhà này nhé!');
       setIsLoading(false);
       return;
    }

    if (password !== SECRET_PASS) {
       setLocalError('Sai mật khẩu rồi! Mật khẩu là ngày kỉ niệm (04102023) cơ mà?!');
       setIsLoading(false);
       return;
    }

    const { email, name, photo } = allowed;

    try {
      // 1. Try to sign in
      const signIn = await supabase.auth.signInWithPassword({ email, password });
      let authUser = signIn.data.user;
      const signInError = signIn.error;

      // 2. If user doesn't exist, sign up
      if (signInError && (signInError.message.includes('Invalid login credentials') || signInError.message.includes('not found'))) {
        const signUp = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              displayName: name,
              photoURL: photo
            }
          }
        });
        if (signUp.error) throw signUp.error;
        authUser = signUp.data.user;
      } else if (signInError) {
        throw signInError;
      }

      if (!authUser) throw new Error("No user returned from auth");

      // 3. Save to team_members
      await supabase.from('team_members').upsert({
        uid: authUser.id,
        display_name: authUser.user_metadata?.displayName || name,
        photo_url: authUser.user_metadata?.photoURL || photo,
        email: authUser.email,
        last_active: Date.now()
      });

    } catch (error: any) {
      console.error("Login Error", error);
      setLocalError('Lỗi đăng nhập: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 relative overflow-hidden">
      {/* Background Hearts for Tit & Tun */}
      <Heart size={300} className="text-pink-500/5 absolute -top-10 -left-10 rotate-12" />
      <Heart size={400} className="text-pink-500/5 absolute -bottom-20 -right-20 -rotate-12" />

      <div className="max-w-md w-full text-center space-y-8 relative z-10 animate-in fade-in zoom-in duration-500">
        
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
           <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30 animate-spin"></div>
           <Zap className="text-indigo-500 w-12 h-12 animate-pulse" />
        </div>
        
        <div>
           <h1 className="text-4xl font-black tracking-tight drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-500">TIT & TUN TASKS</h1>
           <p className="text-slate-400 font-medium mt-2">Góc làm việc riêng tư của 2 tụi mình!</p>
        </div>

        {authError && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-500 p-4 rounded-2xl flex items-start gap-3 mt-4 text-left">
                <ShieldAlert size={20} className="mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-bold">Lỗi Cấu Hình Hệ Thống</p>
                  <p className="opacity-80">{authError}</p>
                </div>
            </div>
        )}

        {localError && (
            <div className="bg-amber-500/10 border border-amber-500/40 text-amber-500 p-4 rounded-2xl flex items-start gap-3 mt-4 text-left animate-in slide-in-from-top-4">
                <ShieldAlert size={20} className="mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-bold">Lỗi Đăng Nhập</p>
                  <p className="opacity-80 break-words">{localError}</p>
                </div>
            </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 pt-6">
           <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                 <User size={20} className="text-slate-500" />
              </div>
              <input 
                 type="text" 
                 required
                 value={username}
                 onChange={e => setUsername(e.target.value)}
                 className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-bold"
                 placeholder="Tên đăng nhập (tit hoặc tun)"
              />
           </div>

           <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                 <Lock size={20} className="text-slate-500" />
              </div>
              <input 
                 type="password"
                 required
                 value={password}
                 onChange={e => setPassword(e.target.value)}
                 className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-bold tracking-widest"
                 placeholder="Mật khẩu bí mật"
              />
           </div>

           <button 
             type="submit"
             disabled={isLoading}
             className="w-full bg-gradient-to-r from-indigo-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-black text-lg hover:opacity-90 transition-all shadow-xl shadow-pink-500/20 active:scale-95 disabled:opacity-50 mt-4"
           >
             {isLoading ? 'ĐANG VÀO NHÀ...' : 'VÀO LÀM VIỆC THÔI'}
           </button>
        </form>
      </div>
    </div>
  );
}
