import React, { useState, useEffect } from 'react'

export const PageHeader: React.FC = () => {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={[
        'bg-white border border-black/[0.04] sticky top-0 z-[1000] transition-[background-color,box-shadow] duration-[400ms] ease-[cubic-bezier(0.2,0,0.2,1)]',
        scrolled
          ? 'bg-white/85 backdrop-blur-[12px] [-webkit-backdrop-filter:blur(12px)] border-b border-black/5 shadow-[0_4px_12px_rgba(0,0,0,0.03)]'
          : '',
      ].join(' ')}
    >
      <div className="flex items-center min-h-16 md:h-[72px] container-fluid">
        <a href="/" className="flex items-center flex-shrink-0">
          <img
            src="/images/logo1-blue.svg"
            alt="GALLOPICS"
            className="h-6 min-[480px]:h-7 w-auto block"
          />
        </a>
      </div>
    </header>
  )
}
