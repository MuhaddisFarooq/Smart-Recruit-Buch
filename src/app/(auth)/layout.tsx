
import React from 'react'

export default function Page({children}: {children: React.ReactNode}) {

  return (
    <main className="min-h-screen w-full flex">
      {/* Image Section - 70% width */}
      <div className="w-[70%] relative hidden lg:block">
        <img 
          src="/images/buch-bg-cover.png" 
          alt="Login background" 
          className="h-full w-full object-cover  pointer-events-none"
        />
      </div>

    {children}
    </main>
  )
}