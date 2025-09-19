'use client';

import { useState } from 'react';
import { useAppContext } from '@/context/app-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { subDays, subMonths, subYears } from 'date-fns';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import type { ComponentRequest } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

type Period = '7d' | '1m' | '6m' | '1y' | 'all';

export default function ReportGenerator() {
  const { requests } = useAppContext();
  const [period, setPeriod] = useState<Period>('7d');

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

  const getReturnStatus = (request: ComponentRequest) => {
    if (request.status !== 'approved' && request.status !== 'partially-returned' && request.status !== 'returned') return 'N/A';
    
    const totalRequested = request.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    const totalReturned = request.items.reduce((sum: number, item: any) => sum + (item.returnedQuantity || 0), 0);
    
    if (totalReturned === 0) return 'Borrowing';
    if (totalReturned < totalRequested) return 'Partially Returned';
    return 'Fully Returned';
  }

  const filteredRequests = requests.filter(request => {
    if (period === 'all') return true;
    const requestDate = (request.approvedAt || request.createdAt) as Timestamp;
    if (!requestDate) return false;

    let startDate: Date;
    switch (period) {
      case '7d':
        startDate = subDays(new Date(), 7);
        break;
      case '1m':
        startDate = subMonths(new Date(), 1);
        break;
      case '6m':
        startDate = subMonths(new Date(), 6);
        break;
      case '1y':
        startDate = subYears(new Date(), 1);
        break;
    }
    return requestDate.toDate() >= startDate;
  });
  
  const formatDate = (date: Date | Timestamp | undefined) => {
    if (!date) return '';
    const dateObj = date instanceof Timestamp ? date.toDate() : date;
    return format(dateObj, 'PP');
  }

  const handleDownload = () => {
    if (filteredRequests.length === 0) return;

    const headers = [
      "Sr.",
      "Student",
      "Department",
      "Year",
      "Purpose",
      "Date",
      "Items",
      "Status",
      "Return Status"
    ];

    const csvRows = [headers.join(',')];

    filteredRequests.forEach((request, index) => {
      const itemsString = request.items
        .map(item => `"${item.name} x ${item.quantity}"`)
        .join('; ');
      
      const date = formatDate(request.approvedAt || request.createdAt);
      const returnStatus = getReturnStatus(request);
      
      const values = [
        index + 1,
        `"${request.userName}"`,
        `"${request.department}"`,
        `"${request.year} Year"`,
        `"${request.purpose.replace(/"/g, '""')}"`,
        `"${date}"`,
        `"${itemsString}"`,
        `"${request.status}"`,
        `"${returnStatus}"`
      ];
      csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `report-${period}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-start items-center gap-4">
        <Select onValueChange={(value: Period) => setPeriod(value)} defaultValue={period}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="1m">Last 1 Month</SelectItem>
                <SelectItem value="6m">Last 6 Months</SelectItem>
                <SelectItem value="1y">Last 1 Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
        </Select>
        <Button onClick={handleDownload} disabled={filteredRequests.length === 0} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download Report
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sr.</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Return Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.map((request, index) => (
              <TableRow key={request.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-medium">{request.userName}</TableCell>
                <TableCell>
                    <div className="flex flex-col">
                        <span className="text-sm">{request.department}</span>
                        <span className="text-xs text-muted-foreground">{request.year} Year</span>
                    </div>
                </TableCell>
                <TableCell className="max-w-xs truncate">{request.purpose}</TableCell>
                <TableCell>{formatDate(request.approvedAt || request.createdAt)}</TableCell>
                <TableCell>
                    <ul className="list-disc pl-4">
                        {request.items.map(item => <li key={item.componentId}>{item.name} &times; {item.quantity}</li>)}
                    </ul>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(request.status)}>{request.status}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getReturnStatus(request) === 'Fully Returned' ? 'secondary' : 'outline'}>
                    {getReturnStatus(request)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {filteredRequests.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No requests found for the selected period.</p>
      )}
    </div>
  );
}
