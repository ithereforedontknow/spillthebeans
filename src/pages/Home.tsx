import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Wifi, Zap, Volume2, Monitor } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSpots } from "@/hooks/useSpots";
import { useSpotReviews } from "@/hooks/useReviews";
import { SpotCard } from "@/components/spot/SpotCard";
import { PageSpinner } from "@/components/ui/Spinner";
import { computeSpotStats } from "@/lib/utils";
import type { DbSpot } from "@/types";

// Fetch all reviews for homepage spots in one shot
function useAllSpotReviews(spotIds: string[]) {
  // We load per-spot; this is fine since React Query caches each
  return spotIds;
}

export function Home() {
  const { user, profile } = useAuth();
  const { data: spots = [], isLoading } = useSpots();

  // For homepage we do a single pass — load top 8 spots and show cards
  // Individual review counts come from the SpotCard itself
  // We hydrate stats via a bulk fetch below

  const topSpots = useMemo(() => spots.slice(0, 8), [spots]);

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      {user ? (
        <WorkerHero
          name={profile?.username ?? user.email?.split("@")[0] ?? "there"}
        />
      ) : (
        <LandingHero />
      )}
      <FeaturesStrip />
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <SectionHeader
          title="Work spots in Baguio"
          sub={`${spots.length} listed`}
          href="/spots"
        />
        {topSpots.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {topSpots.map((spot, i) => (
              <div
                key={spot.id}
                className={`animate-fade-up s${Math.min(i + 1, 6)}`}
              >
                <SpotCardHydrated spot={spot} />
              </div>
            ))}
          </div>
        ) : (
          <p className="font-mono text-sm text-dim py-12 text-center">
            No spots listed yet.
          </p>
        )}
        {spots.length > 8 && (
          <div className="mt-8 text-center">
            <Link to="/spots" className="btn-secondary">
              View all {spots.length} spots <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </section>
      {!user && <JoinBanner />}
    </div>
  );
}

// Hydrates a card's reviews inline
function SpotCardHydrated({ spot }: { spot: DbSpot }) {
  const { data: reviews = [] } = useSpotReviews(spot.id);
  return <SpotCard spot={spot} reviews={reviews} />;
}

function LandingHero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#c8c3b8 1px, transparent 1px), linear-gradient(90deg, #c8c3b8 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Amber glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber/5 rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-28 md:py-36">
        <div className="max-w-3xl">
          <p className="font-mono text-2xs text-amber uppercase tracking-widest mb-5">
            Baguio City, Philippines / est. 2026
          </p>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl text-head leading-[1.05] mb-6">
            Find your next
            <br />
            <em className="not-italic text-amber">work spot.</em>
          </h1>
          <p className="text-lg text-dim leading-relaxed mb-10 max-w-xl">
            Cafes rated by remote workers on WiFi speed, power outlets, noise
            level, and more. Not vibes — data.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/spots" className="btn-primary px-6 py-2.5 text-base">
              Browse spots <ArrowRight size={15} />
            </Link>
            <Link to="/login" className="btn-secondary px-6 py-2.5">
              Add a review
            </Link>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-20 pt-8 border-t border-border grid grid-cols-3 gap-8 max-w-sm">
          {[
            ["6", "Work metrics"],
            ["0", "Paid listings"],
            ["100%", "Community rated"],
          ].map(([v, l]) => (
            <div key={l}>
              <div className="font-mono text-2xl font-semibold text-amber">
                {v}
              </div>
              <div className="font-mono text-2xs text-dim mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkerHero({ name }: { name: string }) {
  return (
    <section className="border-b border-border bg-raised">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 flex items-center justify-between gap-6 flex-wrap">
        <div>
          <p className="font-mono text-2xs text-amber uppercase tracking-widest mb-2">
            Welcome back
          </p>
          <h1 className="font-display text-3xl text-head">
            Good to see you, {name}.
          </h1>
          <p className="text-sm text-dim mt-1">
            Where are you working from today?
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/review/new" className="btn-primary">
            + Write a review
          </Link>
          <Link to="/spots" className="btn-secondary">
            Browse spots
          </Link>
        </div>
      </div>
    </section>
  );
}

function FeaturesStrip() {
  const items = [
    {
      icon: Wifi,
      label: "WiFi Speed",
      desc: "Rated for video calls and uploads",
    },
    { icon: Zap, label: "Power Outlets", desc: "Per seat availability" },
    { icon: Volume2, label: "Noise Level", desc: "Focus-friendliness score" },
    {
      icon: Monitor,
      label: "Laptop Setup",
      desc: "Glare, desk depth, ergonomics",
    },
  ];
  return (
    <div className="border-b border-border bg-raised">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
        {items.map(({ icon: Icon, label, desc }) => (
          <div key={label} className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-subtle border border-amber/20 rounded flex items-center justify-center shrink-0">
              <Icon size={15} className="text-amber" />
            </div>
            <div>
              <p className="text-sm font-medium text-head">{label}</p>
              <p className="text-xs text-dim">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  sub,
  href,
}: {
  title: string;
  sub: string;
  href: string;
}) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 className="font-display text-2xl text-head">{title}</h2>
        <p className="font-mono text-2xs text-dim mt-0.5">{sub}</p>
      </div>
      <Link to={href} className="btn-ghost btn-sm font-mono">
        View all <ArrowRight size={13} />
      </Link>
    </div>
  );
}

function JoinBanner() {
  return (
    <section className="border-t border-border bg-raised">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="font-mono text-2xs text-amber uppercase tracking-widest mb-4">
          Community-powered
        </p>
        <h2 className="font-display text-4xl text-head mb-4">
          You know a good spot.
        </h2>
        <p className="text-dim text-lg mb-8">
          Rate a cafe. Help the next nomad find their focus zone.
        </p>
        <Link to="/login" className="btn-primary px-8 py-3 text-base">
          Join for free <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
