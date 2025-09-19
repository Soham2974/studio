import type { LucideIcon } from 'lucide-react';
import { z } from 'zod';

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

export const UserSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().regex(/^\+91[0-9]{10}$/, "Phone number must be in +91XXXXXXXXXX format"),
    department: z.string().min(1, "Department is required"),
    year: z.string().min(1, "Year is required"),
});

export type User = z.infer<typeof UserSchema> & {
    id: string;
    createdAt: Date;
};

export type UserDetails = {
    name: string;
    department: string;
    year: string;
    phoneNumber: string;
    email: string;
}
