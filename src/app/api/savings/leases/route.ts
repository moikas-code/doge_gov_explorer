import { NextRequest, NextResponse } from 'next/server';
import { fetch_lease_savings } from '@/utils/api';
import type { savings_initiative } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const search_params = request.nextUrl.searchParams;
    const page = parseInt(search_params.get('page') || '1');
    const per_page = parseInt(search_params.get('per_page') || '500');
    const sort_by = search_params.get('sort_by');
    const sort_order = search_params.get('sort_order');

    const api_response = await fetch_lease_savings();
    let filtered_data = [...api_response.result.leases];

    // Apply sorting if provided
    if (sort_by && sort_order) {
      filtered_data.sort((a, b) => {
        const field_a = a[sort_by as keyof savings_initiative];
        const field_b = b[sort_by as keyof savings_initiative];
        
        if (field_a === null || field_b === null) return 0;
        
        const comparison = field_a > field_b ? 1 : -1;
        return sort_order === 'asc' ? comparison : -comparison;
      });
    }

    // Apply pagination
    const start_index = (page - 1) * per_page;
    const end_index = start_index + per_page;
    const paginated_data = filtered_data.slice(start_index, end_index);

    return NextResponse.json({
      success: true,
      result: {
        leases: paginated_data
      },
      meta: {
        total_results: filtered_data.length,
        pages: Math.ceil(filtered_data.length / per_page)
      }
    });

  } catch (error) {
    console.error('Error in leases route:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while processing your request. We\'re on it.'
      },
      { status: 500 }
    );
  }
} 