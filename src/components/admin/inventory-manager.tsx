'use client';

import { useState } from 'react';
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit, Trash2, Cpu, CircuitBoard, Droplets, HardDrive, MemoryStick, RadioTower, Zap } from 'lucide-react';
import type { Component } from '@/lib/types';
import { useForm, SubmitHandler } from "react-hook-form";

type FormValues = Omit<Component, 'id' | 'icon'> & {icon: string};
const iconMap = { Cpu, CircuitBoard, Droplets, HardDrive, MemoryStick, RadioTower, Zap };

export default function InventoryManager() {
  const { components, addComponent, updateComponent, deleteComponent } = useAppContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);

  const { register, handleSubmit, reset, setValue } = useForm<FormValues>();

  const openForm = (component?: Component) => {
    if (component) {
      setEditingComponent(component);
      setValue('name', component.name);
      setValue('description', component.description);
      setValue('quantity', component.quantity);
      const iconName = Object.entries(iconMap).find(([, IconComponent]) => IconComponent === component.icon)?.[0] || 'Cpu';
      setValue('icon', iconName);
    } else {
      setEditingComponent(null);
      reset({name: '', description: '', quantity: 0, icon: 'Cpu'});
    }
    setIsFormOpen(true);
  };
  
  const onSubmit: SubmitHandler<FormValues> = (data) => {
    const componentData = { 
        ...data, 
        icon: iconMap[data.icon as keyof typeof iconMap] || Cpu 
    };

    if (editingComponent) {
      updateComponent({ ...editingComponent, ...componentData });
    } else {
      addComponent(componentData);
    }
    setIsFormOpen(false);
    reset();
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openForm()} variant="accent">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Component
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-headline">{editingComponent ? 'Edit' : 'Add'} Component</DialogTitle>
              <DialogDescription>
                {editingComponent ? 'Update the details of the existing component.' : 'Add a new component to the inventory.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Component Name</Label>
                <Input id="name" {...register('name', { required: true })} />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" {...register('description', { required: true })} />
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" type="number" {...register('quantity', { required: true, valueAsNumber: true, min: 0 })} />
              </div>
              <div>
                <Label htmlFor="icon">Icon</Label>
                <select id="icon" {...register('icon')} className="w-full p-2 border rounded-md">
                  {Object.keys(iconMap).map(iconName => (
                    <option key={iconName} value={iconName}>{iconName}</option>
                  ))}
                </select>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                <Button type="submit" variant="accent">{editingComponent ? 'Save Changes' : 'Add Component'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Icon</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {components.map((component) => {
                const Icon = component.icon;
                return (
                    <TableRow key={component.id}>
                        <TableCell><Icon className="h-6 w-6 text-primary" /></TableCell>
                        <TableCell className="font-medium">{component.name}</TableCell>
                        <TableCell className="text-muted-foreground">{component.description}</TableCell>
                        <TableCell className="text-right">{component.quantity}</TableCell>
                        <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openForm(component)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteComponent(component.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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
