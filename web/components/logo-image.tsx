'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface LogoImageProps {
  variant?: 'light' | 'dark' | 'color'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showText?: boolean
}

const sizeMap = {
  sm: { width: 32, height: 32, text: 'text-sm' },
  md: { width: 48, height: 48, text: 'text-lg' },
  lg: { width: 64, height: 64, text: 'text-xl' },
  xl: { width: 96, height: 96, text: 'text-2xl' },
}

export function LogoImage({
  variant = 'color',
  size = 'md',
  className,
  showText = true,
}: LogoImageProps) {
  const [isLoading, setIsLoading] = useState(true)

  const getImageSrc = () => {
    switch (variant) {
      case 'dark':
        return '/assets/logos/etchi_white_noBG.png'
      case 'light':
        return '/assets/logos/etchi_logo_noBG.png'
      case 'color':
      default:
        return '/assets/logos/etchi_logo_noBG.png'
    }
  }

  const dimensions = sizeMap[size]

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative flex-shrink-0">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse rounded-lg">
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <Image
          src={getImageSrc()}
          alt="Etchi Logo"
          width={dimensions.width}
          height={dimensions.height}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          priority
          onLoad={() => setIsLoading(false)}
        />
      </div>
      {showText && (
        <span
          className={cn(
            'font-bold tracking-tight',
            dimensions.text,
            variant === 'dark' ? 'text-white' : 'text-foreground'
          )}
        >
          <span className={variant === 'dark' ? 'text-white' : 'text-foreground'}>
            et
          </span>
          <span className="text-primary">CHI</span>
        </span>
      )}
    </div>
  )
}


