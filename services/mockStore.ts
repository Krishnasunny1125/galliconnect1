
import { User, Shop, Product, Order, EarningStat } from '../types';
import { REALTIME_CONFIG } from '../config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

class GlobalDatabaseService {
  private supabase: SupabaseClient | null = null;
  private isConfigured: boolean = false;

  constructor() {
    if (REALTIME_CONFIG.SUPABASE_CONFIG.url !== "https://your-project-id.supabase.co") {
      this.supabase = createClient(
        REALTIME_CONFIG.SUPABASE_CONFIG.url,
        REALTIME_CONFIG.SUPABASE_CONFIG.anonKey
      );
      this.isConfigured = true;
      console.log("Galliconnect: Supabase Global Database Connected.");
    }
  }

  private getLocal(key: string) { return JSON.parse(localStorage.getItem(key) || '[]'); }
  private setLocal(key: string, data: any) { localStorage.setItem(key, JSON.stringify(data)); }

  async getUsers(): Promise<User[]> {
    if (!this.isConfigured) return this.getLocal('g_users');
    const { data, error } = await this.supabase!.from('users').select('*');
    if (error) throw error;
    return data as User[];
  }

  async getShops(): Promise<Shop[]> {
    if (!this.isConfigured) return this.getLocal('g_shops');
    const { data, error } = await this.supabase!.from('shops').select('*');
    if (error) throw error;
    return data as Shop[];
  }

  async getProducts(shopId?: string): Promise<Product[]> {
    if (!this.isConfigured) {
      const p = this.getLocal('g_products');
      return shopId ? p.filter((x: any) => x.shopId === shopId) : p;
    }
    let query = this.supabase!.from('products').select('*');
    if (shopId) query = query.eq('shopId', shopId);
    const { data, error } = await query;
    if (error) throw error;
    return data as Product[];
  }

  async getOrders(): Promise<Order[]> {
    if (!this.isConfigured) return this.getLocal('g_orders');
    const { data, error } = await this.supabase!.from('orders').select('*');
    if (error) throw error;
    return data as Order[];
  }

  onOrdersUpdate(callback: (orders: Order[]) => void, filter?: { shopId?: string, customerId?: string }) {
    if (!this.isConfigured) return () => {};

    // Initial fetch
    this.getOrders().then(orders => {
      let filtered = orders;
      if (filter?.shopId) filtered = filtered.filter(o => o.shopId === filter.shopId);
      if (filter?.customerId) filtered = filtered.filter(o => o.customerId === filter.customerId);
      callback(filtered);
    });

    // Realtime subscription
    const channel = this.supabase!
      .channel('orders_realtime')
      .on('postgres_changes', { event: '*', table: 'orders', schema: 'public' }, async () => {
        const orders = await this.getOrders();
        let filtered = orders;
        if (filter?.shopId) filtered = filtered.filter(o => o.shopId === filter.shopId);
        if (filter?.customerId) filtered = filtered.filter(o => o.customerId === filter.customerId);
        callback(filtered);
      })
      .subscribe();

    return () => {
      this.supabase!.removeChannel(channel);
    };
  }

  async addUser(user: User) {
    if (!this.isConfigured) {
      const u = this.getLocal('g_users'); u.push(user); this.setLocal('g_users', u);
      return;
    }
    const { error } = await this.supabase!.from('users').upsert(user);
    if (error) throw error;
  }

  async verifyEmail(userId: string) {
    if (!this.isConfigured) {
      const u = this.getLocal('g_users');
      const found = u.find((x: any) => x.id === userId);
      if (found) found.isEmailVerified = true;
      this.setLocal('g_users', u);
      return;
    }
    const { error } = await this.supabase!.from('users').update({ isEmailVerified: true }).eq('id', userId);
    if (error) throw error;
  }

  async addShop(shop: Shop) {
    if (!this.isConfigured) {
      const s = this.getLocal('g_shops'); s.push(shop); this.setLocal('g_shops', s);
      return;
    }
    const { error } = await this.supabase!.from('shops').upsert(shop);
    if (error) throw error;
  }

  async toggleShopStatus(shopId: string) {
    if (!this.isConfigured) {
      const s = this.getLocal('g_shops');
      const found = s.find((x: any) => x.id === shopId);
      if (found) found.isOpen = !found.isOpen;
      this.setLocal('g_shops', s);
      return;
    }
    const { data: shop } = await this.supabase!.from('shops').select('isOpen').eq('id', shopId).single();
    if (shop) {
      const { error } = await this.supabase!.from('shops').update({ isOpen: !shop.isOpen }).eq('id', shopId);
      if (error) throw error;
    }
  }

  async addProduct(product: Product) {
    if (!this.isConfigured) {
      const p = this.getLocal('g_products'); p.push(product); this.setLocal('g_products', p);
      return;
    }
    const { error } = await this.supabase!.from('products').upsert(product);
    if (error) throw error;
  }

  async updateProductStock(productId: string, inStock: boolean) {
    if (!this.isConfigured) {
      const p = this.getLocal('g_products');
      const found = p.find((x: any) => x.id === productId);
      if (found) found.inStock = inStock;
      this.setLocal('g_products', p);
      return;
    }
    const { error } = await this.supabase!.from('products').update({ inStock }).eq('id', productId);
    if (error) throw error;
  }

  async addOrder(order: Order) {
    if (!this.isConfigured) {
      const o = this.getLocal('g_orders'); o.push(order); this.setLocal('g_orders', o);
      return;
    }
    const { error } = await this.supabase!.from('orders').upsert(order);
    if (error) throw error;
  }

  async updateOrderStatus(orderId: string, status: Order['status']) {
    if (!this.isConfigured) {
      const o = this.getLocal('g_orders');
      const found = o.find((x: any) => x.id === orderId);
      if (found) found.status = status;
      this.setLocal('g_orders', o);
      return;
    }
    const { error } = await this.supabase!.from('orders').update({ status }).eq('id', orderId);
    if (error) throw error;
  }

  async getEarnings(shopId: string): Promise<EarningStat[]> {
    const orders = await this.getOrders();
    const shopOrders = orders.filter(o => o.shopId === shopId && o.status === 'Delivered');
    const earningsMap: Record<string, number> = {};
    
    shopOrders.forEach(o => {
      const date = o.createdAt.split('T')[0];
      earningsMap[date] = (earningsMap[date] || 0) + o.total;
    });

    return Object.entries(earningsMap).map(([date, amount]) => ({ date, amount })).sort((a, b) => a.date.localeCompare(b.date));
  }
}

export const mockStore = new GlobalDatabaseService();
