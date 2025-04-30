'use client'

import React, { useState, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { Card, CardBody, CardHeader } from '@nextui-org/react'
import { fetch_all_savings, fetch_payments } from '@/utils/api'

interface savings_initiative {
  id: string;
  date: string;
  amount: number;
  savings: number;
  projected_savings: number;
  status: string;
  type: string;
  department: string;
  description?: string;
  link?: string;
}

interface contract_item {
  id: string;
  date: string;
  amount: number;
  department: string;
  type: string;
  description?: string;
  link?: string;
}

interface chart_data {
  name: string;
  value: number;
}

interface stats {
  total_savings: number;
  projected_savings: number;
  payments: number;
  savings_error: string | null;
  payments_error: string | null;
}

interface savings_response {
  success: boolean;
  result: Array<savings_initiative | contract_item>;
  meta: {
    total_results: number;
    pages: number;
  };
}

interface payment_response {
  result: {
    payments: Array<{
      post_date: string;
      amount: number;
    }>;
  };
}

const initial_stats: stats = {
  total_savings: 0,
  projected_savings: 0,
  payments: 0,
  savings_error: null,
  payments_error: null
}

export default function Home() {
  const [stats, set_stats] = useState<stats>(initial_stats)

  useEffect(() => {
    const fetch_data = async () => {
      try {
        // Fetch data independently to handle partial failures
        let total_savings = 0;
        let projected_savings = 0;
        let payments = 0;
        let savings_error = null;
        let payments_error = null;

        try {
          const savings_response = await fetch_all_savings();
          
          // Calculate total savings
          total_savings = (savings_response as savings_response).result
            ?.filter((item): item is savings_initiative => 'savings' in item)
            .reduce((sum, item) => sum + (item.savings || 0), 0) || 0;

          // Calculate projected savings
          projected_savings = (savings_response as savings_response).result
            ?.filter((item): item is savings_initiative => 'projected_savings' in item && item.status === 'Verified')
            .reduce((sum, item) => sum + (item.projected_savings || 0), 0) || 0;

        } catch (error) {
          savings_error = error instanceof Error ? error.message : 'Failed to fetch savings data';
        }

        try {
          const payments_response = await fetch_payments();
          const thirty_days_ago = new Date();
          thirty_days_ago.setDate(thirty_days_ago.getDate() - 30);
          
          // Calculate payments metrics
          payments = (payments_response as payment_response).result?.payments
            ?.filter(item => new Date(item.post_date) >= thirty_days_ago)
            .reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

        } catch (error) {
          payments_error = error instanceof Error ? error.message : 'Failed to fetch payments data';
        }

        set_stats({
          total_savings,
          projected_savings,
          payments,
          savings_error,
          payments_error
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetch_data();
  }, []);

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
