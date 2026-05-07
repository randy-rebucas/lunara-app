export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4">
      <div className="mb-8 flex items-center gap-2">
        <span className="text-3xl font-bold text-primary">Lunara</span>
      </div>
      {children}
    </div>
  )
}
