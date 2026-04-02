import { useNavigate } from "react-router-dom";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/main.jpg')" }}
      />
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/30 to-white/60" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <span className="text-xl sm:text-2xl font-bold" style={{ color: "#1E2A4A" }}>
              WarehouseMe
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              className="rounded-full border-primary/30 text-primary hover:bg-primary/5 font-medium px-4 sm:px-6"
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
            <Button
              className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 font-medium px-4 sm:px-6 shadow-md"
              onClick={() => navigate("/auth")}
            >
              Get Started
            </Button>
          </div>
        </header>

        {/* Hero text */}
        <div className="flex-1 flex items-start justify-center px-4 pt-4 sm:pt-8 md:pt-12">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center leading-tight max-w-3xl"
            style={{ color: "#1E2A4A" }}
          >
            Everything at home — under control
          </h1>
        </div>
      </div>
    </div>
  );
};

export default Index;
