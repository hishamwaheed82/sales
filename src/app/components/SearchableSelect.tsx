import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { cn } from "./ui/utils";

export type SearchableSelectOption = {
  value: string;
  label: string;
  /** Extra text matched by search (codes, aliases). */
  keywords?: string;
  disabled?: boolean;
};

type Size = "sm" | "md";

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  size?: Size;
  /** When true, shows a clear control that sets value to "". */
  allowClear?: boolean;
  disabled?: boolean;
};

const EMPTY_VALUE = "__empty__";

/**
 * Combobox-style select with typeahead — standard pattern for long lists
 * (accounts, cost centers, journal types). Reuses existing cmdk + Popover.
 */
export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "اختر…",
  searchPlaceholder = "بحث…",
  emptyText = "لا نتائج",
  className,
  size = "md",
  allowClear = false,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  const triggerPad = size === "sm" ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-lg border border-[#E0E8F4] bg-white text-start text-[#0D1B2E] outline-none transition-colors",
            "hover:border-[#1A4F8C]/50 focus-visible:border-[#1A4F8C] focus-visible:ring-2 focus-visible:ring-[#1A4F8C]/15",
            "disabled:cursor-not-allowed disabled:opacity-50",
            triggerPad,
            className
          )}
          aria-expanded={open}
        >
          <span className={cn("truncate", !selected && "text-slate-400")}>
            {selected?.label ?? placeholder}
          </span>
          <span className="flex shrink-0 items-center gap-0.5 text-slate-400">
            {allowClear && value ? (
              <span
                role="button"
                tabIndex={-1}
                className="rounded p-0.5 hover:bg-slate-100 hover:text-slate-600"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange("");
                }}
              >
                <X size={size === "sm" ? 12 : 14} />
              </span>
            ) : null}
            <ChevronsUpDown size={size === "sm" ? 12 : 14} />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[80] w-[var(--radix-popover-trigger-width)] min-w-[220px] border-[#E0E8F4] p-0 shadow-lg"
        align="start"
        sideOffset={4}
      >
        <Command
          className="rounded-lg"
          filter={(itemValue, search) => {
            const key = itemValue === EMPTY_VALUE ? "" : itemValue;
            const opt = options.find((o) => o.value === key);
            if (!opt) return 0;
            const hay = `${opt.label} ${opt.keywords ?? ""} ${opt.value}`.toLowerCase();
            return hay.includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput
            placeholder={searchPlaceholder}
            className="h-10 text-sm text-[#0D1B2E] placeholder:text-slate-400"
          />
          <CommandList className="max-h-60">
            <CommandEmpty className="py-6 text-center text-xs text-slate-400">
              {emptyText}
            </CommandEmpty>
            <CommandGroup className="p-1">
              {options.map((opt) => {
                const itemValue = opt.value === "" ? EMPTY_VALUE : opt.value;
                return (
                  <CommandItem
                    key={itemValue}
                    value={itemValue}
                    disabled={opt.disabled}
                    onSelect={(current) => {
                      const next = current === EMPTY_VALUE ? "" : current;
                      onChange(next);
                      setOpen(false);
                    }}
                    className="cursor-pointer rounded-md px-2 py-2 text-sm aria-selected:bg-[#E8F0FB] aria-selected:text-[#0D1B2E]"
                  >
                    <Check
                      size={14}
                      className={cn(
                        "me-2 shrink-0 text-[#1A4F8C]",
                        value === opt.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{opt.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
