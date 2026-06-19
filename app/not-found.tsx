import Link from "next/link"

export default function NotFound() {
  return (
    <section className="container mx-auto px-6 py-20">
      <div className="max-w-xl mx-auto">
        <div className="card bg-base-100 shadow-lg border border-base-200">
          <div className="card-body items-center text-center">
            <div className="text-6xl">⚽</div>

            <h1 className="text-3xl font-bold mt-2">
              Page not found
            </h1>

            <p className="text-base-content/70 max-w-md">
              We couldn't find the page you're looking for.
              It may have been moved, deleted, or the link may be incorrect.
            </p>

            <div className="mt-4">
              <Link href="/" className="btn btn-primary">
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}