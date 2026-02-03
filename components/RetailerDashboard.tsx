
import React, { useState, useMemo, useEffect } from 'react';
import { User, Shop, Product, Order, OrderStatus, EarningStat } from '../types';
import { mockStore } from '../services/mockStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RetailerDashboardProps {
  user: User;
}

const RetailerDashboard: React.FC<RetailerDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'catalog' | 'earnings'>('orders');
  
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [earnings, setEarnings] = useState<EarningStat[]>([]);

  useEffect(() => {
    let unsubscribe: () => void = () => {};

    const initialize = async () => {
      const allShops = await mockStore.getShops();
      const foundShop = allShops.find(s => s.ownerId === user.id);
      
      if (foundShop) {
        setShop(foundShop);
        unsubscribe = mockStore.onOrdersUpdate((realtimeOrders) => {
          setOrders(realtimeOrders);
          mockStore.getEarnings(foundShop.id).then(setEarnings);
        }, { shopId: foundShop.id });
        mockStore.getProducts(foundShop.id).then(setProducts);
      }
    };

    initialize();
    return () => unsubscribe();
  }, [user.id]);

  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQty, setNewItemQty] = useState('');

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayEarnings = earnings.find(e => e.date === today)?.amount || 0;
    const pendingOrders = orders.filter(o => o.status === 'Ordered').length;
    return { todayEarnings, pendingOrders };
  }, [earnings, orders]);

  if (!shop) return <div className="p-20 text-center flex flex-col items-center gap-4">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Syncing Shop Registry...</p>
  </div>;

  const handleToggleShop = async () => {
    await mockStore.toggleShopStatus(shop.id);
    const s = await mockStore.getShops();
    setShop(s.find(x => x.id === shop.id) || null);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    await mockStore.addProduct({
      id: Math.random().toString(36).substr(2, 9),
      shopId: shop.id,
      name: newItemName,
      price: parseFloat(newItemPrice),
      quantity: newItemQty,
      image: `https://picsum.photos/seed/${newItemName}/200`,
      inStock: true
    });
    setNewItemName('');
    setNewItemPrice('');
    setNewItemQty('');
    const p = await mockStore.getProducts(shop.id);
    setProducts(p);
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    await mockStore.updateOrderStatus(orderId, status);
  };

  const toggleStock = async (productId: string, inStock: boolean) => {
    await mockStore.updateProductStock(productId, inStock);
    const p = await mockStore.getProducts(shop.id);
    setProducts(p);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-black text-slate-800">{shop.name}</h2>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded border border-emerald-100">Live</span>
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">{shop.type} • {shop.area}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Store Presence</p>
            <p className={`text-sm font-black ${shop.isOpen ? 'text-emerald-600' : 'text-rose-500'}`}>
              {shop.isOpen ? 'ONLINE & SELLING' : 'CURRENTLY OFFLINE'}
            </p>
          </div>
          <button 
            onClick={handleToggleShop}
            className={`w-14 h-8 rounded-full transition-all shadow-inner relative ${shop.isOpen ? 'bg-emerald-500' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${shop.isOpen ? 'right-1' : 'left-1'}`} />
          </button>
        </div>
      </div>

      <div className="flex bg-slate-100/50 p-1 rounded-2xl w-fit">
        {(['orders', 'catalog', 'earnings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(order => (
              <div key={order.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:border-emerald-200 transition-colors flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase mb-1">TXN #{order.id.toUpperCase()}</p>
                    <p className="text-2xl font-black text-slate-800">₹{order.total}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${
                    order.status === 'Ordered' ? 'bg-amber-100 text-amber-600 border border-amber-200' : 
                    order.status === 'Accepted' ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                  }`}>
                    {order.status}
                  </span>
                </div>

                {/* New: Customer & Delivery Details Section */}
                <div className="mb-4 p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <p className="text-xs font-black text-emerald-700 uppercase tracking-wider">Delivery To</p>
                  </div>
                  <p className="text-sm font-black text-slate-800">{order.customerName}</p>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">{order.customerAddress}</p>
                  <p className="text-xs font-bold text-slate-400 mt-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                    {order.customerContact}
                  </p>
                </div>

                <div className="space-y-2 mb-6 bg-slate-50 p-4 rounded-2xl flex-grow">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Order Items</p>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="text-xs font-bold text-slate-600 flex justify-between">
                      <span>{item.name} × {item.quantity}</span>
                      <span className="text-slate-400">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  {order.status === 'Ordered' && (
                    <button onClick={() => updateStatus(order.id, 'Accepted')} className="flex-1 bg-emerald-600 text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100">Confirm Order</button>
                  )}
                  {order.status === 'Accepted' && (
                    <button onClick={() => updateStatus(order.id, 'Delivered')} className="flex-1 bg-slate-900 text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-colors shadow-lg shadow-slate-200">Dispatch Done</button>
                  )}
                </div>
              </div>
            ))}
            {orders.length === 0 && <div className="col-span-full py-20 text-center text-slate-300 font-black uppercase tracking-[0.2em] text-sm">Waiting for real-time orders...</div>}
          </div>
        </div>
      )}

      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm sticky top-24">
              <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-tight">Inventory Entry</h3>
              <form onSubmit={handleAddProduct} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Item Designation</label>
                  <input required value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-50 transition-all font-bold" placeholder="e.g. Organic Milk" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Price (₹)</label>
                    <input required type="number" step="0.01" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-50 transition-all font-bold" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Metric</label>
                    <input required value={newItemQty} onChange={e => setNewItemQty(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-50 transition-all font-bold" placeholder="kg / unit" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100">Add to Global Catalog</button>
              </form>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Product Details</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Unit Price</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Stock</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <img src={p.image} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt={p.name} />
                          <div>
                            <p className="font-black text-slate-800 text-sm">{p.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.quantity}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm font-black text-slate-700">₹{p.price}</td>
                      <td className="px-8 py-5">
                        <button 
                          onClick={() => toggleStock(p.id, !p.inStock)}
                          className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest border transition-all ${p.inStock ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}
                        >
                          {p.inStock ? 'Available' : 'Sold Out'}
                        </button>
                      </td>
                      <td className="px-8 py-5">
                        <button className="text-slate-300 hover:text-rose-500 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'earnings' && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-emerald-600 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.82v-1.91c-1.63-.16-3.13-.88-4.13-1.94l1.37-1.37c.8.78 1.84 1.25 2.76 1.4v-3.72c-2.07-.63-4.57-1.35-4.57-4.15 0-1.89 1.42-3.41 3.41-3.79V5h2.82v1.89c1.47.16 2.77.78 3.66 1.63l-1.37 1.37c-.6-.56-1.42-.92-2.29-1.03v3.54c2.14.71 4.57 1.54 4.57 4.25 0 2.05-1.6 3.59-3.86 3.9z"/></svg>
              </div>
              <p className="text-[10px] text-emerald-100 mb-2 uppercase tracking-[0.3em] font-black">Net Cumulative Revenue</p>
              <p className="text-5xl font-black">₹{earnings.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</p>
            </div>
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-[0.3em] font-black">Real-time Payout Pool</p>
              <p className="text-5xl font-black text-slate-800 tracking-tighter">₹0<span className="text-sm opacity-30">.00</span></p>
            </div>
          </div>
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm h-96">
            <h3 className="text-sm font-black text-slate-800 mb-8 uppercase tracking-widest">Global Sales Trajectory</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={earnings}>
                <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={5} dot={{ r: 8, fill: '#10b981', strokeWidth: 4, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetailerDashboard;
