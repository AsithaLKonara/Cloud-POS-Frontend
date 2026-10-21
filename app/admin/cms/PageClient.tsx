"use client";

import { useState, useRef } from "react";
import {
  Layout, Image as ImageIcon, FileText, Megaphone, Plus, Trash2,
  GripVertical, Eye, EyeOff, Edit3, Check, X, ChevronDown, ChevronUp,
  Globe, Save, ExternalLink
} from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import MediaPickerModal from "@/components/admin/MediaPickerModal";
import type { MediaFile } from "@/components/admin/MediaPickerModal";
import Image from "next/image";

import { useCms } from "@/hooks/useCms";
import { HeroSlide, Banner, HomepageSection, StaticPage } from "@/services/cms.service";

// ─── Sub-components ────────────────────────────────────────────────────────────

function HeroTab() {
  const { heroSlides, isLoadingHero, createHeroSlide, updateHeroSlide, deleteHeroSlide } = useCms();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<HeroSlide>>({});
  const [saved, setSaved] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const startEdit = (slide: HeroSlide) => {
    setEditingId(slide.id);
    setEditData({ ...slide });
  };

  const cancelEdit = () => { setEditingId(null); setEditData({}); };

  const saveEdit = async () => {
    const { id, createdAt, updatedAt, lastEdited, ...updateData } = editData as any;
    if (editingId && !editingId.startsWith('new-')) {
      await updateHeroSlide.mutateAsync({ id: editingId, data: updateData });
    } else {
      await createHeroSlide.mutateAsync(updateData);
    }
    setEditingId(null);
    setEditData({});
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleActive = async (id: string) => {
    const slide = heroSlides.find((s: HeroSlide) => s.id === id);
    if (slide) await updateHeroSlide.mutateAsync({ id, data: { active: !slide.active } });
  };

  const moveSlide = async (id: string, dir: "up" | "down") => {
    const sorted = [...heroSlides].sort((a: HeroSlide, b: HeroSlide) => a.order - b.order);
    const idx = sorted.findIndex((s: HeroSlide) => s.id === id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    
    const current = sorted[idx];
    const swap = sorted[swapIdx];
    
    // Swap orders
    await Promise.all([
      updateHeroSlide.mutateAsync({ id: current.id, data: { order: swap.order } }),
      updateHeroSlide.mutateAsync({ id: swap.id, data: { order: current.order } })
    ]);
  };

  const addSlide = () => {
    const newSlide: any = {
      id: `new-${Date.now()}`,
      title: "New Slide",
      subtitle: "Edit this subtitle.",
      cta: "Shop Now",
      ctaLink: "/shop",
      image: "/hero-placeholder.jpg",
      active: false,
      order: heroSlides.length + 1,
    };
    startEdit(newSlide);
  };

  if (isLoadingHero) return <div className="p-8 text-center text-muted font-inter">Loading slides...</div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <p className="font-inter text-sm text-muted">Manage the hero carousel slides shown at the top of the homepage.</p>
        <div className="flex items-center gap-3">
          {saved && <span className="text-emerald-600 font-inter text-sm font-medium flex items-center gap-1"><Check size={14}/>Saved</span>}
          <button onClick={addSlide} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-inter font-medium text-sm hover:bg-stone-800 transition-colors shadow-sm">
            <Plus size={16}/> Add Slide
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {[...heroSlides].sort((a: HeroSlide, b: HeroSlide) => a.order - b.order).map((slide: HeroSlide) => (
          <div key={slide.id} className={`bg-surface border rounded-xl shadow-sm overflow-hidden ${slide.active ? 'border-border' : 'border-border/50 opacity-70'}`}>
            {editingId === slide.id ? (
              <div className="p-5 flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">Title</label>
                    <input value={editData.title || ""} onChange={e => setEditData(p => ({...p, title: e.target.value}))} className="border border-border rounded-lg px-3 py-2 text-sm font-inter outline-none focus:ring-1 focus:ring-stone-900"/>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">Subtitle</label>
                    <input value={editData.subtitle || ""} onChange={e => setEditData(p => ({...p, subtitle: e.target.value}))} className="border border-border rounded-lg px-3 py-2 text-sm font-inter outline-none focus:ring-1 focus:ring-stone-900"/>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">CTA Button Text</label>
                    <input value={editData.cta || ""} onChange={e => setEditData(p => ({...p, cta: e.target.value}))} className="border border-border rounded-lg px-3 py-2 text-sm font-inter outline-none focus:ring-1 focus:ring-stone-900"/>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">CTA Link</label>
                    <input value={editData.ctaLink || ""} onChange={e => setEditData(p => ({...p, ctaLink: e.target.value}))} className="border border-border rounded-lg px-3 py-2 text-sm font-inter outline-none focus:ring-1 focus:ring-stone-900"/>
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">Slide Image</label>
                    <div className="flex gap-3 items-center">
                      {editData.image && (
                        <div className="relative w-20 h-14 bg-stone-100 rounded-lg overflow-hidden shrink-0 border border-border">
                          <Image src={editData.image} alt="preview" fill sizes="100px" className="object-cover" />
                        </div>
                      )}
                      <div className="flex flex-col gap-2 flex-1">
                        <input value={editData.image || ""} onChange={e => setEditData(p => ({...p, image: e.target.value}))} placeholder="/path/to/image.jpg" className="border border-border rounded-lg px-3 py-2 text-sm font-inter outline-none focus:ring-1 focus:ring-stone-900 font-mono text-xs"/>
                        <button type="button" onClick={() => setShowPicker(true)} className="flex items-center gap-2 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-foreground border border-border rounded-lg font-inter font-semibold text-xs transition-colors w-fit">
                          <ImageIcon size={13}/> Pick from Media Library
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 justify-end border-t border-border/50 pt-4">
                  <button onClick={cancelEdit} className="px-4 py-2 border border-border text-foreground rounded-lg font-inter text-sm hover:bg-background transition-colors">Cancel</button>
                  <button onClick={saveEdit} className="px-4 py-2 bg-primary text-white rounded-lg font-inter text-sm hover:bg-stone-800 transition-colors flex items-center gap-2">
                    <Save size={14}/>Save Slide
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4">
                <div className="flex flex-col gap-1 text-muted">
                  <button onClick={() => moveSlide(slide.id, "up")} className="p-0.5 hover:text-foreground"><ChevronUp size={14}/></button>
                  <button onClick={() => moveSlide(slide.id, "down")} className="p-0.5 hover:text-foreground"><ChevronDown size={14}/></button>
                </div>
                <GripVertical size={16} className="text-stone-300 shrink-0"/>
                <div className="w-16 h-10 bg-stone-100 rounded-md overflow-hidden shrink-0 flex items-center justify-center relative">
                  {slide.image ? <Image src={slide.image} alt="slide" fill sizes="100px" className="object-cover"/> : <ImageIcon size={16} className="text-stone-300"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-inter font-bold text-sm text-foreground truncate">{slide.title}</p>
                  <p className="font-inter text-xs text-muted truncate">{slide.subtitle}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${slide.active ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-muted'}`}>
                    {slide.active ? "Live" : "Draft"}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleActive(slide.id)} className="p-2 text-stone-400 hover:text-foreground hover:bg-stone-100 rounded-lg transition-colors" title={slide.active ? "Deactivate" : "Activate"}>
                    {slide.active ? <Eye size={15}/> : <EyeOff size={15}/>}
                  </button>
                  <button onClick={() => startEdit(slide)} className="p-2 text-stone-400 hover:text-foreground hover:bg-stone-100 rounded-lg transition-colors">
                    <Edit3 size={15}/>
                  </button>
                  <button onClick={() => deleteHeroSlide.mutateAsync(slide.id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={15}/>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {editingId?.startsWith('new-') && (
           <div className={`bg-surface border rounded-xl shadow-sm overflow-hidden border-border`}>
              <div className="p-5 flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">Title</label>
                    <input value={editData.title || ""} onChange={e => setEditData(p => ({...p, title: e.target.value}))} className="border border-border rounded-lg px-3 py-2 text-sm font-inter outline-none focus:ring-1 focus:ring-stone-900"/>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">Subtitle</label>
                    <input value={editData.subtitle || ""} onChange={e => setEditData(p => ({...p, subtitle: e.target.value}))} className="border border-border rounded-lg px-3 py-2 text-sm font-inter outline-none focus:ring-1 focus:ring-stone-900"/>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">CTA Button Text</label>
                    <input value={editData.cta || ""} onChange={e => setEditData(p => ({...p, cta: e.target.value}))} className="border border-border rounded-lg px-3 py-2 text-sm font-inter outline-none focus:ring-1 focus:ring-stone-900"/>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">CTA Link</label>
                    <input value={editData.ctaLink || ""} onChange={e => setEditData(p => ({...p, ctaLink: e.target.value}))} className="border border-border rounded-lg px-3 py-2 text-sm font-inter outline-none focus:ring-1 focus:ring-stone-900"/>
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">Slide Image</label>
                    <div className="flex gap-3 items-center">
                      {editData.image && (
                        <div className="relative w-20 h-14 bg-stone-100 rounded-lg overflow-hidden shrink-0 border border-border">
                          <Image src={editData.image} alt="preview" fill sizes="100px" className="object-cover" />
                        </div>
                      )}
                      <div className="flex flex-col gap-2 flex-1">
                        <input value={editData.image || ""} onChange={e => setEditData(p => ({...p, image: e.target.value}))} placeholder="/path/to/image.jpg" className="border border-border rounded-lg px-3 py-2 text-sm font-inter outline-none focus:ring-1 focus:ring-stone-900 font-mono text-xs"/>
                        <button type="button" onClick={() => setShowPicker(true)} className="flex items-center gap-2 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-foreground border border-border rounded-lg font-inter font-semibold text-xs transition-colors w-fit">
                          <ImageIcon size={13}/> Pick from Media Library
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 justify-end border-t border-border/50 pt-4">
                  <button onClick={cancelEdit} className="px-4 py-2 border border-border text-foreground rounded-lg font-inter text-sm hover:bg-background transition-colors">Cancel</button>
                  <button onClick={saveEdit} className="px-4 py-2 bg-primary text-white rounded-lg font-inter text-sm hover:bg-stone-800 transition-colors flex items-center gap-2">
                    <Save size={14}/>Save Slide
                  </button>
                </div>
              </div>
           </div>
        )}
      </div>

      {/* Media Picker */}
      {showPicker && (
        <MediaPickerModal
          title="Select Hero Slide Image"
          onClose={() => setShowPicker(false)}
          onSelect={(url) => {
            setEditData(p => ({ ...p, image: url }));
            setShowPicker(false);
          }}
        />
      )}
    </div>
  );
}

function BannersTab() {
  const { banners, isLoadingBanners, createBanner, updateBanner, deleteBanner } = useCms();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Banner>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const TYPE_COLORS: Record<string, string> = {
    PROMO: "bg-purple-100 text-purple-700",
    SALE: "bg-orange-100 text-orange-700",
    ANNOUNCEMENT: "bg-blue-100 text-blue-700",
  };

  const startEdit = (b: Banner) => { setEditingId(b.id); setEditData({...b}); };
  const cancelEdit = () => { setEditingId(null); setEditData({}); };
  const saveEdit = async () => {
    try {
      setIsSaving(true);
      const { id, createdAt, updatedAt, lastEdited, ...updateData } = editData as any;
      if (editingId && !editingId.startsWith('new-')) {
        await updateBanner.mutateAsync({ id: editingId, data: updateData });
      } else {
        await createBanner.mutateAsync(updateData);
      }
      setEditingId(null);
      setEditData({});
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (banner: Banner) => {
    await updateBanner.mutateAsync({ id: banner.id, data: { active: !banner.active } });
  };

  if (isLoadingBanners) return <div className="p-8 text-center text-muted font-inter">Loading banners...</div>;

  const renderEditForm = () => (
    <div className="p-5 flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">Banner Text</label>
          <input value={editData.text||""} onChange={e=>setEditData(p=>({...p,text:e.target.value}))} className="border border-border rounded-lg px-3 py-2 text-sm font-inter outline-none focus:ring-1 focus:ring-stone-900"/>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">Link URL</label>
          <input value={editData.link||""} onChange={e=>setEditData(p=>({...p,link:e.target.value}))} className="border border-border rounded-lg px-3 py-2 text-sm font-inter outline-none focus:ring-1 focus:ring-stone-900"/>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">Background Color</label>
          <div className="flex gap-2">
            <input type="color" value={editData.bgColor||"#1c1c1c"} onChange={e=>setEditData(p=>({...p,bgColor:e.target.value}))} className="w-10 h-10 rounded border border-border p-0.5 cursor-pointer"/>
            <input value={editData.bgColor||""} onChange={e=>setEditData(p=>({...p,bgColor:e.target.value}))} className="flex-1 border border-border rounded-lg px-3 py-2 text-sm font-inter outline-none focus:ring-1 focus:ring-stone-900 font-mono"/>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">Banner Type</label>
          <select value={editData.type||"PROMO"} onChange={e=>setEditData(p=>({...p,type:e.target.value as any}))} className="border border-border rounded-lg px-3 py-2 text-sm font-inter outline-none focus:ring-1 focus:ring-stone-900">
            <option value="PROMO">Promo</option>
            <option value="SALE">Sale</option>
            <option value="ANNOUNCEMENT">Announcement</option>
          </select>
        </div>
        
        {/* New Image and Overlay Fields */}
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">Main Page Background Image (Optional)</label>
          <div className="flex gap-3 items-center">
            {editData.imageUrl && (
              <div className="relative w-16 h-10 bg-stone-100 rounded-md overflow-hidden shrink-0 border border-border">
                <Image src={editData.imageUrl} alt="preview" fill sizes="100px" className="object-cover" />
              </div>
            )}
            <div className="flex flex-col gap-2 flex-1">
              <input value={editData.imageUrl || ""} onChange={e => setEditData(p => ({...p, imageUrl: e.target.value}))} placeholder="/path/to/image.jpg" className="border border-border rounded-lg px-3 py-2 text-sm font-inter outline-none focus:ring-1 focus:ring-stone-900 font-mono text-xs"/>
              <div className="flex justify-between items-center">
                <button type="button" onClick={() => setShowMediaPicker(true)} className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-foreground border border-border rounded-lg font-inter font-semibold text-xs transition-colors w-fit">
                  <ImageIcon size={13}/> Pick Image
                </button>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editData.showOverlay ?? true} onChange={e => setEditData(p => ({...p, showOverlay: e.target.checked}))} className="rounded border-stone-300 text-foreground focus:ring-stone-900" />
                  <span className="font-inter text-xs font-semibold text-stone-600">Show Dark Overlay</span>
                </label>
              </div>
            </div>
          </div>
        </div>

      </div>
      {editData.text && (
        <div className="p-3 rounded-lg text-center text-sm font-inter font-medium text-white relative overflow-hidden" style={{backgroundColor: editData.bgColor||"#1c1c1c"}}>
          {editData.imageUrl && (
             <Image src={editData.imageUrl} alt="bg" fill className="object-cover opacity-50 z-0" />
          )}
          <span className="relative z-10">Preview: {editData.text}</span>
        </div>
      )}
      <div className="flex gap-3 justify-end border-t border-border/50 pt-4">
        <button onClick={cancelEdit} disabled={isSaving} className="px-4 py-2 border border-border text-foreground rounded-lg font-inter text-sm hover:bg-background disabled:opacity-50">Cancel</button>
        <button onClick={saveEdit} disabled={isSaving} className="px-4 py-2 bg-primary text-white rounded-lg font-inter text-sm hover:bg-stone-800 flex items-center gap-2 disabled:opacity-50"><Save size={14}/>{isSaving ? "Saving..." : "Save"}</button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <p className="font-inter text-sm text-muted">Manage promotional banners. Multiple banners can be live at the same time — ANNOUNCEMENT banners show in the topbar, PROMO banners appear on the homepage.</p>
        <button onClick={() => { const nb: any = { id: `new-${Date.now()}`, text: "New announcement", link: "/", bgColor: "#1c1c1c", active: false, type: "PROMO", showOverlay: true}; startEdit(nb); }} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-inter font-medium text-sm hover:bg-stone-800 transition-colors shadow-sm">
          <Plus size={16}/> Add Banner
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {banners.map((banner: Banner) => (
          <div key={banner.id} className={`bg-surface border rounded-xl shadow-sm overflow-hidden ${banner.active ? 'border-stone-900 ring-1 ring-stone-900/10' : 'border-border'}`}>
            {editingId === banner.id ? (
              renderEditForm()
            ) : (
              <div className="flex items-center gap-4 p-4">
                <div className="w-8 h-8 rounded shrink-0 relative overflow-hidden" style={{backgroundColor: banner.bgColor}}>
                   {/* @ts-ignore - banner will have imageUrl after DB update */}
                   {banner.imageUrl && <Image src={banner.imageUrl} alt="" fill className="object-cover opacity-60" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-inter font-bold text-sm text-foreground truncate">{banner.text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${TYPE_COLORS[banner.type]}`}>{banner.type}</span>
                    <span className="font-inter text-xs text-stone-400 truncate">{banner.link}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(banner)}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full transition-colors ${banner.active ? 'bg-emerald-100 text-emerald-700 hover:bg-red-50 hover:text-red-600' : 'bg-stone-100 text-stone-600 hover:bg-emerald-50 hover:text-emerald-700'}`}
                    title={banner.active ? 'Click to deactivate' : 'Click to set live'}
                  >
                    {banner.active ? 'LIVE' : 'Set Live'}
                  </button>
                  <button onClick={() => startEdit(banner)} className="p-2 text-stone-400 hover:text-foreground hover:bg-stone-100 rounded-lg transition-colors"><Edit3 size={15}/></button>
                  <button onClick={() => deleteBanner.mutateAsync(banner.id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15}/></button>
                </div>
              </div>
            )}
          </div>
        ))}
        {editingId?.startsWith('new-') && !banners.some(b => b.id === editingId) && (
           <div className={`bg-surface border rounded-xl shadow-sm overflow-hidden border-border`}>
              {renderEditForm()}
           </div>
        )}
      </div>

      {showMediaPicker && (
        <MediaPickerModal
          title="Select Banner Image"
          onClose={() => setShowMediaPicker(false)}
          onSelect={(url) => {
            setEditData(p => ({ ...p, imageUrl: url }));
            setShowMediaPicker(false);
          }}
        />
      )}
    </div>
  );
}

function HomepageTab() {
  const { sections, isLoadingSections, updateHomepageSection, createHomepageSection, deleteHomepageSection } = useCms();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<HomepageSection>>({});
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const toggleVisible = async (id: string) => {
    const sec = sections.find((s: HomepageSection) => s.id === id);
    if (sec) await updateHomepageSection.mutateAsync({ id, data: { visible: !sec.visible } });
  };

  const move = async (id: string, dir: "up" | "down") => {
    const sorted = [...sections].sort((a: HomepageSection, b: HomepageSection) => a.order - b.order);
    const idx = sorted.findIndex((s: HomepageSection) => s.id === id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    
    const current = sorted[idx];
    const swap = sorted[swapIdx];
    
    await Promise.all([
      updateHomepageSection.mutateAsync({ id: current.id, data: { order: swap.order } }),
      updateHomepageSection.mutateAsync({ id: swap.id, data: { order: current.order } })
    ]);
  };

  const startEdit = (sec: HomepageSection) => { setEditingId(sec.id); setEditData({...sec}); };
  const cancelEdit = () => { setEditingId(null); setEditData({}); };
  const saveEdit = async () => {
    const { id, createdAt, updatedAt, lastEdited, ...updateData } = editData as any;
    if (editingId && !editingId.startsWith('new-')) {
      await updateHomepageSection.mutateAsync({ id: editingId, data: updateData });
    } else {
      await createHomepageSection.mutateAsync(updateData);
    }
    setEditingId(null);
    setEditData({});
  };

  if (isLoadingSections) return <div className="p-8 text-center text-muted font-inter">Loading sections...</div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <p className="font-inter text-sm text-muted">Drag to reorder or toggle visibility of each homepage section.</p>
      </div>
      <div className="flex flex-col gap-3">
        {[...sections].sort((a: HomepageSection, b: HomepageSection) => a.order - b.order).map((sec: HomepageSection, idx: number) => (
          <div key={sec.id} className={`bg-surface border rounded-xl shadow-sm overflow-hidden ${sec.visible ? 'border-border' : 'border-border/50 opacity-60'}`}>
            {editingId === sec.id ? (
              <div className="p-4 flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">Section Name</label>
                    <input readOnly value={editData.name||""} className="border border-border bg-background rounded-lg px-3 py-2 text-sm font-inter outline-none text-muted cursor-not-allowed"/>
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">Description</label>
                    <input value={editData.description||""} onChange={e=>setEditData(p=>({...p,description:e.target.value}))} className="border border-border rounded-lg px-3 py-2 text-sm font-inter outline-none focus:ring-1 focus:ring-stone-900"/>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">Section Type</label>
                    <select value={editData.type||"STATIC"} onChange={e=>setEditData(p=>({...p,type:e.target.value}))} className="border border-border rounded-lg px-3 py-2 text-sm font-inter outline-none focus:ring-1 focus:ring-stone-900">
                      <option value="STATIC">Static / Custom</option>
                      <option value="FEATURED_PRODUCTS">Featured Products</option>
                      <option value="CATEGORY_GRID">Category Grid</option>
                      <option value="NEW_ARRIVALS">New Arrivals</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">Config JSON</label>
                      <button type="button" onClick={() => setShowMediaPicker(true)} className="text-xs font-medium text-foreground bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded flex items-center gap-1 border border-border">
                        <ImageIcon size={12}/> Pick Image for Config
                      </button>
                    </div>
                    <textarea 
                      value={typeof editData.config === 'string' ? editData.config : JSON.stringify(editData.config||{}, null, 2)} 
                      onChange={e=>{
                        try { setEditData(p=>({...p,config:JSON.parse(e.target.value)})); } 
                        catch(err) { setEditData(p=>({...p,config:e.target.value as any})); }
                      }} 
                      rows={4} 
                      className="border border-border rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-stone-900" 
                      placeholder='{"count": 8, "categoryId": "..."}' 
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end border-t border-border/50 pt-4">
                  <button onClick={cancelEdit} className="px-4 py-2 border border-border text-foreground rounded-lg font-inter text-sm hover:bg-background">Cancel</button>
                  <button onClick={saveEdit} className="px-4 py-2 bg-primary text-white rounded-lg font-inter text-sm hover:bg-stone-800 flex items-center gap-2"><Save size={14}/>Save</button>
                </div>
              </div>
            ) : (
              <div className="p-4 flex items-center gap-4 transition-all">
                <div className="flex flex-col gap-1 text-stone-300">
                  <button onClick={() => move(sec.id, "up")} className="hover:text-foreground transition-colors"><ChevronUp size={14}/></button>
                  <button onClick={() => move(sec.id, "down")} className="hover:text-foreground transition-colors"><ChevronDown size={14}/></button>
                </div>
                <GripVertical size={16} className="text-stone-200 shrink-0"/>
                <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center shrink-0">
                  <span className="font-inter font-bold text-sm text-muted">{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-inter font-bold text-sm text-foreground">{sec.name}</p>
                  <p className="font-inter text-xs text-stone-400">{sec.description}</p>
                </div>
                <button
                  onClick={() => toggleVisible(sec.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold font-inter rounded-full border transition-all ${sec.visible ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' : 'bg-background border-border text-muted hover:bg-stone-100'}`}
                >
                  {sec.visible ? <Eye size={12}/> : <EyeOff size={12}/>}
                  {sec.visible ? "Visible" : "Hidden"}
                </button>
                <button onClick={() => startEdit(sec)} className="p-2 text-stone-400 hover:text-foreground hover:bg-stone-100 rounded-lg transition-colors"><Edit3 size={15}/></button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showMediaPicker && (
        <MediaPickerModal
          title="Select Section Image"
          onClose={() => setShowMediaPicker(false)}
          onSelect={(url) => {
            setEditData(p => {
              let currentConfig = {};
              if (typeof p.config === 'object' && p.config !== null) {
                currentConfig = p.config;
              } else if (typeof p.config === 'string') {
                try { currentConfig = JSON.parse(p.config); } catch (e) {}
              }
              return { ...p, config: { ...currentConfig, image: url } };
            });
            setShowMediaPicker(false);
          }}
        />
      )}
    </div>
  );
}

function PagesTab() {
  const { pages, isLoadingPages, updateStaticPage, createStaticPage, deleteStaticPage } = useCms();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<StaticPage>>({});
  const [saved, setSaved] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormat = (syntax: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const currentContent = editData.content || "";
    let newContent = currentContent;

    if (syntax === 'B') {
      newContent = currentContent.substring(0, start) + "**" + currentContent.substring(start, end) + "**" + currentContent.substring(end);
    } else if (syntax === 'I') {
      newContent = currentContent.substring(0, start) + "*" + currentContent.substring(start, end) + "*" + currentContent.substring(end);
    } else if (syntax === 'H1') {
      newContent = currentContent.substring(0, start) + "\n# " + currentContent.substring(start, end) + currentContent.substring(end);
    } else if (syntax === 'H2') {
      newContent = currentContent.substring(0, start) + "\n## " + currentContent.substring(start, end) + currentContent.substring(end);
    } else if (syntax === '—') {
      newContent = currentContent.substring(0, start) + "\n\n---\n\n" + currentContent.substring(start, end) + currentContent.substring(end);
    } else if (syntax === 'Link') {
      newContent = currentContent.substring(0, start) + "[Link Text](url)" + currentContent.substring(start, end) + currentContent.substring(end);
    }
    
    setEditData(p => ({...p, content: newContent}));
  };

  const startEdit = (page: StaticPage) => { setEditingId(page.id); setEditData({...page}); };
  const cancelEdit = () => { setEditingId(null); setEditData({}); };
  const saveEdit = async () => {
    try {
      const { id, createdAt, updatedAt, lastEdited, ...payload } = editData as any;
      if (editingId && !editingId.startsWith('new-')) {
        await updateStaticPage.mutateAsync({ id: editingId, data: payload });
      } else {
        await createStaticPage.mutateAsync(payload);
      }
      setEditingId(null);
      setEditData({});
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save page", err);
      alert("Failed to save page. Please try again.");
    }
  };

  if (isLoadingPages) return <div className="p-8 text-center text-muted font-inter">Loading pages...</div>;

  const editingPage = pages.find((p: StaticPage) => p.id === editingId) || (editingId?.startsWith('new-') ? editData : null);

  if (editingId && editingPage) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-inter font-bold text-lg text-foreground">Editing: {editingPage.title || "New Page"}</h3>
            <p className="font-inter text-xs text-stone-400 font-mono">/{editingPage.slug || "new-slug"}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={cancelEdit} className="px-4 py-2 border border-border text-foreground rounded-lg font-inter text-sm hover:bg-background">Cancel</button>
            <button onClick={saveEdit} className="px-4 py-2 bg-primary text-white rounded-lg font-inter text-sm hover:bg-stone-800 flex items-center gap-2"><Save size={14}/>Save Page</button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">Title</label>
            <input value={editData.title||""} onChange={e=>setEditData(p=>({...p,title:e.target.value}))} className="border border-border rounded-lg px-3 py-2 text-sm font-inter outline-none focus:ring-1 focus:ring-stone-900"/>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">Slug</label>
            <input value={editData.slug||""} onChange={e=>setEditData(p=>({...p,slug:e.target.value}))} className="border border-border rounded-lg px-3 py-2 text-sm font-inter outline-none focus:ring-1 focus:ring-stone-900"/>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">SEO Title (metaTitle)</label>
            <input value={editData.metaTitle||""} onChange={e=>setEditData(p=>({...p,metaTitle:e.target.value}))} className="border border-border rounded-lg px-3 py-2 text-sm font-inter outline-none focus:ring-1 focus:ring-stone-900" placeholder="Optional SEO title"/>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">SEO Keywords (metaKeywords)</label>
            <input value={editData.metaKeywords||""} onChange={e=>setEditData(p=>({...p,metaKeywords:e.target.value}))} className="border border-border rounded-lg px-3 py-2 text-sm font-inter outline-none focus:ring-1 focus:ring-stone-900" placeholder="Optional comma-separated keywords"/>
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">SEO Description (metaDescription)</label>
            <textarea value={editData.metaDescription||""} onChange={e=>setEditData(p=>({...p,metaDescription:e.target.value}))} rows={2} className="border border-border rounded-lg px-3 py-2 text-sm font-inter outline-none focus:ring-1 focus:ring-stone-900" placeholder="Optional SEO description"/>
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="font-inter text-xs font-semibold text-muted uppercase tracking-wider">OG Image</label>
            <div className="flex gap-2">
              <input value={editData.ogImage||""} onChange={e=>setEditData(p=>({...p,ogImage:e.target.value}))} className="flex-1 border border-border rounded-lg px-3 py-2 text-sm font-inter outline-none focus:ring-1 focus:ring-stone-900" placeholder="Image URL"/>
              <button type="button" onClick={() => setShowMediaPicker(true)} className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-foreground border border-border rounded-lg font-inter font-semibold text-xs transition-colors whitespace-nowrap">
                Browse Media
              </button>
            </div>
            {editData.ogImage && (
              <div className="relative w-32 h-20 rounded-lg border border-border overflow-hidden mt-1">
                <Image src={editData.ogImage} alt="OG Preview" fill className="object-cover" />
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex gap-2 p-3 border-b border-border/50 bg-background flex-wrap">
            {["B", "I", "H1", "H2", "—", "Link"].map(tool => (
              <button 
                key={tool} 
                onClick={() => insertFormat(tool)}
                className="px-2.5 py-1 bg-surface border border-border text-foreground font-inter font-bold text-xs rounded hover:bg-stone-100 transition-colors shadow-sm"
              >
                {tool}
              </button>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            value={editData.content||""}
            onChange={e => setEditData(p=>({...p,content:e.target.value}))}
            rows={20}
            className="w-full p-5 font-mono text-sm text-stone-800 outline-none resize-none leading-relaxed"
            placeholder="Enter page content using Markdown..."
          />
        </div>
        <div className="bg-background border border-border rounded-xl p-4">
          <p className="font-inter text-xs font-semibold text-muted uppercase tracking-wider mb-2">Preview</p>
          <div className="font-inter text-sm text-foreground leading-relaxed whitespace-pre-wrap">{editData.content}</div>
        </div>
        {showMediaPicker && (
          <MediaPickerModal
            title="Select OG Image"
            onClose={() => setShowMediaPicker(false)}
            onSelect={(url) => {
              setEditData(p => ({ ...p, ogImage: url }));
              setShowMediaPicker(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <p className="font-inter text-sm text-muted">Edit static pages that replace WordPress content. These appear on the public storefront.</p>
        <button onClick={() => { const np: any = { id: `new-${Date.now()}`, title: "New Page", slug: "new-page", content: ""}; startEdit(np); }} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-inter font-medium text-sm hover:bg-stone-800 transition-colors shadow-sm">
          <Plus size={16}/> Add Page
        </button>
      </div>
      
      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg font-inter text-sm flex items-center gap-2">
          <Check size={16}/> Page saved successfully.
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pages.map((page: StaticPage) => (
          <div key={page.id} className="bg-surface border border-border rounded-xl shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-inter font-bold text-foreground">{page.title}</h3>
                <p className="font-inter text-xs text-stone-400 font-mono mt-0.5">/{page.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <a href={`/${page.slug}`} target="_blank" rel="noreferrer" className="p-1.5 text-stone-400 hover:text-foreground hover:bg-stone-100 rounded-lg transition-colors" title="Preview on site">
                  <ExternalLink size={14}/>
                </a>
                <button onClick={() => deleteStaticPage.mutateAsync(page.id)} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
            <p className="font-inter text-xs text-muted leading-relaxed line-clamp-3">{page.content}</p>
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <span className="font-inter text-xs text-stone-400">Last edited: {new Date(page.lastEdited).toLocaleDateString()}</span>
              <button onClick={() => startEdit(page)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white font-inter font-medium text-xs rounded-lg hover:bg-stone-800 transition-colors shadow-sm">
                <Edit3 size={12}/> Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "hero", label: "Hero Slides", icon: ImageIcon },
  { id: "banners", label: "Promo Banners", icon: Megaphone },
  { id: "homepage", label: "Homepage Layout", icon: Layout },
];

export default function AdminCMSPage() {
  const [activeTab, setActiveTab] = useState("hero");

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Content Management"
        subtitle="Manage homepage sections, promotional banners, hero slides, and static pages."
        actionLabel="View Storefront"
        actionHref="/"
      />

      {/* Tab Navigation */}
      <div className="bg-surface border border-border rounded-xl shadow-sm p-1.5 flex gap-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-inter font-semibold text-sm transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:bg-background hover:text-foreground"
              }`}
            >
              <Icon size={16}/>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "hero" && <HeroTab/>}
        {activeTab === "banners" && <BannersTab/>}
        {activeTab === "homepage" && <HomepageTab/>}
      </div>
    </div>
  );
}
