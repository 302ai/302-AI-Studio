import { cn } from '@renderer/lib/utils'
import { useEffect, useRef, useState } from 'react'

export function MarkdownMathWrapper({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [, setLatex] = useState('')
  const [isDisplay, setIsDisplay] = useState(false)

  useEffect(() => {
    if (ref.current) {
      const annotation = ref.current.querySelector('.katex-mathml annotation')
      if (annotation) {
        setLatex(annotation.textContent || '')
      }

      setIsDisplay(!!ref.current.closest('.katex-display'))
    }
  }, [])

  return (
    <span ref={ref} className={cn('group/math relative', isDisplay ? 'block' : 'inline-block')}>
      {children}
    </span>
  )
}
