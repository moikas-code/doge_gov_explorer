import { NextRequest, NextResponse } from 'next/server';
import { fetch_api } from '@/utils/api';
import type { savings_initiative } from '@/types/api';

interface grants_response {
  result: {
    grants: savings_initiative[];
  };
}

export async function GET(request: NextRequest) {
  try {
    const search_params = request.nextUrl.searchParams;
    const page = Number(search_params.get('page')) || 1;
    const items_per_page = Number(search_params.get('items_per_page')) || 10;
    const sort_by = search_params.get('sort_by');
    const sort_order = search_params.get('sort_order');

    const api_response = await fetch_api<grants_response>('/savings/grants');
    const filtered_data = [...(api_response.result.grants || [])];

    // Sort data if sort parameters are provided
    if (sort_by && sort_order) {
      filtered_data.sort((a, b) => {
        const value_a = a[sort_by as keyof savings_initiative];
        const value_b = b[sort_by as keyof savings_initiative];
        if (typeof value_a === 'number' && typeof value_b === 'number') {
          return sort_order === 'ascending' ? value_a - value_b : value_b - value_a;
        }
        return 0;
      });
    }

    // Calculate pagination
    const total_items = filtered_data.length;
    const total_pages = Math.ceil(total_items / items_per_page);
    const start_index = (page - 1) * items_per_page;
    const end_index = start_index + items_per_page;
    const paginated_data = filtered_data.slice(start_index, end_index);

    return NextResponse.json({
      result: paginated_data,
      total_pages,
      current_page: page,
      items_per_page
    });
  } catch (error) {
    console.error('Error fetching grants:', error);
    return NextResponse.json({ error: 'Failed to fetch grants' }, { status: 500 });
  }
} 