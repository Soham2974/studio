'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, ListChecks, FileText, Users, Undo2 } from 'lucide-react';
import InventoryManager from '@/components/admin/inventory-manager';
import RequestManager from '@/components/admin/request-manager';
import ReportGenerator from '@/components/admin/report-generator';
import UserManager from '@/components/admin/user-manager';
import ReturnsManager from '@/components/admin/returns-manager';

export default function AdminDashboard() {
  return (
    <div className="container mx-auto p-4 lg:p-8">
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-5">
          <TabsTrigger value="inventory">
            <Shield className="mr-2 h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="requests">
            <ListChecks className="mr-2 h-4 w-4" />
            Requests
          </TabsTrigger>
          <TabsTrigger value="returns">
            <Undo2 className="mr-2 h-4 w-4" />
            Returns
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="report">
            <FileText className="mr-2 h-4 w-4" />
            Report
          </TabsTrigger>
        </TabsList>
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Inventory Management</CardTitle>
              <CardDescription>Add, edit, or delete components in the inventory.</CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryManager />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Pending Requests</CardTitle>
              <CardDescription>Review and approve or reject user component requests.</CardDescription>
            </CardHeader>
            <CardContent>
              <RequestManager />
            </CardContent>
          </Card>
        </TabsContent>
         <TabsContent value="returns">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Manage Returns</CardTitle>
                    <CardDescription>Track and process returned components from members.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ReturnsManager />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="users">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">User Management</CardTitle>
                    <CardDescription>View and edit details of all registered members.</CardDescription>
                </CardHeader>
                <CardContent>
                    <UserManager />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="report">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Request Report</CardTitle>
              <CardDescription>Generate a detailed log of component requests for a specific period.</CardDescription>
            </CardHeader>
            <CardContent>
              <ReportGenerator />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
