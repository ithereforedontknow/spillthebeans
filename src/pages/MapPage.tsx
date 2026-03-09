import { useMemo } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useSpots } from "@/hooks/useSpots";
import { useSpotReviews } from "@/hooks/useReviews";
import { PageSpinner } from "@/components/ui/Spinner";
import { computeSpotStats, scoreLabel } from "@/lib/utils";
import { ScoreBar } from "@/components/ui/ScoreBar";
import type { DbSpot } from "@/types";

const BAGUIO: [number, number] = [16.4023, 120.596];

const makeIcon = (score: number) => {
  const color = score >= 4 ? "#f0a500" : score >= 3 ? "#7a7268" : "#332f29";
  return L.divIcon({
    className: "",
    html: `<div style="width:20px;height:20px;background:${color};border-radius:50%;border:2px solid #0c0b09;box-shadow:0 0 0 1.5px ${color}40;"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -14],
  });
};

function SpotMarker({ spot }: { spot: DbSpot }) {
  const { data: reviews = [] } = useSpotReviews(spot.id);
  const stats = computeSpotStats(reviews);
  const icon = makeIcon(stats.avg_score);

  return (
    <Marker position={[spot.lat!, spot.lng!]} icon={icon}>
      <Popup>
        <div className="min-w-[180px] font-sans" style={{ color: "#c8c3b8" }}>
          <p
            style={{
              fontFamily: "Fraunces, Georgia, serif",
              fontSize: "15px",
              color: "#edeae3",
              marginBottom: "4px",
            }}
          >
            {spot.name}
          </p>
          <p
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "10px",
              color: "#7a7268",
              marginBottom: "8px",
            }}
          >
            {spot.city}
          </p>
          {stats.review_count > 0 && (
            <div style={{ marginBottom: "8px" }}>
              <span
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#f0a500",
                }}
              >
                {stats.avg_score.toFixed(1)}
              </span>
              <span
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "10px",
                  color: "#7a7268",
                }}
              >
                {" "}
                /5 — {scoreLabel(stats.avg_score)}
              </span>
            </div>
          )}
          <p
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "10px",
              color: "#7a7268",
              marginBottom: "10px",
            }}
          >
            {stats.review_count}{" "}
            {stats.review_count === 1 ? "review" : "reviews"}
          </p>
          <a
            href={`/spot/${spot.id}`}
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "11px",
              color: "#f0a500",
              textDecoration: "none",
            }}
          >
            View spot →
          </a>
        </div>
      </Popup>
    </Marker>
  );
}

export function MapPage() {
  const { data: spots = [], isLoading } = useSpots();
  const mapped = useMemo(() => spots.filter((s) => s.lat && s.lng), [spots]);

  if (isLoading) return <PageSpinner />;

  return (
    <div className="h-[calc(100dvh-3.5rem)] flex flex-col">
      {/* Toolbar */}
      <div className="border-b border-border bg-raised px-4 sm:px-6 h-12 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-lg text-head">Map</h1>
          <span className="font-mono text-2xs text-dim">
            {mapped.length} spots with coordinates
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 font-mono text-2xs text-dim">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber" />
              Score 4+
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-dim" />
              Score 3+
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-muted" />
              Below 3
            </span>
          </div>
          <Link to="/spots" className="btn-secondary btn-sm font-mono">
            List view
          </Link>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        {mapped.length > 0 ? (
          <MapContainer
            center={BAGUIO}
            zoom={14}
            style={{ height: "100%", width: "100%" }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mapped.map((spot) => (
              <SpotMarker key={spot.id} spot={spot} />
            ))}
          </MapContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-dim">
            <p className="font-display text-xl text-head mb-2">
              No coordinates yet.
            </p>
            <p className="font-mono text-xs">
              Add lat/lng to spots via the Admin panel.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
