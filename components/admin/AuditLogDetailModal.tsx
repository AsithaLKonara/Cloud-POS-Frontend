"use client";

import React from "react";
import { X, Server, Database, Code, Activity, Shield } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/Badges";

interface AuditLogDetailModalProps {
  log: any;
  onClose: () => void;
}

export default function AuditLogDetailModal({ log, onClose }: AuditLogDetailModalProps) {
  if (!log) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border bg-surface shrink-0">
          <div>
            <h2 className="font-inter font-bold text-xl text-foreground flex items-center gap-2">
              <Shield className="text-primary" size={24} /> Audit Log Details
            </h2>
            <p className="font-inter text-sm text-muted mt-1">ID: {log.id}</p>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-background flex-1 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
              <h3 className="font-inter font-bold text-sm text-foreground mb-4 flex items-center gap-2 uppercase tracking-wide">
                <Activity size={16} className="text-blue-500" /> Action Context
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="font-inter text-sm text-muted">Action</span>
                  <StatusBadge 
                    label={log.action} 
                    variant={log.action === "DELETE" ? "error" : log.action === "UPDATE" ? "warning" : log.action === "CREATE" ? "success" : "neutral"} 
                  />
                </div>
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="font-inter text-sm text-muted">User</span>
                  <span className="font-inter text-sm font-medium text-foreground">{log.user}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="font-inter text-sm text-muted">IP Address</span>
                  <span className="font-mono text-sm text-foreground">{log.raw?.ipAddress || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="font-inter text-sm text-muted">Timestamp</span>
                  <span className="font-inter text-sm font-medium text-foreground">{log.timestamp}</span>
                </div>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
              <h3 className="font-inter font-bold text-sm text-foreground mb-4 flex items-center gap-2 uppercase tracking-wide">
                <Database size={16} className="text-emerald-500" /> Resource Details
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="font-inter text-sm text-muted">Entity</span>
                  <span className="font-inter text-sm font-medium text-foreground">{log.resource}</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="font-inter text-sm text-muted">Entity ID</span>
                  <span className="font-mono text-sm font-medium text-foreground">{log.raw?.entityId || "N/A"}</span>
                </div>
                <div className="mt-4 p-3 bg-surface-elevated rounded-lg border border-border">
                  <span className="font-inter text-xs font-semibold text-muted uppercase">User Agent</span>
                  <p className="font-mono text-xs text-foreground mt-1 break-words">{log.raw?.userAgent || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface border border-border rounded-xl p-0 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-surface-elevated px-5 py-3 border-b border-border flex items-center gap-2">
                <Code size={16} className="text-muted" />
                <h3 className="font-inter font-bold text-sm text-foreground uppercase tracking-wide">Previous State (oldData)</h3>
              </div>
              <div className="p-5 flex-1 bg-[#1E1E1E] overflow-auto max-h-[300px]">
                {log.raw?.oldData ? (
                  <pre className="text-xs font-mono text-emerald-400">
                    {JSON.stringify(log.raw.oldData, null, 2)}
                  </pre>
                ) : (
                  <span className="text-muted text-sm font-inter italic flex items-center justify-center h-full">No previous data</span>
                )}
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-0 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-surface-elevated px-5 py-3 border-b border-border flex items-center gap-2">
                <Server size={16} className="text-muted" />
                <h3 className="font-inter font-bold text-sm text-foreground uppercase tracking-wide">New State (newData)</h3>
              </div>
              <div className="p-5 flex-1 bg-[#1E1E1E] overflow-auto max-h-[300px]">
                {log.raw?.newData ? (
                  <pre className="text-xs font-mono text-emerald-400">
                    {JSON.stringify(log.raw.newData, null, 2)}
                  </pre>
                ) : (
                  <span className="text-muted text-sm font-inter italic flex items-center justify-center h-full">No new data</span>
                )}
              </div>
            </div>
          </div>

        </div>

        <div className="p-6 border-t border-border bg-surface flex justify-end shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 bg-primary text-white font-inter font-medium text-sm rounded-lg hover:bg-primary-hover transition-colors shadow-sm">
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
