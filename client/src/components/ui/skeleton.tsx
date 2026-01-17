import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-md bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100",
        "border-0 outline-none ring-0 focus:ring-0 focus:outline-none",
        className
      )}
      style={{
        backgroundSize: '200% 100%',
      }}
      {...props}
    />
  )
}

export { Skeleton }
