// src/components/common/ExportButton.tsx
"use client";

import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface ExportColumn {
  key: string;
  header: string;
  width?: number;
}

interface ExportButtonProps {
  data: Record<string, any>[];
  columns: ExportColumn[];
  filename: string;
  title: string;
  className?: string;
  disabled?: boolean;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  columns,
  filename,
  title,
  className = "",
  disabled = false,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const exportToPDF = () => {
    setIsExporting(true);
    
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text(title, 14, 20);
      
      // Add export date
      doc.setFontSize(10);
      doc.text(`Exported on: ${new Date().toLocaleDateString()}`, 14, 30);
      
      // Prepare table data
      const tableColumns = columns.map(col => col.header);
      const tableRows = data.map(item => 
        columns.map(col => {
          const value = item[col.key];
          // Handle different data types
          if (value === null || value === undefined) return "-";
          if (typeof value === "boolean") return value ? "Yes" : "No";
          if (typeof value === "object") return JSON.stringify(value);
          return String(value);
        })
      );

      // Add table
      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: 40,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [200, 233, 103], // Light green color similar to your theme
          textColor: [0, 0, 0],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: 40 },
      });

      // Save the PDF
      doc.save(`${filename}.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
      setShowOptions(false);
    }
  };

  const exportToExcel = () => {
    setIsExporting(true);
    
    try {
      // Prepare data for Excel
      const excelData = data.map(item => {
        const row: Record<string, any> = {};
        columns.forEach(col => {
          const value = item[col.key];
          // Handle different data types for Excel
          if (value === null || value === undefined) {
            row[col.header] = "";
          } else if (typeof value === "boolean") {
            row[col.header] = value ? "Yes" : "No";
          } else if (typeof value === "object") {
            row[col.header] = JSON.stringify(value);
          } else {
            row[col.header] = value;
          }
        });
        return row;
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      
      // Set column widths
      const colWidths = columns.map(col => ({
        wch: col.width || 15
      }));
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, title);
      
      // Save the Excel file
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } catch (error) {
      console.error("Excel Export Error:", error);
      alert("Failed to export Excel. Please try again.");
    } finally {
      setIsExporting(false);
      setShowOptions(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={disabled || isExporting}
        className={`rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title="Export data"
      >
        {isExporting ? "Exporting..." : "Export"}
      </button>
      
      {showOptions && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowOptions(false)}
          />
          
          {/* Options Menu */}
          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-md border bg-white shadow-lg">
            <div className="py-1">
              <button
                onClick={exportToPDF}
                disabled={isExporting}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                📄 Export as PDF
              </button>
              <button
                onClick={exportToExcel}
                disabled={isExporting}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                📊 Export as Excel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;