
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';
import RetailerDashboard from './components/RetailerDashboard';
import CustomerView from './components/CustomerView';
import { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('g_current_user');
    if (saved) {
      setUser(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('g_current_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('g_current_user');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        <p className="text-slate-400 font-bold tracking-widest text-xs uppercase animate-pulse">Syncing Global State</p>
      </div>
    </div>
  );

  return (
    <Layout user={user} onLogout={handleLogout}>
      {!user ? (
        <Auth onLogin={handleLogin} />
      ) : (
        <div className="animate-fade-in">
          {user.role === 'ADMIN' && <AdminDashboard />}
          {user.role === 'RETAILER' && <RetailerDashboard user={user} />}
          {user.role === 'CUSTOMER' && <CustomerView user={user} />}
        </div>
      )}
    </Layout>
  );
};

export default App;
