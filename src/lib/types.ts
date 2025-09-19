import type { LucideIcon } from 'lucide-react';

export type Component = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  icon: ((props: React.SVGProps<SVGSVGElement>) => JSX.Element) | LucideIcon;
};

export type CartItem = {
  componentId: string;
  quantity: number;
};

export type ComponentRequestItem = CartItem & { 
  name: string;
  returnedQuantity: number;
};

export type ComponentRequest = {
  id:string;
  userName: string;
  department: string;
  year: string;
  purpose: string;
  items: ComponentRequestItem[];
  status: 'pending' | 'approved' | 'rejected' | 'partially-returned' | 'returned';
  createdAt: Date;
  approvedAt?: Date;
};

export type UserRole = 'admin' | 'user' | null;

export type User = {
    id: string;
    name: string;
    email: string;
    department: string;
    year: string;
    createdAt: Date;
};

export type UserDetails = {
    name: string;
    department: string;
    year: string;
}
