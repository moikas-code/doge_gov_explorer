import { NextRequest, NextResponse } from 'next/server';
import { fetch_api } from '@/utils/api';
import { payment_line_item } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const search_params = request.nextUrl.searchParams;
    const page = parseInt(search_params.get('page') || '1');
    const per_page = parseInt(search_params.get('per_page') || '100');
    const sort_by = search_params.get('sort_by');
    const sort_order = search_params.get('sort_order');
    const filter = search_params.get('filter');
    const filter_value = search_params.get('filter_value');

    // Construct query parameters
    const api_params = new URLSearchParams();
    if (page) api_params.append('page', page.toString());
    if (per_page) api_params.append('per_page', per_page.toString());
    if (sort_by) api_params.append('sort_by', sort_by);
    if (sort_order) api_params.append('sort_order', sort_order);
    if (filter) api_params.append('filter', filter);
    if (filter_value) api_params.append('filter_value', filter_value);

    try {
      // Call the actual API
      const response = await fetch_api(`/payments?${api_params.toString()}`);
      return NextResponse.json(response);
    } catch (api_error) {
      // If API returns 500, return a partial success response with empty data
      console.warn('Payment API error:', api_error);
      return NextResponse.json({
        success: true,
        result: {
          payments: []
        },
        meta: {
          total_results: 0,
          pages: 0,
          error: 'Partial data: Payment service temporarily unavailable'
        }
      });
    }

  } catch (error) {
    console.error('Critical error in payments route:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while processing your request. We\'re on it.'
      },
      { status: 500 }
    );
  }
} 