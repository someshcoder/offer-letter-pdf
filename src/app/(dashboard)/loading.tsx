export default function DashboardLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-8">
      <div
        className="size-7 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent"
        aria-label="Loading page"
      />
    </div>
  );
}
