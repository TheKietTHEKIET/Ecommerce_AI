import { ClerkProvider } from '@clerk/nextjs'
import React from 'react'

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
        <main>{children}</main>
    </ClerkProvider>
   
  )
}

export default Layout