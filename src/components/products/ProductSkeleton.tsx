export default function ProductSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white" aria-hidden>
      <div className="skeleton aspect-[4/3] w-full" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="skeleton h-4 w-4/5 rounded-full" />
        <div className="skeleton h-3 w-1/3 rounded-full" />
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="skeleton h-6 w-20 rounded-full" />
          <div className="skeleton h-8 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}
