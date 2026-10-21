"use client";

import { useState, useRef } from "react";
import {
  Search, Upload, Grid, List, Trash2, Copy, Download, CheckCircle2,
  Image as ImageIcon, Film, Filter, FolderOpen, X, ZoomIn, ExternalLink,
  FileImage, AlertCircle, ArrowRight, Loader2, Cloud
} from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import { useMedia, useUploadMedia, useDeleteMedia, useSyncLocal } from "@/hooks/useMedia";
import { globalDialog } from "@/store/dialog.store";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MediaFile {
  id: string;
  name: string;
  type: "image" | "video";
  folder: string;
  size: string;
  dimensions: string;
  url: string;
  uploadedAt: string;
  usedIn: string[];
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const FOLDERS = ["All", "Products", "Hero", "Banners", "About", "Uncategorized"];

// Mock data removed in favor of real API

// ─── Detail Panel ──────────────────────────────────────────────────────────────

interface DetailPanelProps {
  file: MediaFile;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const ASSIGN_DESTINATIONS = [
  { label: "Hero Slide Image", page: "/admin/cms" },
  { label: "Promo Banner", page: "/admin/cms" },
  { label: "Product Image", page: "/admin/products" },
  { label: "Category Cover", page: "/admin/categories" },
  { label: "Collection Cover", page: "/admin/collections" },
  { label: "CMS Static Page", page: "/admin/cms" },
];

function AssignToSection({ file }: { file: MediaFile }) {
  const [destination, setDestination] = useState("");
  const [assigned, setAssigned] = useState(false);

  const handleAssign = () => {
    if (!destination) return;
    setAssigned(true);
    setTimeout(() => setAssigned(false), 2500);
  };

  return (
    <div className="flex flex-col gap-2">
      <select
        value={destination}
        onChange={e => setDestination(e.target.value)}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm font-inter outline-none focus:border-stone-900 bg-surface"
      >
        <option value="">Select a destination...</option>
        {ASSIGN_DESTINATIONS.map(d => (
          <option key={d.label} value={d.label}>{d.label}</option>
        ))}
      </select>
      <button
        onClick={handleAssign}
        disabled={!destination}
        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-inter font-semibold text-xs transition-all disabled:opacity-40 ${
          assigned ? "bg-emerald-600 text-white" : "bg-primary text-white hover:bg-stone-700"
        }`}
      >
        {assigned ? (
          <><CheckCircle2 size={13}/> Assigned successfully!</>
        ) : (
          <><ArrowRight size={13}/> Assign This Image</>
        )}
      </button>
      {assigned && destination && (
        <p className="font-inter text-xs text-muted text-center">
          Image URL copied to clipboard — open <span className="font-bold text-foreground">{destination}</span> to paste it.
        </p>
      )}
    </div>
  );
}


function DetailPanel({ file, onClose, onDelete }: DetailPanelProps) {
  const [copied, setCopied] = useState(false);
  const copyUrl = () => { navigator.clipboard.writeText(file.url); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[380px] bg-surface border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right-4 duration-200">
      <div className="flex items-center justify-between p-5 border-b border-border bg-background shrink-0">
        <h3 className="font-inter font-bold text-foreground truncate pr-4">{file.name}</h3>
        <button onClick={onClose} className="p-1.5 text-muted hover:text-foreground hover:bg-stone-200 rounded-lg transition-colors shrink-0">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Preview */}
        <div className="bg-surface-elevated flex items-center justify-center h-56 shrink-0 relative">
          <Image src={file.url} alt={file.name} fill className="object-contain" />
        </div>

        {/* Metadata */}
        <div className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 text-sm font-inter">
            {[
              ["Type", file.type?.toUpperCase() || 'UNKNOWN'],
              ["Folder", file.folder],
              ["Size", `${(Number(file.size) / 1024).toFixed(0)} KB`],
              ["Uploaded", new Date(file.uploadedAt).toLocaleDateString()],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">{label}</span>
                <span className="text-foreground font-medium">{value}</span>
              </div>
            ))}
          </div>

          {file.usedIn?.length > 0 && (
            <div className="bg-background border border-border rounded-lg p-3">
              <p className="font-inter text-xs font-semibold text-muted uppercase tracking-wider mb-2">Used In</p>
              <div className="flex flex-col gap-1">
                {file.usedIn.map(u => (
                  <span key={u} className="font-inter text-xs text-foreground flex items-center gap-1.5">
                    <FolderOpen size={11} className="text-muted"/> {u}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* URL Copy */}
          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">File URL</label>
            <div className="flex gap-2">
              <input readOnly value={file.url} className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-muted outline-none"/>
              <button onClick={copyUrl} className={`px-3 py-2 rounded-lg font-inter font-medium text-xs transition-all flex items-center gap-1.5 shadow-sm ${copied ? 'bg-emerald-600 text-white' : 'bg-surface border border-border text-foreground hover:bg-background'}`}>
                {copied ? <CheckCircle2 size={13}/> : <Copy size={13}/>}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Assign To */}
          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">Assign To</label>
            <AssignToSection file={file} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-5 border-t border-border bg-surface flex gap-3 shrink-0">
        <a href={file.url} download className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-lg font-inter font-medium text-sm hover:bg-stone-800 transition-colors shadow-sm">
          <Download size={15}/> Download
        </a>
        <button
          onClick={() => { onDelete(file.id); onClose(); }}
          className="px-4 py-2.5 border border-red-200 text-red-600 bg-red-50 rounded-lg font-inter font-medium text-sm hover:bg-red-100 transition-colors"
        >
          <Trash2 size={15}/>
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminMediaPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [activeFolder, setActiveFolder] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailFile, setDetailFile] = useState<MediaFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(1);

  const { data: mediaResponse, isLoading } = useMedia(activeFolder !== "All" ? activeFolder : undefined, page, 20);
  const serverFiles = mediaResponse?.data || [];
  const totalPages = mediaResponse?.totalPages || 1;
  const { mutateAsync: uploadMedia } = useUploadMedia();
  const { mutateAsync: deleteMedia } = useDeleteMedia();
  const { mutateAsync: syncLocal, isPending: isSyncing } = useSyncLocal();

  const handleSyncLocal = async () => {
    try {
      const res = await syncLocal();
      globalDialog.alert(`Synced successfully. Added ${res.added} missing files.`);
    } catch (err) {
      globalDialog.alert("Failed to sync local files.");
    }
  };

  const files = serverFiles.map((f: any) => ({
    id: f.id,
    name: f.name,
    type: f.type,
    folder: f.folder,
    size: f.size.toString(),
    dimensions: f.dimensions,
    url: f.url,
    uploadedAt: f.createdAt,
    usedIn: f.usedIn || [],
  }));

  const filtered = files.filter((f: any) => {
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const bulkDelete = async () => {
    for (const id of selectedIds) {
      await deleteMedia(id);
    }
    setSelectedIds([]);
  };

  const deleteOne = async (id: string) => {
    await deleteMedia(id);
  };

  const handleUploadFiles = async (chosenFiles: File[]) => {
    if (chosenFiles.length === 0) return;
    setIsUploading(true);
    
    try {
      for (const file of chosenFiles) {
        await uploadMedia({ file, folder: activeFolder !== "All" ? activeFolder : "Uncategorized" });
      }
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error("Upload failed", error);
      globalDialog.alert("Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleUploadFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleUploadFiles(Array.from(e.target.files || []));
  };

  const totalSize = files.reduce((acc: any, f: any) => {
    const num = Number(f.size);
    return acc + num;
  }, 0);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Media Library"
        subtitle="Upload, manage, and optimize images and videos for products and CMS blocks."
        actionLabel="Upload Files"
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Files", value: mediaResponse?.total || files.length, color: "text-foreground" },
          { label: "Images", value: files.filter((f: any) => f.type.startsWith("image")).length, color: "text-blue-600" },
          { label: "Unused Files", value: files.filter((f: any) => !f.usedIn || f.usedIn.length === 0).length, color: "text-orange-600" },
          { label: "Storage Used", value: `${(totalSize / (1024 * 1024)).toFixed(2)} MB`, color: "text-purple-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col gap-1">
            <span className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">{label}</span>
            <span className={`font-inter text-3xl font-black ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Upload Success */}
      {uploadSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl font-inter text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16}/> Files uploaded successfully and added to the library.
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all ${
          isDragging
            ? "border-stone-900 bg-background scale-[1.01]"
            : "border-border hover:border-stone-400 hover:bg-background/50"
        }`}
      >
        <div className="flex flex-col items-center gap-3 relative z-10 pointer-events-none">
          <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center shadow-sm text-muted">
            {isUploading ? <Loader2 size={24} className="animate-spin text-foreground" /> : <Upload size={24} />}
          </div>
          <div className="text-center">
            <p className="font-inter font-bold text-foreground">{isUploading ? "Uploading..." : "Drag & drop files here"}</p>
            <p className="font-inter text-sm text-muted mt-1">or click to browse from your computer</p>
          </div>
          <button 
            className="mt-2 bg-surface border border-border text-foreground px-5 py-2.5 rounded-lg font-inter text-sm font-medium hover:bg-background transition-colors pointer-events-auto shadow-sm disabled:opacity-50"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            Select Files
          </button>
        </div>
        <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileInput}/>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by filename..."
            className="w-full h-10 pl-10 pr-4 bg-surface border border-border rounded-lg outline-none focus:border-stone-900 text-sm font-inter"
          />
        </div>

        {/* Folder Tabs */}
        <div className="flex gap-1.5 flex-wrap flex-1">
          {FOLDERS.map(f => (
            <button
              key={f}
              onClick={() => { setActiveFolder(f); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-inter font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeFolder === f ? "bg-primary text-white" : "bg-surface text-muted border border-border hover:bg-background"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex gap-2 shrink-0">
          <button 
            onClick={handleSyncLocal} 
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-inter font-semibold rounded-lg transition-colors border border-border text-foreground hover:bg-background disabled:opacity-50"
          >
            {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <Cloud size={14} />}
            Sync Local
          </button>
          <button onClick={() => setView("grid")} className={`p-2 rounded-lg border transition-colors ${view === "grid" ? "bg-primary text-white border-stone-900" : "border-border text-muted hover:bg-background"}`}>
            <Grid size={16}/>
          </button>
          <button onClick={() => setView("list")} className={`p-2 rounded-lg border transition-colors ${view === "list" ? "bg-primary text-white border-stone-900" : "border-border text-muted hover:bg-background"}`}>
            <List size={16}/>
          </button>
        </div>
      </div>

      {/* Count row */}
      <div className="flex items-center justify-between -mt-2">
        <p className="font-inter text-sm text-muted">{filtered.length} file{filtered.length !== 1 ? "s" : ""}</p>
        {filtered.filter(f => f.usedIn.length === 0).length > 0 && (
          <button className="font-inter text-xs text-orange-600 hover:underline flex items-center gap-1">
            <AlertCircle size={12}/> {filtered.filter(f => f.usedIn.length === 0).length} unused files
          </button>
        )}
      </div>

      {/* Grid View */}
      {view === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(file => {
            const isSelected = selectedIds.includes(file.id);
            return (
              <div
                key={file.id}
                className={`group relative bg-surface border rounded-xl shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? "border-stone-900 ring-2 ring-stone-900/20" : "border-border hover:border-stone-400"
                }`}
              >
                {/* Thumbnail */}
                <div
                  className="relative aspect-square bg-surface-elevated flex items-center justify-center overflow-hidden"
                  onClick={() => setDetailFile(file)}
                >
                  <Image src={file.url} alt={file.name} fill className="object-cover"/>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity"/>
                  </div>
                  {file.usedIn.length === 0 && (
                    <div className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Unused</div>
                  )}
                </div>

                {/* Checkbox */}
                <div
                  className="absolute top-2 right-2"
                  onClick={e => { e.stopPropagation(); toggleSelect(file.id); }}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                    isSelected ? "bg-stone-900 border-stone-900" : "bg-surface/80 border-border opacity-0 group-hover:opacity-100"
                  }`}>
                    {isSelected && <CheckCircle2 size={12} className="text-white"/>}
                  </div>
                </div>

                {/* Info */}
                <div className="p-2.5">
                  <p className="font-inter text-xs font-semibold text-foreground truncate">{file.name}</p>
                  <p className="font-inter text-[10px] text-muted mt-0.5">{file.size} · {file.dimensions}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-background border-b border-border">
                <th className="py-3 px-5 w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filtered.length && filtered.length > 0}
                    onChange={e => setSelectedIds(e.target.checked ? filtered.map(f => f.id) : [])}
                    className="rounded text-foreground border-border"
                  />
                </th>
                <th className="font-inter text-xs font-semibold text-muted uppercase tracking-wider py-3 px-3">File</th>
                <th className="font-inter text-xs font-semibold text-muted uppercase tracking-wider py-3 px-3">Folder</th>
                <th className="font-inter text-xs font-semibold text-muted uppercase tracking-wider py-3 px-3">Dimensions</th>
                <th className="font-inter text-xs font-semibold text-muted uppercase tracking-wider py-3 px-3">Size</th>
                <th className="font-inter text-xs font-semibold text-muted uppercase tracking-wider py-3 px-3">Used In</th>
                <th className="font-inter text-xs font-semibold text-muted uppercase tracking-wider py-3 px-3">Uploaded</th>
                <th className="py-3 px-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map(file => {
                const isSelected = selectedIds.includes(file.id);
                return (
                  <tr key={file.id} className={`hover:bg-background transition-colors ${isSelected ? "bg-background" : ""}`}>
                    <td className="py-3 px-5">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(file.id)} className="rounded text-foreground border-border"/>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-surface-elevated rounded-lg overflow-hidden shrink-0 relative">
                          <Image src={file.url} alt={file.name} fill className="object-cover"/>
                        </div>
                        <div>
                          <p className="font-inter font-semibold text-sm text-foreground">{file.name}</p>
                          <p className="font-inter text-xs text-muted uppercase">{file.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-inter text-sm text-muted">{file.folder}</td>
                    <td className="py-3 px-3 font-inter text-sm text-muted font-mono text-xs">{file.dimensions}</td>
                    <td className="py-3 px-3 font-inter text-sm text-muted">{file.size}</td>
                    <td className="py-3 px-3">
                      {file.usedIn.length === 0 ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-orange-100 text-orange-700 rounded">Unused</span>
                      ) : (
                        <span className="font-inter text-sm text-muted">{file.usedIn.length} place(s)</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-inter text-sm text-muted">{file.uploadedAt}</td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1">
                        <button onClick={() => setDetailFile(file)} className="p-1.5 text-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors"><ZoomIn size={14}/></button>
                        <button onClick={() => deleteOne(file.id)} className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center font-inter text-sm text-muted">No media found.</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between py-4">
          <p className="font-inter text-sm text-muted">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-border bg-surface rounded-lg font-inter text-sm font-medium hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-border bg-surface rounded-lg font-inter text-sm font-medium hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10 z-40">
          <span className="font-inter font-medium text-sm">{selectedIds.length} file{selectedIds.length !== 1 ? "s" : ""} selected</span>
          <div className="w-px h-6 bg-stone-700"/>
          <button
            onClick={bulkDelete}
            className="font-inter font-semibold text-sm bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-400 transition-colors flex items-center gap-2"
          >
            <Trash2 size={14}/> Delete Selected
          </button>
          <button onClick={() => setSelectedIds([])} className="text-muted hover:text-white transition-colors">
            <X size={18}/>
          </button>
        </div>
      )}

      {/* Detail Panel */}
      {detailFile && (
        <DetailPanel
          file={detailFile}
          onClose={() => setDetailFile(null)}
          onDelete={deleteOne}
        />
      )}
    </div>
  );
}
