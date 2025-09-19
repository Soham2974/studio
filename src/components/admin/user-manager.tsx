'use client';

import { useState } from 'react';
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit } from 'lucide-react';
import { useForm, SubmitHandler } from "react-hook-form";
import type { User } from '@/lib/types';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type FormValues = Omit<User, 'id' | 'createdAt'>;

export default function UserManager() {
  const { users, updateUser } = useAppContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { register, handleSubmit, reset, setValue } = useForm<FormValues>();

  const openForm = (user: User) => {
    setEditingUser(user);
    setValue('name', user.name);
    setValue('email', user.email);
    setValue('department', user.department);
    setValue('year', user.year);
    setIsFormOpen(true);
  };
  
  const onSubmit: SubmitHandler<FormValues> = (data) => {
    if (editingUser) {
      updateUser({ ...editingUser, ...data });
    }
    setIsFormOpen(false);
    reset();
  };

  return (
    <div>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline">Edit User Details</DialogTitle>
            <DialogDescription>
              Update the details of the registered member.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register('name', { required: true })} />
            </div>
             <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email', { required: true })} />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Input id="department" {...register('department', { required: true })} />
            </div>
            <div>
              <Label htmlFor="year">Year of Study</Label>
              <Input id="year" {...register('year', { required: true })} />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit" variant="accent">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Year</TableHead>
              <TableHead className="text-right">Joined On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                      <Avatar>
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                  </div>
                </TableCell>
                <TableCell>{user.department}</TableCell>
                <TableCell>{user.year}</TableCell>
                <TableCell className="text-right">{format(user.createdAt, 'PP')}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openForm(user)}>
                      <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
