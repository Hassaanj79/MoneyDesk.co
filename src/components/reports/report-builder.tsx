"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCustomReports } from '@/contexts/custom-reports-context';
import { useDateRange } from '@/contexts/date-range-context';
import { Plus, X, Settings, Download, FileText, BarChart3, PieChart, TrendingUp, Wallet, CreditCard, Target, Activity, List, Repeat } from 'lucide-react';
import type { ReportModule, CustomReport, ReportGenerationOptions } from '@/types';

const reportSchema = z.object({
  name: z.string().min(1, 'Report name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  modules: z.array(z.string()).min(1, 'Select at least one module'),
  format: z.enum(['pdf', 'csv', 'excel']),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ReportBuilderProps {
  onReportCreated?: (report: CustomReport) => void;
  onReportGenerated?: (reportId: string, data: any) => void;
}

const iconMap = {
  Wallet,
  TrendingUp,
  PieChart,
  CreditCard,
  BarChart3,
  Target,
  FileText,
  Activity,
  List,
  Repeat,
  Settings,
  Download,
};

export function ReportBuilder({ onReportCreated, onReportGenerated }: ReportBuilderProps) {
  const { createReport, generateReport, reportModules, getModulesByCategory, loading } = useCustomReports();
  const { date } = useDateRange();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [generationOptions, setGenerationOptions] = useState<ReportGenerationOptions>({
    includeCharts: true,
    includeTables: true,
    includeSummary: true,
    chartTheme: 'auto',
    pageSize: 'A4',
    orientation: 'portrait',
  });

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      name: '',
      description: '',
      modules: [],
      format: 'pdf',
      isPublic: false,
      tags: [],
    },
  });

  const categories = [
    { id: 'financial', name: 'Financial', icon: Wallet },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
    { id: 'transactions', name: 'Transactions', icon: Activity },
    { id: 'accounts', name: 'Accounts', icon: CreditCard },
    { id: 'budgets', name: 'Budgets', icon: Target },
    { id: 'loans', name: 'Loans', icon: FileText },
  ];

  const handleModuleToggle = (moduleId: string) => {
    const newSelectedModules = selectedModules.includes(moduleId)
      ? selectedModules.filter(id => id !== moduleId)
      : [...selectedModules, moduleId];
    
    setSelectedModules(newSelectedModules);
    form.setValue('modules', newSelectedModules);
  };

  const handleSubmit = async (data: ReportFormData) => {
    try {
      if (!date?.from || !date?.to) {
        throw new Error('Please select a date range');
      }

      const reportData = {
        ...data,
        dateRange: {
          from: date.from,
          to: date.to,
        },
      };

      const reportId = await createReport(reportData);
      
      // Get the created report
      const createdReport = {
        id: reportId,
        userId: '', // Will be set by the service
        ...reportData,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as CustomReport;

      onReportCreated?.(createdReport);
      setIsOpen(false);
      form.reset();
      setSelectedModules([]);
    } catch (error) {
      console.error('Error creating report:', error);
    }
  };

  const handleGenerateReport = async (reportId: string) => {
    try {
      const data = await generateReport(reportId, generationOptions);
      onReportGenerated?.(reportId, data);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Custom Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Report</DialogTitle>
          <DialogDescription>
            Select modules and configure your custom financial report
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="modules">Select Modules</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Monthly Financial Summary" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what this report contains..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Export Format</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="csv">CSV</SelectItem>
                            <SelectItem value="excel">Excel</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Make Public</FormLabel>
                          <FormDescription>
                            Allow others to view this report template
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="modules" className="space-y-4">
                <div className="space-y-4">
                  {categories.map((category) => {
                    const IconComponent = category.icon;
                    const categoryModules = getModulesByCategory(category.id as any);
                    
                    return (
                      <Card key={category.id}>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <IconComponent className="h-5 w-5" />
                            {category.name}
                          </CardTitle>
                          <CardDescription>
                            {categoryModules.length} modules available
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {categoryModules.map((module) => {
                              const ModuleIcon = iconMap[module.icon as keyof typeof iconMap] || FileText;
                              const isSelected = selectedModules.includes(module.id);
                              
                              return (
                                <div
                                  key={module.id}
                                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                    isSelected 
                                      ? 'border-primary bg-primary/5' 
                                      : 'border-border hover:border-primary/50'
                                  }`}
                                  onClick={() => handleModuleToggle(module.id)}
                                >
                                  <div className="flex items-start gap-3">
                                    <ModuleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-sm">{module.name}</h4>
                                        {module.required && (
                                          <Badge variant="secondary" className="text-xs">Required</Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {module.description}
                                      </p>
                                      <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="outline" className="text-xs">
                                          {module.dataType}
                                        </Badge>
                                        {module.chartType && (
                                          <Badge variant="outline" className="text-xs">
                                            {module.chartType}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <Checkbox
                                      checked={isSelected}
                                      onChange={() => handleModuleToggle(module.id)}
                                      className="flex-shrink-0"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {selectedModules.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Selected Modules ({selectedModules.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedModules.map((moduleId) => {
                          const module = reportModules.find(m => m.id === moduleId);
                          if (!module) return null;
                          
                          return (
                            <Badge key={moduleId} variant="secondary" className="flex items-center gap-1">
                              {module.name}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => handleModuleToggle(moduleId)}
                              />
                            </Badge>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Generation Options</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={generationOptions.includeCharts}
                          onCheckedChange={(checked) => 
                            setGenerationOptions(prev => ({ ...prev, includeCharts: !!checked }))
                          }
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Include Charts</FormLabel>
                        <FormDescription>
                          Include visual charts in the report
                        </FormDescription>
                      </div>
                    </FormItem>

                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={generationOptions.includeTables}
                          onCheckedChange={(checked) => 
                            setGenerationOptions(prev => ({ ...prev, includeTables: !!checked }))
                          }
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Include Tables</FormLabel>
                        <FormDescription>
                          Include data tables in the report
                        </FormDescription>
                      </div>
                    </FormItem>

                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={generationOptions.includeSummary}
                          onCheckedChange={(checked) => 
                            setGenerationOptions(prev => ({ ...prev, includeSummary: !!checked }))
                          }
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Include Summary</FormLabel>
                        <FormDescription>
                          Include executive summary section
                        </FormDescription>
                      </div>
                    </FormItem>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormItem>
                      <FormLabel>Chart Theme</FormLabel>
                      <Select 
                        value={generationOptions.chartTheme} 
                        onValueChange={(value: 'light' | 'dark' | 'auto') => 
                          setGenerationOptions(prev => ({ ...prev, chartTheme: value }))
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="auto">Auto</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>

                    <FormItem>
                      <FormLabel>Page Size</FormLabel>
                      <Select 
                        value={generationOptions.pageSize} 
                        onValueChange={(value: 'A4' | 'Letter') => 
                          setGenerationOptions(prev => ({ ...prev, pageSize: value }))
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A4">A4</SelectItem>
                          <SelectItem value="Letter">Letter</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || selectedModules.length === 0}>
                {loading ? 'Creating...' : 'Create Report'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
