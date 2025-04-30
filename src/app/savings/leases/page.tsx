'use client';

import React, { useState, useEffect } from 'react';
import { DataTable } from '@/components/data_table';
import { api_response, leases_response, lease_item } from '@/types/api';
import { formatCurrency } from '@/utils/format';
import { Spinner } from '@nextui-org/react';

interface search_params {
  page?: string;
  per_page?: string;
  sort_by?: string;
  sort_order?: string;
}

interface leases_page_props {
  searchParams: search_params;
}

interface leases_state {
  data: lease_item[];
  loading: boolean;
  error: string | null;
  meta: {
    pages: number;
  };
}

async function get_leases(params: search_params) {
  const search_params = new URLSearchParams();
  if (params.page) search_params.append('page', params.page);
  if (params.per_page) search_params.append('per_page', params.per_page);
  if (params.sort_by) search_params.append('sort_by', params.sort_by);
  if (params.sort_order) search_params.append('sort_order', params.sort_order);

  const response = await fetch(`/api/savings/leases?${search_params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch leases');
  
  return response.json() as Promise<api_response<leases_response>>;
}

export default function leases_page({ searchParams }: leases_page_props) {
  const [state, set_state] = useState<leases_state>({
    data: [],
    loading: true,
    error: null,
    meta: { pages: 1 }
  });

  const current_page = parseInt(searchParams.page || '1');
  const items_per_page = parseInt(searchParams.per_page || '100');

  useEffect(() => {
    async function load_data() {
      try {
        set_state(prev => ({ ...prev, loading: true, error: null }));
        const { result, meta } = await get_leases(searchParams);
        set_state({
          data: result.leases,
          loading: false,
          error: null,
          meta
        });
      } catch (error) {
        console.error('Error loading leases:', error);
        set_state(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load leases'
        }));
      }
    }

    load_data();
  }, [searchParams]);

  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'location', label: 'Location' },
    {
      key: 'sq_ft',
      label: 'Square Feet',
      render: (value: unknown) => (value as number).toLocaleString()
    },
    {
      key: 'value',
      label: 'Value',
      render: (value: unknown) => formatCurrency(value as number)
    },
    {
      key: 'savings',
      label: 'Savings',
      render: (value: unknown) => formatCurrency(value as number)
    },
    { key: 'agency', label: 'Agency' }
  ];

  if (state.loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading leases</h3>
            <div className="mt-2 text-sm text-red-700">{state.error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DataTable<lease_item>
        columns={columns}
        data={state.data}
        loading={state.loading}
        total_pages={state.meta.pages}
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
        render_metadata={(row: lease_item) => (
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
    </div>
  );
} 