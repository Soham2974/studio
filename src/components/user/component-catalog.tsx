'use client';

import { useState } from 'react';
import { useAppContext } from '@/context/app-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ComponentCatalog() {
  const { components, addToCart } = useAppContext();
  const { toast } = useToast();
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [filter, setFilter] = useState('');

  const handleAddToCart = (componentId: string, name: string, availableQuantity: number) => {
    const quantity = quantities[componentId] || 1;
    if (quantity > availableQuantity) {
      toast({
        variant: 'destructive',
        title: 'Not enough stock',
        description: `Only ${availableQuantity} units of ${name} are available.`,
      });
      return;
    }
    addToCart(componentId, quantity);
    toast({
        title: `Added to cart`,
        description: `${quantity} x ${name} added to your cart.`
    });
  };

  const handleQuantityChange = (componentId: string, value: string) => {
    const numValue = parseInt(value, 10);
    setQuantities(prev => ({ ...prev, [componentId]: isNaN(numValue) || numValue < 1 ? 1 : numValue }));
  };

  const filteredComponents = components.filter(c => 
    c.name.toLowerCase().includes(filter.toLowerCase()) || 
    c.description.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
        <Input 
            placeholder="Search for components..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
        />
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead className="text-center">Available</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredComponents.map((component) => {
                    const Icon = component.icon;
                    return (
                        <TableRow key={component.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Icon className="h-8 w-8 text-primary shrink-0" />
                                <span className="font-medium">{component.name}</span>
                            </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{component.description}</TableCell>
                        <TableCell className="text-center">{component.quantity}</TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                            <Input
                                type="number"
                                min="1"
                                max={component.quantity}
                                className="w-16 h-9"
                                value={quantities[component.id] || 1}
                                onChange={e => handleQuantityChange(component.id, e.target.value)}
                                disabled={component.quantity === 0}
                            />
                            <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleAddToCart(component.id, component.name, component.quantity)}
                                disabled={component.quantity === 0}
                            >
                                <ShoppingCart className="h-4 w-4" />
                                <span className="sr-only">Add to Cart</span>
                            </Button>
                            </div>
                        </TableCell>
                        </TableRow>
                    );
                })}
                </TableBody>
            </Table>
        </div>
    </div>
  );
}
