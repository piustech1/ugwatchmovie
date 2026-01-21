const SkeletonCard = () => {
  return (
    <div className="flex-shrink-0 w-32 md:w-40 lg:w-44">
      <div className="aspect-[2/3] rounded-lg shimmer" />
      <div className="mt-2 space-y-2">
        <div className="h-4 w-3/4 rounded shimmer" />
        <div className="h-3 w-1/2 rounded shimmer" />
      </div>
    </div>
  );
};

const SkeletonRow = () => {
  return (
    <section className="py-4">
      <div className="flex items-center justify-between mb-3 px-4">
        <div className="h-6 w-32 rounded shimmer" />
      </div>
      <div className="content-row px-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </section>
  );
};

const SkeletonHero = () => {
  return (
    <div className="relative h-[70vh] md:h-[80vh] shimmer">
      <div className="absolute inset-0 gradient-overlay" />
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 space-y-4">
        <div className="h-10 w-64 rounded shimmer" />
        <div className="h-4 w-48 rounded shimmer" />
        <div className="h-16 w-full max-w-xl rounded shimmer" />
        <div className="flex gap-3">
          <div className="h-12 w-32 rounded-lg shimmer" />
          <div className="h-12 w-32 rounded-lg shimmer" />
        </div>
      </div>
    </div>
  );
};

export { SkeletonCard, SkeletonRow, SkeletonHero };
