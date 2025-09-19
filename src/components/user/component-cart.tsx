'use client';

import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/app-context';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Send, ShoppingCart } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { useForm, SubmitHandler } from "react-hook-form";
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { UserDetails } from '@/lib/types';

const RequestFormSchema = z.object({
  purpose: z.string().min(1, "Purpose is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().regex(/^\+91[0-9]{10}$/, "Phone number must be in +91XXXXXXXXXX format"),
  department: z.string().min(1, "Department is required"),
  year: z.string().min(1, "Year is required"),
});

type FormValues = z.infer<typeof RequestFormSchema>;

export default function ComponentCart() {
  const { cart, components, removeFromCart, updateCartQuantity, submitRequest, clearCart, userDetails } = useAppContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(RequestFormSchema),
    defaultValues: {
      purpose: '',
      name: '',
      email: '',
      phoneNumber: '',
      department: '',
      year: '',
    }
  });

  useEffect(() => {
    if (userDetails && isFormOpen) {
      form.reset({
        purpose: '',
        name: userDetails.name || '',
        email: userDetails.email || '',
        phoneNumber: userDetails.phoneNumber || '',
        department: userDetails.department || '',
        year: userDetails.year || '',
      });
    } else if (isFormOpen) {
      form.reset({
        purpose: '',
        name: '',
        email: '',
        phoneNumber: '',
        department: '',
        year: '',
      });
    }
  }, [userDetails, isFormOpen, form]);


  const cartDetails = cart.map(item => {
    const component = components.find(c => c.id === item.componentId);
    return { ...item, name: component?.name, availableQuantity: component?.quantity };
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    submitRequest(data);
    setIsFormOpen(false);
    form.reset();
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="font-headline flex items-center justify-between">
          <span>Component Cart</span>
          <Badge variant="secondary">{totalItems} items</Badge>
        </CardTitle>
        <CardDescription>Review items before submitting your request.</CardDescription>
      </CardHeader>
      <CardContent>
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mb-4"/>
            <p className="text-muted-foreground">Your cart is empty.</p>
            <p className="text-sm text-muted-foreground/80">Add components from the catalog.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {cartDetails.map(item => (
              <div key={item.componentId} className="flex items-center justify-between gap-2">
                <div className="flex-grow">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <Input
                  type="number"
                  min="1"
                  max={item.availableQuantity}
                  className="w-16 h-9"
                  value={item.quantity}
                  onChange={e => updateCartQuantity(item.componentId!, isNaN(parseInt(e.target.value, 10)) ? 1 : parseInt(e.target.value, 10))}
                />
                <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.componentId!)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button className="w-full" disabled={cart.length === 0} variant="accent">
                    <Send className="mr-2 h-4 w-4" />
                    Submit Request
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-headline">Submit Component Request</DialogTitle>
                    <DialogDescription>
                        Please confirm your details and provide the purpose for this request.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                        <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="department" render={({ field }) => (
                        <FormItem><FormLabel>Department</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                    )}/>
                     <FormField control={form.control} name="year" render={({ field }) => (
                        <FormItem><FormLabel>Year</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="purpose" render={({ field }) => (
                        <FormItem><FormLabel>Purpose of Use</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <DialogFooter>
                      <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                      <Button type="submit" variant="accent">Confirm & Submit</Button>
                    </DialogFooter>
                </form>
                </Form>
            </DialogContent>
        </Dialog>
        <Button className="w-full" variant="outline" onClick={clearCart} disabled={cart.length === 0}>
            Clear Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
