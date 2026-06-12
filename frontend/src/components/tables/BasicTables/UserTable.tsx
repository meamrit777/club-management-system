import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../ui/table";

import { IUser } from "../../../interfaces";
import Badge from "../../ui/badge/Badge";

interface UsersTableProps {
  users: IUser[];
}

export default function UsersTable({ users }: UsersTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* HEADER */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader>User</TableCell>
              <TableCell isHeader>Email</TableCell>
              <TableCell isHeader>Phone</TableCell>
              <TableCell isHeader>Position</TableCell>
              <TableCell isHeader>Role</TableCell>
              <TableCell isHeader>Status</TableCell>
            </TableRow>
          </TableHeader>

          {/* BODY */}
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                {/* USER INFO */}
                <TableCell className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.profileImage}
                      alt={user.firstName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{user._id}</p>
                    </div>
                  </div>
                </TableCell>

                {/* EMAIL */}
                <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                  {user.email}
                </TableCell>

                {/* PHONE */}
                <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                  {user.phoneNumber}
                </TableCell>

                {/* POSITION */}
                <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                  {user.position}
                </TableCell>

                {/* ROLE */}
                <TableCell>
                  <Badge
                    size="sm"
                    color={
                      user.role === "SuperAdmin"
                        ? "error"
                        : user.role === "Admin"
                          ? "warning"
                          : "success"
                    }
                  >
                    {user.role}
                  </Badge>
                </TableCell>

                {/* STATUS */}
                <TableCell>
                  <Badge size="sm" color={user.isActive ? "success" : "error"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
