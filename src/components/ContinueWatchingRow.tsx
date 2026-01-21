import { Clock } from "lucide-react";
import ContinueWatchingCard from "./ContinueWatchingCard";
import { useContinueWatching } from "@/hooks/useContinueWatching";

const ContinueWatchingRow = () => {
  const { continueWatching, loading } = useContinueWatching();

  if (loading || continueWatching.length === 0) return null;

  return (
    <section className="py-4">
      <div className="flex items-center gap-2 mb-3 px-4">
        <Clock className="w-5 h-5 text-primary" />
        <h2 className="text-lg md:text-xl font-bold text-foreground">Continue Watching</h2>
      </div>
      
      <div className="content-row px-4">
        {continueWatching.slice(0, 10).map((item, index) => (
          <ContinueWatchingCard key={item.movieId} item={item} index={index} />
        ))}
      </div>
    </section>
  );
};

export default ContinueWatchingRow;
