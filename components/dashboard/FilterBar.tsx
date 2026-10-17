import { Search, Filter } from "lucide-react";

interface FilterBarProps {
  placeholder?: string;
  filters?: React.ReactNode;
  bottomRow?: React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export default function FilterBar({
  placeholder = "Search...",
  filters,
  bottomRow,
  searchQuery,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4 bg-surface p-4 rounded-2xl border border-border mb-6 shadow-sm">
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="flex-1 w-full relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-muted" />
          </div>
          <input
            type="text"
            value={searchQuery !== undefined ? searchQuery : undefined}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 text-sm font-inter text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        {/* Filters (Dropdowns, Tabs, etc.) */}
        {filters && (
          <div className="flex items-center gap-3 w-full md:w-auto shrink-0 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            <div className="flex items-center gap-2 text-muted mr-2 md:hidden">
              <Filter size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider">Filters</span>
            </div>
            {filters}
          </div>
        )}
      </div>
      
      {bottomRow && (
        <div className="flex flex-col md:flex-row items-center gap-4 pt-1 w-full overflow-x-auto scrollbar-hide">
          {bottomRow}
        </div>
      )}
    </div>
  );
}
