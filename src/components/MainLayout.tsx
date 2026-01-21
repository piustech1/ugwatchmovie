import { ReactNode } from "react";
import TopNav from "@/components/TopNav";
import BottomNav from "@/components/BottomNav";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: ReactNode;
  showTopNav?: boolean;
}

const MainLayout = ({ 
  children, 
  showTopNav = true
}: MainLayoutProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen bg-background">
      {showTopNav && <TopNav />}
      <main className={isMobile ? "pb-24" : "pb-8"}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default MainLayout;
