"use client";

import { useState, useEffect } from "react";
import { X, ImagePlus } from "lucide-react";
import Image from "next/image";

import { useCreateCategory, useUpdateCategory } from "@/hooks/useCategories";
import { Category } from "@/types/category";
import MediaPickerModal from "@/components/admin/MediaPickerModal";

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: Category;
}

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function CategoryFormModal({ isOpen, onClose, categoryToEdit }: CategoryFormModalProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [status, setStatus] = useState("Active");

  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();

  useEffect(() => {
    if (categoryToEdit && isOpen) {
      setName(categoryToEdit.name || "");
      setSlug(categoryToEdit.slug || "");
      setDescription(categoryToEdit.description || "");
      setImageUrl(categoryToEdit.imageUrl || "");
      setStatus(categoryToEdit.status || "Active");
      setSlugEdited(true);
    } else if (!categoryToEdit && isOpen) {
      setName("");
      setSlug("");
      setDescription("");
      setImageUrl("");
      setStatus("Active");
      setSlugEdited(false);
    }
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  function handleNameChange(val: string) {
    setName(val);
    if (!slugEdited) setSlug(generateSlug(val));
  }

  async function handleSave() {
    try {
      const payload = {
        name,
        slug: slug || undefined,
        description,
        status,
        imageUrl: imageUrl || undefined,
      };

      if (categoryToEdit) {
        await updateCategoryMutation.mutateAsync({ id: categoryToEdit.id, data: payload });
      } else {
        await createCategoryMutation.mutateAsync(payload);
      }
      onClose();
    } catch (error) {
      console.error("Failed to save category", error);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative w-full max-w-[600px] bg-surface border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background shrink-0">
          <div>
            <h2 className="font-inter font-bold text-lg text-foreground">{categoryToEdit ? "Edit Category" : "Add New Category"}</h2>
            <p className="font-inter text-xs text-muted mt-0.5">{categoryToEdit ? "Update category details." : "Create a new product category."}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-hover rounded-lg text-muted hover:text-foreground transition-colors" aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
          
          <div className="flex flex-col gap-2">
            <label className="font-inter text-xs font-semibold text-foreground">Category Cover Image</label>
            <div 
              onClick={() => setIsMediaModalOpen(true)}
              className="w-full h-40 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-surface-hover transition-colors flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group"
            >
              {imageUrl ? (
                <>
                  <Image src={imageUrl} alt="Category Cover" fill className="object-cover" />
                  <div className="absolute inset-0 bg-stone-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="font-inter text-white text-xs font-medium">Change Image</p>
                  </div>
                </>
              ) : (
                <>
                  <ImagePlus size={24} className="text-muted mb-2" />
                  <p className="font-inter text-sm font-medium text-foreground">Browse Media</p>
                  <p className="font-inter text-xs text-muted">Click to select from library</p>
                </>
              )}
            </div>
            {imageUrl && (
              <button 
                onClick={(e) => { e.stopPropagation(); setImageUrl(""); }}
                className="self-start text-[11px] font-inter font-medium text-red-500 hover:text-red-400"
              >
                Remove Image
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-inter text-xs font-semibold text-foreground">Category Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="e.g. Apparel, Groceries, Electronics, Automotive"
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-inter"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-inter text-xs font-semibold text-foreground">Category Slug</label>
            <div className="flex items-center border border-border rounded-lg overflow-hidden bg-background focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
              <span className="px-3 py-2.5 bg-surface text-muted text-sm border-r border-border font-mono">/categories/</span>
              <input
                type="text"
                value={slug}
                onChange={e => { setSlug(e.target.value); setSlugEdited(true); }}
                className="flex-1 px-3 py-2.5 text-sm outline-none font-mono bg-transparent text-foreground placeholder:text-muted"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-inter text-xs font-semibold text-foreground">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Brief description for internal catalog and categorization..."
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-inter resize-none"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
            <div>
              <h3 className="font-inter font-bold text-sm text-foreground">Category Status</h3>
              <p className="font-inter text-xs text-muted mt-0.5">Control visibility across the platform.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={status === "Active"} onChange={e => setStatus(e.target.checked ? "Active" : "Inactive")} />
              <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 bg-background shrink-0 flex items-center justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-surface border border-border rounded-lg font-inter font-medium text-sm text-foreground hover:bg-surface-hover transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || createCategoryMutation.isPending || updateCategoryMutation.isPending}
            className="px-5 py-2 bg-primary text-white rounded-lg font-inter font-medium text-sm hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createCategoryMutation.isPending || updateCategoryMutation.isPending ? "Saving..." : "Save Category"}
          </button>
        </div>
      </div>
      
      {isMediaModalOpen && (
        <MediaPickerModal
          onClose={() => setIsMediaModalOpen(false)}
          onSelect={(url) => { setImageUrl(url); setIsMediaModalOpen(false); }}
          title="Select Category Image"
        />
      )}
    </div>
  );
}
