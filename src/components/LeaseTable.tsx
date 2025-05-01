import React from 'react'
import { 
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, 
  Pagination, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
  Button, SortDescriptor
} from "@nextui-org/react"
import { lease_item } from '@/types/api'
import { ChevronDownIcon } from '@/components/icons/chevron_down_icon'
import { ExternalLinkIcon } from '@/components/icons/external_link_icon'
import { VerticalDotsIcon } from '@/components/icons/vertical_dots_icon'

interface LeaseTableProps {
  data: lease_item[];
  current_page: number;
  total_pages: number;
  expanded_rows: Set<string>;
  on_page_change: (page: number) => void;
  on_row_expand: (id: string) => void;
}

export function LeaseTable({
  data,
  current_page,
  total_pages,
  expanded_rows,
  on_page_change,
  on_row_expand,
}: LeaseTableProps) {
  const lease_data = data
    .filter((item): item is lease_item => {
      if (!item || typeof item !== 'object') return false
      const obj = item as any
      return (
        'location' in obj && 
        typeof obj.location === 'string' &&
        'sq_ft' in obj && 
        typeof obj.sq_ft === 'number' &&
        'agency' in obj && 
        typeof obj.agency === 'string' &&
        'savings' in obj &&
        typeof obj.savings === 'number' &&
        'date' in obj &&
        typeof obj.date === 'string'
      )
    })

  return (
    <div className="flex-grow overflow-hidden flex flex-col">
      <div className="flex-grow overflow-hidden flex flex-col border border-divider rounded-lg bg-white dark:bg-default-100">
        <div className="flex-grow overflow-auto">
          <Table 
            aria-label="Lease savings table"
            layout="fixed"
            classNames={{
              wrapper: "min-h-[500px] flex-grow bg-white dark:bg-default-100 p-0",
              base: "overflow-hidden flex flex-col min-h-[500px]",
              table: "min-h-[500px]",
              tbody: "overflow-auto min-h-[500px]",
              thead: "bg-white dark:bg-default-100 -mb-px w-full",
              th: [
                "bg-white dark:bg-default-100",
                "text-default-700",
                "font-semibold",
                "text-base",
                "h-12",
                "whitespace-nowrap",
                "sticky top-0",
                "z-10",
                "border-b border-divider",
                'text-left'
              ].join(" "),
              td: [
                "py-4",
                "group-data-[odd=true]:bg-default-50/50",
                "whitespace-nowrap",
              ].join(" ")
            }}
          >
            <TableHeader>
              <TableColumn className='text-left !w-[180px]' key="agency" width={180}>AGENCY</TableColumn>
              <TableColumn className='text-left !w-[180px]' key="location" width={180}>LOCATION</TableColumn>
              <TableColumn className='text-left !w-[300px]' key="description" width={300}>DESCRIPTION</TableColumn>
              <TableColumn className='text-left !w-[120px]' key="date" width={120}>DATE</TableColumn>
              <TableColumn className='text-left !w-[120px]' key="sq_ft" width={120}>SQ FT</TableColumn>
              <TableColumn className='text-left !w-[120px]' key="savings" width={120}>SAVED</TableColumn>
            </TableHeader>
            <TableBody>
              {lease_data.map((item) => (
                <React.Fragment key={item.date + item.location}>
                  <TableRow 
                    className="group cursor-pointer hover:bg-default-100/50 transition-colors"
                    onClick={() => on_row_expand(item.date + item.location)}
                  >
                    <TableCell width={180} className="text-base">
                      {item.agency}
                    </TableCell>
                    <TableCell width={180} className="text-base">
                      {item.location}
                    </TableCell>
                    <TableCell width={300} className="text-base truncate">
                      {item.description || '-'}
                    </TableCell>
                    <TableCell width={120} className="text-base">
                      {new Date(item.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell width={120} className="text-base">
                      {item.sq_ft.toLocaleString()}
                    </TableCell>
                    <TableCell width={120} className="text-base font-semibold">
                      ${(item.savings || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                  {expanded_rows.has(item.date + item.location) && item.description && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="px-4 py-2 bg-default-50 rounded-lg">
                          <p className="text-sm text-default-600">{item.description}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-2 px-2 bg-white dark:bg-default-100 border-t border-divider -mt-px">
          <span className="text-small text-default-400 truncate">
            {lease_data.length} leases total
          </span>
          <div className="flex-shrink-0">
            <Pagination
              total={total_pages}
              page={current_page}
              onChange={on_page_change}
              showControls
              classNames={{
                wrapper: "gap-2 flex-nowrap",
                item: [
                  "w-10",
                  "h-10",
                  "text-kawaii-pink",
                  "bg-transparent",
                  "hover:bg-kawaii-pink/10",
                  "data-[selected=true]:bg-kawaii-gradient",
                  "data-[selected=true]:text-white",
                  "font-semibold",
                  "cursor-pointer",
                  "transition-colors",
                  "flex-shrink-0",
                ].join(" "),
                cursor: [
                  "bg-kawaii-gradient",
                  "text-white",
                  "font-semibold",
                ].join(" "),
                next: [
                  "text-kawaii-pink",
                  "hover:text-accent-cyan",
                  "cursor-pointer",
                  "transition-colors",
                  "flex-shrink-0",
                ].join(" "),
                prev: [
                  "text-kawaii-pink",
                  "hover:text-accent-cyan",
                  "cursor-pointer",
                  "transition-colors",
                  "flex-shrink-0",
                ].join(" "),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 