import { useEffect, useState } from "react"

export function useMediaQuery(query: string) {
  const [value, setValue] = useState(false)

  useEffect(() => {
    const result = matchMedia(query)
    
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches)
    }

    result.addEventListener("change", onChange)
    setValue(result.matches)

    return () => result.removeEventListener("change", onChange)
  }, [query])

  return value
}
