"use client";
import AdminStatCards from "@/components/admin/AdminStatCards";

import { useState } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/Badges";
import FilterBar from "@/components/dashboard/FilterBar";
import AddCollectionModal from "@/components/dashboard/AddCollectionModal";
import { useAdminCollections, useDeleteCollection } from "@/hooks/useAdminCollections";
import { Collection } from "@/services/collections.service";
import { globalDialog } from "@/store/dialog.store";

export default function CollectionsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [collectionToEdit, setCollectionToEdit] = useState<Collection | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: response } = useAdminCollections({ search: searchQuery });
  const collections = response?.data || [];
  const deleteCollectionMutation = useDeleteCollection();

  const handleEdit = (collection: Collection) => {
    setCollectionToEdit(collection);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setCollectionToEdit(undefined);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (await globalDialog.confirm("Are you sure you want to delete this collection?")) {
      await deleteCollectionMutation.mutateAsync(id);
    }
  };

  const columns = [
    { header: "ID", accessor: (row: any) => row.id.substring(0, 8), className: "font-mono text-stone-500 text-xs" },
    { 
      header: "Collection Title", 
      accessor: (row: any) => (
        <button onClick={() => handleEdit(row)} className="font-semibold text-stone-900 hover:text-accent transition-colors text-left">
          {row.title}
        </button>
      )
    },
    { header: "Slug", accessor: "slug" as const, className: "font-mono text-xs text-stone-500" },
    { 
      header: "Type", 
      accessor: (row: any) => row.type.charAt(0) + row.type.slice(1).toLowerCase(), 
      className: "text-stone-600 font-inter text-sm" 
    },
    { header: "Products", accessor: (row: any) => row._count?.products || 0, className: "font-bold text-stone-800" },
    {
      header: "Status",
      accessor: (row: any) => (
        <StatusBadge label={row.status} variant={row.status === "Active" ? "success" : "neutral"} />
      ),
    },
    {
      header: "Actions",
      accessor: (row: any) => (
        <div className="flex items-center gap-2">
          <button onClick={() => handleEdit(row)} className="text-xs text-blue-600 hover:underline font-medium">Edit</button>
          <span className="text-stone-300">·</span>
          <button onClick={() => handleDelete(row.id)} disabled={deleteCollectionMutation.isPending} className="text-xs text-red-500 hover:underline font-medium disabled:opacity-50">Delete</button>
        </div>
      ),
    },
  ];

  const filters = (
    <>
      <select className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-sm font-inter text-stone-700 outline-none focus:ring-1 focus:ring-stone-900/50">
        <option>All Status</option>
        <option>Active</option>
        <option>Draft</option>
      </select>
      <select className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-sm font-inter text-stone-700 outline-none focus:ring-1 focus:ring-stone-900/50">
        <option>All Types</option>
        <option>Manual</option>
        <option>Automated</option>
      </select>
      <button 
        onClick={handleAdd}
        className="bg-stone-900 text-white hover:bg-stone-800 active:scale-95 px-5 py-2 rounded-lg font-inter text-sm font-semibold transition-all whitespace-nowrap ml-auto shadow-md shadow-stone-900/20 flex items-center gap-2"
      >
        + Add Collection
      </button>
    </>
  );

  return (
    <div className="flex flex-col p-4 md:p-10 max-w-[1280px] mx-auto w-full gap-6">
      <PageHeader
        title="Collections"
        description="Curate products into thematic collections for easier discovery."
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Collections", value: collections.length.toString() },
          { label: "Active", value: collections.filter(c => c.status === 'Active').length.toString() },
          { label: "Draft", value: collections.filter(c => c.status === 'Draft').length.toString() },
          { label: "Automated", value: collections.filter(c => c.type === 'AUTOMATED').length.toString() },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider font-inter">{s.label}</p>
            <p className="text-3xl font-bold text-foreground mt-1 font-inter">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6"><AdminStatCards metrics={[
  { title: "Total", value: collections.length.toString(), theme: "white-blue" },
  { title: "Active", value: collections.filter((c: any) => c.status === "ACTIVE").length.toString(), theme: "white-stone" },
  { title: "Pending", value: collections.filter((c: any) => c.status === "DRAFT").length.toString(), theme: "orange" }
]} /></div>
      <FilterBar 
        placeholder="Search collections..." 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters} 
      />

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <DataTable
          data={collections}
          columns={columns}
          keyExtractor={(row) => row.id}
          pagination={{ currentPage: 1, totalPages: 1 }}
        />
      </div>
      
      <AddCollectionModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        collectionToEdit={collectionToEdit}
      />
    </div>
  );
}
