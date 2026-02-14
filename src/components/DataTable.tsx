'use client';

import { ReactNode, useState, useMemo } from 'react';
import { Search, Download, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface DataTableProps {
  data: any[];
  columns: {
    key: string;
    header: string;
    render?: (item: any) => ReactNode;
    sortable?: boolean;
  }[];
  title?: string;
  loading?: boolean;
  searchable?: boolean;
  exportable?: boolean;
  pageSize?: number;
}

export default function DataTable({
  data, 
  columns, 
  title,
  loading = false,
  searchable = true,
  exportable = true,
  pageSize = 10
}: DataTableProps) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Ensure data is always an array
  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!search.trim()) return safeData;
    const searchLower = search.toLowerCase();
    return safeData.filter(item =>
      columns.some(col => {
        const value = item[col.key];
        return value != null && String(value).toLowerCase().includes(searchLower);
      })
    );
  }, [safeData, search, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null) return sortDir === 'asc' ? 1 : -1;
      if (bVal == null) return sortDir === 'asc' ? -1 : 1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [filteredData, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const exportToCsv = () => {
    const headers = columns.map(col => col.header).join(',');
    const rows = sortedData.map(item =>
      columns.map(col => {
        const value = item[col.key];
        const strVal = value == null ? '' : String(value);
        // Escape quotes and wrap in quotes if contains comma
        if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || 'data'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="medical-card p-6">
        {title && <h3 className="medical-card-title text-lg font-semibold mb-4">{title}</h3>}
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="medical-card overflow-hidden">
      {/* Header with title and actions */}
      <div className="px-6 py-4 border-b border-[#c8d9e4] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {title && <h3 className="medical-card-title text-lg font-semibold">{title}</h3>}
          <p className="text-sm text-slate-500">
            {filteredData.length} {filteredData.length === 1 ? 'record' : 'records'}
            {search && ` (filtered from ${safeData.length})`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 border border-[#c9e2cf] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2e8f5e] focus:border-transparent w-48"
              />
            </div>
          )}
          {exportable && (
            <button
              onClick={exportToCsv}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[#1b5033] border border-[#c9e2cf] rounded-lg hover:bg-[#edf8f0] transition-colors"
            >
              <Download size={16} />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#edf8f0]">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-[#426751] uppercase tracking-wider ${
                    col.sortable !== false ? 'cursor-pointer hover:bg-[#e0f1e5] select-none' : ''
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable !== false && sortKey === col.key && (
                      sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dcefe1]">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500">
                  {search ? 'No matching records found' : 'No data available'}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr key={index} className="hover:bg-[#f3fbf5]">
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-[#1f4a31]">
                      {col.render 
                        ? col.render(item) 
                        : String(item[col.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-[#c9e2cf] flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-1 text-sm text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
