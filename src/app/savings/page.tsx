'use client'

import React from 'react'
import { useEffect, useState } from 'react'
import { 
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, 
  Card, CardHeader, CardBody, Tabs, Tab, Input, Button, 
  Pagination, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
  SortDescriptor
} from "@nextui-org/react"
import { 
  fetch_all_savings, 
  fetch_grant_savings, 
  fetch_contract_savings, 
  fetch_lease_savings, 
  contract_item
} from '@/utils/api'
import { savings_initiative } from '@/types/api'
import { SearchIcon } from '@/components/icons/search_icon'
import { ChevronDownIcon } from '@/components/icons/chevron_down_icon'
import { ExternalLinkIcon } from '@/components/icons/external_link_icon'
import { VerticalDotsIcon } from '@/components/icons/vertical_dots_icon'

type savings_type = 'all' | 'grants' | 'contracts' | 'leases'

// Create a unique ID generator
let id_counter = 0;
function generate_unique_id(prefix: string): string {
  id_counter += 1;
  return `${prefix}-${Date.now()}-${id_counter}`;
}

interface savings_base {
  savings: number;
  date: string;
  status: string;
  department: string;
  description?: string;
  link?: string;
}

// Ensure both types have common fields we need
type normalized_savings = savings_base & {
  id: string;
  type: string;
}

type normalized_contract = savings_base & {
  id: string;
  type: 'Contract';
}

interface savings_state {
  data: (normalized_savings | normalized_contract)[];
  error: string | null;
  loading: boolean;
}

const initial_state: savings_state = {
  data: [],
  error: null,
  loading: true
}

function normalize_savings_item(item: savings_initiative): normalized_savings {
  return {
    id: item.id || generate_unique_id('savings'),
    savings: item.amount || 0,
    date: item.date || new Date().toISOString(),
    status: item.status || 'Unknown',
    department: item.department || 'Unknown',
    type: item.type || 'Unknown'
  }
}

function normalize_contract_item(item: contract_item): normalized_contract {
  return {
    id: item.piid || generate_unique_id('contract'),
    savings: item.savings || 0,
    date: item.deleted_date || new Date().toISOString(),
    status: item.fpds_status || 'Unknown',
    department: item.agency || 'Unknown',
    type: 'Contract'
  }
}

export default function SavingsPage() {
  const [state, set_state] = useState<savings_state>(initial_state)
  const [total_savings, set_total_savings] = useState(0)
  const [monthly_improvement, set_monthly_improvement] = useState(0)
  const [selected_type, set_selected_type] = useState<savings_type>('all')
  const [search_query, set_search_query] = useState('')
  const [current_page, set_current_page] = useState(1)
  const [expanded_rows, set_expanded_rows] = useState<Set<string>>(new Set([]))
  const [sort_descriptor, set_sort_descriptor] = useState<SortDescriptor>({
    column: "date",
    direction: "descending"
  })
  const rows_per_page = 10

  // Filter and sort data
  const filtered_data = state.data
    .filter(item => {
      const search_text = search_query.toLowerCase()
      return (
        item.department.toLowerCase().includes(search_text) ||
        item.type.toLowerCase().includes(search_text) ||
        item.status.toLowerCase().includes(search_text)
      )
    })
    .sort((a, b) => {
      const date_a = new Date(a.date).getTime()
      const date_b = new Date(b.date).getTime()
      const multiplier = sort_descriptor.direction === "descending" ? -1 : 1
      
      switch (sort_descriptor.column) {
        case "date":
          return (date_a - date_b) * multiplier
        case "savings":
          return (a.savings - b.savings) * multiplier
        case "type":
          return a.type.localeCompare(b.type) * multiplier
        case "status":
          return a.status.localeCompare(b.status) * multiplier
        case "department":
          return a.department.localeCompare(b.department) * multiplier
        default:
          return 0
      }
    })

  const total_pages = Math.ceil(filtered_data.length / rows_per_page)
  const start_index = (current_page - 1) * rows_per_page
  const paginated_data = filtered_data.slice(start_index, start_index + rows_per_page)

  const handle_row_expand = (id: string) => {
    const new_expanded_rows = new Set(expanded_rows)
    if (expanded_rows.has(id)) {
      new_expanded_rows.delete(id)
    } else {
      new_expanded_rows.add(id)
    }
    set_expanded_rows(new_expanded_rows)
  }

  useEffect(() => {
    async function load_data() {
      try {
        set_state(prev => ({ ...prev, loading: true, error: null }))
        let data: (normalized_savings | normalized_contract)[] = []
        
        switch (selected_type) {
          case 'grants': {
            const response = await fetch_grant_savings()
            if (!response.success) throw new Error('Failed to fetch grants data')
            data = (response.result?.grants || [])
              .filter(item => item !== null && item !== undefined)
              .map(normalize_savings_item)
            break
          }
          case 'contracts': {
            const response = await fetch_contract_savings()
            if (!response.success) throw new Error('Failed to fetch contracts data')
            data = (response.result?.contracts || [])
              .filter(item => item !== null && item !== undefined)
              .map(normalize_contract_item)
            break
          }
          case 'leases': {
            const response = await fetch_lease_savings()
            if (!response.success) throw new Error('Failed to fetch leases data')
            data = (response.result?.leases || [])
              .filter(item => item !== null && item !== undefined)
              .map(normalize_savings_item)
            break
          }
          default: {
            const response = await fetch_all_savings()
            if (!response.success) throw new Error('Failed to fetch savings data')
            data = (response.result || [])
              .filter(item => item !== null && item !== undefined)
              .map(item => 
                'piid' in item ? normalize_contract_item(item as contract_item) : normalize_savings_item(item as savings_initiative)
              )
          }
        }

        // Filter out any items that might have slipped through with invalid data
        data = data.filter(item => 
          item !== null && 
          item !== undefined && 
          typeof item.savings === 'number' &&
          typeof item.date === 'string' &&
          item.date.length > 0
        )

        set_state({ data, loading: false, error: null })

        // Calculate total savings with null check
        const total = data.reduce((sum, item) => sum + (item?.savings || 0), 0)
        set_total_savings(total)
        
        // Calculate monthly improvement with null checks
        const current_month = new Date().getMonth()
        const current_year = new Date().getFullYear()
        
        const this_month_savings = data
          .filter(item => {
            try {
              const date = new Date(item.date)
              return !isNaN(date.getTime()) && 
                     date.getMonth() === current_month && 
                     date.getFullYear() === current_year
            } catch {
              return false
            }
          })
          .reduce((sum, item) => sum + (item?.savings || 0), 0)
          
        const last_month_savings = data
          .filter(item => {
            try {
              const date = new Date(item.date)
              return !isNaN(date.getTime()) && 
                     date.getMonth() === (current_month - 1) && 
                     date.getFullYear() === current_year
            } catch {
              return false
            }
          })
          .reduce((sum, item) => sum + (item?.savings || 0), 0)
          
        set_monthly_improvement(this_month_savings - last_month_savings)
      } catch (error) {
        console.error('Error loading savings data:', error)
        set_state({ 
          data: [],
          error: error instanceof Error ? error.message : 'An unexpected error occurred',
          loading: false 
        })
      }
    }
    
    load_data()
  }, [selected_type])

  if (state.loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading...</p>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{state.error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-4 my-4 h-screen flex flex-col">
      <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-kawaii-pink to-accent-cyan bg-clip-text text-transparent">
        DOGE Budget Savings
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Card className="transform hover:scale-[1.02] transition-transform">
          <CardHeader className="border-b border-divider">
            <h2 className="text-xl font-bold">Total Savings</h2>
          </CardHeader>
          <CardBody className="py-6">
            <p className="text-4xl font-bold text-kawaii-pink">
              ${(total_savings || 0).toLocaleString()}
            </p>
            <p className="text-sm text-default-500 mt-2">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardBody>
        </Card>

        <Card className="transform hover:scale-[1.02] transition-transform">
          <CardHeader className="border-b border-divider">
            <h2 className="text-xl font-bold">Monthly Improvement</h2>
          </CardHeader>
          <CardBody className="py-6">
            <p className={`text-4xl font-bold ${(monthly_improvement || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
              {(monthly_improvement || 0) >= 0 ? '+' : ''}{(monthly_improvement || 0).toLocaleString()}
            </p>
            <p className="text-sm text-default-500 mt-2">
              Compared to last month
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-col gap-6 flex-grow overflow-hidden">
        <div className="flex flex-row flex-wrap justify-between items-center gap-4">
          <h2 className="text-2xl font-bold">Savings Initiatives</h2>
          <div className="flex-1 md:flex-none">
            <Input
              className="w-full md:w-80 ml-auto"
              placeholder="Search initiatives..."
              startContent={<SearchIcon className="text-default-400" />}
              value={search_query}
              onChange={(e) => set_search_query(e.target.value)}
              size="lg"
              classNames={{
                input: "text-base",
                inputWrapper: "h-12 bg-default-100/50"
              }}
            />
          </div>
        </div>
        <Tabs 
          selectedKey={selected_type} 
          onSelectionChange={(key) => {
            set_selected_type(key as savings_type)
            set_current_page(1)
            set_search_query('')
          }}
          classNames={{
            tab: "h-12 px-8 cursor-pointer",
            tabContent: "group-data-[selected=true]:text-kawaii-pink font-semibold text-base",
            cursor: "bg-kawaii-gradient",
            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider overflow-x-auto"
          }}
        >
          <Tab 
            key="all" 
            title={
              <div className="flex items-center gap-2">
                <span>All Savings</span>
                {selected_type === 'all' && (
                  <span className="px-2 py-1 text-xs bg-kawaii-pink/10 rounded-full">
                    {filtered_data.length}
                  </span>
                )}
              </div>
            }
          />
          <Tab 
            key="grants" 
            title={
              <div className="flex items-center gap-2">
                <span>Grants</span>
                {selected_type === 'grants' && (
                  <span className="px-2 py-1 text-xs bg-kawaii-pink/10 rounded-full">
                    {filtered_data.length}
                  </span>
                )}
              </div>
            }
          />
          <Tab 
            key="contracts" 
            title={
              <div className="flex items-center gap-2">
                <span>Contracts</span>
                {selected_type === 'contracts' && (
                  <span className="px-2 py-1 text-xs bg-kawaii-pink/10 rounded-full">
                    {filtered_data.length}
                  </span>
                )}
              </div>
            }
          />
          <Tab 
            key="leases" 
            title={
              <div className="flex items-center gap-2">
                <span>Leases</span>
                {selected_type === 'leases' && (
                  <span className="px-2 py-1 text-xs bg-kawaii-pink/10 rounded-full">
                    {filtered_data.length}
                  </span>
                )}
              </div>
            }
          />
        </Tabs>
        <div className="flex-grow overflow-hidden flex flex-col">
          <div className="flex-grow overflow-hidden flex flex-col border border-divider rounded-lg bg-white">
            <div className="flex-grow overflow-auto">
              <Table 
                aria-label="Savings initiatives table"
                sortDescriptor={sort_descriptor}
                onSortChange={set_sort_descriptor}
                layout="fixed"
                classNames={{
                  wrapper: "min-h-[500px] flex-grow bg-white p-0",
                  base: "overflow-hidden flex flex-col min-h-[500px]",
                  table: "min-h-[500px]",
                  tbody: "overflow-auto min-h-[500px]",
                  thead: "bg-white -mb-px w-full",
                  th: [
                    "bg-white",
                    "text-default-700",
                    "font-semibold",
                    "text-base",
                    "h-12",
                    "cursor-pointer",
                    "transition-colors",
                    "hover:text-kawaii-pink",
                    "whitespace-nowrap",
                    "sticky top-0",
                    "z-10",
                    "border-b border-divider",
                    'btn text-left'
                  ].join(" "),
                  td: [
                    "py-4",
                    "group-data-[odd=true]:bg-default-50/50",
                    "whitespace-nowrap",
                  ].join(" "),
                  sortIcon: [

                    "text-default-400 text-left",
                    "group-data-[sorted=true]:text-kawaii-pink",
                  ].join(" "),
                }}
              >
                <TableHeader className='flex flex-row text-left'>
                  <TableColumn className='text-left !w-[120px]' key="date" allowsSorting  width={120}>DATE</TableColumn>
                  <TableColumn className='text-left !w-[150px]' key="savings" allowsSorting width={150}>SAVINGS (USD)</TableColumn>
                  <TableColumn className='text-left !w-[120px]' key="type" allowsSorting width={120} >TYPE</TableColumn>
                  <TableColumn className='text-left !w-[120px]' key="status" allowsSorting width={120} >STATUS</TableColumn>
                  <TableColumn className='text-left !w-[120px]' key="department" allowsSorting width={120} >DEPARTMENT</TableColumn>
                  <TableColumn className='text-left !w-[80px]' width={80}>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {paginated_data.map((item) => (
                    <React.Fragment key={item.id}>
                      <TableRow 
                        className="group cursor-pointer hover:bg-default-100/50 transition-colors"
                      >
                        <TableCell width={120} className="text-base">
                          {new Date(item.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell width={150} className="text-base font-semibold">
                          ${(item.savings || 0).toLocaleString()}
                        </TableCell>
                        <TableCell width={120} className="text-base">
                          {item.type || 'Unknown'}
                        </TableCell>
                        <TableCell width={120}>
                          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                            item.status === 'Verified' 
                              ? 'bg-success/10 text-success' 
                              : 'bg-warning/10 text-warning'
                          }`}>
                            {item.status || 'Unknown'}
                          </span>
                        </TableCell>
                        <TableCell width={120} className="text-base">
                          {item.department || 'Unknown'}
                        </TableCell>
                        <TableCell width={80}>
                          <div className="relative flex justify-end items-center gap-2">
                            <Dropdown>
                              <DropdownTrigger>
                                <Button 
                                  isIconOnly
                                  size="sm" 
                                  variant="light"
                                  className="text-default-400 hover:text-kawaii-pink"
                                >
                                  <VerticalDotsIcon className="text-xl" />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu 
                                aria-label="Actions"
                                onAction={(key) => {
                                  if (key === 'details') {
                                    handle_row_expand(item.id);
                                  } else if (key === 'link' && item.link) {
                                    window.open(item.link, '_blank');
                                  }
                                }}
                              >
                                {item.description ? (
                                  <DropdownItem
                                    key="details"
                                    className="text-default-500 cursor-pointer"
                                    startContent={<ChevronDownIcon className={`w-4 h-4 transition-transform ${expanded_rows.has(item.id) ? 'rotate-180' : ''}`} />}
                                  >
                                    View Details
                                  </DropdownItem>
                                ) : null}
                                {item.link ? (
                                  <DropdownItem
                                    key="link"
                                    className="text-default-500 cursor-pointer"
                                    endContent={<ExternalLinkIcon className="text-base" />}
                                  >
                                    View Source
                                  </DropdownItem>
                                ) : null}
                              </DropdownMenu>
                            </Dropdown>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expanded_rows.has(item.id) && item.description && (
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
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-2 px-2 bg-white border-t border-divider -mt-px">
              <span className="text-small text-default-400 truncate">
                {filtered_data.length} initiatives total
              </span>
              <div className="flex-shrink-0">
                <Pagination
                  total={total_pages}
                  page={current_page}
                  onChange={set_current_page}
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
      </div>
    </div>
  )
} 