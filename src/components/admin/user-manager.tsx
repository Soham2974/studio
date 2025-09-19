'use client';

import { useAppContext } from '@/context/app-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function UserManager() {
  const { users } = useAppContext();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Year</TableHead>
            <TableHead className="text-right">Joined On</TableHead>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
