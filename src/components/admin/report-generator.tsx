'use client';

import { useState } from 'react';
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import type { ComponentRequest } from '@/lib/types';
import { subMonths, subYears } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ReportItem = {
    name: string;
    quantity: number;
};

type Period = '1m' | '6m' | '1y' | 'all';

export default function ReportGenerator() {
  const { requests } = useAppContext();
  const [report, setReport] = useState<ReportItem[] | null>(null);
  const [period, setPeriod] = useState<Period>('1m');

  const generateReport = () => {
    let startDate: Date | null = new Date();
    switch (period) {
        case '1m':
            startDate = subMonths(new Date(), 1);
            break;
        case '6m':
            startDate = subMonths(new Date(), 6);
            break;
        case '1y':
            startDate = subYears(new Date(), 1);
            break;
        case 'all':
            startDate = null; // No start date filter for all time
            break;
    }

    const approvedRequests = requests.filter(
      r => r.status === 'approved' && r.approvedAt && (!startDate || new Date(r.approvedAt) >= startDate)
    );

    const componentSummary: { [name: string]: number } = {};
    approvedRequests.forEach(request => {
      request.items.forEach(item => {
        if (componentSummary[item.name]) {
          componentSummary[item.name] += item.quantity;
        } else {
          componentSummary[item.name] = item.quantity;
        }
      });
    });

    const reportData = Object.entries(componentSummary)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity);

    setReport(reportData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center items-center gap-4">
        <Select onValueChange={(value: Period) => setPeriod(value)} defaultValue={period}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="1m">Last 1 Month</SelectItem>
                <SelectItem value="6m">Last 6 Months</SelectItem>
                <SelectItem value="1y">Last 1 Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
        </Select>
        <Button onClick={generateReport} variant="accent">
          <FileText className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
      </div>
      {report && (
        report.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component Name</TableHead>
                  <TableHead className="text-right">Total Quantity Approved</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.map(item => (
                  <TableRow key={item.name}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No components were approved in the selected period.</p>
        )
      )}
    </div>
  );
}
