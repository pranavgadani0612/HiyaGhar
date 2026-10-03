import React, { useState, useMemo } from 'react';
import './DataTable.css';

export interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (item: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  title: string;
  addButtonText?: string;
  columns: ColumnDef<T>[];
  data: T[];
  onAddClick?: () => void;
  onEditClick?: (item: T) => void;
  onDeleteClick?: (item: T) => void;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canExport?: boolean;
  onExportClick?: () => void;
  extraControls?: React.ReactNode;
  loading?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  title,
  addButtonText = '+ Add Item',
  columns,
  data,
  onAddClick,
  onEditClick,
  onDeleteClick,
  canAdd = true,
  canEdit = true,
  canDelete = true,
  canExport = true,
  onExportClick,
  extraControls,
  loading = false,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter Data (Triggers on 3+ characters or when cleared)
  const filteredData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    // If search is empty, return all data
    if (!term) return data;
    // If search is less than 3 characters, require at least 3 characters before filtering
    if (term.length < 3) return data;

    return data.filter((item) =>
      Object.values(item).some((val) => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') {
          return JSON.stringify(val).toLowerCase().includes(term);
        }
        return String(val).toLowerCase().includes(term);
      })
    );
  }, [data, searchTerm]);

  // Sort Data (Default: Newest additions at #1, or user-selected column sort)
  const sortedData = useMemo(() => {
    if (!sortKey) {
      // If no column is clicked for sorting, default to showing newest created items at the top (#1)
      return [...filteredData].sort((a, b) => {
        const idA = a.id ?? a.userId ?? a.roleId ?? a.menuId ?? a.customerId ?? a.attributeId ?? a.componentId ?? a.orderId ?? 0;
        const idB = b.id ?? b.userId ?? b.roleId ?? b.menuId ?? b.customerId ?? b.attributeId ?? b.componentId ?? b.orderId ?? 0;
        if (typeof idA === 'number' && typeof idB === 'number' && (idA !== 0 || idB !== 0)) {
          return idB - idA;
        }
        return 0;
      });
    }

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredData, sortKey, sortDirection]);

  const totalEntries = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);
  const endIndex = Math.min(startIndex + pageSize, totalEntries);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleDefaultExport = () => {
    if (onExportClick) {
      onExportClick();
      return;
    }
    if (!data || data.length === 0) {
      alert('No data available to export.');
      return;
    }

    const headers = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`);
    const rows = sortedData.map((item) =>
      columns.map((c) => {
        const val = item[c.key];
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="hiyaghar-datatable-card">
      {/* Table Header: Title + Add Button */}
      <div className="hiyaghar-datatable-top-header">
        <h2 className="hiyaghar-datatable-title">{title}</h2>
        <div className="hiyaghar-datatable-actions-top">
          {canExport && (
            <button type="button" className="hiyaghar-export-btn" onClick={handleDefaultExport} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export CSV</span>
            </button>
          )}
          {canAdd && onAddClick && (
            <button type="button" className="hiyaghar-add-entity-btn" onClick={onAddClick}>
              {addButtonText}
            </button>
          )}
        </div>
      </div>

      {/* Control Bar: Entries Count & Search Bar */}
      <div className="hiyaghar-datatable-controls">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div className="hiyaghar-entries-control">
            <span>Show entries</span>
            <select value={pageSize} onChange={handlePageSizeChange} className="hiyaghar-select-pagesize">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          {extraControls}
        </div>

        <div className="hiyaghar-search-control">
          <label>Search:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search..."
            className="hiyaghar-search-input"
          />
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="hiyaghar-table-responsive">
        <table className="hiyaghar-datatable">
          <thead>
            <tr>
              <th className="th-srno">Sr.No</th>
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="th-sortable"
                    title={`Click to sort by ${col.label}`}
                  >
                    <div className="th-sortable-inner">
                      <span>{col.label}</span>
                      <span className={`sort-icon ${isSorted ? 'active' : ''}`}>
                        {isSorted ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                      </span>
                    </div>
                  </th>
                );
              })}
              {(canEdit || canDelete) && <th className="th-action">Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 2} className="td-empty">
                  ⏳ Loading data...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="td-empty">
                  No matching records found.
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => {
                const srNo = startIndex + index + 1;
                return (
                  <tr key={item.id || item.userId || item.roleId || item.menuId || index}>
                    <td className="td-srno">{srNo}</td>
                    {columns.map((col) => (
                      <td key={col.key}>
                        {col.render ? col.render(item, startIndex + index) : item[col.key] ?? '-'}
                      </td>
                    ))}
                    {(canEdit || canDelete) && (
                      <td className="td-action">
                        <div className="hiyaghar-action-btns">
                          {canEdit && onEditClick && (
                            <button
                              type="button"
                              className="hiyaghar-action-edit-btn"
                              onClick={() => onEditClick(item)}
                              title="Edit Record"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                          )}
                          {canDelete && onDeleteClick && (
                            <button
                              type="button"
                              className="hiyaghar-action-delete-btn"
                              onClick={() => onDeleteClick(item)}
                              title="Delete Record"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer: Entry Info & Pagination */}
      <div className="hiyaghar-datatable-footer">
        <div className="hiyaghar-footer-info">
          Showing {totalEntries === 0 ? 0 : startIndex + 1} to {endIndex} of {totalEntries} entries
        </div>

        <div className="hiyaghar-pagination">
          <button
            type="button"
            className="hiyaghar-page-btn"
            disabled={safeCurrentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              className={`hiyaghar-page-btn ${pageNum === safeCurrentPage ? 'is-active' : ''}`}
              onClick={() => setCurrentPage(pageNum)}
            >
              {pageNum}
            </button>
          ))}

          <button
            type="button"
            className="hiyaghar-page-btn"
            disabled={safeCurrentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
