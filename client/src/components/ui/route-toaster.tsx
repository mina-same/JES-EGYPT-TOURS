"use client"

import { useEffect, useRef } from "react"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"

/**
 * The toast region for the visitor routes that raise toasts (Contact and
 * Special Offers), mounted by those routes instead of the [locale] layout.
 *
 * In the layout it put the Radix Toast code into the JavaScript every visitor
 * page downloads, although no other visitor route ever calls toast(). The
 * routes render it after their page content, where the layout's copy sat, so
 * the fixed viewport keeps its place in the stacking order.
 *
 * Toasts live in a module-level store (hooks/use-toast) that outlives this
 * component. Leaving the route while a toast is showing unmounts the Toaster
 * and Radix's auto-dismiss timer with it, so the toast would stay open in the
 * store and reappear the next time a route mounts a Toaster. The layout's copy
 * never unmounted, so this never came up before. Dismissing on unmount closes
 * the toast as the timer would have.
 */
export function RouteToaster() {
  const { dismiss } = useToast()
  // useToast returns a new dismiss on every render; the ref keeps the cleanup
  // below from running, and closing every toast, on each re-render.
  const dismissRef = useRef(dismiss)
  dismissRef.current = dismiss

  useEffect(() => () => dismissRef.current(), [])

  return <Toaster />
}
