
import React from 'react';
import { User } from '../types';

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children }) => {
  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      <header className="glass-effect border-b border-slate-200/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-18 flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-200 rotate-2">
              G
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none text-slate-900">Galliconnect</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600/80">Hyperlocal Cloud</span>
              </div>
            </div>
          </div>
          {user && (
            <div className="flex items-center gap-6">
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-slate-900 leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] mt-1">{user.role}</p>
              </div>
              <button 
                onClick={onLogout}
                className="bg-slate-900 hover:bg-indigo-600 px-5 py-2.5 rounded-xl text-xs font-black text-white transition-all shadow-lg hover:shadow-indigo-200 active:scale-95"
              >
                LOGOUT
              </button>
            </div>
          )}
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-100 py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-indigo-600 font-black text-sm">G</div>
              <span className="font-black text-slate-800 tracking-tight">Galliconnect Network</span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">© 2026 • GLOBAL HYPERLOCAL ARCHITECTURE</p>
            <div className="flex gap-4">
              {['Twitter', 'Discord', 'GitHub'].map(social => (
                <span key={social} className="text-xs font-black text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors uppercase tracking-widest">{social}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
