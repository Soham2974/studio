'use client';

import { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { UserRole, Component, CartItem, ComponentRequest } from '@/lib/types';
import { initialComponents, initialRequests } from '@/lib/mock-data';
import { preventOverdraft } from '@/ai/flows/prevent-overdraft-flow';

type AppState = {
  userRole: UserRole;
  components: Component[];
  cart: CartItem[];
  requests: ComponentRequest[];
};

type AppContextType = AppState & {
  login: (role: 'admin' | 'user') => void;
  logout: () => void;
  addToCart: (componentId: string, quantity: number) => void;
  removeFromCart: (componentId: string) => void;
  updateCartQuantity: (componentId: string, quantity: number) => void;
  clearCart: () => void;
  submitRequest: (details: Omit<ComponentRequest, 'id' | 'items' | 'status' | 'createdAt'>) => void;
  addComponent: (component: Omit<Component, 'id'>) => void;
  updateComponent: (component: Component) => void;
  deleteComponent: (componentId: string) => void;
  approveRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

type Action =
  | { type: 'LOGIN'; payload: 'admin' | 'user' }
  | { type: 'LOGOUT' }
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'ADD_REQUEST'; payload: ComponentRequest }
  | { type: 'SET_COMPONENTS'; payload: Component[] }
  | { type: 'SET_REQUESTS'; payload: ComponentRequest[] };

const initialState: AppState = {
  userRole: null,
  components: initialComponents,
  cart: [],
  requests: initialRequests,
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, userRole: action.payload };
    case 'LOGOUT':
      return { ...state, userRole: null, cart: [] };
    case 'SET_CART':
      return { ...state, cart: action.payload };
    case 'ADD_REQUEST':
      return { ...state, requests: [action.payload, ...state.requests] };
    case 'SET_COMPONENTS':
        return { ...state, components: action.payload };
    case 'SET_REQUESTS':
        return { ...state, requests: action.payload };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { toast } = useToast();

  const login = (role: 'admin' | 'user') => dispatch({ type: 'LOGIN', payload: role });
  const logout = () => dispatch({ type: 'LOGOUT' });

  const addToCart = (componentId: string, quantity: number) => {
    const existingItem = state.cart.find(item => item.componentId === componentId);
    let newCart: CartItem[];
    if (existingItem) {
      newCart = state.cart.map(item =>
        item.componentId === componentId ? { ...item, quantity: item.quantity + quantity } : item
      );
    } else {
      newCart = [...state.cart, { componentId, quantity }];
    }
    dispatch({ type: 'SET_CART', payload: newCart });
    toast({ title: "Added to cart", description: `Added ${quantity} item(s).` });
  };

  const removeFromCart = (componentId: string) => {
    const newCart = state.cart.filter(item => item.componentId !== componentId);
    dispatch({ type: 'SET_CART', payload: newCart });
  };

  const updateCartQuantity = (componentId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(componentId);
    } else {
      const newCart = state.cart.map(item =>
        item.componentId === componentId ? { ...item, quantity } : item
      );
      dispatch({ type: 'SET_CART', payload: newCart });
    }
  };
  
  const clearCart = () => dispatch({type: 'SET_CART', payload: []});

  const submitRequest = (details: Omit<ComponentRequest, 'id' | 'items' | 'status' | 'createdAt'>) => {
    const newRequest: ComponentRequest = {
      ...details,
      id: `req-${Date.now()}`,
      items: state.cart.map(item => ({
        ...item,
        name: state.components.find(c => c.id === item.componentId)?.name || 'Unknown',
      })),
      status: 'pending',
      createdAt: new Date(),
    };
    dispatch({ type: 'ADD_REQUEST', payload: newRequest });
    dispatch({ type: 'SET_CART', payload: [] });
    toast({ title: "Request Submitted", description: "Your component request has been sent for approval." });
  };

  const addComponent = (component: Omit<Component, 'id'>) => {
    const newComponent: Component = { ...component, id: `comp-${Date.now()}` };
    dispatch({ type: 'SET_COMPONENTS', payload: [...state.components, newComponent]});
    toast({ title: 'Component Added', description: `${component.name} has been added to the inventory.` });
  };

  const updateComponent = (updatedComponent: Component) => {
    const newComponents = state.components.map(c => c.id === updatedComponent.id ? updatedComponent : c);
    dispatch({ type: 'SET_COMPONENTS', payload: newComponents });
    toast({ title: 'Component Updated', description: `${updatedComponent.name} has been updated.` });
  };

  const deleteComponent = (componentId: string) => {
    const newComponents = state.components.filter(c => c.id !== componentId);
    dispatch({ type: 'SET_COMPONENTS', payload: newComponents });
    toast({ title: 'Component Deleted', variant: 'destructive' });
  };

  const approveRequest = useCallback(async (requestId: string) => {
    const request = state.requests.find(r => r.id === requestId);
    if (!request) return;

    let canApprove = true;
    const updates: { componentId: string, newQuantity: number }[] = [];

    for (const item of request.items) {
      const component = state.components.find(c => c.id === item.componentId);
      if (!component) {
        toast({ variant: 'destructive', title: 'Error', description: `Component ${item.name} not found.` });
        canApprove = false;
        break;
      }

      const overdraftResult = await preventOverdraft({
        componentName: component.name,
        requestedQuantity: item.quantity,
        currentQuantity: component.quantity,
      });

      if (overdraftResult.isOverdraft) {
        toast({
          variant: "destructive",
          title: "Overdraft Warning",
          description: overdraftResult.reason,
        });
        canApprove = false;
        break;
      }
      updates.push({ componentId: component.id, newQuantity: component.quantity - item.quantity });
    }

    if (canApprove) {
      const newComponents = state.components.map(c => {
        const update = updates.find(u => u.componentId === c.id);
        return update ? { ...c, quantity: update.newQuantity } : c;
      });
      dispatch({ type: 'SET_COMPONENTS', payload: newComponents });

      const newRequests = state.requests.map(r => r.id === requestId ? { ...r, status: 'approved' as const, approvedAt: new Date() } : r);
      dispatch({ type: 'SET_REQUESTS', payload: newRequests });
      
      toast({ title: 'Request Approved', description: 'Inventory has been updated.' });
    }
  }, [state.requests, state.components, toast]);

  const rejectRequest = (requestId: string) => {
    const newRequests = state.requests.map(r => r.id === requestId ? { ...r, status: 'rejected' as const } : r);
    dispatch({ type: 'SET_REQUESTS', payload: newRequests });
    toast({ title: 'Request Rejected', variant: 'destructive' });
  };


  return (
    <AppContext.Provider value={{ 
        ...state, 
        login, 
        logout,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        submitRequest,
        addComponent,
        updateComponent,
        deleteComponent,
        approveRequest,
        rejectRequest,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
