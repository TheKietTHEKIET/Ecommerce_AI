import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FilterLabelProps {
  children: React.ReactNode;
  isActive: boolean;
  filterKey: string;
  onClear: (key: string) => void;
}

export const FilterLabel = ({
  children,
  isActive,
  filterKey,
  onClear,
}: FilterLabelProps) => (
  <div className="mb-2 flex items-center justify-between">
    <span
      className={`block text-sm font-medium ${
        isActive
          ? "text-zinc-900 dark:text-zinc-100"
          : "text-zinc-700 dark:text-zinc-300"
      }`}
    >
      {children}
      {isActive && (
        <Badge className="ml-2 h-5 bg-amber-500 px-1.5 text-xs text-white hover:bg-amber-500">
          Active
        </Badge>
      )}
    </span>
    {isActive && (
      <button
        type="button"
        onClick={() => onClear(filterKey)}
        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        aria-label={`Clear ${filterKey} filter`}
      >
        <X className="h-4 w-4" />
      </button>
    )}
  </div>
);
