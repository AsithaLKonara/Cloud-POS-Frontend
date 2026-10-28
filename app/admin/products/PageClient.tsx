"use client";
import AdminStatCards from "@/components/admin/AdminStatCards";

import { useState, useRef } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import FilterBar from "@/components/dashboard/FilterBar";
import DataTable from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/Badges";
import ProductFormModal from "@/components/dashboard/ProductFormModal";
import BulkEditModal from "@/components/admin/BulkEditModal";
import Link from "next/link";
import { Barcode, Edit, ArchiveRestore, CheckCircle2, Printer, X, Pencil, Trash2 } from "lucide-react";
import BarcodeLib from "react-barcode";
import { useReactToPrint } from "react-to-print";
import { useProducts, useDeleteProduct, useBulkEditProducts } from "@/hooks/useProducts";
import { Product } from "@/types/product";
import { globalDialog } from "@/store/dialog.store";
import { toast } from "@/store/toast.store";

export default function ProductsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | undefined>(undefined);
  const [printingProduct, setPrintingProduct] = useState<{name: string, variants: any[]} | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);

  const [page, setPage] = useState(1);
  const take = 12;

  const [searchQuery, setSearchQuery] = useState("");
  const [productTypeFilter, setProductTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: response, isLoading } = useProducts({
    skip: (page - 1) * take,
    take: take,
    search: searchQuery || undefined,
    productType: productTypeFilter === "All Types" ? undefined : (productTypeFilter || undefined),
    category: categoryFilter === "All Categories" ? undefined : (categoryFilter || undefined),
    status: statusFilter === "All Status" ? undefined : (statusFilter || undefined)
  } as any);
  const products = response?.data || [];
  const meta = response?.meta || { total: 0, skip: 0, take: take };
  const totalPages = Math.ceil(meta.total / (meta.take || take)) || 1;
  const deleteProductMutation = useDeleteProduct();
  const bulkEditProductsMutation = useBulkEditProducts();

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProducts(products.map((p: Product) => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectOne = (sku: string) => {
    setSelectedProducts(prev => prev.includes(sku) ? prev.filter(p => p !== sku) : [...prev, sku]);
  };

  const handleDelete = async (id: string) => {
    if (await globalDialog.confirm("Are you sure you want to archive this product?")) {
      await deleteProductMutation.mutateAsync(id);
      toast.success("Product archived successfully");
    }
  };

  const handleBulkPublish = async () => {
    if (selectedProducts.length === 0) return;
    try {
      await bulkEditProductsMutation.mutateAsync({ productIds: selectedProducts, data: { status: 'ACTIVE' } });
      toast.success(`${selectedProducts.length} products published successfully.`);
      setSelectedProducts([]);
    } catch (e) {
      toast.error('Failed to publish products');
    }
  };

  const handleBulkArchive = async () => {
    if (selectedProducts.length === 0) return;
    if (await globalDialog.confirm(`Are you sure you want to archive ${selectedProducts.length} products?`)) {
      try {
        await bulkEditProductsMutation.mutateAsync({ productIds: selectedProducts, data: { status: 'ARCHIVED' } });
        toast.success(`${selectedProducts.length} products archived successfully.`);
        setSelectedProducts([]);
      } catch (e) {
        toast.error('Failed to archive products');
      }
    }
  };

  const handleEdit = (product: Product) => {
    setProductToEdit(product);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setProductToEdit(undefined);
    setModalOpen(true);
  };

  const columns = [
    {
      header: <input type="checkbox" checked={selectedProducts.length === products.length && products.length > 0} onChange={handleSelectAll} className="rounded text-stone-900 focus:ring-stone-900 border-stone-300" />,
      accessor: (row: any) => <input type="checkbox" checked={selectedProducts.includes(row.id)} onChange={() => handleSelectOne(row.id)} onClick={e => e.stopPropagation()} className="rounded text-stone-900 focus:ring-stone-900 border-stone-300" />
    },
    { 
      header: "SKU / Code", 
      accessor: (row: any) => row.variants?.[0]?.sku || row.sku || row.variants?.[0]?.barcode || 'N/A', 
      className: "font-mono text-stone-500 text-xs" 
    },
    {
      header: "Product & Spec",
      accessor: (row: any) => (
        <div className="flex flex-col text-left">
          <button onClick={() => handleEdit(row)} className="font-semibold text-foreground hover:text-amber-500 transition-colors text-left text-sm">
            {row.name}
          </button>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted">
            {row.brand && <span className="font-medium text-foreground/80">{row.brand}</span>}
            {row.brand && (row.viscosity || row.partNumber) && <span>·</span>}
            {row.viscosity && <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-[11px]">({row.viscosity})</span>}
            {row.partNumber && <span className="font-mono text-muted text-[11px]">#{row.partNumber}</span>}
          </div>
        </div>
      ),
    },
    {
      header: "Type",
      accessor: (row: any) => {
        const type = row.productType || "LUBRICANT";
        return (
          <span className="text-xs font-semibold text-foreground/80">
            {type.replace('_', ' ')}
          </span>
        );
      }
    },
    { 
      header: "Pack / Unit", 
      accessor: (row: any) => row.variants?.[0]?.packUnit || <span className="text-stone-400">Unit</span>,
      className: "text-xs text-stone-600"
    },
    { 
      header: "Cost (COGS)", 
      accessor: (row: any) => {
        const cost = row.variants?.[0]?.costPrice || 0;
        return `Rs ${cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      },
      className: "text-xs text-stone-500 font-mono" 
    },
    { 
      header: "Retail Price", 
      accessor: (row: any) => {
        const price = row.variants?.[0]?.price || 0;
        return `Rs ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      },
      className: "font-semibold text-stone-900 font-mono text-sm" 
    },
    { 
      header: "Stock", 
      accessor: (row: any) => {
        const totalQuantity = row.variants?.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0) || 0;
        return (
          <span className={totalQuantity === 0 ? "text-red-600 font-bold" : totalQuantity <= 10 ? "text-amber-600 font-bold" : "text-stone-900 font-semibold"}>
            {totalQuantity}
          </span>
        );
      }
    },
    {
      header: "Status",
      accessor: (row: any) => {
        const statusStr = row.status || "ACTIVE";
        if (statusStr === "DRAFT") return <StatusBadge label="Draft" variant="warning" />;
        if (statusStr === "ARCHIVED") return <StatusBadge label="Archived" variant="neutral" />;
        const inStock = row.variants?.some((v: any) => v.stockStatus === 'instock' && v.quantity > 0) ?? false;
        return <StatusBadge label={inStock ? "In Stock" : "Out of Stock"} variant={inStock ? "success" : "error"} />;
      },
    },
    {
      header: "Actions",
      accessor: (row: any) => (
        <div className="flex gap-1 items-center justify-end">
          <button 
            onClick={() => handleEdit(row)} 
            title="Edit Product"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors"
          >
            <Pencil size={15} />
          </button>
          <button 
            onClick={() => handleDelete(row.id)} 
            disabled={deleteProductMutation.isPending} 
            title="Archive Product"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={() => setPrintingProduct({ name: row.name, variants: row.variants || [] })}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
            title="Print Variant Barcodes"
          >
            <Barcode size={15} />
          </button>
        </div>
      ),
    },
  ];

  const filters = (
    <>
      <select 
        value={productTypeFilter}
        onChange={(e) => { setProductTypeFilter(e.target.value); setPage(1); }}
        className="bg-surface border border-border rounded-xl py-2 px-3 text-sm font-inter text-foreground outline-none focus:ring-1 focus:ring-amber-500"
      >
        <option value="">All Item Classifications</option>
        <option value="RETAIL">Retail & Apparel</option>
        <option value="FMCG_GROCERY">Food, Beverage & Grocery</option>
        <option value="HEALTH_BEAUTY">Health & Beauty</option>
        <option value="ELECTRONICS">Electronics & Tech</option>
        <option value="HOME_HARDWARE">Home & Hardware</option>
        <option value="AUTOMOTIVE">Automotive & Industrial</option>
        <option value="SERVICE">Service & Labor</option>
        <option value="GENERAL">General Merchandise</option>
      </select>
      <select 
        value={statusFilter}
        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        className="bg-surface border border-border rounded-xl py-2 px-3 text-sm font-inter text-foreground outline-none focus:ring-1 focus:ring-amber-500"
      >
        <option value="">All Status</option>
        <option value="ACTIVE">Active</option>
        <option value="LOW_STOCK">Low Stock</option>
        <option value="OUT_OF_STOCK">Out of Stock</option>
        <option value="DRAFT">Draft</option>
        <option value="ARCHIVED">Archived</option>
      </select>
      <button
        id="add-product-button"
        onClick={handleAdd}
        className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold active:scale-95 px-5 py-2 rounded-xl font-inter text-sm transition-all whitespace-nowrap ml-auto shadow-sm flex items-center gap-2"
      >
        + Add Item
      </button>
    </>
  );

  return (
    <>
      <div className="flex flex-col p-4 md:p-8 max-w-[1400px] mx-auto w-full gap-4">
        <PageHeader
          title="Product Catalog & Inventory Items"
          description="Manage universal product catalog, variants, pricing, packaging, and stock levels."
        />

        <div className="mb-2">
          <AdminStatCards metrics={[
            { title: "Total Catalog", value: meta?.total?.toString() || products.length.toString(), theme: "white-blue" },
            { title: "Active SKUs", value: products.filter((p: any) => p.status === "ACTIVE").length.toString(), theme: "white-stone" },
            { title: "Draft Items", value: products.filter((p: any) => p.status === "DRAFT").length.toString(), theme: "orange" }
          ]} />
        </div>
        <FilterBar
          placeholder="Search products by name or SKU..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
        />

        <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden mt-4">
          <DataTable
            data={products}
            columns={columns}
            keyExtractor={(row) => row.id}
            pagination={{ 
              currentPage: page, 
              totalPages: totalPages,
              onPageChange: (newPage) => setPage(newPage)
            }}
          />
        </div>
      </div>

      <ProductFormModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        productToEdit={productToEdit}
      />
      
      {/* Floating Bulk Action Bar */}
      {selectedProducts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10 z-40">
          <span className="font-inter font-medium text-sm">{selectedProducts.length} selected</span>
          <div className="w-px h-6 bg-stone-700"></div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowBulkEditModal(true)} className="font-inter font-semibold text-sm bg-stone-800 text-white px-4 py-2 rounded-full hover:bg-stone-700 transition-colors flex items-center gap-2">
              <Edit size={14} /> Bulk Edit
            </button>
            <button onClick={handleBulkPublish} disabled={bulkEditProductsMutation.isPending} className="font-inter font-semibold text-sm bg-emerald-600 text-white px-4 py-2 rounded-full hover:bg-emerald-500 transition-colors flex items-center gap-2 disabled:opacity-50">
              <CheckCircle2 size={14} /> Publish
            </button>
            <button onClick={handleBulkArchive} disabled={bulkEditProductsMutation.isPending} className="font-inter font-semibold text-sm bg-stone-800 text-white px-4 py-2 rounded-full hover:bg-stone-700 transition-colors flex items-center gap-2 disabled:opacity-50">
              <ArchiveRestore size={14} /> Archive
            </button>
          </div>
        </div>
      )}

      {showBulkEditModal && (
        <BulkEditModal 
          selectedProducts={products.filter((p: Product) => selectedProducts.includes(p.id)).map((p: Product) => ({ id: p.id, sku: (p as any).sku || p.id, name: p.name }))}
          onClose={() => setShowBulkEditModal(false)}
          onSuccess={() => {
            setShowBulkEditModal(false);
            setSelectedProducts([]);
          }}
        />
      )}

      {printingProduct && (
        <ProductVariantsBarcodeModal
          productName={printingProduct.name}
          variants={printingProduct.variants}
          onClose={() => setPrintingProduct(null)}
        />
      )}
    </>
  );
}

// ── Per-variant + Bulk Barcode Print Modal ───────────────────────────────────
// ── Label size presets ───────────────────────────────────────────────────────
const LABEL_SIZES = [
  { id: 'auto',    label: 'Auto (Printer)',   desc: 'Let printer decide',   css: 'auto',       bW: 1.5, bH: 45 },
  { id: '30x20',   label: '30 × 20 mm',       desc: 'Tiny roll',            css: '30mm 20mm',  bW: 0.8, bH: 20 },
  { id: '50x30',   label: '50 × 30 mm',       desc: 'Small roll',           css: '50mm 30mm',  bW: 1.0, bH: 28 },
  { id: '60x40',   label: '60 × 40 mm',       desc: 'Standard label',       css: '60mm 40mm',  bW: 1.2, bH: 35 },
  { id: '100x50',  label: '100 × 50 mm',      desc: 'Wide label',           css: '100mm 50mm', bW: 1.8, bH: 40 },
  { id: '4x6in',   label: '4″ × 6″',          desc: 'Shipping label',       css: '4in 6in',    bW: 2.2, bH: 60 },
  { id: 'a4',      label: 'A4',               desc: 'Full page (3 per row)', css: 'A4 portrait', bW: 1.2, bH: 40 },
] as const;
type LabelSizeId = typeof LABEL_SIZES[number]['id'];

function ProductVariantsBarcodeModal({
  productName,
  variants,
  onClose,
}: {
  productName: string;
  variants: any[];
  onClose: () => void;
}) {
  const bulkRef = useRef<HTMLDivElement>(null);
  const singleRef = useRef<HTMLDivElement>(null);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number | null>(null);
  const [labelSizeId, setLabelSizeId] = useState<LabelSizeId>('auto');

  const activeSize = LABEL_SIZES.find(s => s.id === labelSizeId) || LABEL_SIZES[0];

  const barcodePrintPageStyle = `
    @page {
      size: ${activeSize.css};
      margin: ${labelSizeId === 'a4' ? '10mm' : '2mm'};
    }
    body { visibility: visible !important; margin: 0; padding: 0; background: white; }
    body * { visibility: visible !important; }
  `;

  const handleBulkPrint = useReactToPrint({
    contentRef: bulkRef,
    documentTitle: `Barcodes-${productName}`,
    pageStyle: barcodePrintPageStyle,
  });

  const handleSinglePrint = useReactToPrint({
    contentRef: singleRef,
    documentTitle: `Barcode-${selectedVariantIdx !== null ? variants[selectedVariantIdx]?.barcode : ''}`,
    pageStyle: barcodePrintPageStyle,
  });

  const variantsWithBarcodes = variants.filter((v: any) => v.barcode);
  const selectedVariant = selectedVariantIdx !== null ? variants[selectedVariantIdx] : null;

  const getDisplayCode = (barcode: string) =>
    barcode && barcode.length > 12 ? barcode.substring(0, 12) : barcode;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-background shrink-0">
          <div>
            <h2 className="font-inter font-bold text-lg text-foreground">Variant Barcodes</h2>
            <p className="text-sm text-muted font-inter mt-0.5">
              {productName} &mdash; {variantsWithBarcodes.length} variant{variantsWithBarcodes.length !== 1 ? 's' : ''} with barcodes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleBulkPrint()}
              disabled={variantsWithBarcodes.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-inter font-medium text-sm rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <Printer size={15} />
              Print All ({variantsWithBarcodes.length})
            </button>
            <button onClick={onClose} className="p-2 text-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Label Size Selector */}
        <div className="px-5 py-3 border-b border-border bg-background shrink-0">
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2">Label / Roll Size</p>
          <div className="flex flex-wrap gap-2">
            {LABEL_SIZES.map(s => (
              <button
                key={s.id}
                onClick={() => setLabelSizeId(s.id)}
                className={`flex flex-col items-start px-3 py-1.5 rounded-lg border text-left transition-all text-xs font-inter ${
                  labelSizeId === s.id
                    ? 'bg-primary border-primary text-white shadow-sm'
                    : 'bg-surface border-border text-foreground hover:bg-surface-elevated'
                }`}
              >
                <span className="font-semibold leading-tight">{s.label}</span>
                <span className={`text-[9px] leading-tight ${labelSizeId === s.id ? 'text-white/80' : 'text-muted'}`}>{s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Variant List */}
          <div className="w-56 border-r border-border overflow-y-auto shrink-0 bg-background">
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider px-4 pt-4 pb-2">
              Select Variant
            </p>
            {variants.length === 0 ? (
              <p className="text-sm text-muted font-inter px-4 py-6 text-center">No variants found</p>
            ) : (
              variants.map((v: any, i: number) => (
                <button
                  key={v.id || i}
                  onClick={() => setSelectedVariantIdx(i)}
                  className={`w-full text-left px-4 py-3 border-b border-border transition-colors text-sm font-inter ${
                    selectedVariantIdx === i
                      ? 'bg-primary text-white'
                      : 'hover:bg-surface-elevated text-foreground'
                  }`}
                >
                  <p className="font-semibold text-xs mb-0.5">{v.size} / {v.color}</p>
                  <p className={`text-[10px] font-mono truncate ${selectedVariantIdx === i ? 'text-white/80' : 'text-muted'}`}>
                    {v.barcode ? v.barcode : 'No barcode'}
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Preview Panel */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface/40 overflow-y-auto">
            {selectedVariant ? (
              <>
                {selectedVariant.barcode ? (
                  <div className="flex flex-col items-center gap-5 w-full">
                    {/* Live preview label */}
                    <div className="flex items-center gap-2 text-xs text-muted font-inter">
                      <span>Previewing as:</span>
                      <span className="font-semibold text-foreground">{activeSize.label}</span>
                    </div>
                    <div className="bg-white rounded-xl shadow-md border border-border p-6 flex flex-col items-center w-full max-w-xs">
                      <div ref={singleRef} className="react-to-print-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'white', padding: '8px', width: '100%', fontFamily: 'sans-serif' }}>
                        <p style={{ fontWeight: 700, fontSize: '11px', textAlign: 'center', margin: '0 0 3px 0', color: '#1c1917' }}>{productName}</p>
                        <p style={{ fontSize: '10px', textAlign: 'center', margin: '0 0 6px 0', color: '#78716c' }}>{selectedVariant.size} / {selectedVariant.color}</p>
                        <BarcodeLib value={getDisplayCode(selectedVariant.barcode)} format="CODE128" width={activeSize.bW} height={activeSize.bH} displayValue fontSize={10} margin={3} />
                      </div>
                    </div>
                    <button onClick={() => handleSinglePrint()} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-inter font-semibold text-sm rounded-lg hover:bg-primary-hover transition-colors shadow-sm">
                      <Printer size={15} /> Print This Barcode
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-muted">
                    <Barcode size={40} className="opacity-20" />
                    <p className="font-inter text-sm">No barcode on this variant</p>
                    <p className="font-inter text-xs">Edit the product to auto-generate barcodes</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 text-muted">
                <Barcode size={40} className="opacity-20" />
                <p className="font-inter text-sm font-medium">Select a variant</p>
                <p className="font-inter text-xs">Click a variant on the left to preview its barcode</p>
              </div>
            )}
          </div>
        </div>

        {/* Bulk print area — off-screen so react-to-print can render it */}
        <div style={{ position: 'fixed', left: '-9999px', top: 0, width: activeSize.id === 'a4' ? '21cm' : activeSize.css.replace(' ', ' x ').split(' ')[0], pointerEvents: 'none' }} aria-hidden="true">
          <div
            ref={bulkRef}
            className="react-to-print-content"
            style={{
              padding: '8px',
              display: 'grid',
              gridTemplateColumns: activeSize.id === 'a4' ? 'repeat(3, 1fr)' : '1fr',
              gap: activeSize.id === 'a4' ? '10px' : '4px',
              background: 'white',
              fontFamily: 'sans-serif',
            }}
          >
            {variantsWithBarcodes.map((v: any, i: number) => (
              <div key={v.id || i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #e7e5e4', padding: '6px', background: 'white' }}>
                <p style={{ fontWeight: 700, fontSize: '9px', textAlign: 'center', color: '#1c1917', margin: '0 0 2px 0' }}>{productName}</p>
                <p style={{ fontSize: '8px', textAlign: 'center', color: '#78716c', margin: '0 0 3px 0' }}>{v.size} / {v.color}</p>
                <BarcodeLib value={getDisplayCode(v.barcode)} format="CODE128" width={activeSize.bW} height={activeSize.bH} displayValue fontSize={8} margin={2} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

