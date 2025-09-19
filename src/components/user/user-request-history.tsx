'use client';

import { useAppContext } from '@/context/app-context';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { ComponentRequest } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';


export default function UserRequestHistory() {
  const { requests, authUser } = useAppContext();
  
  const userRequests = authUser ? requests.filter(r => r.userId === authUser.uid) : [];

  const getStatusVariant = (status: ComponentRequest['status']) => {
    switch (status) {
      case 'approved':
      case 'partially-returned':
        return 'default';
      case 'returned':
         return 'secondary';
      case 'rejected':
        return 'destructive';
      case 'pending':
      default:
        return 'outline';
    }
  };

  const formatDate = (date: Date | Timestamp | undefined) => {
    if (!date) return '';
    const dateObj = date instanceof Timestamp ? date.toDate() : date;
    return format(dateObj, 'PP');
  }

  if (userRequests.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">My Request History</CardTitle>
                <CardDescription>Track the status of your component requests.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-center text-muted-foreground py-8">You have not made any requests yet.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle className="font-headline">My Request History</CardTitle>
            <CardDescription>Track the status of your component requests and returns.</CardDescription>
        </CardHeader>
        <CardContent>
            <Accordion type="single" collapsible className="w-full">
            {userRequests.map(request => (
                <AccordionItem value={request.id} key={request.id}>
                <AccordionTrigger>
                    <div className="flex w-full items-center justify-between pr-4">
                        <div className="text-left">
                            <p className="font-semibold">Request from {formatDate(request.createdAt)}</p>
                            <p className="text-sm text-muted-foreground max-w-md truncate">Purpose: {request.purpose}</p>
                        </div>
                        <Badge variant={getStatusVariant(request.status)}>{request.status}</Badge>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-4 p-2">
                    <div>
                        <h4 className="font-semibold mb-2">Requested Items</h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {request.items.map(item => (
                            <li key={item.componentId} className="p-2 bg-muted/50 rounded-md text-sm">
                                <p className="font-medium">{item.name}</p>
                                <span>Requested: {item.quantity}</span>
                                { (request.status === 'approved' || request.status === 'partially-returned' || request.status === 'returned') && 
                                    <span className="ml-4">Returned: {item.returnedQuantity || 0}</span>
                                }
                            </li>
                        ))}
                        </ul>
                    </div>
                    {request.status === 'approved' && request.approvedAt &&
                        <p className="text-sm text-muted-foreground">Approved on: {formatDate(request.approvedAt)}</p>
                    }
                    </div>
                </AccordionContent>
                </AccordionItem>
            ))}
            </Accordion>
        </CardContent>
    </Card>
  );
}
