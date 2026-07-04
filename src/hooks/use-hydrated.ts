import { useEffect, useState } from 'react'

// False on the server AND on the first client render, true after mount.
// Gate client-only (localStorage) UI on this so server and first client
// render agree, avoiding hydration mismatches.
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  return hydrated
}
