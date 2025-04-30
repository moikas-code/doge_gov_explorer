'use client'

import { useEffect, useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Card, CardBody, CardHeader } from '@nextui-org/react'
import { fetch_all_savings, fetch_payments } from '@/utils/api'

interface DashboardStats {
  total_savings: number;
  recent_payments: number;
  active_initiatives: number;
  payments_error: string | null;
  savings_error: string | null;
}

const initial_stats: DashboardStats = {
  total_savings: 0,
  recent_payments: 0,
  active_initiatives: 0,
  payments_error: null,
  savings_error: null
}

export default function Home() {
  const [stats, set_stats] = useState<DashboardStats>(initial_stats)
  const [loading, set_loading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function load_data() {
      try {
        console.log('Fetching data...')
        
        // Fetch data independently to handle partial failures
        let total_savings = 0
        let active_initiatives = 0
        let recent_payments = 0
        let savings_error = null
        let payments_error = null

        try {
          const savings_response = await fetch_all_savings()
          console.log('Savings response:', savings_response)

          if (!savings_response.success) {
            throw new Error('Failed to fetch savings data')
          }

          // Calculate total savings
          total_savings = savings_response.result?.reduce((sum: number, item: any) => sum + (item.savings || 0), 0) || 0

          // Count verified initiatives
          active_initiatives = savings_response.result
            ?.filter((item: any) => item.status === 'Verified')
            .length || 0

        } catch (error) {
          console.error('Error loading savings:', error)
          savings_error = error instanceof Error ? error.message : 'Failed to load savings data'
        }

        try {
          const payments_response = await fetch_payments()
          console.log('Payments response:', payments_response)

          if (!payments_response.success) {
            throw new Error('Failed to fetch payments data')
          }

          // Calculate recent payments (last 30 days)
          const thirty_days_ago = new Date()
          thirty_days_ago.setDate(thirty_days_ago.getDate() - 30)
          
          recent_payments = payments_response.result?.payments
            ?.filter((item: any) => new Date(item.post_date) >= thirty_days_ago)
            .reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0

        } catch (error) {
          console.error('Error loading payments:', error)
          payments_error = error instanceof Error ? error.message : 'Failed to load payments data'
        }

        if (mounted) {
          set_stats({
            total_savings,
            recent_payments,
            active_initiatives,
            savings_error,
            payments_error
          })
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
                <p className="text-3xl font-bold">${stats.recent_payments.toLocaleString()}</p>
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
                <p className="text-3xl font-bold">{stats.active_initiatives}</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </main>
  )
}
