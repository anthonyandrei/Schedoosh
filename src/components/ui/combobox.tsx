"use client";

import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

export interface ComboboxProps {
  id?: string;
  options?: { value: string; label: string; badge?: string }[];
  selectMessage?: string;
  searchMessage?: string;
  emptyMessage?: string;
  value: string;
  allowCustom?: boolean;
  onValueChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  isCustom?: boolean;
  onCustomChange?: (value: boolean) => void;
}

export function Combobox({
  id,
  options = [],
  selectMessage = "Please select an option...",
  searchMessage = "Search options...",
  emptyMessage = "No options found.",
  value,
  allowCustom = false,
  onValueChange,
  className = "",
  disabled = false,
  isCustom,
  onCustomChange = () => {},
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const selectedOption = isCustom
    ? { badge: null, label: value, value: value }
    : options.find((option) => option.value === value);

  const handleSelect = (currentValue: string) => {
    onValueChange(currentValue === value ? "" : currentValue);
    setOpen(false);
    onCustomChange?.(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <span
            className={cn(
              "min-w-0 overflow-hidden text-ellipsis",
              !selectedOption && "text-muted-foreground"
            )}
          >
            {selectedOption ? (
              <>
                {selectedOption.badge && (
                  <Badge variant="secondary" className="mr-2">
                    {selectedOption.badge}
                  </Badge>
                )}
                {selectedOption.label}
              </>
            ) : (
              selectMessage
            )}
          </span>
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-h-[--radix-popover-content-available-height] w-[--radix-popover-trigger-width] p-0">
        <Command
          filter={(value, search, keywords = []) => {
            const extendValue = `${value} ${keywords.join(" ")}`;
            if (extendValue.toLowerCase().includes(search.toLowerCase())) {
              return 1;
            }
            return 0;
          }}
        >
          <CommandInput
            placeholder={searchMessage}
            className="h-9"
            value={search}
            onValueChange={setSearch}
          />
          <ScrollArea className="max-h-96 overflow-auto">
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {allowCustom && search && value !== search && (
                  <div>
                    <CommandItem
                      value={search}
                      onSelect={() => {
                        onValueChange(search.trim());
                        onCustomChange(true);
                        setOpen(false);
                      }}
                      className="text-muted-foreground"
                    >
                      Add new option {`"${search}"`}
                    </CommandItem>
                  </div>
                )}
                {isCustom && (
                  <CommandItem value={value} onSelect={handleSelect}>
                    <Badge className="mr-2">New</Badge> {`"${value}"`}
                    <CheckIcon className={cn("ml-auto h-4 w-4")} />
                  </CommandItem>
                )}
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={handleSelect}
                    keywords={[option.label, ...[option.badge ?? ""]]}
                  >
                    {option.badge && (
                      <Badge variant="secondary" className="mr-2">
                        {option.badge}
                      </Badge>
                    )}
                    {option.label}
                    <CheckIcon
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
