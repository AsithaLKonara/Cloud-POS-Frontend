"use client";
import AdminStatCards from "@/components/admin/AdminStatCards";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/dashboard/PageHeader";
import FilterBar from "@/components/dashboard/FilterBar";
import DataTable from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/Badges";
import { useCustomers } from "@/hooks/useCustomers";
import { useDebounce } from "use-debounce";

export default function CustomersPage() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 500);
  const [typeFilter, setTypeFilter] = useState("");
  const [sortFilter, setSortFilter] = useState("Sort By: Newest");
  const [page, setPage] = useState(1);

  const { data: customerData, isLoading } = useCustomers({
    search: debouncedSearch || undefined,
    type: typeFilter === "All Types" ? undefined : (typeFilter || undefined),
    sort: sortFilter || undefined,
    page: page
  });

  const customers = customerData?.data || [];
  const meta = customerData?.meta || { totalPages: 1, page: 1 };

  const columns = [
    { header: "Name", accessor: "name" as const },
    { header: "Phone", accessor: "phone" as const },
    { header: "Email", accessor: "email" as const },
    { 
      header: "Type", 
      accessor: (row: any) => (
        <StatusBadge 
          label={row.type} 
          variant={row.type === "Registered" ? "success" : "neutral"} 
          dot 
        />
      ) 
    },
    { header: "Orders", accessor: "orders" as const },
    { header: "Total Spent", accessor: "spent" as const },
    { header: "Last Active", accessor: "lastActive" as const },
  ];

  const filters = (
    <>
      <select 
        value={typeFilter}
        onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
        className="bg-background border border-border rounded-lg py-2 px-3 text-sm font-inter text-foreground outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors cursor-pointer"
      >
        <option value="" className="bg-surface text-foreground">All Types</option>
        <option value="Registered" className="bg-surface text-foreground">Registered</option>
        <option value="Guest" className="bg-surface text-foreground">Guest</option>
      </select>
      <select 
        value={sortFilter}
        onChange={e => { setSortFilter(e.target.value); setPage(1); }}
        className="bg-background border border-border rounded-lg py-2 px-3 text-sm font-inter text-foreground outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors cursor-pointer"
      >
        <option value="Sort By: Newest" className="bg-surface text-foreground">Sort By: Newest</option>
        <option value="Sort By: Highest Spend" className="bg-surface text-foreground">Sort By: Highest Spend</option>
        <option value="Sort By: Most Orders" className="bg-surface text-foreground">Sort By: Most Orders</option>
      </select>
    </>
  );

  return (
    <div className="flex flex-col p-4 md:p-10 max-w-[1280px] mx-auto w-full">
      <PageHeader 
        title="Customers" 
        description="View and manage registered customers and guest checkout histories."
      />

      <div className="mb-6"><AdminStatCards metrics={[
  { title: "Total", value: meta?.total?.toString() || customers.length.toString(), theme: "white-blue" },
  { title: "Active", value: customers.filter((c: any) => c.status === "ACTIVE").length.toString(), theme: "white-stone" },
  { title: "Pending", value: customers.filter((c: any) => c.status === "INACTIVE").length.toString(), theme: "orange" }
]} /></div>
      <FilterBar 
        placeholder="Search by name, phone, or email..." 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters} 
      />

      <DataTable 
        data={customers}
        columns={columns}
        keyExtractor={(row) => row.id}
        onRowClick={(row) => console.log("Navigate to", row.id)}
        pagination={{ 
          currentPage: meta.page, 
          totalPages: meta.totalPages || 1,
          onPageChange: (newPage) => setPage(newPage)
        }}
      />
    </div>
  );
}
