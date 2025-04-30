'use client'

import { useEffect, useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Card, CardBody, CardHeader } from '@nextui-org/react'
import { fetch_all_savings, fetch_payments } from '@/utils/api'
import { savings_initiative, api_response } from '@/types/api'

interface DashboardStats {
  total_savings: number;
  projected_savings: number;
  payments: number;
  savings_error: string | null;
  payments_error: string | null;
}

interface ChartData {
  name: string;
  value: number;
}

const initial_stats: DashboardStats = {
  total_savings: 0,
  projected_savings: 0,
  payments: 0,
  savings_error: null,
  payments_error: null
}

const format_chart_data = (data: DashboardStats): ChartData[] => {
  return [
    { name: 'Total Savings', value: data.total_savings },
    { name: 'Projected Savings', value: data.projected_savings },
  ];
};

const format_table_data = (data: savings_initiative[]): Record<string, string | number>[] => {
  return data.map(item => ({
    id: item.id,
    description: item.description,
    amount: item.amount,
    status: item.status,
    department: item.department,
    date: item.date,
    type: item.type
  }));
};

export default function Home() {
  const [stats, set_stats] = useState<DashboardStats>(initial_stats)
  const [loading, set_loading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function load_data() {
      try {
        console.log('Fetching data...')
        
        // Fetch data independently to handle partial failures
        let total_savings = 0;
        let projected_savings = 0;
        let payments = 0;
        let savings_error = null;
        let payments_error = null;

        try {
          const savings_response = await fetch_all_savings();
          
          // Calculate total savings
          total_savings = savings_response.result?.reduce((sum: number, item: any) => sum + (item.savings || 0), 0) || 0;

          // Calculate projected savings
          projected_savings = savings_response.result
            ?.filter((item: any) => item.status === 'Verified')
            .reduce((sum: number, item: any) => sum + (item.projected_savings || 0), 0) || 0;

        } catch (error) {
          savings_error = error instanceof Error ? error.message : 'Failed to fetch savings data';
        }

        try {
          const payments_response = await fetch_payments();
          const thirty_days_ago = new Date();
          thirty_days_ago.setDate(thirty_days_ago.getDate() - 30);
          
          // Calculate payments metrics
          payments = payments_response.result?.payments
            ?.filter((item: any) => new Date(item.post_date) >= thirty_days_ago)
            .reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0;

        } catch (error) {
          payments_error = error instanceof Error ? error.message : 'Failed to fetch payments data';
        }

        if (mounted) {
          set_stats({
            total_savings,
            projected_savings,
            payments,
            savings_error,
            payments_error
          });
        }
      } finally {
        if (mounted) {
          set_loading(false)
        }
      }
    }
    
    load_data()

    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">DOGE Government Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex gap-3">
              <div className="flex flex-col">
                <p className="text-md">Total Budget Savings</p>
                <p className="text-small text-default-500">Current fiscal year</p>
              </div>
            </CardHeader>
            <CardBody>
              {stats.savings_error ? (
                <div className="text-red-600 text-sm">{stats.savings_error}</div>
              ) : (
                <p className="text-3xl font-bold">${stats.total_savings.toLocaleString()}</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex gap-3">
              <div className="flex flex-col">
                <p className="text-md">Recent Payments</p>
                <p className="text-small text-default-500">Last 30 days</p>
              </div>
            </CardHeader>
            <CardBody>
              {stats.payments_error ? (
                <div className="text-red-600 text-sm">{stats.payments_error}</div>
              ) : (
                <p className="text-3xl font-bold">${stats.payments.toLocaleString()}</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex gap-3">
              <div className="flex flex-col">
                <p className="text-md">Verified Initiatives</p>
                <p className="text-small text-default-500">Successfully implemented</p>
              </div>
            </CardHeader>
            <CardBody>
              {stats.savings_error ? (
                <div className="text-red-600 text-sm">{stats.savings_error}</div>
              ) : (
                <p className="text-3xl font-bold">{stats.projected_savings}</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </main>
  )
}
