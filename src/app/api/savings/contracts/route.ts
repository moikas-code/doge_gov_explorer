import { NextRequest, NextResponse } from 'next/server';
import { fetch_contract_savings } from '@/utils/api';
import type { contract_item } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const search_params = request.nextUrl.searchParams;
    const page = parseInt(search_params.get('page') || '1');
    const per_page = parseInt(search_params.get('per_page') || '500');
    const sort_by = search_params.get('sort_by') || 'date';
    const sort_order = search_params.get('sort_order') || 'desc';

    const api_response = await fetch_contract_savings({
      page,
      per_page,
      sort_by,
      sort_order
    });

    if (!api_response.success) {
      throw new Error('Failed to fetch contracts data');
    }

    const filtered_data = [...api_response.result.contracts];

    // Apply sorting
    filtered_data.sort((a, b) => {
      const field_a = a[sort_by as keyof contract_item];
      const field_b = b[sort_by as keyof contract_item];
      
      if (field_a === null || field_b === null) return 0;
      
      const comparison = field_a > field_b ? 1 : -1;
      return sort_order === 'desc' ? -comparison : comparison;
    });

    // Apply pagination
    const start_index = (page - 1) * per_page;
    const end_index = start_index + per_page;
    const paginated_data = filtered_data.slice(start_index, end_index);

    return NextResponse.json({
      success: true,
      result: {
        contracts: paginated_data
      },
      meta: {
        total_results: filtered_data.length,
        pages: Math.ceil(filtered_data.length / per_page),
        current_page: page,
        per_page
      }
    });

  } catch (error) {
    console.error('Error in contracts route:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while processing your request.'
      },
      { status: 500 }
    );
  }
} 