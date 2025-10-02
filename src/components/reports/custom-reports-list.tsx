"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCustomReports } from '@/contexts/custom-reports-context';
import { 
  MoreHorizontal, 
  Download, 
  Edit, 
  Trash2, 
  Calendar, 
  FileText, 
  Users,
  Clock,
  Tag
} from 'lucide-react';
import { format } from 'date-fns';
import type { CustomReport } from '@/types';

interface CustomReportsListProps {
  onEditReport?: (report: CustomReport) => void;
  onGenerateReport?: (report: CustomReport) => void;
}

export function CustomReportsList({ onEditReport, onGenerateReport }: CustomReportsListProps) {
  const { customReports, deleteReport, loading } = useCustomReports();
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);

  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteReport(reportId);
      setDeleteReportId(null);
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'csv':
        return <FileText className="h-4 w-4" />;
      case 'excel':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getFormatColor = (format: string) => {
    switch (format) {
      case 'pdf':
        return 'bg-red-100 text-red-800';
      case 'csv':
        return 'bg-green-100 text-green-800';
      case 'excel':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (customReports.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Custom Reports</h3>
          <p className="text-muted-foreground text-center mb-4">
            Create your first custom report to get started with personalized financial insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {customReports.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {report.name}
                    {report.isPublic && (
                      <Badge variant="secondary" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        Public
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {report.description || 'No description provided'}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onGenerateReport?.(report)}>
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEditReport?.(report)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Report
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setDeleteReportId(report.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Report Details */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(report.dateRange.from, 'MMM dd, yyyy')} - {format(report.dateRange.to, 'MMM dd, yyyy')}
                  </div>
                  <div className="flex items-center gap-1">
                    {getFormatIcon(report.format)}
                    <span className="uppercase">{report.format}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {report.modules.length} modules
                  </div>
                </div>

                {/* Tags */}
                {report.tags && report.tags.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                      {report.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Last Generated */}
                {report.lastGenerated && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Last generated: {format(report.lastGenerated, 'MMM dd, yyyy HH:mm')}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <Button 
                    size="sm" 
                    onClick={() => onGenerateReport?.(report)}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Generate Report
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onEditReport?.(report)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteReportId} onOpenChange={() => setDeleteReportId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteReportId && handleDeleteReport(deleteReportId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
