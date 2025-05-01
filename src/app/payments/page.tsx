// PaymentsTable.tsx - Client Component
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/data_table';
import { payments_response } from "@/types/api";
import { formatCurrency } from "@/utils/format";
import { fetch_payments } from '@/utils/api';

type SortDirection = 'ascending' | 'descending';

const map_sort_direction = (direction: string): SortDirection => {
  return direction === 'desc' ? 'descending' : 'ascending';
};

const reverse_sort_direction = (direction: SortDirection): string => {
  return direction === 'descending' ? 'desc' : 'asc';
};

function PaymentsTable() {
  const router = useRouter();
  const search_params = useSearchParams();
  const [loading, set_loading] = useState(true);
  const [payments_data, set_payments_data] = useState<payments_response>({ payments: [] });
  const [meta_data, set_meta_data] = useState<{ total_results: number; pages: number }>({ total_results: 0, pages: 0 });
  
  const current_page = parseInt(search_params.get('page') || '1');
  const items_per_page = parseInt(search_params.get('per_page') || '500');
  const current_sort_by = search_params.get('sort_by') || 'post_date';
  const current_sort_order = map_sort_direction(search_params.get('sort_order') || 'desc');
  const current_filter = search_params.get('filter') || undefined;
  const current_filter_value = search_params.get('filter_value') || undefined;

  useEffect(() => {
    const load_payments = async () => {
      try {
        set_loading(true);
        const response = await fetch_payments({
          page: current_page,
          per_page: items_per_page,
          sort_by: current_sort_by,
          sort_order: reverse_sort_direction(current_sort_order),
          filter: current_filter,
          filter_value: current_filter_value
        });
        
        if (response.success && response.result) {
          set_payments_data(response.result);
          set_meta_data(response.meta);
        }
      } catch (error) {
        console.error('Error loading payments:', error);
      } finally {
        set_loading(false);
      }
    };

    load_payments();
  }, [current_page, items_per_page, current_sort_by, current_sort_order, current_filter, current_filter_value]);

  const update_url_params = (params: Record<string, string>) => {
    const current = new URLSearchParams(search_params.toString());
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        current.set(key, value);
      } else {
        current.delete(key);
      }
    });
    
    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${window.location.pathname}${query}`);
  };

  const columns = [
    { key: 'agency', label: 'Agency', sortable: true },
    { key: 'org_name', label: 'Organization', sortable: true },
    { key: 'description', label: 'Description', sortable: false },
    {
      key: 'amount',
      label: 'Amount',
      render: (value: number) => formatCurrency(value),
      sortable: true,
    },
    { key: 'post_date', label: 'Post Date', sortable: true },
    { key: 'status_description', label: 'Status', sortable: false },
  ];

  return (
    <DataTable
      columns={columns}
      data={payments_data.payments}
      loading={loading}
      total_pages={meta_data.pages}
      current_page={current_page}
      items_per_page={items_per_page}
      sort_by={current_sort_by}
      sort_order={current_sort_order}
      on_page_change={(page: number) => {
        update_url_params({ page: page.toString() });
      }}
      on_items_per_page_change={(items: number) => {
        update_url_params({
          per_page: items.toString(),
          page: '1'
        });
      }}
      on_sort_change={(key: string, order: SortDirection) => {
        update_url_params({
          sort_by: key,
          sort_order: reverse_sort_direction(order),
          page: '1'
        });
      }}
    />
  );
}

// Loading fallback component
function PaymentsTableFallback() {
  return <div className="p-4">Loading payments data...</div>;
}

// page.tsx - Server Component
import { Suspense } from 'react';

export default function PaymentsPage() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Government Payments</h1>
        <Suspense fallback={<PaymentsTableFallback />}>
          <PaymentsTable />
        </Suspense>
      </div>
    </main>
  );
}
