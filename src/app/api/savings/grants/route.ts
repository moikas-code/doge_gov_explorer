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
    const per_page = Number(search_params.get('per_page')) || 500;
    const sort_by = search_params.get('sort_by') || 'date';
    const sort_order = search_params.get('sort_order') || 'desc';

    const api_response = await fetch_api<grants_response>('/savings/grants', {
      page,
      per_page,
      sort_by,
      sort_order
    });

    const filtered_data = [...(api_response.result.grants || [])];

    // Sort data
    filtered_data.sort((a, b) => {
      const value_a = a[sort_by as keyof savings_initiative];
      const value_b = b[sort_by as keyof savings_initiative];
      
      if (value_a === null || value_b === null) return 0;
      
      const comparison = value_a > value_b ? 1 : -1;
      return sort_order === 'desc' ? -comparison : comparison;
    });

    // Calculate pagination
    const total_items = filtered_data.length;
    const total_pages = Math.ceil(total_items / per_page);
    const start_index = (page - 1) * per_page;
    const end_index = start_index + per_page;
    const paginated_data = filtered_data.slice(start_index, end_index);

    return NextResponse.json({
      success: true,
      result: {
        grants: paginated_data
      },
      meta: {
        total_results: total_items,
        pages: total_pages,
        current_page: page,
        per_page
      }
    });
  } catch (error) {
    console.error('Error fetching grants:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to fetch grants'
      }, 
      { status: 500 }
    );
  }
} 