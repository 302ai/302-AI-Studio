import { useCallback, useRef, useState } from "react"
import { useTranslation } from 'react-i18next'
import { toast } from "sonner"

interface UseCopyToClipboardProps {
  text: string
}

export function useCopyToClipboard({
  text
}: UseCopyToClipboardProps) {
  const { t } = useTranslation('translation', {
    keyPrefix: 'common',
  })
  const [isCopied, setIsCopied] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleCopy = useCallback(() => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success(t('copied-success'))
        setIsCopied(true)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        timeoutRef.current = setTimeout(() => {
          setIsCopied(false)
        }, 2000)
      })
      .catch(() => {
        toast.error(t('copied-failed'))
      })
  }, [text, t])

  return { isCopied, handleCopy }
}
