'use client';

import React from 'react';
import { DataTable } from '@/components/data_table';
import { api_response, leases_response } from '@/types/api';
import { formatCurrency } from '@/utils/format';

interface leases_page_props {
  searchParams: {
    page?: string;
    per_page?: string;
    sort_by?: string;
    sort_order?: string;
  };
}

async function get_leases(params: leases_page_props['searchParams']) {
  const search_params = new URLSearchParams();
  if (params.page) search_params.append('page', params.page);
  if (params.per_page) search_params.append('per_page', params.per_page);
  if (params.sort_by) search_params.append('sort_by', params.sort_by);
  if (params.sort_order) search_params.append('sort_order', params.sort_order);

  const response = await fetch(`/api/savings/leases?${search_params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch leases');
  
  return response.json() as Promise<api_response<leases_response>>;
}

export default async function leases_page({ searchParams }: leases_page_props) {
  const current_page = parseInt(searchParams.page || '1');
  const items_per_page = parseInt(searchParams.per_page || '100');
  
  const { result, meta } = await get_leases(searchParams);

  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'location', label: 'Location' },
    {
      key: 'sq_ft',
      label: 'Square Feet',
      render: (value: number) => value.toLocaleString()
    },
    {
      key: 'value',
      label: 'Value',
      render: (value: number) => formatCurrency(value)
    },
    {
      key: 'savings',
      label: 'Savings',
      render: (value: number) => formatCurrency(value)
    },
    { key: 'agency', label: 'Agency' }
  ];

  return (
    <DataTable
      columns={columns}
      data={result.leases}
      loading={false}
      total_pages={meta.pages}
      current_page={current_page}
      items_per_page={items_per_page}
      sort_by={searchParams.sort_by}
      sort_order={searchParams.sort_order as 'ascending' | 'descending' | undefined}
      on_page_change={(page: number) => {
        const url = new URL(window.location.href);
        url.searchParams.set('page', page.toString());
        window.location.href = url.toString();
      }}
      on_items_per_page_change={(items: number) => {
        const url = new URL(window.location.href);
        url.searchParams.set('per_page', items.toString());
        url.searchParams.delete('page');
        window.location.href = url.toString();
      }}
      on_sort_change={(key: string, order: 'ascending' | 'descending') => {
        const url = new URL(window.location.href);
        url.searchParams.set('sort_by', key);
        url.searchParams.set('sort_order', order);
        window.location.href = url.toString();
      }}
      render_metadata={(row) => (
        <div className="flex flex-col gap-2">
          {row.description && (
            <div>
              <span className="font-semibold">Description:</span>
              <div className="text-default-700 mt-1 whitespace-pre-line">{row.description}</div>
            </div>
          )}
        </div>
      )}
    />
  );
} 