
export type UserRole = 'ADMIN' | 'RETAILER' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  contact: string;
  address: string;
  landmarks?: string;
  isVerified?: boolean;
  isEmailVerified?: boolean;
}

export type ShopType = 'Groceries' | 'Fruits' | 'Pharmacy';

export interface Shop {
  id: string;
  ownerId: string;
  name: string;
  type: ShopType;
  area: string;
  address: string;
  isOpen: boolean;
  rating: number;
  latitude?: number;  // Added for proximity sorting
  longitude?: number; // Added for proximity sorting
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  price: number;
  quantity: string;
  image: string;
  inStock: boolean;
}

export type OrderStatus = 'Ordered' | 'Accepted' | 'Delivered';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerContact: string;
  shopId: string;
  shopName: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  platformCharge: number;
  deliveryCharge: number;
  grandTotal: number;
  deliverySlot: string;
  createdAt: string;
}

export interface EarningStat {
  date: string;
  amount: number;
}
