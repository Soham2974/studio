'use client';

import ComponentCatalog from '@/components/user/component-catalog';
import ComponentCart from '@/components/user/component-cart';

export default function UserDashboard() {
  return (
    <div className="container mx-auto grid grid-cols-1 gap-8 p-4 md:grid-cols-3 lg:p-8">
      <div className="md:col-span-2">
        <h2 className="font-headline text-3xl font-bold mb-4">Component Catalog</h2>
        <ComponentCatalog />
      </div>
      <div>
        <h2 className="font-headline text-3xl font-bold mb-4">Your Cart</h2>
        <ComponentCart />
      </div>
    </div>
  );
}
