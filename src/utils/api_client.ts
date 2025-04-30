const API_BASE_URL = 'https://api.doge.gov/v1';

interface api_error {
  success: false;
  message: string;
}

interface api_response<T> {
  success: true;
  result: T;
  meta: {
    total_results: number;
    pages: number;
  };
}

type api_result<T> = api_response<T> | api_error;

interface query_params {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  filter?: string;
  filter_value?: string;
}

async function api_request<T>(endpoint: string, params: query_params = {}): Promise<api_result<T>> {
  try {
    const query_string = new URLSearchParams();
    
    // Add query parameters if they exist
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        query_string.append(key, value.toString());
      }
    });

    const url = `${API_BASE_URL}${endpoint}${query_string.toString() ? `?${query_string.toString()}` : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw new Error('Failed to fetch data from the API');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

export async function fetch_grants(params: query_params = {}) {
  return api_request('/savings/grants', params);
}

export async function fetch_contracts(params: query_params = {}) {
  return api_request('/savings/contracts', params);
}

export async function fetch_leases(params: query_params = {}) {
  return api_request('/savings/leases', params);
}

export async function fetch_payments(params: query_params = {}) {
  return api_request('/payments', params);
} 