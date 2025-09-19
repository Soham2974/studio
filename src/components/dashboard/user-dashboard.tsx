'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, ShoppingCart, History } from 'lucide-react';
import ComponentCatalog from '@/components/user/component-catalog';
import ComponentCart from '@/components/user/component-cart';
import UserRequestHistory from '@/components/user/user-request-history';

export default function UserDashboard() {
  return (
    <div className="container mx-auto p-4 lg:p-8">
      <Tabs defaultValue="catalog" className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="catalog">
            <Package className="mr-2 h-4 w-4" />
            Component Catalog
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            My Requests
          </TabsTrigger>
        </TabsList>
        <TabsContent value="catalog">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="md:col-span-2">
              <ComponentCatalog />
            </div>
            <div>
              <ComponentCart />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="history">
            <UserRequestHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
