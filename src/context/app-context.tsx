
'use client';

import { createContext, useContext, useReducer, ReactNode, useCallback, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { UserRole, Component, CartItem, ComponentRequest, User, UserDetails } from '@/lib/types';
import { preventOverdraft } from '@/ai/flows/prevent-overdraft-flow';
import { db } from '@/lib/firebase-config';
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
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { Cpu, CircuitBoard, Droplets, HardDrive, MemoryStick, RadioTower, Zap } from 'lucide-react';

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
  | { type: 'LOGIN'; payload: { role: 'admin' | 'user', userDetails: UserDetails | null } }
  | { type: 'LOGOUT' }
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'SET_COMPONENTS'; payload: Component[] }
  | { type: 'SET_REQUESTS'; payload: ComponentRequest[] }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'SET_USER_DETAILS'; payload: UserDetails | null }
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
    case 'SET_COMPONENTS':
        return { ...state, components: action.payload };
    case 'SET_REQUESTS':
        return { ...state, requests: action.payload };
    case 'SET_USERS':
        return { ...state, users: action.payload };
    case 'SET_USER_DETAILS':
        return { ...state, userDetails: action.payload };
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
    });

    const qReq = query(collection(db, "requests"), orderBy("createdAt", "desc"));
    const unsubscribeRequests = onSnapshot(qReq, (querySnapshot) => {
      const requests = querySnapshot.docs.map(doc => ({ ...convertTimestamps(doc.data()), id: doc.id }) as ComponentRequest);
      dispatch({ type: 'SET_REQUESTS', payload: requests });
    });

    const qUsers = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribeUsers = onSnapshot(qUsers, (querySnapshot) => {
      const users = querySnapshot.docs.map(doc => ({ ...convertTimestamps(doc.data()), id: doc.id }) as User);
      dispatch({ type: 'SET_USERS', payload: users });
    });

    dispatch({ type: 'SET_DATA_LOADED', payload: true });
    
    return () => {
      unsubscribeComponents();
      unsubscribeRequests();
      unsubscribeUsers();
    };
  }, []);


  const login = (role: 'admin' | 'user') => {
      if (role === 'user') {
        const sortedUsers = [...state.users].sort((a, b) => (b.createdAt as Timestamp).toMillis() - (a.createdAt as Timestamp).toMillis());
        const lastUser = sortedUsers.length > 0 ? sortedUsers[0] : null;
        if (lastUser) {
             const userDetails = { name: lastUser.name, department: lastUser.department, year: lastUser.year, phoneNumber: lastUser.phoneNumber, email: lastUser.email };
             dispatch({ type: 'LOGIN', payload: { role, userDetails } });
        } else {
             dispatch({ type: 'LOGIN', payload: { role, userDetails: null } });
        }
      } else {
         dispatch({ type: 'LOGIN', payload: { role, userDetails: null } });
      }
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
    const { purpose, ...userDetails } = requestData;

    try {
        const userQuery = query(collection(db, "users"), where("email", "==", userDetails.email));
        const querySnapshot = await getDocs(userQuery);
        let userId: string;

        if (querySnapshot.empty) {
            const userDocRef = await addDoc(collection(db, "users"), {
                ...userDetails,
                createdAt: serverTimestamp(),
            });
            userId = userDocRef.id;
        } else {
            const userDoc = querySnapshot.docs[0];
            userId = userDoc.id;
            await updateDoc(doc(db, "users", userId), userDetails as Partial<UserDetails>);
        }

        await addDoc(collection(db, 'requests'), {
            purpose: purpose,
            userId: userId,
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

        dispatch({ type: 'SET_CART', payload: [] });
        toast({ title: "Request Submitted", description: "Your component request has been sent for approval." });

    } catch (error) {
        console.error("Error submitting request: ", error);
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: "There was an error submitting your request. Please try again.",
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
