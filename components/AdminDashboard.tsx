
import React, { useMemo, useState, useEffect } from 'react';
import { mockStore } from '../services/mockStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PLATFORM_CHARGE_PERCENT } from '../constants';
import { User, Shop, Order } from '../types';

const AdminDashboard: React.FC = () => {
  // Fix: Replaced direct Promise access with state and async fetching
  const [users, setUsers] = useState<User[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [u, s, o] = await Promise.all([
        mockStore.getUsers(),
        mockStore.getShops(),
        mockStore.getOrders()
      ]);
      setUsers(u);
      setShops(s);
      setOrders(o);
    };
    loadData();
  }, []);

  const retailers = useMemo(() => users.filter(u => u.role === 'RETAILER'), [users]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.status === 'Delivered' ? o.total : 0), 0);
    const adminCommission = totalRevenue * PLATFORM_CHARGE_PERCENT;
    return {
      totalRetailers: retailers.length,
      totalOrders: orders.length,
      totalRevenue,
      adminCommission
    };
  }, [orders, retailers]);

  const chartData = useMemo(() => {
    return shops.map(shop => {
      const shopRevenue = orders
        .filter(o => o.shopId === shop.id && o.status === 'Delivered')
        .reduce((sum, o) => sum + o.total, 0);
      return {
        name: shop.name.split("'")[0],
        revenue: shopRevenue,
        commission: shopRevenue * PLATFORM_CHARGE_PERCENT
      };
    }).slice(0, 5);
  }, [shops, orders]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Retailers', value: stats.totalRetailers, color: 'text-blue-600' },
          { label: 'Orders Processed', value: stats.totalOrders, color: 'text-purple-600' },
          { label: 'Market GMV', value: `₹${stats.totalRevenue.toLocaleString()}`, color: 'text-emerald-600' },
          { label: 'Admin Earnings', value: `₹${stats.adminCommission.toLocaleString()}`, color: 'text-orange-600' }
        ].map((s, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 text-slate-800">Top Performing Shops (Revenue vs Commission)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Total Revenue" />
                <Bar dataKey="commission" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Our Fee" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-4 text-slate-800">Retailer Verification</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-slate-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-medium">Retailer</th>
                  <th className="pb-3 font-medium">Contact</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {retailers.map(r => (
                  <tr key={r.id}>
                    <td className="py-4">
                      <p className="font-semibold text-sm">{r.name}</p>
                      <p className="text-xs text-slate-500">{r.email}</p>
                    </td>
                    <td className="py-4 text-sm text-slate-600">{r.contact}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${r.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {r.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-4">
                      <button className="text-emerald-600 hover:text-emerald-700 font-medium text-sm">Review</button>
                    </td>
                  </tr>
                ))}
                {retailers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">No retailers registered yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
