
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Category } from "@/types"

type CategoryComboboxProps = {
    categories: Category[];
    disabled?: boolean;
    value: string;
    onChange: (value: string) => void;
    onCategoryCreated: (name: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyPlaceholder?: string;
}

export function CategoryCombobox({ 
    categories, 
    disabled,
    value,
    onChange,
    onCategoryCreated,
    placeholder = "Select category...",
    searchPlaceholder = "Search categories...",
    emptyPlaceholder = "No category found.",
}: CategoryComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  
  const handleCreateCategory = () => {
    if (query) {
        onCategoryCreated(query)
        // Find the new category to set the value. A bit of a hack.
        const newCategory = categories.find(c => c.name.toLowerCase() === query.toLowerCase());
        if(newCategory) {
            onChange(newCategory.id);
        }
        setOpen(false)
    }
  }

  const filteredCategories = query === '' 
    ? categories 
    : categories.filter(category => category.name.toLowerCase().includes(query.toLowerCase()));

  const showCreateOption = query !== '' && !filteredCategories.some(c => c.name.toLowerCase() === query.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value
            ? categories.find((category) => category.id === value)?.name
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={query} 
            onValueChange={setQuery}
          />
          <CommandList>
            {filteredCategories.length === 0 && !showCreateOption && <CommandEmpty>{emptyPlaceholder}</CommandEmpty>}
            <CommandGroup>
              {filteredCategories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.id}
                  onSelect={(currentValue) => {
                    onChange(currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === category.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {category.name}
                </CommandItem>
              ))}
              {showCreateOption && (
                 <CommandItem onSelect={handleCreateCategory}>
                     <PlusCircle className="mr-2 h-4 w-4" />
                    Create "{query}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
