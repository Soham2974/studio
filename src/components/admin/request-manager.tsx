'use client';

import { useState } from 'react';
import { useAppContext } from '@/context/app-context';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function RequestManager() {
  const { requests, approveRequest, rejectRequest } = useAppContext();
  const [loadingRequestId, setLoadingRequestId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setLoadingRequestId(id);
    await approveRequest(id);
    setLoadingRequestId(null);
  };
  
  const handleReject = (id: string) => {
    rejectRequest(id);
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');

  if (pendingRequests.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No pending requests.</p>;
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {pendingRequests.map(request => (
        <AccordionItem value={request.id} key={request.id}>
          <AccordionTrigger>
            <div className="flex w-full items-center justify-between pr-4">
              <div className="text-left">
                <p className="font-semibold">{request.userName}</p>
                <p className="text-sm text-muted-foreground">{request.department} - {request.year} Year</p>
              </div>
              <Badge variant="secondary">{format(request.createdAt, 'PP')}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 p-2">
              <div>
                <h4 className="font-semibold">Purpose</h4>
                <p className="text-muted-foreground">{request.purpose}</p>
              </div>
              <div>
                <h4 className="font-semibold">Requested Items</h4>
                <ul className="list-disc pl-5 text-muted-foreground">
                  {request.items.map(item => (
                    <li key={item.componentId}>{item.name} &times; {item.quantity}</li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => handleReject(request.id)} disabled={!!loadingRequestId}>
                  <XCircle className="mr-2 h-4 w-4"/> Reject
                </Button>
                <Button 
                    variant="accent" 
                    size="sm" 
                    onClick={() => handleApprove(request.id)} 
                    disabled={!!loadingRequestId}
                >
                  {loadingRequestId === request.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4"/>
                  )}
                  {loadingRequestId === request.id ? 'Approving...' : 'Approve'}
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
