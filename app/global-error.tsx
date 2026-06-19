"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <section className="container mx-auto px-6 py-20">
      <div className="max-w-xl mx-auto">
        <div className="card bg-base-100 shadow-lg border border-base-200">
          <div className="card-body items-center text-center">
            <div className="text-6xl">⚽</div>

            <h1 className="text-3xl font-bold">
              Something went wrong
            </h1>

            <p className="text-base-content/70 max-w-md">
              We had a problem loading this page. Please try again.
            </p>

            {error.message && (
              <p className="text-error/70 text-sm mt-2">
                {error.message}
              </p>
            )}

            <button
              onClick={() => reset()}
              className="btn btn-primary mt-4"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}