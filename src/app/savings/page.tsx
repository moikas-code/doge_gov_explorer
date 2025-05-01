"use client";

import React from "react";
import { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Card,
  CardHeader,
  CardBody,
  Tabs,
  Tab,
  Input,
  Button,
  Pagination,
  SortDescriptor,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import {
  fetch_all_savings,
  fetch_grant_savings,
  fetch_contract_savings,
  fetch_lease_savings,
} from "@/utils/api";
import {
  savings_initiative,
  lease_item,
  contract_item,
  grant_item,
} from "@/types/api";
import { SearchIcon } from "@/components/icons/search_icon";
import { ExternalLinkIcon } from "@/components/icons/external_link_icon";
import { LeaseTable } from "@/components/LeaseTable";

type savings_type = "all" | "grants" | "contracts" | "leases";

// Create a unique ID generator
let id_counter = 0;
function generate_unique_id(prefix: string): string {
  id_counter += 1;
  return `${prefix}-${Date.now()}-${id_counter}`;
}

interface savings_base {
  savings: number;
  date: string;
  agency: string;
  recipient: string;
  value: number;
  link?: string;
  description?: string;
}

// Ensure both types have common fields we need
type normalized_savings = savings_base & {
  id: string;
  type: string;
};

type normalized_contract = {
  id: string;
  piid: string;
  agency: string;
  vendor: string;
  value: number;
  description: string | null;
  fpds_status: string | null;
  fpds_link: string | null;
  deleted_date: string | null;
  savings: number;
  type: "Contract";
};

interface savings_state {
  data: (normalized_savings | normalized_contract | grant_item)[];
  lease_data: lease_item[];
  error: string | null;
  loading: boolean;
}

const initial_state: savings_state = {
  data: [],
  lease_data: [],
  error: null,
  loading: true,
};

function normalize_savings_item(item: savings_initiative): normalized_savings {
  return {
    id: item.id || generate_unique_id("savings"),
    savings: item?.savings || 0,
    date: item.date || new Date().toISOString(),
    agency: item.agency || "Unknown",
    recipient: item.recipient || "Unknown",
    value: item.value || 0,
    link: item.link,
    description: item.description,
    type: item.type || "Unknown",
  };
}

function normalize_contract_item(item: contract_item): normalized_contract {
  return {
    id: item.piid || generate_unique_id("contract"),
    piid: item.piid,
    agency: item.agency,
    vendor: item.vendor,
    value: item.value,
    description: item.description,
    fpds_status: item.fpds_status,
    fpds_link: item.fpds_link,
    deleted_date: item.deleted_date,
    savings: item.savings,
    type: "Contract",
  };
}

export default function SavingsPage() {
  const [state, set_state] = useState<savings_state>(initial_state);
  const [total_savings, set_total_savings] = useState(0);
  const [monthly_improvement, set_monthly_improvement] = useState(0);
  const [selected_type, set_selected_type] = useState<savings_type>("all");
  const [search_query, set_search_query] = useState("");
  const [current_page, set_current_page] = useState(1);
  const [expanded_rows, set_expanded_rows] = useState<Set<string>>(new Set([]));
  const [sort_field, set_sort_field] = useState<
    "savings" | "value" | "deleted_date" | null
  >(null);
  const [sort_direction, set_sort_direction] = useState<
    "ascending" | "descending"
  >("descending");
  const rows_per_page = 10;
  const [selected_contract, set_selected_contract] =
    useState<normalized_contract | null>(null);
 
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // Filter and sort data
  const filtered_data = state.data
    .filter((item) => {
      if (selected_type === "grants" || selected_type === "leases") return false;
      
      const search_text = search_query.toLowerCase();
      
      if (selected_type === "contracts") {
        if (!("type" in item) || item.type !== "Contract") return false;
        const contract = item as normalized_contract;
        return (
          (contract.agency || "").toLowerCase().includes(search_text) ||
          (contract.vendor || "").toLowerCase().includes(search_text) ||
          (contract.fpds_status || "").toLowerCase().includes(search_text) ||
          (contract.piid || "").toLowerCase().includes(search_text)
        );
      }
      
      // All view
      return (
        (item.agency || "").toLowerCase().includes(search_text) ||
        (("recipient" in item && item.recipient || "").toLowerCase().includes(search_text)) ||
        (("description" in item && item.description || "").toLowerCase().includes(search_text))
      );
    })
    .sort((a, b) => {
      if (
        !("type" in a) ||
        !("type" in b) ||
        a.type !== "Contract" ||
        b.type !== "Contract"
      )
        return 0;

      const contract_a = a as normalized_contract;
      const contract_b = b as normalized_contract;
      const multiplier = sort_direction === "descending" ? -1 : 1;

      switch (sort_field) {
        case "savings":
          return (
            ((contract_a.savings || 0) - (contract_b.savings || 0)) * multiplier
          );
        case "value":
          return (
            ((contract_a.value || 0) - (contract_b.value || 0)) * multiplier
          );
        case "deleted_date":
          const date_a = contract_a.deleted_date
            ? new Date(contract_a.deleted_date).getTime()
            : 0;
          const date_b = contract_b.deleted_date
            ? new Date(contract_b.deleted_date).getTime()
            : 0;
          return (date_a - date_b) * multiplier;
        default:
          return 0;
      }
    });

  const sorted_lease_data = state.lease_data.sort((a, b) => {
    const multiplier = sort_direction === "descending" ? -1 : 1;

    switch (sort_field) {
      case "savings":
        return ((a.savings || 0) - (b.savings || 0)) * multiplier;
      case "value":
        return ((a.sq_ft || 0) - (b.sq_ft || 0)) * multiplier;
      case "deleted_date":
        const date_a = a.date ? new Date(a.date).getTime() : 0;
        const date_b = b.date ? new Date(b.date).getTime() : 0;
        return (date_a - date_b) * multiplier;
      default:
        return 0;
    }
  });

  const sorted_grants_data = state.data
    .filter((item): item is grant_item => {
      if (selected_type !== "grants") return false;
      if (!item || typeof item !== "object") return false;
      const obj = item as Record<string, unknown>;
      return (
        "date" in obj &&
        typeof obj.date === "string" &&
        "agency" in obj &&
        typeof obj.agency === "string" &&
        "recipient" in obj &&
        typeof obj.recipient === "string" &&
        "value" in obj &&
        typeof obj.value === "number" &&
        "savings" in obj &&
        typeof obj.savings === "number"
      );
    })
    .sort((a, b) => {
      const multiplier = sort_direction === "descending" ? -1 : 1;

      switch (sort_field) {
        case "savings":
          return ((a.savings || 0) - (b.savings || 0)) * multiplier;
        // case "value":
        //   return ((a.value || 0) - (b.value || 0)) * multiplier;
        case "deleted_date":
          const date_a = a.date ? new Date(a.date).getTime() : 0;
          const date_b = b.date ? new Date(b.date).getTime() : 0;
          return (date_a - date_b) * multiplier;
        default:
          return 0;
      }
    });

  const total_pages = Math.ceil(filtered_data.length / rows_per_page);
  const start_index = (current_page - 1) * rows_per_page;
  const paginated_data = filtered_data.slice(
    start_index,
    start_index + rows_per_page
  );

  const handle_row_expand = (id: string) => {
    const new_expanded_rows = new Set(expanded_rows);
    if (expanded_rows.has(id)) {
      new_expanded_rows.delete(id);
    } else {
      new_expanded_rows.add(id);
    }
    set_expanded_rows(new_expanded_rows);
  };

  const truncate_text = (text: string, length: number) => {
    if (!text) return "-";
    return text.length > length ? `${text.substring(0, length)}...` : text;
  };

  useEffect(() => {
    async function load_data() {
      try {
        set_state((prev) => ({ ...prev, loading: true, error: null }));
        let data: (normalized_savings | normalized_contract | grant_item)[] =
          [];
        let lease_data: lease_item[] = [];

        switch (selected_type) {
          case "grants": {
            const response = await fetch_grant_savings();
            if (!response.success)
              throw new Error("Failed to fetch grants data");
            data = (response.result?.grants || [])
              .filter((item) => item !== null && item !== undefined)
              .map(normalize_savings_item);
            break;
          }
          case "contracts": {
            const response = await fetch_contract_savings();
            if (!response.success)
              throw new Error("Failed to fetch contracts data");
            data = (response.result?.contracts || [])
              .filter(
                (item): item is contract_item =>
                  item !== null &&
                  item !== undefined &&
                  "piid" in item &&
                  "agency" in item
              )
              .map(normalize_contract_item);
            break;
          }
          case "leases": {
            const response = await fetch_lease_savings();
            if (!response.success)
              throw new Error("Failed to fetch leases data");
            const raw_leases = response.result?.leases || [];
            lease_data = raw_leases as unknown as lease_item[];
            break;
          }
          default: {
            const response = await fetch_all_savings();
            if (!response.success)
              throw new Error("Failed to fetch savings data");
            data = (response.result || [])
              .filter(
                (item): item is savings_initiative =>
                  item !== null &&
                  item !== undefined &&
                  "id" in item &&
                  "amount" in item &&
                  "type" in item
              )
              .map(normalize_savings_item);
          }
        }

        // Filter out any items that might have slipped through with invalid data
        data = data.filter(
          (item) =>
            item !== null &&
            item !== undefined &&
            typeof item.savings === "number" &&
            (("type" in item && item.type === "Contract" && "deleted_date" in item && typeof item.deleted_date === "string" && item.deleted_date.length > 0) ||
            ("type" in item && item.type !== "Contract" && "date" in item && typeof item.date === "string" && item.date.length > 0))
        );

        lease_data = lease_data.filter(
          (item) =>
            item !== null &&
            item !== undefined &&
            typeof item.savings === "number" &&
            typeof item.date === "string" &&
            item.date.length > 0 &&
            typeof item.location === "string" &&
            typeof item.sq_ft === "number" &&
            typeof item.agency === "string"
        );

        set_state({ data, lease_data, loading: false, error: null });

        // Calculate total savings with null check
        const total = [...data, ...lease_data].reduce(
          (sum, item) => sum + (item?.savings || 0),
          0
        );
        set_total_savings(total);

        // Calculate monthly improvement with null checks
        const current_month = new Date().getMonth();
        const current_year = new Date().getFullYear();

        const all_items = [...data, ...lease_data];
        const this_month_savings = all_items
          .filter((item) => {
            try {
              const date_str =
                item.type === "Contract"
                  ? (item as normalized_contract).deleted_date
                  : (item as normalized_savings).date;
              if (!date_str) return false;

              const date = new Date(date_str);
              return (
                !isNaN(date.getTime()) &&
                date.getMonth() === current_month &&
                date.getFullYear() === current_year
              );
            } catch {
              return false;
            }
          })
          .reduce((sum, item) => sum + (item?.savings || 0), 0);

        const last_month_savings = all_items
          .filter((item) => {
            try {
              const date_str =
                item.type === "Contract"
                  ? (item as normalized_contract).deleted_date
                  : (item as normalized_savings).date;
              if (!date_str) return false;

              const date = new Date(date_str);
              return (
                !isNaN(date.getTime()) &&
                date.getMonth() === current_month - 1 &&
                date.getFullYear() === current_year
              );
            } catch {
              return false;
            }
          })
          .reduce((sum, item) => sum + (item?.savings || 0), 0);

        set_monthly_improvement(this_month_savings - last_month_savings);
      } catch (error) {
        console.error("Error loading savings data:", error);
        set_state({
          data: [],
          lease_data: [],
          error:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
          loading: false,
        });
      }
    }

    load_data();
  }, [selected_type]);

  if (state.loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading...</p>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{state.error}</span>
        </div>
      </div>
    );
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
            <p
              className={`text-4xl font-bold ${
                (monthly_improvement || 0) >= 0 ? "text-success" : "text-danger"
              }`}
            >
              {(monthly_improvement || 0) >= 0 ? "+" : ""}
              {(monthly_improvement || 0).toLocaleString()}
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
          <div className="flex gap-2">
            <Button
              color={sort_field === "savings" ? "primary" : "default"}
              variant={sort_field === "savings" ? "solid" : "light"}
              onClick={() => {
                if (sort_field === "savings") {
                  set_sort_direction((prev) =>
                    prev === "ascending" ? "descending" : "ascending"
                  );
                } else {
                  set_sort_field("savings");
                  set_sort_direction("descending");
                }
              }}
              endContent={
                sort_field === "savings" && (
                  <span className="ml-1">
                    {sort_direction === "ascending" ? "↑" : "↓"}
                  </span>
                )
              }
            >
              Sort by Savings
            </Button>
            {selected_type !== "grants" && (
              <Button
                color={sort_field === "savings" ? "primary" : "default"}
                variant={sort_field === "savings" ? "solid" : "light"}
                onClick={() => {
                  if (sort_field === "savings") {
                    set_sort_direction((prev) =>
                      prev === "ascending" ? "descending" : "ascending"
                    );
                  } else {
                    set_sort_field("savings");
                    set_sort_direction("descending");
                  }
                }}
                endContent={
                  sort_field === "savings" && (
                    <span className="ml-1">
                      {sort_direction === "ascending" ? "↑" : "↓"}
                    </span>
                  )
                }
              >
                {selected_type === "leases" ? "Sort by Sq Ft" : "Sort by Value"}
              </Button>
            )}
            <Button
              color={sort_field === "deleted_date" ? "primary" : "default"}
              variant={sort_field === "deleted_date" ? "solid" : "light"}
              onClick={() => {
                if (sort_field === "deleted_date") {
                  set_sort_direction((prev) =>
                    prev === "ascending" ? "descending" : "ascending"
                  );
                } else {
                  set_sort_field("deleted_date");
                  set_sort_direction("descending");
                }
              }}
              endContent={
                sort_field === "deleted_date" && (
                  <span className="ml-1">
                    {sort_direction === "ascending" ? "↑" : "↓"}
                  </span>
                )
              }
            >
              Sort by Date
            </Button>
          </div>
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
                inputWrapper: "h-12 bg-default-100/50",
              }}
            />
          </div>
        </div>
        <Tabs
          selectedKey={selected_type}
          onSelectionChange={(key) => {
            set_selected_type(key as savings_type);
            set_current_page(1);
            set_search_query("");
            set_sort_field(null);
            set_sort_direction("descending");
          }}
          classNames={{
            tab: "h-12 px-8 cursor-pointer",
            tabContent:
              "group-data-[selected=true]:text-kawaii-pink font-semibold text-base",
            cursor: "bg-kawaii-gradient",
            tabList:
              "gap-6 w-full relative rounded-none p-0 border-b border-divider overflow-x-auto",
          }}
        >
          <Tab
            key="all"
            title={
              <div className="flex items-center gap-2">
                <span>All Savings</span>
                {selected_type === "all" && (
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
                {selected_type === "grants" && (
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
                {selected_type === "contracts" && (
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
                {selected_type === "leases" && (
                  <span className="px-2 py-1 text-xs bg-kawaii-pink/10 rounded-full">
                    {filtered_data.length}
                  </span>
                )}
              </div>
            }
          />
        </Tabs>
        {selected_type === "leases" ? (
          <LeaseTable
            data={sorted_lease_data}
            current_page={current_page}
            total_pages={total_pages}
            expanded_rows={expanded_rows}
            on_page_change={set_current_page}
            on_row_expand={handle_row_expand}
          />
        ) : selected_type === "grants" ? (
          <div className="flex-grow overflow-hidden flex flex-col">
            <div className="flex-grow overflow-hidden flex flex-col border border-divider rounded-lg bg-white">
              <div className="flex-grow overflow-auto">
                <Table
                  aria-label="Grants savings table"
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
                      "whitespace-nowrap",
                      "sticky top-0",
                      "z-10",
                      "border-b border-divider",
                      "text-left",
                    ].join(" "),
                    td: [
                      "py-4",
                      "group-data-[odd=true]:bg-default-50/50",
                      "whitespace-nowrap",
                    ].join(" "),
                  }}
                >
                  <TableHeader>
                    <TableColumn
                      className="text-left !w-[180px]"
                      key="agency"
                      width={180}
                    >
                      AGENCY
                    </TableColumn>
                    <TableColumn
                      className="text-left !w-[180px]"
                      key="recipient"
                      width={180}
                    >
                      RECIPIENT
                    </TableColumn>
                    <TableColumn
                      className="text-left !w-[300px]"
                      key="description"
                      width={300}
                    >
                      DESCRIPTION
                    </TableColumn>
                    <TableColumn
                      className="text-left !w-[120px]"
                      key="date"
                      width={120}
                    >
                      DATE
                    </TableColumn>
                    <TableColumn
                      className="text-left !w-[120px]"
                      key="value"
                      width={120}
                    >
                      VALUE
                    </TableColumn>
                    <TableColumn
                      className="text-left !w-[120px]"
                      key="savings"
                      width={120}
                    >
                      SAVED
                    </TableColumn>
                    <TableColumn className="text-left !w-[80px]" width={80}>
                      LINK
                    </TableColumn>
                  </TableHeader>
                  <TableBody>
                    {sorted_grants_data.map((grant) => (
                      <React.Fragment key={grant.date + grant.recipient}>
                        <TableRow
                          className="group cursor-pointer hover:bg-default-100/50 transition-colors"
                          onClick={() => {
                            onOpen();
                          }}
                        >
                          <TableCell width={180} className="text-base">
                            {grant.agency || "-"}
                          </TableCell>
                          <TableCell width={180} className="text-base">
                            {grant.recipient || "-"}
                          </TableCell>
                          <TableCell width={300} className="text-base truncate">
                            {truncate_text(grant.description || "", 42)}
                          </TableCell>
                          <TableCell width={120} className="text-base">
                            {grant.date
                              ? new Date(grant.date).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell width={120} className="text-base">
                            ${(grant.value || 0).toLocaleString()}
                          </TableCell>
                          <TableCell
                            width={120}
                            className="text-base font-semibold"
                          >
                            ${(grant.savings || 0).toLocaleString()}
                          </TableCell>
                          <TableCell width={80}>
                            {grant.link && (
                              <a
                                href={grant.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLinkIcon className="w-4 h-4" />
                                View
                              </a>
                            )}
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-2 px-2 bg-white border-t border-divider -mt-px">
                <span className="text-small text-default-400 truncate">
                  {sorted_grants_data.length} grants total
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
        ) : (
          <div className="flex-grow overflow-hidden flex flex-col">
            <div className="flex-grow overflow-hidden flex flex-col border border-divider rounded-lg bg-white">
              <div className="flex-grow overflow-auto">
                <Table
                  aria-label="Savings initiatives table"
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
                      "btn text-left",
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
                  <TableHeader>
                    <TableColumn
                      className="text-left !w-[180px]"
                      key="agency"
                      width={180}
                    >
                      AGENCY
                    </TableColumn>
                    <TableColumn
                      className="text-left !w-[180px]"
                      key="vendor"
                      width={180}
                    >
                      VENDOR
                    </TableColumn>
                    <TableColumn
                      className="text-left !w-[300px]"
                      key="description"
                      width={300}
                    >
                      DESCRIPTION
                    </TableColumn>
                    <TableColumn
                      className="text-left !w-[120px]"
                      key="deleted_date"
                      width={120}
                    >
                      DATE
                    </TableColumn>
                    <TableColumn className="text-left !w-[80px]" width={80}>
                      FPDS
                    </TableColumn>
                    <TableColumn
                      className="text-left !w-[120px]"
                      key="savings"
                      width={120}
                    >
                      SAVED
                    </TableColumn>
                  </TableHeader>
                  <TableBody>
                    {paginated_data
                      .filter(
                        (item): item is normalized_contract =>
                          "type" in item &&
                          item.type === "Contract" &&
                          item !== null &&
                          item !== undefined
                      )
                      .map((contract) => (
                        <TableRow
                          key={contract.id}
                          className="group cursor-pointer hover:bg-default-100/50 transition-colors"
                          onClick={() => {
                            set_selected_contract(contract);
                            onOpen();
                          }}
                        >
                          <TableCell width={180} className="text-base">
                            {contract.agency || "-"}
                          </TableCell>
                          <TableCell width={180} className="text-base">
                            {contract.vendor || "-"}
                          </TableCell>
                          <TableCell width={300} className="text-base">
                            {truncate_text(contract.description || "", 42)}
                          </TableCell>
                          <TableCell width={120} className="text-base">
                            {contract.deleted_date
                              ? new Date(
                                  contract.deleted_date
                                ).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell width={80}>
                            <div className="relative flex justify-end items-center gap-2">
                              {contract.fpds_link && (
                                <a
                                  href={contract.fpds_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLinkIcon className="w-4 h-4" />
                                  FPDS
                                </a>
                              )}
                            </div>
                          </TableCell>
                          <TableCell
                            width={120}
                            className="text-base font-semibold"
                          >
                            ${(contract.savings || 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
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
        )}
      </div>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Contract Details
              </ModalHeader>
              <ModalBody>
                {selected_contract && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-default-400">
                        Agency
                      </h3>
                      <p className="text-base">
                        {selected_contract.agency || "-"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-default-400">
                        Vendor
                      </h3>
                      <p className="text-base">
                        {selected_contract.vendor || "-"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-default-400">
                        Description
                      </h3>
                      <p className="text-base whitespace-pre-wrap">
                        {selected_contract.description || "-"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-default-400">
                        PIID
                      </h3>
                      <p className="text-base">
                        {selected_contract.piid || "-"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-default-400">
                        Value
                      </h3>
                      <p className="text-base">
                        ${(selected_contract.value || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-default-400">
                        Savings
                      </h3>
                      <p className="text-base font-semibold">
                        ${(selected_contract.savings || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-default-400">
                        Status
                      </h3>
                      <span
                        className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                          selected_contract.fpds_status === "Verified"
                            ? "bg-success/10 text-success"
                            : "bg-warning/10 text-warning"
                        }`}
                      >
                        {selected_contract.fpds_status || "Unknown"}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-default-400">
                        Date
                      </h3>
                      <p className="text-base">
                        {selected_contract.deleted_date
                          ? new Date(
                              selected_contract.deleted_date
                            ).toLocaleDateString()
                          : "-"}
                      </p>
                    </div>
                    {selected_contract.fpds_link && (
                      <div>
                        <h3 className="text-sm font-medium text-default-400">
                          FPDS Link
                        </h3>
                        <a
                          href={selected_contract.fpds_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View on FPDS
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onOpenChange}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
