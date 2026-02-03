
import React, { useState, useMemo, useEffect } from 'react';
import { User, Shop, Product, OrderItem, Order } from '../types';
import { mockStore } from '../services/mockStore';
import { DELIVERY_CHARGE, PLATFORM_CHARGE_PERCENT, DELIVERY_SLOTS } from '../constants';

interface CustomerViewProps {
  user: User;
}

const CustomerView: React.FC<CustomerViewProps> = ({ user }) => {
  const [view, setView] = useState<'shops' | 'catalog' | 'cart' | 'orders'>('shops');
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedSlot, setSelectedSlot] = useState(DELIVERY_SLOTS[0]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  const loadData = async () => {
    const [s, o, p] = await Promise.all([
      mockStore.getShops(),
      mockStore.getOrders(),
      mockStore.getProducts()
    ]);
    setShops(s.filter(shop => shop.isOpen));
    setMyOrders(o.filter(ord => ord.customerId === user.id));
    setAllProducts(p);
  };

  useEffect(() => { 
    loadData();
    // Get customer's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Location access denied. Sorting by distance disabled.")
      );
    }
  }, [user.id]);

  const sortedShops = useMemo(() => {
    if (!userCoords) return shops;
    return [...shops].sort((a, b) => {
      if (!a.latitude || !a.longitude) return 1;
      if (!b.latitude || !b.longitude) return -1;
      const distA = calculateDistance(userCoords.lat, userCoords.lng, a.latitude, a.longitude);
      const distB = calculateDistance(userCoords.lat, userCoords.lng, b.latitude, b.longitude);
      return distA - distB;
    });
  }, [shops, userCoords]);

  useEffect(() => {
    if (selectedShop) {
      mockStore.getProducts(selectedShop.id).then(all => {
        setProducts(all.filter(p => p.inStock));
      });
    }
  }, [selectedShop]);

  const cartSummary = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const platform = subtotal * PLATFORM_CHARGE_PERCENT;
    const total = subtotal + platform + DELIVERY_CHARGE;
    return { subtotal, platform, total };
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing && existing.quantity > 1) return prev.map(item => item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item);
      return prev.filter(item => item.productId !== productId);
    });
  };

  const placeOrder = async () => {
    if (!selectedShop) return;
    const order: Order = {
      id: Math.random().toString(36).substr(2, 9),
      customerId: user.id, customerName: user.name, customerAddress: user.address, customerContact: user.contact,
      shopId: selectedShop.id, shopName: selectedShop.name,
      items: [...cart], status: 'Ordered',
      total: cartSummary.subtotal, platformCharge: cartSummary.platform, deliveryCharge: DELIVERY_CHARGE, grandTotal: cartSummary.total,
      deliverySlot: selectedSlot, createdAt: new Date().toISOString()
    };
    await mockStore.addOrder(order);
    setCart([]); setView('orders'); alert('Order placed! Real-time tracking enabled.');
    await loadData();
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex bg-white rounded-3xl shadow-sm p-1.5 border border-slate-100 w-full md:w-fit mx-auto overflow-x-auto">
        {(['shops', 'orders', 'cart'] as const).map(v => (
          <button
            key={v} onClick={() => setView(v)}
            className={`flex-1 py-3 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${view === v ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-900'}`}
          >
            {v} {v === 'cart' && cart.length > 0 && `(${cart.length})`}
          </button>
        ))}
      </div>

      {view === 'shops' && (
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Marketplace</h2>
            <p className="text-slate-400 font-medium">Discover premium local vendors {userCoords ? 'sorted by distance' : 'near you'}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedShops.map(shop => {
              const distance = (userCoords && shop.latitude && shop.longitude) 
                ? calculateDistance(userCoords.lat, userCoords.lng, shop.latitude, shop.longitude) 
                : null;

              return (
                <div key={shop.id} onClick={() => { setSelectedShop(shop); setView('catalog'); }} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 cursor-pointer group hover:shadow-2xl transition-all hover:-translate-y-1">
                  <div className="h-56 overflow-hidden relative">
                    <img src={`https://picsum.photos/seed/${shop.name}/600/400`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={shop.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute top-5 right-5 flex flex-col items-end gap-2">
                      <span className="bg-white/90 backdrop-blur-sm text-slate-900 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                        {shop.isOpen ? 'ONLINE' : 'OFFLINE'}
                      </span>
                      {distance !== null && (
                        <span className="bg-indigo-600/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                          {distance < 1 ? `${(distance * 1000).toFixed(0)}m away` : `${distance.toFixed(1)}km away`}
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-5 left-5">
                      <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{shop.type}</span>
                      <h3 className="text-2xl font-black text-white mt-2 leading-none">{shop.name}</h3>
                    </div>
                  </div>
                  <div className="p-8 flex justify-between items-center">
                    <div>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{shop.area}</p>
                      <div className="flex items-center text-amber-500 font-black text-sm">
                        <svg className="w-4 h-4 fill-current mr-1" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
                        {shop.rating} Verified
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'catalog' && selectedShop && (
        <div className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-10">
            <div>
              <button onClick={() => setView('shops')} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mb-4 hover:gap-3 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Back to Shops
              </button>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter">{selectedShop.name}</h2>
              <p className="text-slate-400 font-bold mt-2 uppercase text-xs tracking-widest">Available Inventory • {selectedShop.area}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {products.map(p => {
              const inCart = cart.find(item => item.productId === p.id);
              return (
                <div key={p.id} className="bg-white rounded-3xl border border-slate-100 p-5 flex flex-col gap-4 shadow-sm hover:shadow-xl transition-all group">
                  <div className="h-40 overflow-hidden rounded-2xl bg-slate-100">
                    <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={p.name} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm leading-tight mb-1">{p.name}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.quantity}</p>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-black text-lg text-indigo-600 tracking-tighter">₹{p.price}</span>
                    {inCart ? (
                      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                        <button onClick={() => removeFromCart(p.id)} className="w-7 h-7 rounded-lg bg-white flex items-center justify-center font-black text-slate-600 shadow-sm">-</button>
                        <span className="w-8 text-center text-xs font-black">{inCart.quantity}</span>
                        <button onClick={() => addToCart(p)} className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white shadow-md">+</button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(p)} className="bg-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 shadow-lg transition-all">Add</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'cart' && (
        <div className="max-w-3xl mx-auto space-y-10">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight text-center">Your Selection</h2>
          {cart.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden divide-y divide-slate-50">
                  {cart.map(item => (
                    <div key={item.productId} className="p-6 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                      <div>
                        <p className="font-black text-slate-900 leading-none mb-1">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">₹{item.price} Unit</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                          <button onClick={() => removeFromCart(item.productId)} className="w-8 h-8 rounded-xl border border-slate-100 flex items-center justify-center font-black text-slate-400 hover:border-rose-200 hover:text-rose-500 transition-all">-</button>
                          <span className="font-black text-sm">{item.quantity}</span>
                          <button onClick={() => { const p = allProducts.find(x => x.id === item.productId); if(p) addToCart(p); }} className="w-8 h-8 rounded-xl border border-slate-100 flex items-center justify-center font-black text-slate-400 hover:border-indigo-200 hover:text-indigo-600 transition-all">+</button>
                        </div>
                        <p className="font-black text-indigo-600 w-20 text-right tracking-tighter">₹{(item.price * item.quantity).toFixed(0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-[2rem] border border-slate-100 p-8 space-y-6">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Fulfillment Details</h3>
                  <div className="space-y-4">
                    <label className="block text-[10px] text-slate-400 font-black uppercase tracking-widest">Delivery Slot</label>
                    <select value={selectedSlot} onChange={e => setSelectedSlot(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold text-sm">
                      {DELIVERY_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <label className="block text-[10px] text-slate-400 font-black uppercase tracking-widest mt-6">Destination Address</label>
                    <div className="p-6 bg-slate-50 rounded-2xl text-xs font-bold border border-slate-100 text-slate-600 leading-relaxed italic">
                      {user.address}
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="bg-indigo-600 text-white rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-200 sticky top-28 space-y-8">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-60">Checkout Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="opacity-80">Subtotal</span>
                      <span className="tracking-tighter">₹{cartSummary.subtotal.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span className="opacity-80">Platform Charge</span>
                      <span className="tracking-tighter">₹{cartSummary.platform.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span className="opacity-80">Delivery</span>
                      <span className="tracking-tighter">₹{DELIVERY_CHARGE}</span>
                    </div>
                  </div>
                  <div className="pt-8 border-t border-indigo-500/50">
                    <div className="flex justify-between items-center mb-10">
                      <span className="text-xs font-black uppercase tracking-widest opacity-60">Total</span>
                      <span className="text-5xl font-black tracking-tighter">₹{cartSummary.total.toFixed(0)}</span>
                    </div>
                    <button onClick={placeOrder} className="w-full bg-white text-indigo-600 py-6 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-transform active:scale-95">
                      Confirm & Pay
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center space-y-8">
              <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mx-auto text-4xl grayscale opacity-50">🛒</div>
              <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Your basket is currently empty</p>
              <button onClick={() => setView('shops')} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all">Start Shopping</button>
            </div>
          )}
        </div>
      )}

      {view === 'orders' && (
        <div className="max-w-4xl mx-auto space-y-10">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight text-center">Active Shipments</h2>
          <div className="space-y-8">
            {myOrders.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(order => (
              <div key={order.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-10 flex flex-col md:flex-row gap-10">
                <div className="flex-1 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] text-slate-400 font-black tracking-[0.2em] mb-2 uppercase">TXN ID: {order.id.toUpperCase()}</p>
                      <h3 className="text-3xl font-black text-slate-900 leading-none">{order.shopName}</h3>
                      <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
                      order.status === 'Ordered' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      order.status === 'Accepted' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs font-bold py-2 border-b border-slate-100/50 last:border-0">
                        <span className="text-slate-600">{item.name} × {item.quantity}</span>
                        <span className="text-slate-400 tracking-tighter">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="md:w-64 flex flex-col justify-between items-center text-center p-8 bg-slate-900 rounded-[2rem] text-white">
                  <div>
                    <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mb-4">Slot Assigned</p>
                    <p className="text-xs font-black leading-relaxed">{order.deliverySlot}</p>
                  </div>
                  <div className="mt-8 border-t border-white/10 pt-8 w-full">
                    <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mb-2">Grand Total</p>
                    <p className="text-4xl font-black tracking-tighter">₹{order.grandTotal.toFixed(0)}</p>
                  </div>
                </div>
              </div>
            ))}
            {myOrders.length === 0 && <div className="py-24 text-center text-slate-300 font-black uppercase tracking-widest border border-dashed rounded-[3rem]">Historical log is empty</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerView;
