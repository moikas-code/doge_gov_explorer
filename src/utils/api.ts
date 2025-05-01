import { api_response, savings_initiative, payments_response, contracts_response } from '@/types/api';

const API_BASE_URL = 'https://api.doge.gov';

export interface query_params {
  sort_by?: string;
  sort_order?: string;
  page?: number;
  per_page?: number;
  filter?: string;
  filter_value?: string;
}

const default_params: query_params = {
  sort_by: 'date',
  sort_order: 'desc',
  page: 1,
  per_page: 500
};

export async function fetch_api<T>(endpoint: string, params: query_params = default_params): Promise<api_response<T>> {
  try {
    const search_params = new URLSearchParams();
    
    // Merge default params with provided params
    const merged_params = { ...default_params, ...params };
    
    Object.entries(merged_params).forEach(([key, value]) => {
      if (value !== undefined) {
        search_params.append(key, value.toString());
      }
    });

    const url = `${API_BASE_URL}${endpoint}${search_params.toString() ? `?${search_params.toString()}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    throw error;
  }
}

export function format_currency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function format_date(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface grant_response {
  grants: savings_initiative[];
}

interface lease_response {
  leases: savings_initiative[];
}

export async function fetch_grant_savings(params: query_params = {}): Promise<api_response<grant_response>> {
  return fetch_api('/savings/grants', params);
}

export async function fetch_contract_savings(params: query_params = {}): Promise<api_response<contracts_response>> {
  return fetch_api('/savings/contracts', params);
}

export async function fetch_lease_savings(params: query_params = {}): Promise<api_response<lease_response>> {
  return fetch_api('/savings/leases', params);
}

export async function fetch_all_savings() {
  const [grants, contracts, leases] = await Promise.all([
    fetch_grant_savings(),
    fetch_contract_savings(),
    fetch_lease_savings(),
  ]);
  
  const all_data = [
    ...(grants.result?.grants || []),
    ...(contracts.result?.contracts || []),
    ...(leases.result?.leases || []),
  ];
  console.log(all_data);
  return {
    success: true,
    result: all_data,
    meta: {
      total_results: all_data.length,
      pages: Math.max(
        grants.meta?.pages || 1,
        contracts.meta?.pages || 1,
        leases.meta?.pages || 1
      ),
    },
  };
}

export async function fetch_payments(params: query_params = {}): Promise<api_response<payments_response>> {
  const default_params: query_params = {
    sort_by: 'post_date',
    sort_order: 'desc',
    page: 1,
    per_page: 500,
    ...params
  };

  const search_params = new URLSearchParams();
  Object.entries(default_params).forEach(([key, value]) => {
    if (value !== undefined) {
      search_params.append(key, value.toString());
    }
  });

  return fetch_api(`/payments?${search_params.toString()}`);
} 