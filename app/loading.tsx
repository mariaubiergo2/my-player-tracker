export default function Loading() {
  return (
    <section className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <span className="loading loading-spinner loading-lg text-primary"></span>
      <p className="text-base-content/60">Loading...</p>
    </section>
  )
}