'use client'

import React from 'react'
import Link from 'next/link'
import {
  Navbar as NextUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link as NextUILink,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem
} from "@nextui-org/react"
import { usePathname } from 'next/navigation'

export function Navbar() {
  const pathname = usePathname()
  const [is_menu_open, set_is_menu_open] = React.useState(false)

  const menu_items = [
    { name: 'Dashboard', href: '/' },
    { name: 'Savings', href: '/savings' },
    { name: 'Payments', href: '/payments' }
  ]

  return (
    <NextUINavbar
      isBordered
      isMenuOpen={is_menu_open}
      onMenuOpenChange={set_is_menu_open}
      className="bg-background/70 bg-white backdrop-blur-md border-b border-kawaii-pink/20 z-50 flex flex-col flex-md-row"
      maxWidth="full"
      
    >
      <NavbarContent className="sm:hidden" justify="start">
        <NavbarMenuToggle 
          aria-label={is_menu_open ? "Close menu" : "Open menu"}
          className="text-kawaii-pink"
        />
      </NavbarContent>

      <NavbarContent className="pr-3" justify="center">
        <NavbarBrand>
          <p className="font-bold text-2xl bg-kawaii-gradient bg-clip-text text-transparent animate-glow">
            DOGE Gov Explorer
          </p>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        {menu_items.map((item) => (
          <NavbarItem 
            key={item.href} 
            isActive={pathname === item.href}
            className="relative group"
          >
            <NextUILink 
              color={pathname === item.href ? "primary" : "foreground"} 
              href={item.href}
              className={`w-full transition-colors duration-200 ${
                pathname === item.href 
                  ? 'text-kawaii-pink' 
                  : 'hover:text-kawaii-pink'
              }`}
            >
              {item.name}
              <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-kawaii-pink transition-all duration-200 ${
                pathname === item.href ? 'w-full' : 'group-hover:w-full'
              }`} />
            </NextUILink>
          </NavbarItem>
        ))}
      </NavbarContent>

      {/* <NavbarContent justify="end">
        <NavbarItem>
          <Button 
            as={Link} 
            href="https://doge.gov/about" 
            target="_blank"
            className="bg-kawaii-gradient text-white font-semibold hover:opacity-90 transition-opacity"
            variant="flat"
          >
            About DOGE
          </Button>
        </NavbarItem>
      </NavbarContent> */}

      <NavbarMenu className="bg-background/95 bg-white backdrop-blur-md pt-6">
        {menu_items.map((item) => (
          <NavbarMenuItem key={item.href}>
            <NextUILink
              color={pathname === item.href ? "primary" : "foreground"}
              className={`w-full text-lg ${
                pathname === item.href 
                  ? 'text-kawaii-pink' 
                  : 'hover:text-kawaii-pink'
              }`}
              href={item.href}
              size="lg"
            >
              {item.name}
            </NextUILink>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </NextUINavbar>
  )
} 