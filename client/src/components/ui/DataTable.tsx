import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpDown, Search, CheckSquare, Square } from 'lucide-react';

export interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
    sortable?: boolean;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
    enableSelection?: boolean;
    onSelectionChange?: (selectedItems: T[]) => void;
    keyField: keyof T; // Unique ID field
    actions?: React.ReactNode;
    isLoading?: boolean;
    pagination?: boolean;
    searchable?: boolean;
    onSearch?: (term: string) => void;
    getRowClassName?: (item: T) => string; // Optional row styling function
    totalCount?: number; // Total records (for server-side pagination)
    currentPage?: number; // Current page (from parent)
    pageSize?: number; // Page size (from parent)
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
}

export function DataTable<T>({
    data,
    columns,
    onRowClick,
    enableSelection = false,
    onSelectionChange,
    keyField,
    actions,
    isLoading = false,
    pagination = true,
    searchable = true,
    onSearch,
    getRowClassName,
    totalCount,
    currentPage: externalCurrentPage,
    pageSize: externalPageSize,
    onPageChange,
    onPageSizeChange
}: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof T | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
    const [internalCurrentPage, setInternalCurrentPage] = useState(1);
    const [internalPageSize, setInternalPageSize] = useState(10);
    const [selectedIds, setSelectedIds] = useState<Set<any>>(new Set());

    const currentPage = externalCurrentPage ?? internalCurrentPage;
    const pageSize = externalPageSize ?? internalPageSize;
    const isServerSide = totalCount !== undefined;

    const changePage = (page: number) => {
        if (onPageChange) {
            onPageChange(page);
        } else {
            setInternalCurrentPage(page);
        }
    };

    const changePageSize = (size: number) => {
        if (onPageSizeChange) {
            onPageSizeChange(size);
        } else {
            setInternalPageSize(size);
            setInternalCurrentPage(1);
        }
    };

    // 1. Filter
    const filteredData = useMemo(() => {
        if (onSearch || isServerSide) return data; // If external/server search, assume data is handled
        if (!searchTerm) return data;
        return data.filter(item =>
            Object.values(item as any).some(val =>
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [data, searchTerm, onSearch, isServerSide]);

    // 2. Sort
    const sortedData = useMemo(() => {
        if (!sortConfig.key || isServerSide) return filteredData;
        return [...filteredData].sort((a, b) => {
            const aVal = a[sortConfig.key!] as any;
            const bVal = b[sortConfig.key!] as any;
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig, isServerSide]);

    // 3. Paginate — if pageSize is 0, show all
    const dataSize = isServerSide ? (totalCount ?? 0) : sortedData.length;
    const effectivePageSize = pageSize === 0 ? dataSize || 1 : pageSize;
    const totalPages = pagination ? Math.ceil(dataSize / effectivePageSize) : 1;
    const paginatedData = (pagination && !isServerSide) ? sortedData.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize) : sortedData;

    // Handlers
    const handleSort = (key: keyof T) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const toggleSelection = (id: any, item: T) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
        if (onSelectionChange) {
            const selectedItems = data.filter(i => newSelected.has(i[keyField]));
            onSelectionChange(selectedItems);
        }
    };

    const toggleAll = () => {
        if (selectedIds.size === paginatedData.length) {
            setSelectedIds(new Set());
            if (onSelectionChange) onSelectionChange([]);
        } else {
            const newIds = new Set(paginatedData.map(i => i[keyField]));
            setSelectedIds(newIds);
            if (onSelectionChange) onSelectionChange(paginatedData);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (onSearch) {
            onSearch(value);
        }
    };

    return (
        <div className="w-full bg-card text-card-foreground rounded-lg shadow-sm border border-border font-sans">
            {/* Toolbar */}
            {(searchable || actions || pagination) && (
                <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between gap-4 items-center">
                    {searchable && (
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                        </div>
                    )}
                    <div className="flex items-center gap-3 ml-auto flex-wrap">
                        {pagination && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Show</span>
                                <select
                                    value={pageSize}
                                    onChange={e => changePageSize(Number(e.target.value))}
                                    className="border border-border bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    {[10, 50, 100].map(n => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                    <option value={0}>All</option>
                                </select>
                                <span className="text-gray-400">/ {sortedData.length}</span>
                            </div>
                        )}
                        {actions}
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-muted-foreground">
                    <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
                        <tr>
                            {enableSelection && (
                                <th className="px-6 py-3 w-10">
                                    <button onClick={toggleAll} className="text-gray-400 hover:text-gray-600">
                                        {selectedIds.size > 0 && selectedIds.size === paginatedData.length ? <CheckSquare size={18} /> : <Square size={18} />}
                                    </button>
                                </th>
                            )}
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className={`px-6 py-3 ${col.sortable ? 'cursor-pointer hover:bg-accent hover:text-accent-foreground' : ''}`}
                                    onClick={() => col.sortable && col.accessorKey && handleSort(col.accessorKey)}
                                >
                                    <div className="flex items-center gap-1">
                                        {col.header}
                                        {col.sortable && <ArrowUpDown size={14} className="text-gray-400" />}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length + (enableSelection ? 1 : 0)} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex justify-center items-center gap-2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                        <span>Loading data...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : paginatedData.length > 0 ? (
                            paginatedData.map((item, rowIdx) => (
                                <tr
                                    key={String(item[keyField])}
                                    onClick={() => onRowClick && onRowClick(item)}
                                    className={`hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${getRowClassName ? getRowClassName(item) : ''}`}
                                >
                                    {enableSelection && (
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => toggleSelection(item[keyField], item)}
                                                className={`text-gray-400 hover:text-primary ${selectedIds.has(item[keyField]) ? 'text-primary' : ''}`}
                                            >
                                                {selectedIds.has(item[keyField]) ? <CheckSquare size={18} /> : <Square size={18} />}
                                            </button>
                                        </td>
                                    )}
                                    {columns.map((col, colIdx) => (
                                        <td key={colIdx} className="px-6 py-4">
                                            {col.cell ? col.cell(item) : String(item[col.accessorKey!] || '')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length + (enableSelection ? 1 : 0)} className="px-6 py-8 text-center text-gray-500">
                                    No records found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && pageSize !== 0 && (
                <div className="p-4 border-t border-border flex flex-wrap justify-between items-center gap-3">
                    <span className="text-sm text-gray-500">
                        Showing {Math.min((currentPage - 1) * effectivePageSize + 1, sortedData.length)} to {Math.min(currentPage * effectivePageSize, sortedData.length)} of {sortedData.length}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => changePage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-border rounded-lg disabled:opacity-50 hover:bg-accent hover:text-accent-foreground"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-sm font-medium px-2">
                            Page {currentPage} of {Math.max(1, totalPages)}
                        </span>
                        <button
                            onClick={() => changePage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-2 border border-border rounded-lg disabled:opacity-50 hover:bg-accent hover:text-accent-foreground"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
