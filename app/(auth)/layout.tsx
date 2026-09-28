export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 bg-base-100 font-sans">
      <div className="card w-full max-w-md bg-base-200 border border-base-content/10 shadow-2xl rounded-2xl">
        <div className="card-body p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}