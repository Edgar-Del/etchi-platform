import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'light' | 'dark'
}

export function Logo({ className, size = 'md', variant = 'light' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  }

  const bgColor = variant === 'dark' ? 'bg-background' : 'bg-transparent'
  const textColor = variant === 'dark' ? 'text-white' : 'text-foreground'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Logo Graphic - Three curved diagonal lines (stylized E) */}
      <div className={cn('relative', sizeClasses[size])}>
        {/* Top line - shortest, angled up */}
        <div className="absolute top-0 left-0 h-1.5 w-8 bg-primary rounded-full transform rotate-12 origin-left"></div>
        {/* Middle line - medium, slightly curved */}
        <div className="absolute top-2 left-0 h-2 w-10 bg-primary rounded-full transform rotate-6 origin-left"></div>
        {/* Bottom line - longest, more curved */}
        <div className="absolute top-4 left-0 h-2.5 w-12 bg-primary rounded-full transform -rotate-6 origin-left"></div>
      </div>
      
      {/* Logo Text */}
      <span className={cn(
        'font-bold tracking-tight',
        textSizes[size]
      )}>
        <span className={textColor}>et</span>
        <span className="text-primary">CHI</span>
      </span>
    </div>
  )
}

