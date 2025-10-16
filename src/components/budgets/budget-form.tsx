
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Budget, Category } from "@/types";
import { useEffect } from "react";
import { CategoryCombobox } from "../categories/category-combobox";
import { useBudgets } from "@/contexts/budget-context";
import { useCategories } from "@/contexts/category-context";

const formSchema = z.object({
  categoryId: z.string().min(1, "Please select a category."),
  limit: z.coerce.number().positive("Budget limit must be a positive number."),
});

type BudgetFormProps = {
  onSuccess: () => void;
  existingBudget?: (Budget & {categoryName: string}) | null;
  allBudgets: (Budget & {categoryName: string})[];
  onCategoryCreated: (name: string) => Promise<Category>;
};

export function BudgetForm({ onSuccess, existingBudget, allBudgets, onCategoryCreated }: BudgetFormProps) {
  const { addBudget, updateBudget } = useBudgets();
  const { categories } = useCategories();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: existingBudget?.categoryId || "",
      limit: existingBudget?.limit || 0,
    },
  });
  
  useEffect(() => {
    form.reset({
        categoryId: existingBudget?.categoryId || "",
        limit: existingBudget?.limit || 0,
    })
  }, [existingBudget, form])

  const handleCategoryCreated = async (name: string) => {
    const newCategory = await onCategoryCreated(name);
    form.setValue('categoryId', newCategory.id);
  }

  const availableCategories = categories.filter(c => 
    c.type === 'expense' &&
    (!allBudgets.some(b => b.categoryId === c.id) || (existingBudget && c.id === existingBudget.categoryId))
  );

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (existingBudget) {
      await updateBudget(existingBudget.id, { limit: data.limit });
    } else {
      if (!allBudgets.some(b => b.categoryId === data.categoryId)) {
        await addBudget(data);
      }
    }
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <CategoryCombobox 
                    categories={availableCategories}
                    value={field.value}
                    onChange={field.onChange}
                    onCategoryCreated={handleCategoryCreated}
                    disabled={!!existingBudget}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="limit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Budget Limit</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="e.g., 500.00" 
                  {...field} 
                  step="0.01"
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          {existingBudget ? "Save Changes" : "Create Budget"}
        </Button>
      </form>
    </Form>
  );
}
