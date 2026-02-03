
import React, { useState } from 'react';
import { UserRole, ShopType, User } from '../types';
import { ADMIN_CREDENTIALS, SHOP_TYPES } from '../constants';
import { mockStore } from '../services/mockStore';
import { REALTIME_CONFIG } from '../config';

declare const emailjs: any;

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [step, setStep] = useState<'AUTH' | 'VERIFY'>('AUTH');
  const [verifyingUser, setVerifyingUser] = useState<User | null>(null);
  const [otp, setOtp] = useState('');
  const [correctOtp, setCorrectOtp] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [shopType, setShopType] = useState<ShopType>('Groceries');

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'ADMIN') setIsLogin(true);
  };

  const sendRealEmail = async (userName: string, userEmail: string) => {
    setIsSending(true);
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setCorrectOtp(generatedOtp);

    try {
      if (REALTIME_CONFIG.EMAILJS_PUBLIC_KEY !== "user_your_public_key") {
        await emailjs.send(
          REALTIME_CONFIG.EMAILJS_SERVICE_ID,
          REALTIME_CONFIG.EMAILJS_TEMPLATE_ID,
          {
            to_name: userName,
            to_email: userEmail,
            verification_code: generatedOtp,
          },
          REALTIME_CONFIG.EMAILJS_PUBLIC_KEY
        );
      } else {
        console.warn("OTP:", generatedOtp);
        alert(`Dev Mode: Check console for OTP. Email would go to ${userEmail}`);
      }
    } catch (error) {
      alert("Verification system offline. Please check connection.");
    } finally {
      setIsSending(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      if (isLogin) {
        if (role === 'ADMIN') {
          const adminMatch = ADMIN_CREDENTIALS.find(a => a.email === email && a.password === password);
          if (adminMatch) {
            onLogin({ id: 'admin-1', name: 'System Admin', email, role: 'ADMIN', contact: '000', address: 'HQ', isEmailVerified: true });
            return;
          }
          throw new Error('Invalid Admin credentials');
        }
        const users = await mockStore.getUsers();
        const user = users.find(u => u.email === email && u.role === role);
        if (user) {
          if (!user.isEmailVerified) {
            setVerifyingUser(user);
            setStep('VERIFY');
            await sendRealEmail(user.name, user.email);
          } else {
            onLogin(user);
          }
        } else {
          throw new Error('No account found with these credentials');
        }
      } else {
        let lat, lng;
        if (role === 'RETAILER') {
          // Attempt to get shop location during registration
          try {
            const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
          } catch (err) {
            console.warn("Location access denied for shop registration.");
          }
        }

        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          email, name, role, contact, address,
          isVerified: role === 'CUSTOMER',
          isEmailVerified: false
        };
        await mockStore.addUser(newUser);
        if (role === 'RETAILER') {
          await mockStore.addShop({
            id: 'shop-' + newUser.id,
            ownerId: newUser.id,
            name: name + "'s Store",
            type: shopType, area, address, isOpen: false, rating: 4.5,
            latitude: lat, longitude: lng
          });
        }
        setVerifyingUser(newUser);
        setStep('VERIFY');
        await sendRealEmail(name, email);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSending(false);
    }
  };

  if (step === 'VERIFY') {
    return (
      <div className="max-w-md mx-auto mt-16 p-12 bg-white rounded-[3rem] shadow-2xl border border-slate-100 text-center">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-inner">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Confirm Identity</h2>
        <p className="text-slate-500 text-sm mb-10 px-4 leading-relaxed font-medium">
          We've sent a secure key to <span className="text-indigo-600 font-bold">{verifyingUser?.email}</span>
        </p>

        <form onSubmit={e => { e.preventDefault(); if(otp === correctOtp && verifyingUser) { mockStore.verifyEmail(verifyingUser.id); onLogin({...verifyingUser, isEmailVerified: true}); } else alert('Invalid Code'); }} className="space-y-8">
          <input 
            required maxLength={6} value={otp} onChange={e => setOtp(e.target.value)}
            className="w-full text-center text-4xl tracking-[0.4em] font-black py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none transition-all"
            placeholder="000000"
          />
          <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all">
            Access Network
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-[3.5rem] shadow-2xl overflow-hidden mt-12 border border-slate-100">
      <div className="p-12">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-100 text-2xl font-black rotate-3">G</div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.25em]">Galliconnect Network</p>
        </div>
        
        <div className="flex mb-10 bg-slate-50 rounded-2xl p-1.5 border border-slate-100">
          {(['CUSTOMER', 'RETAILER', 'ADMIN'] as UserRole[]).map(r => (
            <button
              key={r} type="button" onClick={() => handleRoleChange(r)}
              className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all tracking-[0.15em] ${role === r ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600 uppercase'}`}
            >
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          {!isLogin && role !== 'ADMIN' && (
            <>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-semibold text-sm" placeholder="Full Name" />
              <input required type="tel" value={contact} onChange={e => setContact(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-semibold text-sm" placeholder="Contact Number" />
              {role === 'RETAILER' && (
                <div className="grid grid-cols-2 gap-3">
                  <select value={shopType} onChange={e => setShopType(e.target.value as ShopType)} className="px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs uppercase tracking-wider text-slate-600">
                    {SHOP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input required type="text" value={area} onChange={e => setArea(e.target.value)} className="px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold text-sm" placeholder="Area" />
                </div>
              )}
              <textarea required value={address} onChange={e => setAddress(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold text-sm" rows={2} placeholder="Full Delivery Address"></textarea>
            </>
          )}
          
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-semibold text-sm" placeholder="Email Address" />
          <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-semibold text-sm" placeholder="Security Password" />

          <button disabled={isSending} type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl mt-6">
            {isSending ? 'Syncing...' : (isLogin ? 'Sign In' : 'Join Network')}
          </button>
        </form>

        <div className="mt-10 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-indigo-600 hover:text-indigo-800 text-[10px] font-black uppercase tracking-[0.15em]">
            {isLogin ? "New to Galliconnect? Register" : "Member of the network? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
