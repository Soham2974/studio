'use client';

import { createContext, useContext, useReducer, ReactNode, useCallback, useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { UserRole, Component, CartItem, ComponentRequest, User, UserDetails } from '@/lib/types';
import { initialComponents, initialRequests, initialUsers } from '@/lib/mock-data';
import { preventOverdraft } from '@/ai/flows/prevent-overdraft-flow';

type AppState = {
  userRole: UserRole;
  userDetails: UserDetails | null;
  isDataLoaded: boolean;
  components: Component[];
  cart: CartItem[];
  requests: ComponentRequest[];
  users: User[];
};

type AppContextType = AppState & {
  login: (role: 'admin' | 'user') => void;
  logout: () => void;
  addToCart: (componentId: string, quantity: number) => void;
  removeFromCart: (componentId: string) => void;
  updateCartQuantity: (componentId: string, quantity: number) => void;
  clearCart: () => void;
  submitRequest: (details: Omit<ComponentRequest, 'id' | 'items' | 'status' | 'createdAt' | 'approvedAt' | 'userName' | 'department' | 'year' | 'phoneNumber' >) => void;
  addComponent: (component: Omit<Component, 'id'>) => void;
  updateComponent: (component: Component) => void;
  deleteComponent: (componentId: string) => void;
  updateUser: (user: User) => void;
  approveRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => void;
  updateReturnQuantity: (requestId: string, componentId: string, returnedQuantity: number) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

type Action =
  | { type: 'LOGIN'; payload: { role: 'admin' | 'user', userDetails: UserDetails | null } }
  | { type: 'LOGOUT' }
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'ADD_REQUEST'; payload: ComponentRequest }
  | { type: 'SET_COMPONENTS'; payload: Component[] }
  | { type: 'SET_REQUESTS'; payload: ComponentRequest[] }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'SET_DATA_LOADED'; payload: boolean };

const initialState: AppState = {
  userRole: null,
  userDetails: null,
  isDataLoaded: false,
  components: [],
  cart: [],
  requests: [],
  users: [],
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, userRole: action.payload.role, userDetails: action.payload.userDetails };
    case 'LOGOUT':
      return { ...state, userRole: null, userDetails: null, cart: [] };
    case 'SET_CART':
      return { ...state, cart: action.payload };
    case 'ADD_REQUEST':
      return { ...state, requests: [action.payload, ...state.requests] };
    case 'SET_COMPONENTS':
        return { ...state, components: action.payload };
    case 'SET_REQUESTS':
        return { ...state, requests: action.payload };
    case 'SET_USERS':
        return { ...state, users: action.payload };
    case 'SET_DATA_LOADED':
        return { ...state, isDataLoaded: action.payload };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { toast } = useToast();
  
  useEffect(() => {
    // Simulate loading data from local storage or an API
    dispatch({ type: 'SET_COMPONENTS', payload: initialComponents });
    dispatch({ type: 'SET_REQUESTS', payload: initialRequests });
    dispatch({ type: 'SET_USERS', payload: initialUsers });
    dispatch({ type: 'SET_DATA_LOADED', payload: true });
  }, []);


  const login = (role: 'admin' | 'user') => {
      let userDetails: UserDetails | null = null;
      if (role === 'user') {
          // For demo purposes, we'll just pick the first user.
          // In a real app, you'd have a proper user selection/login.
          const demoUser = state.users[0];
          if(demoUser) {
            userDetails = { name: demoUser.name, department: demoUser.department, year: demoUser.year, phoneNumber: demoUser.phoneNumber };
          }
      }
      dispatch({ type: 'LOGIN', payload: { role, userDetails } });
  }
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
  };

  const removeFromCart = (componentId: string) => {
    const newCart = state.cart.filter(item => item.componentId !== componentId);
    dispatch({ type: 'SET_CART', payload: newCart });
  };

  const updateCartQuantity = (componentId: string, quantity: number) => {
    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      removeFromCart(componentId);
    } else {
      const newCart = state.cart.map(item =>
        item.componentId === componentId ? { ...item, quantity: numQuantity } : item
      );
      dispatch({ type: 'SET_CART', payload: newCart });
    }
  };
  
  const clearCart = () => dispatch({type: 'SET_CART', payload: []});

  const submitRequest = (details: Omit<ComponentRequest, 'id' | 'items' | 'status' | 'createdAt' | 'approvedAt' | 'userName' | 'department' | 'year' | 'phoneNumber'>) => {
    if (!state.userDetails) {
        toast({ variant: "destructive", title: "Error", description: "User details not found." });
        return;
    }
    const newRequest: ComponentRequest = {
      ...details,
      ...state.userDetails,
      id: `req-${Date.now()}`,
      items: state.cart.map(item => ({
        ...item,
        name: state.components.find(c => c.id === item.componentId)?.name || 'Unknown',
        returnedQuantity: 0,
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

  const updateUser = (updatedUser: User) => {
    const newUsers = state.users.map(u => u.id === updatedUser.id ? updatedUser : u);
    dispatch({ type: 'SET_USERS', payload: newUsers });
    toast({ title: 'User Updated', description: `Details for ${updatedUser.name} have been updated.` });
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

  const updateReturnQuantity = (requestId: string, componentId: string, returnedQuantity: number) => {
    const request = state.requests.find(r => r.id === requestId);
    if (!request) return;

    const itemToUpdate = request.items.find(i => i.componentId === componentId);
    const component = state.components.find(c => c.id === componentId);
    if (!itemToUpdate || !component) return;

    const currentReturned = itemToUpdate.returnedQuantity || 0;
    const newReturned = currentReturned + returnedQuantity;
    const maxReturnable = itemToUpdate.quantity;

    if(returnedQuantity <= 0) return;
    
    if (newReturned > maxReturnable) {
        toast({ variant: 'destructive', title: 'Error', description: `Cannot return more than was borrowed.` });
        return;
    }

    // Update component inventory
    const newComponents = state.components.map(c => 
        c.id === componentId ? { ...c, quantity: c.quantity + returnedQuantity } : c
    );
    dispatch({ type: 'SET_COMPONENTS', payload: newComponents });

    // Update request item's returned quantity
    const newRequests = state.requests.map(r => {
        if (r.id === requestId) {
            const newItems = r.items.map(i => 
                i.componentId === componentId ? { ...i, returnedQuantity: newReturned } : i
            );
            
            const totalRequested = newItems.reduce((sum, item) => sum + item.quantity, 0);
            const totalReturned = newItems.reduce((sum, item) => sum + (item.returnedQuantity || 0), 0);

            let newStatus: ComponentRequest['status'] = 'partially-returned';
            if (totalReturned >= totalRequested) {
                newStatus = 'returned';
            }

            return { ...r, items: newItems, status: newStatus };
        }
        return r;
    });
    dispatch({ type: 'SET_REQUESTS', payload: newRequests });
    toast({ title: 'Return Processed', description: `${returnedQuantity} x ${component.name} returned to inventory.` });
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
        updateUser,
        approveRequest,
        rejectRequest,
        updateReturnQuantity,
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
