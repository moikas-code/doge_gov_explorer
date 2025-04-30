import React, { useState } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Spinner,
  Select,
  SelectItem,
  SortDescriptor
} from '@nextui-org/react';
import { ChevronDownIcon } from '@/components/icons/chevron_down_icon';

type SortDirection = 'ascending' | 'descending';

interface column_def {
  key: string;
  label: string;
  render?: (value: any, row?: any) => React.ReactNode;
  sortable?: boolean;
  min_width?: string;
}

interface data_table_props<T> {
  columns: column_def[];
  data: T[];
  loading: boolean;
  total_pages: number;
  current_page: number;
  items_per_page: number;
  sort_by?: string;
  sort_order?: SortDirection;
  on_page_change: (page: number) => void;
  on_items_per_page_change: (items: number) => void;
  on_sort_change?: (key: string, order: SortDirection) => void;
  render_metadata?: (row: T) => React.ReactNode;
}

export const data_table = <T extends Record<string, unknown>>({
  columns,
  data,
  loading,
  total_pages,
  current_page,
  items_per_page,
  sort_by = '',
  sort_order = 'ascending',
  on_page_change,
  on_items_per_page_change,
  on_sort_change,
  render_metadata,
}: data_table_props<T>) => {
  const [expanded_rows, set_expanded_rows] = useState<Set<number>>(new Set());

  const handle_row_expand = (row_index: number) => {
    const new_expanded_rows = new Set(expanded_rows);
    if (expanded_rows.has(row_index)) {
      new_expanded_rows.delete(row_index);
    } else {
      new_expanded_rows.add(row_index);
    }
    set_expanded_rows(new_expanded_rows);
  };

  const handle_sort = (descriptor: SortDescriptor) => {
    if (!on_sort_change || typeof descriptor.column !== 'string') return;
    on_sort_change(descriptor.column, descriptor.direction as SortDirection);
  };

  // Create a map from item to index for row expansion
  const item_index_map = new Map<T, number>();
  data.forEach((item, idx) => item_index_map.set(item, idx));

  return (
    <div className="w-full">
      <div className="max-w-full overflow-x-auto scrollbar-thin scrollbar-thumb-kawaii-pink/20 scrollbar-track-background/40">
        <Table
          aria-label="Data table"
          selectionMode="none"
          sortDescriptor={{
            column: sort_by,
            direction: sort_order
          }}
          onSortChange={handle_sort}
          classNames={{
            table: "min-h-[400px] w-full min-w-[800px]",
            base: "max-w-full bg-background/40 backdrop-blur-md rounded-xl border border-kawaii-pink/20",
            th: [
              "bg-background/60 text-kawaii-pink font-semibold",
              "text-xs md:text-sm whitespace-nowrap",
              "first:pl-4 last:pr-4",
              "min-w-[100px]",
            ].join(" "),
            td: [
              "group-data-[odd=true]:bg-background/30",
              "text-xs md:text-sm whitespace-nowrap",
              "first:pl-4 last:pr-4",
              "min-w-[100px]",
            ].join(" "),
            wrapper: "max-w-full rounded-xl shadow-lg shadow-kawaii-pink/10",
            sortIcon: "text-kawaii-pink",
          }}
          bottomContentPlacement="outside"
        >
          <TableHeader>
            {() => (
              <>
                <TableColumn key="expand" className="w-12 md:w-14 min-w-[48px] max-w-[56px]">
                  <span className="sr-only">Expand</span>
                </TableColumn>
                {columns.map((column) => (
                  <TableColumn
                    key={column.key}
                    allowsSorting={column.sortable !== false && !!on_sort_change}
                    className={`text-xs md:text-sm hover:text-accent-cyan transition-colors ${column.min_width ? `min-w-[${column.min_width}]` : ''}`}
                  >
                    {column.label}
                  </TableColumn>
                ))}
              </>
            )}
          </TableHeader>
          <TableBody
            emptyContent={loading ? <Spinner color="secondary" /> : "No data available"}
            loadingContent={<Spinner color="secondary" />}
            isLoading={loading}
          >
            {(item: T) => {
              const row_index = item_index_map.get(item);
              const is_expanded = typeof row_index === 'number' && expanded_rows.has(row_index);
              const can_expand = render_metadata && (item.description || item.link || item.fpds_link);
              
              if (is_expanded && can_expand) {
                return (
                  <TableRow key={`expand-${row_index}`} className="bg-background/60">
                    <TableCell colSpan={columns.length + 1} className="!p-0">
                      <div className="px-4 py-3 md:px-6 md:py-4 border-t border-kawaii-pink/10">
                        {render_metadata(item)}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }
              
              return (
                <TableRow 
                  key={`row-${row_index}`}
                  className="hover:bg-kawaii-pink/5 transition-colors cursor-pointer"
                  onClick={() => { if (typeof row_index === 'number' && can_expand) handle_row_expand(row_index); }}
                >
                  <TableCell 
                    key={`expand-cell-${row_index}`} 
                    className="align-top w-12 md:w-14 min-w-[48px] max-w-[56px]"
                  >
                    {can_expand ? (
                      <button
                        aria-label={is_expanded ? 'Collapse row' : 'Expand row'}
                        onClick={e => { e.stopPropagation(); if (typeof row_index === 'number') handle_row_expand(row_index); }}
                        className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded hover:bg-kawaii-pink/10 focus:outline-none"
                      >
                        <ChevronDownIcon className={`w-4 h-4 md:w-5 md:h-5 transition-transform ${is_expanded ? 'rotate-180' : ''}`} />
                      </button>
                    ) : null}
                  </TableCell>
                  {columns.map((column) => (
                    <TableCell 
                      key={`${column.key}-cell-${row_index}`}
                      className={`text-xs md:text-sm ${column.min_width ? `min-w-[${column.min_width}]` : ''}`}
                    >
                      {column.render
                        ? column.render(item[column.key], item)
                        : item[column.key]?.toString() || '-'}
                    </TableCell>
                  ))}
                </TableRow>
              );
            }}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 mt-4">
        <Select
          value={items_per_page.toString()}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => on_items_per_page_change(Number(e.target.value))}
          className="w-32 bg-background/40 backdrop-blur-md border border-kawaii-pink/20"
          aria-label="Items per page"
        >
          <SelectItem key="10" value="10">10 per page</SelectItem>
          <SelectItem key="25" value="25">25 per page</SelectItem>
          <SelectItem key="50" value="50">50 per page</SelectItem>
          <SelectItem key="100" value="100">100 per page</SelectItem>
        </Select>

        <Pagination
          total={total_pages}
          page={current_page}
          onChange={on_page_change}
          showControls
          classNames={{
            wrapper: "gap-0 overflow-visible h-8",
            item: "w-8 h-8 text-kawaii-pink",
            cursor: "bg-kawaii-gradient text-white font-semibold",
            next: "text-kawaii-pink hover:text-accent-cyan",
            prev: "text-kawaii-pink hover:text-accent-cyan",
          }}
        />
      </div>
    </div>
  );
}; 