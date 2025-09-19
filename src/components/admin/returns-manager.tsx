'use client';

import { useState } from 'react';
import { useAppContext } from '@/context/app-context';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Save } from 'lucide-react';
import { format } from 'date-fns';
import type { ComponentRequest } from '@/lib/types';
import type { Timestamp } from 'firebase/firestore';

export default function ReturnsManager() {
  const { requests, updateReturnQuantity } = useAppContext();
  const [returnQuantities, setReturnQuantities] = useState<{ [reqId: string]: { [compId: string]: number } }>({});

  const approvedRequests = requests.filter(r => r.status === 'approved' || r.status === 'partially-returned');

  const handleQuantityChange = (reqId: string, compId: string, value: string) => {
    const numValue = parseInt(value, 10);
    setReturnQuantities(prev => ({
      ...prev,
      [reqId]: {
        ...prev[reqId],
        [compId]: isNaN(numValue) ? 0 : numValue,
      }
    }));
  };

  const handleSaveReturn = (request: ComponentRequest) => {
    const returns = returnQuantities[request.id];
    if (returns) {
      Object.entries(returns).forEach(([componentId, quantity]) => {
        if (quantity > 0) {
          updateReturnQuantity(request.id, componentId, quantity);
        }
      });
      setReturnQuantities(prev => {
        const newReturns = { ...prev };
        delete newReturns[request.id];
        return newReturns;
      });
    }
  };

  const formatDate = (date: Date | Timestamp | undefined) => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : (date as Timestamp).toDate();
    return format(dateObj, 'PP');
  }
  
  if (approvedRequests.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No items are currently borrowed.</p>;
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {approvedRequests.map(request => {
        const totalRequested = request.items.reduce((sum, item) => sum + item.quantity, 0);
        const totalReturned = request.items.reduce((sum, item) => sum + (item.returnedQuantity || 0), 0);
        const isFullyReturned = totalReturned >= totalRequested;

        return (
            <AccordionItem value={request.id} key={request.id} disabled={isFullyReturned}>
            <AccordionTrigger>
                <div className="flex w-full items-center justify-between pr-4">
                <div className="text-left">
                    <p className="font-semibold">{request.userName}</p>
                    <p className="text-sm text-muted-foreground">{request.department} - {request.year} Year</p>
                </div>
                { isFullyReturned ? <Badge>Fully Returned</Badge> : <Badge variant="outline">Borrowing</Badge>}
                <span className="text-sm text-muted-foreground">{formatDate(request.approvedAt)}</span>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <div className="space-y-4 p-2">
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {request.items.map(item => {
                    const remaining = item.quantity - (item.returnedQuantity || 0);
                    return (
                        <li key={item.componentId} className="p-3 bg-muted/50 rounded-md">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm">Requested: {item.quantity}</p>
                        <p className="text-sm">Returned: {item.returnedQuantity || 0}</p>
                        <p className="text-sm font-semibold">Remaining: {remaining}</p>
                        {remaining > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                            <Input
                                type="number"
                                min="0"
                                max={remaining}
                                placeholder="Return Qty"
                                className="h-9"
                                value={returnQuantities[request.id]?.[item.componentId] || ''}
                                onChange={(e) => handleQuantityChange(request.id, item.componentId, e.target.value)}
                            />
                            </div>
                        )}
                        </li>
                    );
                  })}
                </ul>
                <div className="flex justify-end pt-2">
                    <Button size="sm" onClick={() => handleSaveReturn(request)} disabled={!returnQuantities[request.id]}>
                        <Save className="mr-2 h-4 w-4" /> Save Return
                    </Button>
                </div>
                </div>
            </AccordionContent>
            </AccordionItem>
        )
        })}
    </Accordion>
  );
}
