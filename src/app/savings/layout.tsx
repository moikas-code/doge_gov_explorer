'use client';

import React from 'react';
import { Navbar } from '@/components/navbar';
import { Tabs, Tab, Card } from '@nextui-org/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function savings_layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const current_tab = pathname.split('/').pop() || 'grants';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-gray-800">Government Savings</h1>
            <p className="text-gray-600">Track and analyze government savings across different categories</p>
          </div>
          
          <Card className="w-full">
            <div className="p-0">
              <Tabs 
                selectedKey={current_tab}
                aria-label="Savings categories"
                classNames={{
                  tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                  cursor: "w-full bg-primary",
                  tab: "max-w-fit px-0 h-12",
                  tabContent: "group-data-[selected=true]:text-primary"
                }}
              >
                <Tab
                  key="grants"
                  title={
                    <Link href="/savings/grants" className="w-full px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Grants</span>
                      </div>
                    </Link>
                  }
                />
                <Tab
                  key="contracts"
                  title={
                    <Link href="/savings/contracts" className="w-full px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Contracts</span>
                      </div>
                    </Link>
                  }
                />
                <Tab
                  key="leases"
                  title={
                    <Link href="/savings/leases" className="w-full px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Leases</span>
                      </div>
                    </Link>
                  }
                />
              </Tabs>
            </div>
            <div className="p-4">
              {children}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 