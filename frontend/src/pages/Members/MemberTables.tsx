import React from "react";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import UserTable from "../../components/tables/BasicTables/UserTable";
import { useLazyListUsersQuery } from "../../store/services/userApi";

export default function BasicTables() {
  // RTK Query
  const [fetchUsers, { data: userRes, isLoading, isFetching }] = useLazyListUsersQuery();

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  return (
    <>
      <PageMeta
        title="React.js Basic Tables Dashboard | DYC"
        description="This is React.js Basic Tables Dashboard page for DYC"
      />
      <PageBreadcrumb pageTitle="Basic Tables" />
      <div className="space-y-6">
        <ComponentCard title="Basic Table 1">
          <UserTable users={userRes?.data || []} />
        </ComponentCard>
      </div>
    </>
  );
}
