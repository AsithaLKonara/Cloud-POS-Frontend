"use client";

import { useState, useEffect, Fragment } from "react";
import { Search, Star, Check, X, Flag, MessageSquare, Eye, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import { useAllReviews, useUpdateReviewStatus, useReviewStats, useAddReviewReply } from "@/hooks/useReviews";

// Mock data removed in favor of real API

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PENDING:  { bg: "bg-orange-100", text: "text-orange-700", label: "Pending" },
  APPROVED: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Approved" },
  REJECTED: { bg: "bg-red-100",  text: "text-red-700",  label: "Rejected" },
  SPAM: { bg: "bg-stone-200", text: "text-stone-800", label: "Spam" },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={s <= rating ? "text-amber-400 fill-amber-400" : "text-stone-200 fill-stone-200"}
        />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setPage(1); // Reset page on filter change
  }, [filter]);

  const { data: stats } = useReviewStats();
  const { data: response, isLoading } = useAllReviews(filter, page, limit, debouncedSearch);
  const { mutateAsync: updateStatus } = useUpdateReviewStatus();
  const { mutateAsync: addReply } = useAddReviewReply();

  const serverReviews = response?.data || [];
  const totalReviews = response?.total || 0;
  const totalPages = response?.totalPages || 1;

  const reviews = serverReviews.map((r: any) => ({
    id: r.id,
    customer: `${r.customer.firstName} ${r.customer.lastName}`,
    product: r.product.name,
    productSku: r.productId.substring(0, 8),
    rating: r.rating,
    title: r.title || 'No Title',
    body: r.comment || '',
    date: new Date(r.createdAt).toISOString().split('T')[0],
    status: r.status,
    verified: r.isVerifiedPurchase,
    helpful: 0,
    flagged: r.status === "SPAM",
    adminReply: r.adminReply,
  }));

  const displayed = reviews; // Filtering is now server-side
  const pendingCount = stats?.pending || 0;
  const spamCount = stats?.spam || 0;

  const handleExportCsv = async () => {
    const query = new URLSearchParams();
    if (filter !== "ALL") query.set("status", filter);
    if (debouncedSearch) query.set("search", debouncedSearch);
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    
    try {
      const res = await fetch(`${apiUrl}/reviews/export?${query.toString()}`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to export");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reviews_export_${new Date().getTime()}.csv`;
      a.click();
    } catch (err) {
      console.error(err);
      alert("Failed to export CSV");
    }
  };

  const approve = async (id: string) => {
    await updateStatus({ id, status: "APPROVED" });
  };

  const reject = async (id: string) => {
    await updateStatus({ id, status: "REJECTED" });
  };

  const bulkApprove = async () => {
    for (const id of selectedIds) {
      await updateStatus({ id, status: "APPROVED" });
    }
    setSelectedIds([]);
  };

  const markSpam = async (id: string) => {
    await updateStatus({ id, status: "SPAM" });
  };

  const bulkReject = async () => {
    for (const id of selectedIds) {
      await updateStatus({ id, status: "REJECTED" });
    }
    setSelectedIds([]);
  };

  const bulkSpam = async () => {
    for (const id of selectedIds) {
      await updateStatus({ id, status: "SPAM" });
    }
    setSelectedIds([]);
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSelectedIds(e.target.checked ? displayed.map((r: any) => r.id) : []);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Reviews & Ratings"
        subtitle="Moderate customer reviews before they appear on the storefront."
        actionLabel="Export CSV"
        onAction={handleExportCsv}
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pending Review", value: stats?.pending || 0, color: "text-orange-600" },
          { label: "Approved", value: stats?.approved || 0, color: "text-emerald-600" },
          { label: "Rejected / Spam", value: stats?.rejected || 0, color: "text-red-600" },
          { label: "Average Rating", value: `${Number(stats?.averageRating || 0).toFixed(1)} / 5.0`, color: "text-amber-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm flex flex-col gap-1">
            <span className="font-inter text-xs font-semibold text-stone-500 uppercase tracking-wider">{label}</span>
            <span className={`font-inter text-3xl font-black ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 border border-stone-200 rounded-xl shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, product, or title..."
            className="w-full h-10 pl-10 pr-4 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:border-stone-900 focus:bg-white transition-colors text-sm font-inter"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["ALL", "PENDING", "APPROVED", "REJECTED", "SPAM"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 font-inter text-sm font-medium rounded-lg transition-colors whitespace-nowrap capitalize ${
                filter === f ? "bg-stone-900 text-white" : "bg-stone-50 text-stone-600 hover:bg-stone-100"
              }`}
            >
              {f === "ALL" ? "All Reviews" : f.charAt(0) + f.slice(1).toLowerCase()}
              {f === "PENDING" && pendingCount > 0 && (
                <span className="ml-2 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
              {f === "SPAM" && spamCount > 0 && (
                <span className="ml-2 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="py-4 px-6 w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === displayed.length && displayed.length > 0}
                    onChange={handleSelectAll}
                    className="rounded text-stone-900 focus:ring-stone-900 border-stone-300"
                  />
                </th>
                <th className="font-inter font-semibold text-xs text-stone-500 uppercase tracking-wider py-4 px-4">Rating</th>
                <th className="font-inter font-semibold text-xs text-stone-500 uppercase tracking-wider py-4 px-4">Review</th>
                <th className="font-inter font-semibold text-xs text-stone-500 uppercase tracking-wider py-4 px-4">Product</th>
                <th className="font-inter font-semibold text-xs text-stone-500 uppercase tracking-wider py-4 px-4">Customer</th>
                <th className="font-inter font-semibold text-xs text-stone-500 uppercase tracking-wider py-4 px-4">Status</th>
                <th className="font-inter font-semibold text-xs text-stone-500 uppercase tracking-wider py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {displayed.map((review) => {
                const st = STATUS_STYLES[review.status];
                const isExpanded = expandedId === review.id;
                return (
                  <Fragment key={review.id}>
                    <tr
                      className={`transition-colors group ${selectedIds.includes(review.id) ? "bg-stone-50" : "hover:bg-stone-50/60"}`}
                    >
                    <td className="py-4 px-6 align-top">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(review.id)}
                        onChange={() => toggleSelect(review.id)}
                        className="rounded text-stone-900 focus:ring-stone-900 border-stone-300 mt-1"
                      />
                    </td>
                    <td className="py-4 px-4 align-top">
                      <StarRating rating={review.rating} />
                      <span className="font-inter text-xs text-stone-400 mt-1 block">{review.date}</span>
                    </td>
                    <td className="py-4 px-4 align-top max-w-xs">
                      <div className="flex items-start gap-2">
                        {review.flagged && (
                          <Flag size={14} className="text-red-500 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <p className="font-inter font-semibold text-sm text-stone-900 line-clamp-1">{review.title}</p>
                          <p className={`font-inter text-xs text-stone-500 mt-1 leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
                            {review.body}
                          </p>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : review.id)}
                            className="font-inter text-xs text-blue-600 hover:underline mt-1 flex items-center gap-1"
                          >
                            <Eye size={12} />
                            {isExpanded ? "Show less" : "Read more"}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <p className="font-inter text-sm font-medium text-stone-900 line-clamp-1">{review.product}</p>
                      <p className="font-inter text-xs text-stone-400 font-mono mt-0.5">{review.productSku}</p>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <p className="font-inter text-sm text-stone-700">{review.customer}</p>
                      {review.verified && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-[10px] font-bold uppercase tracking-wider mt-1">
                          <Check size={10} /> Verified Purchase
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 align-top">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                      {review.flagged && (
                        <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-red-600 uppercase tracking-wider">
                          <AlertTriangle size={12} />
                          <span>Spam Flagged</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-center justify-end gap-2">
                        {review.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => approve(review.id)}
                              title="Approve"
                              className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm"
                            >
                              <Check size={15} />
                            </button>
                            <button
                              onClick={() => reject(review.id)}
                              title="Reject"
                              className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors shadow-sm"
                            >
                              <X size={15} />
                            </button>
                            <button
                              onClick={() => markSpam(review.id)}
                              title="Mark as Spam"
                              className="w-8 h-8 flex items-center justify-center bg-stone-100 text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-200 transition-colors shadow-sm"
                            >
                              <Flag size={14} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => { setReplyingToId(review.id); setReplyText(review.adminReply || ""); }}
                          title="Reply"
                          className="w-8 h-8 flex items-center justify-center bg-stone-50 text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors shadow-sm"
                        >
                          <MessageSquare size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {review.adminReply && !replyingToId && (
                    <tr key={`${review.id}-reply-show`} className="bg-stone-50/30">
                      <td colSpan={2}></td>
                      <td colSpan={5} className="pb-4 px-4 align-top">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 relative">
                          <span className="text-[10px] uppercase font-bold text-blue-800 absolute -top-2 bg-blue-100 px-2 rounded">Admin Reply</span>
                          <p className="text-sm font-inter text-blue-900 mt-1">{review.adminReply}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {replyingToId === review.id && (
                    <tr key={`${review.id}-reply`} className="bg-stone-50/50">
                      <td colSpan={2}></td>
                      <td colSpan={5} className="py-4 px-4">
                        <div className="flex flex-col gap-2 max-w-2xl">
                          <textarea 
                            autoFocus
                            className="w-full border border-stone-300 rounded-lg p-3 text-sm font-inter outline-none focus:ring-2 focus:ring-stone-900"
                            rows={3}
                            placeholder="Type your reply to the customer..."
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                          />
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setReplyingToId(null)} className="px-3 py-1.5 border border-stone-300 text-stone-700 text-xs font-semibold rounded hover:bg-stone-100 transition-colors">Cancel</button>
                            <button 
                              onClick={async () => {
                                await addReply({ id: review.id, reply: replyText });
                                setReplyingToId(null);
                              }} 
                              disabled={!replyText.trim()}
                              className="px-3 py-1.5 bg-stone-900 text-white text-xs font-semibold rounded hover:bg-stone-800 disabled:opacity-50 transition-colors"
                            >
                              Post Reply
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {displayed.length === 0 && (
          <div className="py-16 text-center text-stone-500 font-inter text-sm">
            No reviews found matching your filters.
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-stone-200 bg-stone-50/50">
          <span className="font-inter text-sm text-stone-500">
            Showing <span className="font-medium text-stone-900">{displayed.length > 0 ? (page - 1) * limit + 1 : 0}</span> to <span className="font-medium text-stone-900">{Math.min(page * limit, totalReviews)}</span> of{" "}
            <span className="font-medium text-stone-900">{totalReviews}</span> reviews
          </span>
          <div className="flex gap-2">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 bg-white border border-stone-200 text-stone-700 font-inter text-sm rounded-md shadow-sm hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button 
              disabled={page >= totalPages} 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 bg-white border border-stone-200 text-stone-700 font-inter text-sm rounded-md shadow-sm hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10 z-40">
          <span className="font-inter font-medium text-sm">{selectedIds.length} selected</span>
          <div className="w-px h-6 bg-stone-700"></div>
          <button
            onClick={bulkApprove}
            className="font-inter font-semibold text-sm bg-emerald-500 text-white px-4 py-2 rounded-full hover:bg-emerald-400 transition-colors flex items-center gap-2"
          >
            <Check size={14} /> Approve All
          </button>
          <button
            onClick={bulkReject}
            className="font-inter font-semibold text-sm bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-400 transition-colors flex items-center gap-2"
          >
            <X size={14} /> Reject All
          </button>
        </div>
      )}
    </div>
  );
}
