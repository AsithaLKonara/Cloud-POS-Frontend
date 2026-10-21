"use client";
import AdminStatCards from "@/components/admin/AdminStatCards";

import { useState } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/Badges";
import FilterBar from "@/components/dashboard/FilterBar";
import CategoryFormModal from "@/components/dashboard/CategoryFormModal";
import { useCategories, useDeleteCategory } from "@/hooks/useCategories";
import { Category } from "@/types/category";
import { globalDialog } from "@/store/dialog.store";

export default function CategoriesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: response, isLoading } = useCategories({ search: searchQuery });
  const categories = response?.data || [];
  
  const deleteCategoryMutation = useDeleteCategory();

  const handleEdit = (category: Category) => {
    setCategoryToEdit(category);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setCategoryToEdit(undefined);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (await globalDialog.confirm("Are you sure you want to delete this category?")) {
      await deleteCategoryMutation.mutateAsync(id);
    }
  };

  const columns = [
    { header: "ID", accessor: (row: any) => row.id.substring(0, 8), className: "font-mono text-muted text-xs" },
    { 
      header: "Category Name", 
      accessor: (row: any) => (
        <button onClick={() => handleEdit(row)} className="font-semibold text-foreground hover:text-primary transition-colors text-left">
          {row.name}
        </button>
      )
    },
    { header: "Slug", accessor: "slug" as const, className: "font-mono text-xs text-muted" },
    { 
      header: "Products", 
      accessor: (row: any) => row._count?.products || 0,
      className: "font-bold text-foreground font-mono" 
    },
    {
      header: "Status",
      accessor: (row: any) => (
        <StatusBadge 
          label={row.status || "Active"} 
          variant={row.status === 'Inactive' ? 'neutral' : 'success'} 
        />
      ),
    },
    {
      header: "Actions",
      accessor: (row: any) => (
        <div className="flex items-center gap-2">
          <button onClick={() => handleEdit(row)} className="text-xs text-blue-600 hover:underline font-medium">Edit</button>
          <span className="text-stone-300">·</span>
          <button onClick={() => handleDelete(row.id)} disabled={deleteCategoryMutation.isPending} className="text-xs text-red-500 hover:underline font-medium disabled:opacity-50">Delete</button>
        </div>
      ),
    },
  ];

  const filters = (
    <>
      {/* Category status filter doesn't currently exist in schema. Hiding static mock for now. */}
      <button 
        onClick={handleAdd}
        className="bg-stone-900 text-white hover:bg-stone-800 active:scale-95 px-5 py-2 rounded-lg font-inter text-sm font-semibold transition-all whitespace-nowrap ml-auto shadow-md shadow-stone-900/20 flex items-center gap-2"
      >
        + Add Category
      </button>
    </>
  );

  return (
    <div className="flex flex-col p-4 md:p-10 max-w-[1280px] mx-auto w-full gap-6">
      <PageHeader
        title="Categories"
        description="Manage product categories and sub-categories for your catalog."
      />

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Categories", value: categories.length.toString() },
          { label: "Active", value: categories.length.toString() },
          { label: "Draft", value: "0" },
          { label: "Total Products Categorized", value: categories.reduce((sum: number, c: any) => sum + (c._count?.products || 0), 0).toString() },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider font-inter">{s.label}</p>
            <p className="text-3xl font-bold text-foreground mt-1 font-inter font-mono">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6"><AdminStatCards metrics={[
  { title: "Total", value: categories.length.toString(), theme: "white-blue" },
  { title: "Active", value: categories.filter((c: any) => c.status !== "Inactive").length.toString(), theme: "white-stone" },
  { title: "Pending", value: "0", theme: "orange" }
]} /></div>
      <FilterBar 
        placeholder="Search categories..." 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters} 
      />

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <DataTable
          data={categories}
          columns={columns}
          keyExtractor={(row) => row.id}
          pagination={{ currentPage: 1, totalPages: 1 }}
        />
      </div>
      
      <CategoryFormModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        categoryToEdit={categoryToEdit} 
      />
    </div>
  );
}
