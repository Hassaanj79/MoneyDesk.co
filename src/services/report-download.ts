import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { ReportData, CustomReport, ReportGenerationOptions } from '@/types';

// Dynamic import for xlsx to handle missing dependency gracefully
let XLSX: any = null;
const loadXLSX = async () => {
  if (!XLSX) {
    try {
      XLSX = await import('xlsx');
    } catch (error) {
      console.warn('xlsx package not available, Excel export disabled');
      throw new Error('Excel export requires xlsx package to be installed');
    }
  }
  return XLSX;
};

// PDF Generation
export const generatePDFReport = async (
  report: CustomReport,
  reportData: ReportData[],
  options: ReportGenerationOptions
): Promise<void> => {
  const doc = new jsPDF({
    orientation: options.orientation,
    unit: 'mm',
    format: options.pageSize,
  });

  // Set up fonts and colors
  doc.setFont('helvetica');
  
  // Title
  doc.setFontSize(20);
  doc.text(report.name, 20, 30);
  
  // Date range
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(
    `Period: ${format(report.dateRange.from, 'MMM dd, yyyy')} - ${format(report.dateRange.to, 'MMM dd, yyyy')}`,
    20,
    40
  );
  
  // Generated date
  doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 20, 50);
  
  let yPosition = 60;

  // Process each module's data
  for (const moduleData of reportData) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 30;
    }

    // Module title
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(moduleData.metadata.title, 20, yPosition);
    yPosition += 10;

    // Module description
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(moduleData.metadata.description, 20, yPosition);
    yPosition += 15;

    // Process data based on type
    if (moduleData.data) {
      if (Array.isArray(moduleData.data)) {
        // Table data
        const tableData = moduleData.data.map((row: any) => {
          if (typeof row === 'object') {
            return Object.values(row);
          }
          return [row];
        });

        autoTable(doc, {
          head: moduleData.data.length > 0 && typeof moduleData.data[0] === 'object' 
            ? [Object.keys(moduleData.data[0])] 
            : [['Data']],
          body: tableData,
          startY: yPosition,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 139, 202] },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 20;
      } else if (typeof moduleData.data === 'object') {
        // Summary data
        const summaryData = Object.entries(moduleData.data).map(([key, value]) => [
          key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          typeof value === 'number' ? value.toLocaleString() : String(value)
        ]);

        autoTable(doc, {
          head: [['Metric', 'Value']],
          body: summaryData,
          startY: yPosition,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 139, 202] },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 20;
      }
    }

    yPosition += 10;
  }

  // Download the PDF
  doc.save(`${report.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
};

// CSV Generation
export const generateCSVReport = async (
  report: CustomReport,
  reportData: ReportData[]
): Promise<void> => {
  const csvData: any[] = [];
  
  // Add report metadata
  csvData.push(['Report Name', report.name]);
  csvData.push(['Description', report.description || '']);
  csvData.push(['Date Range', `${format(report.dateRange.from, 'yyyy-MM-dd')} to ${format(report.dateRange.to, 'yyyy-MM-dd')}`]);
  csvData.push(['Generated', format(new Date(), 'yyyy-MM-dd HH:mm:ss')]);
  csvData.push([]); // Empty row

  // Process each module's data
  reportData.forEach((moduleData, index) => {
    csvData.push([`Module ${index + 1}: ${moduleData.metadata.title}`]);
    csvData.push(['Description', moduleData.metadata.description]);
    csvData.push([]);

    if (moduleData.data) {
      if (Array.isArray(moduleData.data)) {
        // Table data
        if (moduleData.data.length > 0) {
          if (typeof moduleData.data[0] === 'object') {
            // Object array
            const headers = Object.keys(moduleData.data[0]);
            csvData.push(headers);
            moduleData.data.forEach((row: any) => {
              csvData.push(headers.map(header => row[header]));
            });
          } else {
            // Simple array
            csvData.push(['Data']);
            moduleData.data.forEach((item: any) => {
              csvData.push([item]);
            });
          }
        }
      } else if (typeof moduleData.data === 'object') {
        // Summary data
        csvData.push(['Metric', 'Value']);
        Object.entries(moduleData.data).forEach(([key, value]) => {
          csvData.push([
            key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            typeof value === 'number' ? value.toLocaleString() : String(value)
          ]);
        });
      }
    }

    csvData.push([]); // Empty row between modules
  });

  // Convert to CSV string
  const csvString = csvData.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  // Download the CSV
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${report.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Excel Generation
export const generateExcelReport = async (
  report: CustomReport,
  reportData: ReportData[]
): Promise<void> => {
  const xlsx = await loadXLSX();
  const workbook = xlsx.utils.book_new();
  
  // Create summary sheet
  const summaryData = [
    ['Report Name', report.name],
    ['Description', report.description || ''],
    ['Date Range', `${format(report.dateRange.from, 'yyyy-MM-dd')} to ${format(report.dateRange.to, 'yyyy-MM-dd')}`],
    ['Generated', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
    ['Format', report.format.toUpperCase()],
    ['Modules', report.modules.length.toString()],
  ];

  const summarySheet = xlsx.utils.aoa_to_sheet(summaryData);
  xlsx.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Create a sheet for each module
  reportData.forEach((moduleData, index) => {
    const sheetData: any[] = [];
    
    // Add module header
    sheetData.push([moduleData.metadata.title]);
    sheetData.push(['Description', moduleData.metadata.description]);
    sheetData.push(['Generated', format(moduleData.metadata.generatedAt, 'yyyy-MM-dd HH:mm:ss')]);
    sheetData.push(['Data Points', moduleData.metadata.dataPoints.toString()]);
    sheetData.push([]); // Empty row

    if (moduleData.data) {
      if (Array.isArray(moduleData.data)) {
        // Table data
        if (moduleData.data.length > 0) {
          if (typeof moduleData.data[0] === 'object') {
            // Object array
            const headers = Object.keys(moduleData.data[0]);
            sheetData.push(headers);
            moduleData.data.forEach((row: any) => {
              sheetData.push(headers.map(header => row[header]));
            });
          } else {
            // Simple array
            sheetData.push(['Data']);
            moduleData.data.forEach((item: any) => {
              sheetData.push([item]);
            });
          }
        }
      } else if (typeof moduleData.data === 'object') {
        // Summary data
        sheetData.push(['Metric', 'Value']);
        Object.entries(moduleData.data).forEach(([key, value]) => {
          sheetData.push([
            key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            typeof value === 'number' ? value.toLocaleString() : String(value)
          ]);
        });
      }
    }

    const sheet = xlsx.utils.aoa_to_sheet(sheetData);
    const sheetName = `Module ${index + 1}`.substring(0, 31); // Excel sheet name limit
    xlsx.utils.book_append_sheet(workbook, sheet, sheetName);
  });

  // Download the Excel file
  xlsx.writeFile(workbook, `${report.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.xlsx`);
};

// Main download function
export const downloadReport = async (
  report: CustomReport,
  reportData: ReportData[],
  options: ReportGenerationOptions
): Promise<void> => {
  try {
    switch (report.format) {
      case 'pdf':
        await generatePDFReport(report, reportData, options);
        break;
      case 'csv':
        await generateCSVReport(report, reportData);
        break;
      case 'excel':
        await generateExcelReport(report, reportData);
        break;
      default:
        throw new Error(`Unsupported format: ${report.format}`);
    }
  } catch (error) {
    console.error('Error downloading report:', error);
    throw error;
  }
};
