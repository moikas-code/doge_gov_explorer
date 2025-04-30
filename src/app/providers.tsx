'use client'

import { NextUIProvider } from '@nextui-org/react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { useRouter } from 'next/navigation'
import { I18nProvider } from '@react-aria/i18n'

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  
  return (
    <I18nProvider locale="en-US">
      <NextUIProvider navigate={router.push}>
        <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem storageKey="doge-theme">
          {children}
        </NextThemesProvider>
      </NextUIProvider>
    </I18nProvider>
  )
} 