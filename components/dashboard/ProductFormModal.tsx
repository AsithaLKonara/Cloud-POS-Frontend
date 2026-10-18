"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  ImagePlus,
  Trash2,
  Plus,
  Info,
  AlertCircle,
  Package,
  Layers,
  DollarSign,
  Box,
  Wrench,
  Printer,
  Sparkles,
  Droplets,
  Zap,
  FlaskConical,
  Car,
} from "lucide-react";
import BarcodeLib from "react-barcode";
import { useReactToPrint } from "react-to-print";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProductSchema, CreateProductFormData } from "@/lib/validations";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useAdminCollections } from "@/hooks/useAdminCollections";
import { useBranches } from "@/hooks/useInventory";
import { toast } from "@/store/toast.store";
import MediaPickerModal from "@/components/admin/MediaPickerModal";
import Image from "next/image";

interface Variant {
  id: string;
  size: string; // Pack Unit e.g. "4L Can", "1L Can", "Piece"
  color: string; // Spec/Grade/Type e.g. "0W-20", "Standard"
  sku: string;
  barcode: string;
  stock: { [branch: string]: number };
  price: string;
  compareAtPrice: string;
  costPrice?: string;
  wholesalePrice?: string;
  packUnit?: string;
  unitVolumeLiters?: string;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: any;
}

const PRODUCT_TYPES = [
  { value: "LUBRICANT", label: "Lubricant / Engine Oil", icon: Droplets, desc: "Engine oil, Gear oil, ATF, Hydraulic fluid" },
  { value: "FILTER", label: "Oil / Air / Cabin Filter", icon: Wrench, desc: "Spin-on, Cartridge, Air, Cabin, Fuel filters" },
  { value: "BATTERY", label: "Automotive Battery", icon: Zap, desc: "Maintenance-free, AGM, EFB automotive batteries" },
  { value: "CAR_CARE", label: "Coolant & Car Care Fluid", icon: FlaskConical, desc: "Radiator coolant, Brake fluid, Additives, Flushes" },
  { value: "SPARE_PART", label: "Spare Part & Spark Plug", icon: Sparkles, desc: "Spark plugs, Belts, Wiper blades, Bulbs" },
  { value: "ACCESSORY", label: "Vehicle Accessory", icon: Car, desc: "Car accessories and maintenance tools" },
  { value: "SERVICE", label: "Labor & Service Package", icon: Wrench, desc: "Oil change labor, Filter replacement, Inspection" },
  { value: "GENERAL", label: "General Merchandise", icon: Package, desc: "Other retail items" },
];

const COMMON_VISCOSITIES = [
  "0W-16", "0W-20", "5W-20", "5W-30", "5W-40",
  "10W-30", "10W-40", "15W-40", "20W-50",
  "ATF WS", "ATF T-IV", "CVTF", "75W-90", "80W-90", "85W-140"
];

const OIL_TYPES = ["Fully Synthetic", "Semi-Synthetic", "Mineral", "Hydrocracked Synthetic"];

const API_STANDARDS = ["API SP", "API SN Plus", "API SN/CF", "API CK-4", "API CI-4", "API GL-5", "JASO MA2", "JASO DL-1"];

const PACK_PRESETS_BY_TYPE: Record<string, string[]> = {
  LUBRICANT: ["1L Can", "4L Can", "5L Can", "20L Pail", "208L Drum"],
  FILTER: ["Single Piece", "Pack of 10"],
  BATTERY: ["Single Unit"],
  CAR_CARE: ["1L Bottle", "4L Can", "500ml Bottle", "300ml Spray"],
  SPARE_PART: ["Single Piece", "Set of 4 (Plugs)"],
  ACCESSORY: ["Single Piece"],
  SERVICE: ["Standard Service Job"],
  GENERAL: ["Single Unit"],
};

const SECTION_TABS = [
  { id: "basic", label: "Basic Info", icon: Package },
  { id: "specs", label: "Specifications & Fitment", icon: Wrench },
  { id: "variants", label: "Pack Units & Pricing", icon: Layers },
  { id: "pricing", label: "Base Margins & COGS", icon: DollarSign },
  { id: "inventory", label: "Branch Stock Matrix", icon: Box },
  { id: "media", label: "Product Media", icon: ImagePlus },
];

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function generateSKU(name: string, type: string, pack: string) {
  const prefix = type ? type.slice(0, 3).toUpperCase() : "PRD";
  const nameCode = name ? name.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase() : "ITEM";
  const packCode = pack.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase() || "STD";
  return `${prefix}-${nameCode}-${packCode}`;
}

export default function ProductFormModal({ isOpen, onClose, productToEdit }: ProductFormModalProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [slugEdited, setSlugEdited] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [newPackUnit, setNewPackUnit] = useState("");
  const [images, setImages] = useState<string[]>(["", "", "", ""]);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [activeImageSlot, setActiveImageSlot] = useState<number | null>(null);
  const [initialGlobalStock, setInitialGlobalStock] = useState<number>(0);
  const [printingVariant, setPrintingVariant] = useState<{ barcode: string; label: string } | null>(null);
  const [showBulkBarcodePrint, setShowBulkBarcodePrint] = useState(false);

  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const { data: categoriesData } = useCategories();
  const { data: collectionsData } = useAdminCollections();
  const { data: branchesData } = useBranches();
  
  const categories = categoriesData?.data || [];
  const collections = collectionsData?.data || [];
  const branchCodes = (branchesData || []).map((b: any) => b.code);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateProductFormData>({
    resolver: zodResolver(createProductSchema) as any,
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      productType: "LUBRICANT",
      brand: "",
      viscosity: "",
      oilType: "",
      apiStandard: "",
      partNumber: "",
      compatibleVehicles: "",
      category: "",
      collection: "",
      basePrice: "",
      compareAtPrice: "",
      costPrice: "",
      wholesalePrice: "",
      tags: "",
      metaTitle: "",
      metaDesc: "",
    }
  });

  const productName = watch("name");
  const currentProductType = watch("productType") || "LUBRICANT";
  const basePrice = watch("basePrice");
  const costPrice = watch("costPrice");
  const wholesalePrice = watch("wholesalePrice");

  // Keep slug in sync unless manually edited
  useEffect(() => {
    if (!slugEdited && productName && !productToEdit) {
      setValue("slug", generateSlug(productName));
    }
  }, [productName, slugEdited, setValue, productToEdit]);

  // Load existing product data if editing
  useEffect(() => {
    if (productToEdit && isOpen) {
      setValue("name", productToEdit.name || "");
      setValue("slug", productToEdit.slug || "");
      setValue("description", productToEdit.description || "");
      setValue("category", productToEdit.categoryId || "");
      setValue("productType", (productToEdit.productType as any) || "LUBRICANT");
      setValue("brand", productToEdit.brand || "");
      setValue("viscosity", productToEdit.viscosity || "");
      setValue("oilType", productToEdit.oilType || "");
      setValue("apiStandard", productToEdit.apiStandard || "");
      setValue("partNumber", productToEdit.partNumber || "");
      setValue("compatibleVehicles", productToEdit.compatibleVehicles || "");
      setSlugEdited(true);

      if (productToEdit.variants && productToEdit.variants.length > 0) {
        const firstVariant = productToEdit.variants[0];
        setValue("basePrice", firstVariant.price.toString());
        if (firstVariant.salePrice) setValue("compareAtPrice", firstVariant.salePrice.toString());
        if (firstVariant.costPrice) setValue("costPrice", firstVariant.costPrice.toString());
        if (firstVariant.wholesalePrice) setValue("wholesalePrice", firstVariant.wholesalePrice.toString());

        const loadedVariants: Variant[] = productToEdit.variants.map((v: any) => ({
          id: v.id,
          size: v.packUnit || v.size || "Standard",
          color: v.color || "Standard",
          sku: v.sku || "",
          barcode: v.barcode || `20${Math.floor(10000000000 + Math.random() * 89999999999)}`,
          stock: branchCodes.reduce((acc: any, code: string) => {
            const branchInventory = v.inventoryItems?.find((inv: any) => inv.branch?.code === code);
            acc[code] = branchInventory?.quantity || 0;
            return acc;
          }, {}),
          price: v.price.toString(),
          compareAtPrice: v.salePrice ? v.salePrice.toString() : "",
          costPrice: v.costPrice ? v.costPrice.toString() : "",
          wholesalePrice: v.wholesalePrice ? v.wholesalePrice.toString() : "",
          packUnit: v.packUnit || v.size || "Standard",
          unitVolumeLiters: v.unitVolumeLiters ? v.unitVolumeLiters.toString() : "",
        }));

        if (firstVariant.featuredImage) {
          const newImages = [firstVariant.featuredImage, ...(firstVariant.gallery || []), "", "", ""].slice(0, 4);
          setImages(newImages);
        }

        setVariants(loadedVariants);
      }
    } else if (!productToEdit && isOpen) {
      setValue("name", "");
      setValue("slug", "");
      setValue("description", "");
      setValue("productType", "LUBRICANT");
      setValue("brand", "");
      setValue("viscosity", "");
      setValue("oilType", "");
      setValue("apiStandard", "");
      setValue("partNumber", "");
      setValue("compatibleVehicles", "");
      setValue("basePrice", "");
      setValue("compareAtPrice", "");
      setValue("costPrice", "");
      setValue("wholesalePrice", "");
      setSlugEdited(false);
      setVariants([]);
      setImages(["", "", "", ""]);
      setActiveTab("basic");
    }
  }, [productToEdit, isOpen, setValue]);

  // Quick add variant for a pack unit
  function handleAddPackUnit(packUnitName: string) {
    if (!packUnitName.trim()) return;
    const existing = variants.find(v => v.size.toLowerCase() === packUnitName.toLowerCase());
    if (existing) {
      toast.error(`Pack unit "${packUnitName}" already exists`);
      return;
    }

    const defaultPrice = basePrice || "0";
    const defaultCost = costPrice || "0";
    const defaultWholesale = wholesalePrice || "0";

    const newVar: Variant = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      size: packUnitName.trim(),
      color: "Standard",
      sku: generateSKU(productName, currentProductType, packUnitName.trim()),
      barcode: `20${Math.floor(10000000000 + Math.random() * 89999999999)}`,
      stock: Object.fromEntries(branchCodes.map((b: string) => [b, initialGlobalStock])),
      price: defaultPrice,
      compareAtPrice: "",
      costPrice: defaultCost,
      wholesalePrice: defaultWholesale,
      packUnit: packUnitName.trim(),
      unitVolumeLiters: packUnitName.includes("1L") ? "1" : packUnitName.includes("4L") ? "4" : packUnitName.includes("5L") ? "5" : packUnitName.includes("20L") ? "20" : packUnitName.includes("208L") ? "208" : "",
    };

    setVariants(prev => [...prev, newVar]);
    setNewPackUnit("");
    toast.success(`Added ${packUnitName} pack unit`);
  }

  function updateVariantStock(id: string, branch: string, val: number) {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, stock: { ...v.stock, [branch]: val } } : v));
  }

  function updateVariantField(id: string, field: keyof Variant, val: string) {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: val } : v));
  }

  function removeVariant(id: string) {
    setVariants(prev => prev.filter(v => v.id !== id));
  }

  function applyStockToAll() {
    if (variants.length === 0) return toast.error("Add pack units/variants first");
    setVariants(prev => prev.map(v => ({
      ...v,
      stock: Object.fromEntries(branchCodes.map((b: string) => [b, initialGlobalStock]))
    })));
    toast.success(`Applied ${initialGlobalStock} stock to all variants`);
  }

  const onSubmit = async (data: CreateProductFormData) => {
    try {
      if (variants.length === 0) {
        toast.error("Please add at least one pack unit or variant before saving.");
        setActiveTab("variants");
        return;
      }

      const branchCodeToId = Object.fromEntries(
        (branchesData || []).map((b: any) => [b.code, b.id])
      );

      const formatVariantPayload = (v: Variant, isUpdate: boolean = false) => {
        const existingVariant = isUpdate && productToEdit 
          ? productToEdit.variants?.find((pv: any) => pv.id === v.id) 
          : null;
        
        const inventoryUpdate: any[] = [];
        const inventoryCreate: any[] = [];
        
        Object.entries(v.stock).forEach(([code, qty]) => {
          const branchId = branchCodeToId[code];
          if (!branchId) return;
          
          const existingItem = existingVariant?.inventoryItems?.find((inv: any) => inv.branchId === branchId);
          
          if (existingItem) {
            inventoryUpdate.push({
              where: { id: existingItem.id },
              data: { quantity: qty }
            });
          } else {
            inventoryCreate.push({
              branchId,
              quantity: qty
            });
          }
        });
        
        const inventoryItems: any = {};
        if (inventoryCreate.length > 0) inventoryItems.create = inventoryCreate;
        if (inventoryUpdate.length > 0) inventoryItems.update = inventoryUpdate;

        return {
          size: v.size || v.packUnit || "Standard",
          color: v.color || "Standard",
          sku: v.sku || null,
          barcode: v.barcode || null,
          price: parseFloat(v.price || "0"),
          salePrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) : null,
          costPrice: v.costPrice ? parseFloat(v.costPrice) : (data.costPrice ? parseFloat(data.costPrice) : null),
          wholesalePrice: v.wholesalePrice ? parseFloat(v.wholesalePrice) : (data.wholesalePrice ? parseFloat(data.wholesalePrice) : null),
          packUnit: v.packUnit || v.size || null,
          unitVolumeLiters: v.unitVolumeLiters ? parseFloat(v.unitVolumeLiters) : null,
          quantity: Object.values(v.stock).reduce((sum, qty) => sum + qty, 0),
          stockStatus: "instock",
          featuredImage: images[0] || null,
          gallery: images.slice(1).filter(url => url !== ""),
          inventoryItems: Object.keys(inventoryItems).length > 0 ? inventoryItems : undefined
        };
      };

      const getVariantsPayload = () => {
        if (!productToEdit) {
          return { create: variants.map(v => formatVariantPayload(v, false)) };
        }

        const variantsToUpdate = variants.filter(v => productToEdit.variants?.find((pv: any) => pv.id === v.id));
        const variantsToCreate = variants.filter(v => !productToEdit.variants?.find((pv: any) => pv.id === v.id));
        const variantsToDelete = productToEdit.variants?.filter((pv: any) => !variants.find(v => v.id === pv.id)) || [];

        return {
          update: [
            ...variantsToUpdate.map(v => ({
              where: { id: v.id },
              data: formatVariantPayload(v, true)
            })),
            ...variantsToDelete.map((v: any) => ({
              where: { id: v.id },
              data: {
                quantity: 0,
                stockStatus: "outofstock",
                inventoryItems: {
                  deleteMany: {}
                }
              }
            }))
          ],
          create: variantsToCreate.map(v => formatVariantPayload(v, false))
        };
      };

      const payload = {
        name: data.name,
        slug: data.slug || undefined,
        description: data.description,
        productType: data.productType || "LUBRICANT",
        brand: data.brand || null,
        viscosity: data.viscosity || null,
        oilType: data.oilType || null,
        apiStandard: data.apiStandard || null,
        partNumber: data.partNumber || null,
        compatibleVehicles: data.compatibleVehicles || null,
        categoryId: data.category || undefined,
        collectionId: data.collection || undefined,
        variants: getVariantsPayload()
      };
      
      if (productToEdit) {
        await updateProductMutation.mutateAsync({ id: productToEdit.id, data: payload as any });
      } else {
        await createProductMutation.mutateAsync(payload);
      }
      toast.success(productToEdit ? "Product updated successfully!" : "Product created successfully!");
      onClose();
    } catch (error: any) {
      console.error("Failed to save product", error.response?.data || error);
      toast.error(error.response?.data?.error || "Failed to save product. Please try again.");
    }
  };

  const onError = (formErrors: any) => {
    console.error("Form Validation Errors:", formErrors);
    const errorKeys = Object.keys(formErrors);
    if (errorKeys.length > 0) {
      toast.error(`Please check required fields: ${errorKeys.join(', ')}`);
    } else {
      toast.error("Please fill in all required fields.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm" onClick={onClose} />

      {/* Full-height Panel */}
      <div className="relative ml-auto w-full max-w-[960px] h-full bg-white flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-stone-200 bg-stone-50 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-inter font-bold text-xl text-stone-900">
                {productToEdit ? "Edit Item" : "Add Oil or Non-Oil Item"}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                {currentProductType}
              </span>
            </div>
            <p className="font-inter text-sm text-stone-500 mt-0.5">
              Configure lubricants, filters, batteries, car care fluids, or spare parts with live COGS tracking.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-lg text-stone-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-0 border-b border-stone-200 bg-white shrink-0 overflow-x-auto scrollbar-hide">
          {SECTION_TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium font-inter whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "border-stone-900 text-stone-900 bg-stone-50/50"
                    : "border-transparent text-stone-400 hover:text-stone-700 hover:border-stone-300"
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Body Form */}
        <form id="add-product-form" onSubmit={handleSubmit(onSubmit, onError)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8">

            {/* ────────── BASIC INFO ────────── */}
            {activeTab === "basic" && (
              <div className="flex flex-col gap-6 max-w-[760px]">
                {/* Product Type Selector */}
                <div className="flex flex-col gap-2">
                  <label className="label">Item Category & Classification <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {PRODUCT_TYPES.map(type => {
                      const Icon = type.icon;
                      const isSelected = currentProductType === type.value;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setValue("productType", type.value as any)}
                          className={`p-3 text-left rounded-xl border transition-all flex flex-col justify-between ${
                            isSelected
                              ? "border-amber-500 bg-amber-500/10 text-amber-500 shadow-sm"
                              : "border-border bg-surface hover:border-amber-500/40 text-foreground hover:bg-background"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <Icon size={14} className={isSelected ? "text-amber-500" : "text-muted"} />
                            <span className="text-xs font-bold leading-tight">{type.label}</span>
                          </div>
                          <span className={`text-[10px] mt-0.5 line-clamp-2 ${isSelected ? "text-amber-500/80" : "text-muted"}`}>
                            {type.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Product Name */}
                <div className="flex flex-col gap-2">
                  <label className="label">Item Title / Product Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    {...register("name")}
                    placeholder={
                      currentProductType === "LUBRICANT" ? "e.g. Mobil 1 0W-20 Advanced Fuel Economy" :
                      currentProductType === "FILTER" ? "e.g. Toyota Genuine Oil Filter #15601-BZ010" :
                      currentProductType === "BATTERY" ? "e.g. Amaron Hi-Life 65B24L Maintenance Free" :
                      currentProductType === "CAR_CARE" ? "e.g. Toyota Super Long Life Coolant Pre-mixed" :
                      "e.g. NGK Laser Iridium Spark Plug FK20HR11"
                    }
                    className={`input ${errors.name ? 'border-red-500' : ''}`}
                  />
                  {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                </div>

                {/* Brand & Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="label">Brand / Manufacturer</label>
                    <input
                      type="text"
                      {...register("brand")}
                      placeholder="e.g. Mobil, Toyota, Denso, NGK, Amaron, Castrol"
                      className="input"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="label">System Category <span className="text-red-500">*</span></label>
                    <select {...register("category")} className={`input ${errors.category ? 'border-red-500' : ''}`}>
                      <option value="">Select Category</option>
                      {categories.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    {errors.category && <span className="text-red-500 text-xs">{errors.category.message}</span>}
                  </div>
                </div>

                {/* Product Slug */}
                <div className="flex flex-col gap-2">
                  <label className="label">Item Slug / SKU Code</label>
                  <div className={`flex items-center bg-stone-50 border ${errors.slug ? 'border-red-500' : 'border-stone-200'} rounded-lg overflow-hidden`}>
                    <span className="px-3 text-stone-400 text-xs font-mono border-r border-stone-200 h-full py-2.5">/item/</span>
                    <input
                      type="text"
                      {...register("slug", { onChange: () => setSlugEdited(true) })}
                      className="flex-1 bg-transparent px-3 py-2.5 text-xs font-mono outline-none text-stone-900"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-2">
                  <label className="label">Item Description & Specifications</label>
                  <textarea
                    {...register("description")}
                    rows={4}
                    placeholder="Technical specifications, base oils, OEM approvals, and usage guidelines..."
                    className="input resize-none"
                  />
                </div>
              </div>
            )}

            {/* ────────── SPECIFICATIONS & FITMENT ────────── */}
            {activeTab === "specs" && (
              <div className="flex flex-col gap-6 max-w-[760px]">
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 flex flex-col gap-5">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                    <h3 className="font-inter font-bold text-stone-900 text-sm">
                      {currentProductType === "LUBRICANT" ? "Oil & Lubricant Technical Data" :
                       currentProductType === "FILTER" ? "Filter Specifications & OEM Cross-Reference" :
                       currentProductType === "BATTERY" ? "Battery Electrical & Fitment Specs" :
                       "Part Number & Vehicle Compatibility"}
                    </h3>
                    <span className="text-xs text-stone-500 font-mono">Type: {currentProductType}</span>
                  </div>

                  {/* LUBRICANT SPECIFICATIONS */}
                  {currentProductType === "LUBRICANT" && (
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="label">Viscosity Grade (SAE)</label>
                          <input
                            type="text"
                            {...register("viscosity")}
                            placeholder="e.g. 0W-20, 5W-30, 15W-40, ATF"
                            className="input font-mono uppercase"
                            list="viscosity-suggestions"
                          />
                          <datalist id="viscosity-suggestions">
                            {COMMON_VISCOSITIES.map(v => <option key={v} value={v} />)}
                          </datalist>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {["0W-20", "5W-30", "10W-40", "15W-40", "ATF WS"].map(v => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => setValue("viscosity", v)}
                                className="px-2 py-0.5 rounded text-[11px] bg-white border border-stone-200 hover:bg-stone-100 font-mono text-stone-600"
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="label">Base Oil Formulation</label>
                          <select {...register("oilType")} className="input">
                            <option value="">Select Formulation</option>
                            {OIL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="label">API Standard / Performance Rating</label>
                          <input
                            type="text"
                            {...register("apiStandard")}
                            placeholder="e.g. API SP/CF, ILSAC GF-6A, CK-4"
                            className="input font-mono uppercase"
                            list="api-suggestions"
                          />
                          <datalist id="api-suggestions">
                            {API_STANDARDS.map(s => <option key={s} value={s} />)}
                          </datalist>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="label">Recommended Vehicle Applications</label>
                          <input
                            type="text"
                            {...register("compatibleVehicles")}
                            placeholder="e.g. Japanese Hybrids (Aqua, Axio, Prius, Vitz)"
                            className="input"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FILTER / NON-OIL SPECIFICATIONS */}
                  {currentProductType !== "LUBRICANT" && (
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="label">OEM / Manufacturer Part Number</label>
                          <input
                            type="text"
                            {...register("partNumber")}
                            placeholder={
                              currentProductType === "FILTER" ? "e.g. #15601-BZ010 or C-110" :
                              currentProductType === "BATTERY" ? "e.g. DIN55, 65B24L, 46B24L" :
                              "e.g. FK20HR11, BKR6E-11"
                            }
                            className="input font-mono uppercase font-bold text-stone-900"
                          />
                          <p className="text-[11px] text-stone-400">Essential for fast search lookup on POS checkout terminals.</p>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="label">Specification / Model Details</label>
                          <input
                            type="text"
                            {...register("oilType")}
                            placeholder={
                              currentProductType === "BATTERY" ? "e.g. 45Ah, 430 CCA, 18 Months Warranty" :
                              currentProductType === "CAR_CARE" ? "e.g. Pre-mixed 50/50, Pink Organic Acid" :
                              "e.g. Laser Iridium, 0.4mm Tip"
                            }
                            className="input"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="label">Compatible Vehicles & Engine Models</label>
                        <textarea
                          {...register("compatibleVehicles")}
                          rows={3}
                          placeholder="e.g. Toyota Aqua NHP10 (1NZ-FXE), Axio NKE165, Prius ZVW30, Vitz KSP130, Honda Fit GP5"
                          className="input resize-none"
                        />
                        <p className="text-[11px] text-stone-400">Cashiers can search by car model to find matching parts instantly.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ────────── PACK UNITS & VARIANTS ────────── */}
            {activeTab === "variants" && (
              <div className="flex flex-col gap-6">
                {/* Pack Unit Presets */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-inter font-bold text-stone-900 text-sm">Quick Add Pack Units</h3>
                      <p className="text-xs text-stone-500 mt-0.5">Click a preset below or type a custom pack unit to add to this item.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newPackUnit}
                        onChange={e => setNewPackUnit(e.target.value)}
                        placeholder="Custom pack e.g. 10L Pail"
                        className="px-3 py-1.5 text-xs border border-stone-200 rounded-lg outline-none w-44"
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddPackUnit(newPackUnit); } }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddPackUnit(newPackUnit)}
                        className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition-colors"
                      >
                        Add Pack
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-200">
                    {(PACK_PRESETS_BY_TYPE[currentProductType] || PACK_PRESETS_BY_TYPE.LUBRICANT).map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleAddPackUnit(preset)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-stone-200 hover:border-stone-900 hover:bg-stone-100 transition-all flex items-center gap-1.5 text-stone-800"
                      >
                        <Plus size={12} /> {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Variants Table */}
                {variants.length > 0 ? (
                  <div className="border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-stone-100 border-b border-stone-200">
                        <tr>
                          <th className="px-3.5 py-3 font-semibold text-xs text-stone-600 uppercase tracking-wide">Pack Unit / Size</th>
                          <th className="px-3.5 py-3 font-semibold text-xs text-stone-600 uppercase tracking-wide">SKU</th>
                          <th className="px-3.5 py-3 font-semibold text-xs text-stone-600 uppercase tracking-wide">Barcode</th>
                          <th className="px-3.5 py-3 font-semibold text-xs text-amber-700 uppercase tracking-wide">Cost (COGS)</th>
                          <th className="px-3.5 py-3 font-semibold text-xs text-emerald-700 uppercase tracking-wide">Retail (Rs.)</th>
                          <th className="px-3.5 py-3 font-semibold text-xs text-blue-700 uppercase tracking-wide">Wholesale</th>
                          {branchCodes.map((b: string) => (
                            <th key={b} className="px-3.5 py-3 font-semibold text-xs text-stone-600 uppercase tracking-wide text-center">{b}</th>
                          ))}
                          <th className="px-3.5 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {variants.map(v => (
                          <tr key={v.id} className="hover:bg-stone-50 transition-colors">
                            <td className="px-3.5 py-3 font-bold text-stone-900">
                              <span className="px-2 py-1 rounded bg-stone-100 border border-stone-200 text-xs font-mono">
                                {v.size}
                              </span>
                            </td>
                            <td className="px-3.5 py-3">
                              <input
                                className="font-mono text-xs border border-stone-200 rounded px-2 py-1 w-32 outline-none focus:border-stone-400 bg-white"
                                value={v.sku}
                                onChange={e => updateVariantField(v.id, "sku", e.target.value)}
                              />
                            </td>
                            <td className="px-3.5 py-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[11px] bg-stone-50 border border-stone-200 rounded px-1.5 py-1 text-stone-600 select-all cursor-text">
                                  {v.barcode || '—'}
                                </span>
                                {v.barcode && (
                                  <button
                                    type="button"
                                    title="Print barcode"
                                    onClick={() => setPrintingVariant({ barcode: v.barcode, label: `${productName} (${v.size})` })}
                                    className="p-1 text-stone-400 hover:text-stone-800 hover:bg-stone-200 rounded transition-colors"
                                  >
                                    <Printer size={13} />
                                  </button>
                                )}
                              </div>
                            </td>
                            {/* Cost Price */}
                            <td className="px-3.5 py-3">
                              <input
                                type="number"
                                className="text-xs font-mono font-semibold border border-amber-300 rounded px-2 py-1 w-24 outline-none focus:border-amber-500 bg-amber-50/50 text-amber-900"
                                value={v.costPrice || ""}
                                placeholder="0.00"
                                onChange={e => updateVariantField(v.id, "costPrice", e.target.value)}
                              />
                            </td>
                            {/* Retail Price */}
                            <td className="px-3.5 py-3">
                              <input
                                type="number"
                                className="text-xs font-mono font-bold border border-emerald-300 rounded px-2 py-1 w-24 outline-none focus:border-emerald-500 bg-emerald-50/50 text-emerald-900"
                                value={v.price}
                                onChange={e => updateVariantField(v.id, "price", e.target.value)}
                              />
                            </td>
                            {/* Wholesale Price */}
                            <td className="px-3.5 py-3">
                              <input
                                type="number"
                                className="text-xs font-mono border border-blue-200 rounded px-2 py-1 w-24 outline-none focus:border-blue-400 bg-blue-50/30 text-blue-900"
                                value={v.wholesalePrice || ""}
                                placeholder="Optional"
                                onChange={e => updateVariantField(v.id, "wholesalePrice", e.target.value)}
                              />
                            </td>
                            {/* Branch Stocks */}
                            {branchCodes.map((b: string) => (
                              <td key={b} className="px-3.5 py-3 text-center">
                                <input
                                  type="number"
                                  className="text-xs font-mono font-bold border border-stone-200 rounded px-1.5 py-1 w-16 outline-none focus:border-stone-400 text-center bg-white"
                                  value={v.stock[b] || 0}
                                  min={0}
                                  onChange={e => updateVariantStock(v.id, b, parseInt(e.target.value) || 0)}
                                />
                              </td>
                            ))}
                            <td className="px-3.5 py-3 text-right">
                              <button type="button" onClick={() => removeVariant(v.id)} className="text-stone-400 hover:text-red-600 transition-colors p-1">
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-stone-200 rounded-xl p-10 flex flex-col items-center gap-3 text-center bg-stone-50/50">
                    <Layers size={36} className="text-stone-300" />
                    <div>
                      <p className="font-inter text-stone-700 font-semibold text-sm">No Pack Units or Variants Added</p>
                      <p className="font-inter text-xs text-stone-400 mt-0.5">Click a preset above (e.g. &quot;4L Can&quot; or &quot;Single Piece&quot;) to configure pricing and stock.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ────────── PRICING & COGS ────────── */}
            {activeTab === "pricing" && (
              <div className="flex flex-col gap-6 max-w-[560px]">
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 flex flex-col gap-5">
                  <div>
                    <h3 className="font-inter font-bold text-stone-900">Default Base Pricing & Gross Margin</h3>
                    <p className="text-xs text-stone-500 font-inter mt-0.5">
                      Sets the default pricing for newly added variants. Drives the Superadmin Executive P&L Engine.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="label">Default Selling Price (Rs.) <span className="text-red-500">*</span></label>
                      <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden bg-white">
                        <span className="px-3 py-2 text-stone-500 text-xs font-mono border-r border-stone-200">Rs.</span>
                        <input type="number" {...register("basePrice")} placeholder="0.00" className="flex-1 px-3 py-2 text-sm outline-none font-mono font-bold" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="label">Purchase Cost / COGS (Rs.)</label>
                      <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden bg-white">
                        <span className="px-3 py-2 text-stone-500 text-xs font-mono border-r border-stone-200">Rs.</span>
                        <input type="number" {...register("costPrice")} placeholder="0.00" className="flex-1 px-3 py-2 text-sm outline-none font-mono" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="label">Wholesale Price (Rs.)</label>
                      <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden bg-white">
                        <span className="px-3 py-2 text-stone-500 text-xs font-mono border-r border-stone-200">Rs.</span>
                        <input type="number" {...register("wholesalePrice")} placeholder="Optional" className="flex-1 px-3 py-2 text-sm outline-none font-mono" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="label">Compare-At / MRP Price (Rs.)</label>
                      <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden bg-white">
                        <span className="px-3 py-2 text-stone-500 text-xs font-mono border-r border-stone-200">Rs.</span>
                        <input type="number" {...register("compareAtPrice")} placeholder="Optional" className="flex-1 px-3 py-2 text-sm outline-none font-mono" />
                      </div>
                    </div>
                  </div>

                  {/* Gross Margin Card */}
                  {basePrice && costPrice && !isNaN(Number(basePrice)) && !isNaN(Number(costPrice)) && Number(basePrice) > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-inter text-xs font-bold text-emerald-800 uppercase tracking-wide">Estimated Gross Profit Margin</p>
                        <p className="font-inter text-xs text-emerald-600 mt-0.5">
                          Profit: Rs. {(parseFloat(basePrice) - parseFloat(costPrice)).toLocaleString()} per unit
                        </p>
                      </div>
                      <p className="font-inter text-2xl font-black text-emerald-700">
                        {Math.round(((parseFloat(basePrice) - parseFloat(costPrice)) / parseFloat(basePrice)) * 100)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ────────── INVENTORY MATRIX ────────── */}
            {activeTab === "inventory" && (
              <div className="flex flex-col gap-6 max-w-[700px]">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                  <AlertCircle size={16} className="text-amber-700 shrink-0 mt-0.5" />
                  <p className="text-xs font-inter text-amber-800 leading-relaxed">
                    Stock is tracked independently per branch. Spillage and oil wastage transactions will adjust these quantities directly.
                  </p>
                </div>

                <div className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col gap-4">
                  <h3 className="font-inter font-bold text-stone-900 text-sm">Quick Stock Initialization</h3>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      value={initialGlobalStock} 
                      onChange={e => setInitialGlobalStock(parseInt(e.target.value) || 0)} 
                      min={0}
                      className="input w-36 font-mono font-bold" 
                      placeholder="Qty"
                    />
                    <button 
                      type="button" 
                      onClick={applyStockToAll}
                      className="px-4 py-2.5 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition-colors whitespace-nowrap"
                    >
                      Apply to All Existing Variants
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ────────── PRODUCT MEDIA ────────── */}
            {activeTab === "media" && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div 
                      key={i} 
                      onClick={() => { setActiveImageSlot(i); setIsMediaModalOpen(true); }}
                      className={`relative aspect-square border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-stone-50 hover:border-amber-500 transition-all group overflow-hidden ${i === 0 ? "col-span-2 row-span-2" : ""}`}
                    >
                      {images[i] ? (
                        <>
                          <Image src={images[i]} alt={`Product Image ${i + 1}`} fill className="object-cover" />
                          <div className="absolute inset-0 bg-stone-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <p className="font-inter text-white text-xs font-medium">Change Image</p>
                          </div>
                          <button 
                            type="button"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setImages(prev => { const n = [...prev]; n[i] = ""; return n; });
                            }}
                            className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1 text-stone-700 hover:bg-white transition-colors z-20"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <ImagePlus size={i === 0 ? 32 : 20} className="text-stone-300 group-hover:text-amber-600 transition-colors" />
                          <span className="font-inter text-xs text-stone-400 group-hover:text-stone-700 transition-colors">
                            {i === 0 ? "Primary Photo" : "Photo " + (i + 1)}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-stone-400 font-inter">Recommended: High quality can/bottle product images with legible brand and viscosity grade.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-stone-200 px-8 py-4 bg-stone-50 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <Sparkles size={14} className="text-amber-500" />
              <span>Multi-Branch Inventory & COGS Sync Enabled</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-white border border-stone-300 rounded-lg font-inter font-medium text-sm text-stone-700 hover:bg-stone-50 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
                className="px-8 py-2.5 bg-stone-900 text-white rounded-lg font-inter font-semibold text-sm hover:bg-stone-800 transition-colors shadow-md shadow-stone-900/20 disabled:opacity-50 flex items-center gap-2"
              >
                {(createProductMutation.isPending || updateProductMutation.isPending) ? "Saving..." : (productToEdit ? "Update Item" : "Create Item")}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style jsx>{`
        .label { 
          font-family: var(--font-inter);
          font-size: 0.75rem;
          font-weight: 600;
          color: #44403c;
        }
        .input {
          border: 1px solid #e7e5e4;
          border-radius: 0.5rem;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
          background: white;
          width: 100%;
          color: #1c1917;
          transition: border-color 0.15s;
        }
        .input:focus {
          border-color: #1c1917;
          box-shadow: 0 0 0 2px rgba(28, 25, 23, 0.1);
        }
      `}</style>
      
      {isMediaModalOpen && (
        <MediaPickerModal
          onClose={() => { setIsMediaModalOpen(false); setActiveImageSlot(null); }}
          onSelect={(url) => {
            if (activeImageSlot !== null) {
              setImages(prev => { const n = [...prev]; n[activeImageSlot] = url; return n; });
            }
            setIsMediaModalOpen(false);
          }}
          title="Select Product Image"
        />
      )}

      {/* Per-variant Barcode Print Modal */}
      {printingVariant && (
        <VariantBarcodePrintModal
          barcode={printingVariant.barcode}
          label={printingVariant.label}
          onClose={() => setPrintingVariant(null)}
        />
      )}
    </div>
  );
}

// ── Single Variant Barcode Print Modal ──────────────────────────────────────
function VariantBarcodePrintModal({ barcode, label, onClose }: { barcode: string; label: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: ref,
    documentTitle: `Barcode-${barcode}`,
    pageStyle: `@page { size: A4 portrait; margin: 10mm; } body { visibility: visible !important; } body * { visibility: visible !important; }`,
  });
  const displayCode = barcode.length > 12 ? barcode.substring(0, 12) : barcode;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50">
          <h3 className="font-inter font-bold text-base text-stone-900">Print Barcode</h3>
          <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-200 rounded-lg transition-colors"><X size={18} /></button>
        </div>
        <div className="p-6 flex flex-col items-center gap-4 bg-stone-100">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200 flex flex-col items-center w-full">
            <div ref={ref} className="react-to-print-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'white', padding: '16px', width: '100%', fontFamily: 'sans-serif' }}>
              <p style={{ fontWeight: 700, fontSize: '14px', textAlign: 'center', margin: '0 0 4px 0', color: '#1c1917' }}>{label}</p>
              <BarcodeLib value={displayCode} format="CODE128" width={1.5} height={55} displayValue fontSize={13} margin={4} />
            </div>
          </div>
          <p className="text-xs text-stone-500 font-inter text-center">Label: {label}</p>
        </div>
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-stone-200 text-stone-700 font-inter font-medium text-sm rounded-lg hover:bg-stone-50 transition-colors">Cancel</button>
          <button onClick={() => handlePrint()} className="px-5 py-2 bg-stone-900 text-white font-inter font-medium text-sm rounded-lg hover:bg-stone-800 transition-colors flex items-center gap-2">
            <Printer size={15} /> Print Label
          </button>
        </div>
      </div>
    </div>
  );
}
