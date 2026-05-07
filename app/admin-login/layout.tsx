export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4">
      <div className="mb-8 flex items-center gap-2">
        <span className="text-3xl font-bold text-primary">Lunara</span>
        <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
          Admin
        </span>
      </div>
      {children}
    </div>
  )
}
