
'use client';

import { createContext, useContext, useReducer, ReactNode, useCallback, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { UserRole, Component, CartItem, ComponentRequest, User, UserDetails } from '@/lib/types';
import { preventOverdraft } from '@/ai/flows/prevent-overdraft-flow';
import { auth, db } from '@/lib/firebase-config';
import { onAuthStateChanged, signInAnonymously, type User as AuthUser } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  where,
  getDocs,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { Cpu, CircuitBoard, Droplets, HardDrive, MemoryStick, RadioTower, Zap } from 'lucide-react';

type AppState = {
  userRole: UserRole;
  authUser: AuthUser | null;
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
  submitRequest: (requestData: UserDetails & { purpose: string }) => void;
  addComponent: (component: Omit<Component, 'id' | 'icon'> & {icon: string}) => void;
  updateComponent: (component: Component) => void;
  deleteComponent: (componentId: string) => void;
  updateUser: (user: User) => void;
  approveRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => void;
  updateReturnQuantity: (requestId: string, componentId: string, returnedQuantity: number) => void;
};

const iconMap = { Cpu, CircuitBoard, Droplets, HardDrive, MemoryStick, RadioTower, Zap };

const AppContext = createContext<AppContextType | undefined>(undefined);

type Action =
  | { type: 'LOGIN'; payload: { role: 'admin' | 'user' } }
  | { type: 'LOGOUT' }
  | { type: 'SET_AUTH_USER'; payload: AuthUser | null }
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'SET_COMPONENTS'; payload: Component[] }
  | { type: 'SET_REQUESTS'; payload: ComponentRequest[] }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'SET_DATA_LOADED'; payload: boolean };

const initialState: AppState = {
  userRole: null,
  authUser: null,
  isDataLoaded: false,
  components: [],
  cart: [],
  requests: [],
  users: [],
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, userRole: action.payload.role };
    case 'LOGOUT':
      return { ...state, userRole: null, cart: [] };
    case 'SET_AUTH_USER':
      return { ...state, authUser: action.payload };
    case 'SET_CART':
      return { ...state, cart: action.payload };
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

const convertTimestamps = (docData: any) => {
  const data = { ...docData };
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      // Keep as Timestamp object for date-fns formatting
    }
  }
  return data;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { toast } = useToast();
  
  useEffect(() => {
    dispatch({ type: 'SET_DATA_LOADED', payload: false });

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        dispatch({ type: 'SET_AUTH_USER', payload: user });
      } else {
        try {
          // No user is signed in, so attempt to sign in anonymously.
          await signInAnonymously(auth);
        } catch (error: any) {
            if (error.code === 'auth/configuration-not-found') {
                toast({
                    variant: 'destructive',
                    title: 'Firebase Auth Error',
                    description: 'Anonymous sign-in is not enabled. Please enable it in your Firebase console.',
                    duration: 10000,
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Authentication Error',
                    description: 'Could not sign in anonymously. Please check your Firebase config.',
                });
            }
          console.error("Anonymous sign-in error:", error);
        }
      }
    });

    const qComp = query(collection(db, "components"), orderBy("name"));
    const unsubscribeComponents = onSnapshot(qComp, (querySnapshot) => {
      const components = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const iconName = data.icon as string;
        return { 
          ...data, 
          id: doc.id,
          icon: iconMap[iconName as keyof typeof iconMap] || Cpu,
        } as Component;
      });
      dispatch({ type: 'SET_COMPONENTS', payload: components });
    }, (error) => {
      console.error("Error fetching components:", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not fetch components. Check Firestore security rules."});
    });

    const qReq = query(collection(db, "requests"), orderBy("createdAt", "desc"));
    const unsubscribeRequests = onSnapshot(qReq, (querySnapshot) => {
      const requests = querySnapshot.docs.map(doc => ({ ...convertTimestamps(doc.data()), id: doc.id }) as ComponentRequest);
      dispatch({ type: 'SET_REQUESTS', payload: requests });
    }, (error) => {
      console.error("Error fetching requests:", error);
    });

    const qUsers = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribeUsers = onSnapshot(qUsers, (querySnapshot) => {
      const users = querySnapshot.docs.map(doc => ({ ...convertTimestamps(doc.data()), id: doc.id }) as User);
      dispatch({ type: 'SET_USERS', payload: users });
    }, (error) => {
      console.error("Error fetching users:", error);
    });

    dispatch({ type: 'SET_DATA_LOADED', payload: true });
    
    return () => {
      unsubscribeAuth();
      unsubscribeComponents();
      unsubscribeRequests();
      unsubscribeUsers();
    };
  }, [toast]);


  const login = (role: 'admin' | 'user') => {
      if (!state.authUser) {
         toast({ variant: 'destructive', title: "Authentication Not Ready", description: "Please wait a moment for authentication to complete."});
         return;
      }
      dispatch({ type: 'LOGIN', payload: { role } });
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
    if (isNaN(numQuantity)) {
        return;
    }
    if (numQuantity <= 0) {
      removeFromCart(componentId);
    } else {
      const newCart = state.cart.map(item =>
        item.componentId === componentId ? { ...item, quantity: numQuantity } : item
      );
      dispatch({ type: 'SET_CART', payload: newCart });
    }
  };
  
  const clearCart = () => dispatch({type: 'SET_CART', payload: []});

  const submitRequest = async (requestData: UserDetails & { purpose: string }) => {
    const { authUser } = state;
    if (!authUser) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be signed in to submit a request." });
      return;
    }
    if (state.cart.length === 0) {
        toast({ variant: "destructive", title: "Cart is empty", description: "Please add items to your cart." });
        return;
    }

    const { purpose, ...userDetails } = requestData;

    try {
        const userDocRef = doc(db, "users", authUser.uid);
        await setDoc(userDocRef, { ...userDetails, createdAt: serverTimestamp() }, { merge: true });

        await addDoc(collection(db, 'requests'), {
            purpose: purpose,
            userId: authUser.uid,
            userName: userDetails.name,
            department: userDetails.department,
            year: userDetails.year,
            items: state.cart.map(item => ({
                componentId: item.componentId,
                quantity: item.quantity,
                name: state.components.find(c => c.id === item.componentId)?.name || 'Unknown',
                returnedQuantity: 0,
            })),
            status: 'pending',
            createdAt: serverTimestamp(),
        });

        clearCart();
        toast({ title: "Request Submitted", description: "Your component request has been sent for approval." });

    } catch (error) {
        console.error("Error submitting request: ", error);
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: "There was an error submitting your request. Please check your connection and try again.",
        });
    }
  };

  const addComponent = async (component: Omit<Component, 'id'|'icon'> & {icon: string}) => {
    await addDoc(collection(db, 'components'), component);
    toast({ title: 'Component Added', description: `${component.name} has been added to the inventory.` });
  };

  const updateComponent = async (updatedComponent: Component) => {
    const { id, icon, ...data } = updatedComponent;
    const iconName = Object.keys(iconMap).find(key => iconMap[key as keyof typeof iconMap] === icon) || 'Cpu';
    await updateDoc(doc(db, 'components', id), { ...data, icon: iconName });
    toast({ title: 'Component Updated', description: `${updatedComponent.name} has been updated.` });
  };

  const deleteComponent = async (componentId: string) => {
    await deleteDoc(doc(db, 'components', componentId));
    toast({ title: 'Component Deleted', variant: 'destructive' });
  };

  const updateUser = async (updatedUser: User) => {
    const { id, createdAt, ...data } = updatedUser;
    await updateDoc(doc(db, 'users', id), data);
    toast({ title: 'User Updated', description: `Details for ${updatedUser.name} have been updated.` });
  };

  const approveRequest = useCallback(async (requestId: string) => {
    const request = state.requests.find(r => r.id === requestId);
    if (!request) return;

    let canApprove = true;

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
    }

    if (canApprove) {
      for (const item of request.items) {
        const component = state.components.find(c => c.id === item.componentId)!;
        await updateDoc(doc(db, 'components', component.id), {
          quantity: component.quantity - item.quantity,
        });
      }
      
      await updateDoc(doc(db, 'requests', requestId), {
        status: 'approved',
        approvedAt: serverTimestamp(),
      });
      
      toast({ title: 'Request Approved', description: 'Inventory has been updated.' });
    }
  }, [state.requests, state.components, toast]);

  const rejectRequest = async (requestId: string) => {
    await updateDoc(doc(db, 'requests', requestId), { status: 'rejected' });
    toast({ title: 'Request Rejected', variant: 'destructive' });
  };

  const updateReturnQuantity = async (requestId: string, componentId: string, returnedQuantity: number) => {
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

    await updateDoc(doc(db, 'components', componentId), {
      quantity: component.quantity + returnedQuantity
    });

    const newItems = request.items.map(i => 
        i.componentId === componentId ? { ...i, returnedQuantity: newReturned } : i
    );
    
    const totalRequested = newItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalReturned = newItems.reduce((sum, item) => sum + (item.returnedQuantity || 0), 0);

    let newStatus: ComponentRequest['status'] = 'partially-returned';
    if (totalReturned >= totalRequested) {
        newStatus = 'returned';
    }

    await updateDoc(doc(db, 'requests', requestId), {
      items: newItems,
      status: newStatus,
    });
    
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
