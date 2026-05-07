import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-6xl font-bold text-gray-200">404</h1>
      <p className="text-lg text-gray-500">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link
        href="/"
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
      >
        Go home
      </Link>
    </div>
  )
}
