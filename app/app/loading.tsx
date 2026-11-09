import { DashboardSkeleton } from "./components/DashboardSkeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <DashboardSkeleton />
    </main>
  );
}
