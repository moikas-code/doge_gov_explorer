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

export async function fetch_api<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
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

export async function fetch_grant_savings(): Promise<api_response<grant_response>> {
  return fetch_api('/savings/grants');
}

export async function fetch_contract_savings(): Promise<api_response<contracts_response>> {
  return fetch_api('/savings/contracts');
}

export async function fetch_lease_savings(): Promise<api_response<lease_response>> {
  return fetch_api('/savings/leases');
}

export async function fetch_all_savings() {
  const [grants, contracts, leases] = await Promise.all([
    fetch_grant_savings(),
    fetch_contract_savings(),
    fetch_lease_savings(),
  ]);
  console.log(grants);
  const all_data = [
    ...(grants.result?.grants || []),
    ...(contracts.result?.contracts || []),
    ...(leases.result?.leases || []),
  ];

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
    per_page: 100,
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