'use client';

import { useState } from 'react';
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import type { ComponentRequest } from '@/lib/types';
import { subDays } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type ReportItem = {
    name: string;
    quantity: number;
};

export default function ReportGenerator() {
  const { requests } = useAppContext();
  const [report, setReport] = useState<ReportItem[] | null>(null);

  const generateReport = () => {
    const sevenDaysAgo = subDays(new Date(), 7);
    const approvedRequests = requests.filter(
      r => r.status === 'approved' && r.approvedAt && new Date(r.approvedAt) >= sevenDaysAgo
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
      <div className="flex justify-center">
        <Button onClick={generateReport} variant="accent">
          <FileText className="mr-2 h-4 w-4" />
          Generate Weekly Report
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
          <p className="text-center text-muted-foreground py-8">No components were approved in the last 7 days.</p>
        )
      )}
    </div>
  );
}
