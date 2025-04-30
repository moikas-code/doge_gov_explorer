import useSWR from 'swr';
import { api_response, savings_initiative, expenditure } from '@/types/api';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface use_savings_params {
  page?: number;
  per_page?: number;
  status?: 'Pending' | 'Verified' | 'Rejected';
  department?: string;
}

interface use_expenditures_params {
  page?: number;
  per_page?: number;
  status?: 'Pending' | 'Completed' | 'Rejected';
  department?: string;
  fiscal_year?: string;
  category?: string;
}

export function useSavings(params: use_savings_params = {}) {
  const { page = 1, per_page = 10, status, department } = params;
  let url = `/api/savings?page=${page}&per_page=${per_page}`;
  if (status) url += `&status=${status}`;
  if (department) url += `&department=${department}`;

  const { data, error, isLoading } = useSWR<api_response<savings_initiative[]>>(
    url,
    fetcher
  );

  return {
    savings: data?.data || [],
    meta: data?.meta,
    is_loading: isLoading,
    is_error: error,
  };
}

export function useExpenditures(params: use_expenditures_params = {}) {
  const { page = 1, per_page = 10, status, department, fiscal_year, category } = params;
  let url = `/api/expenditures?page=${page}&per_page=${per_page}`;
  if (status) url += `&status=${status}`;
  if (department) url += `&department=${department}`;
  if (fiscal_year) url += `&fiscal_year=${fiscal_year}`;
  if (category) url += `&category=${category}`;

  const { data, error, isLoading } = useSWR<api_response<expenditure[]>>(
    url,
    fetcher
  );

  return {
    expenditures: data?.data || [],
    meta: data?.meta,
    is_loading: isLoading,
    is_error: error,
  };
}

export function useStats(fiscal_year?: string, department?: string) {
  let url = '/api/stats';
  if (fiscal_year) url += `?fiscal_year=${fiscal_year}`;
  if (department) url += `${fiscal_year ? '&' : '?'}department=${department}`;

  const { data, error, isLoading } = useSWR(url, fetcher);

  return {
    stats: data?.data,
    is_loading: isLoading,
    is_error: error,
  };
} 