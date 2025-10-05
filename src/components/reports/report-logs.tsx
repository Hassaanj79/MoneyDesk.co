"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useReportLogs } from '@/contexts/report-logs-context';
import { format } from 'date-fns';
import { Download, AlertCircle, CheckCircle, RefreshCw, FileText, FileSpreadsheet, File } from 'lucide-react';

const getReportTypeIcon = (type: string) => {
  switch (type) {
    case 'pdf':
      return <FileText className="h-4 w-4" />;
    case 'csv':
      return <FileSpreadsheet className="h-4 w-4" />;
    case 'excel':
      return <File className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'success':
      return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
    case 'error':
      return <Badge variant="destructive">Error</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
};

export function ReportLogs() {
  const { reportLogs, loading, error } = useReportLogs();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Report Generation Logs</CardTitle>
          <CardDescription>Loading report generation history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading logs...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Report Generation Logs</CardTitle>
          <CardDescription>Error loading logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Generation Logs</CardTitle>
        <CardDescription>
          History of all report generations ({reportLogs.length} total)
        </CardDescription>
      </CardHeader>
      <CardContent>

        {/* Logs Table */}
        {reportLogs.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No report generation logs found</p>
            <p className="text-sm text-gray-400">Generate your first report to see logs here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getReportTypeIcon(log.reportType)}
                        {log.reportName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase">
                        {log.reportType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(log.dateRange.from, 'MMM dd, yyyy')}</div>
                        <div className="text-gray-500">to {format(log.dateRange.to, 'MMM dd, yyyy')}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(log.generatedAt, 'MMM dd, yyyy')}
                        <div className="text-gray-500">{format(log.generatedAt, 'HH:mm:ss')}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        {getStatusBadge(log.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {log.recordCount && (
                          <div className="text-gray-600">
                            {log.recordCount.toLocaleString()} records
                          </div>
                        )}
                        {log.fileSize && (
                          <div className="text-gray-600">
                            {(log.fileSize / 1024).toFixed(1)} KB
                          </div>
                        )}
                        {log.errorMessage && (
                          <div className="text-red-600 text-xs">
                            {log.errorMessage}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.status === 'success' && log.downloadUrl && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={log.downloadUrl} download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
