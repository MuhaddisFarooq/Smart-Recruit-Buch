import FeedCard from "@/components/dashboard/FeedCard";
import AtAGlanceCard from "@/components/dashboard/AtAGlanceCard";


export default function DashboardPage() {
  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-4">
      {/* Right Column - Sidebar Cards (shown first on mobile) */}
      <div className="lg:hidden space-y-4">
        <AtAGlanceCard />
      </div>

      {/* Left Column - Activity Feed */}
      <div className="order-2 lg:order-1">
        <FeedCard />
      </div>

      {/* Right Column - Sidebar Cards (desktop) */}
      <div className="hidden lg:block lg:order-2 space-y-4">
        <AtAGlanceCard />
      </div>


    </div>
  );
}
