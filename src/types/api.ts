export interface savings_initiative {
  id: string;
  date: string;
  amount: number;
  type: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  department: string;
  description: string;
}

export interface expenditure {
  id: string;
  date: string;
  recipient: string;
  amount: number;
  purpose: string;
  status: 'Pending' | 'Completed' | 'Rejected';
  department: string;
  category: string;
  fiscal_year: string;
}

export interface api_error {
  message: string;
  code: string;
  status: number;
}

export interface api_response<T> {
  success: boolean;
  result: T;
  meta: {
    total_results: number;
    pages: number;
  };
}

export interface api_error_response {
  success: false;
  message: string;
}

export interface payment_line_item {
  agency: string;
  org_name: string;
  description: string | null;
  amount: number;
  post_date: string;
  status_description: string | null;
}

export interface grant_item {
  date: string;
  agency: string;
  recipient: string;
  value: number;
  savings: number;
  link: string | null;
  description: string | null;
}

export interface contract_item {
  piid: string;
  agency: string;
  vendor: string;
  value: number;
  description: string | null;
  fpds_status: string | null;
  fpds_link: string | null;
  deleted_date: string | null;
  savings: number;
}

export interface lease_item {
  date: string;
  location: string;
  sq_ft: number;
  description: string | null;
  value: number;
  savings: number;
  agency: string;
}

export interface payments_response {
  payments: payment_line_item[];
}

export interface grants_response {
  grants: grant_item[];
}

export interface contracts_response {
  contracts: contract_item[];
}

export interface leases_response {
  leases: lease_item[];
} 