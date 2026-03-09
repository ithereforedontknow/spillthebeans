import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <p className="font-display text-head text-lg mb-2">SpillTheBeans</p>
            <p className="text-sm text-dim leading-relaxed">
              Cafes rated by remote workers, for remote workers. Starting in
              Baguio, Philippines.
            </p>
          </div>
          <div>
            <p className="font-mono text-2xs uppercase tracking-widest text-dim mb-3">
              Explore
            </p>
            <ul className="space-y-2 text-sm text-dim">
              {[
                ["Browse Spots", "/spots"],
                ["Map View", "/map"],
                ["Write a Review", "/review/new"],
              ].map(([l, t]) => (
                <li key={t}>
                  <Link to={t} className="hover:text-body transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-mono text-2xs uppercase tracking-widest text-dim mb-3">
              Info
            </p>
            <ul className="space-y-2 text-sm text-dim">
              {[
                ["About", "/about"],
                ["Privacy", "/privacy"],
                ["Terms", "/terms"],
              ].map(([l, t]) => (
                <li key={t}>
                  <Link to={t} className="hover:text-body transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-mono text-2xs uppercase tracking-widest text-dim mb-3">
              Coverage
            </p>
            <p className="text-sm text-dim">Baguio City, Philippines</p>
            <p className="text-xs text-dim/60 mt-1">Expanding nationally</p>
          </div>
        </div>
        <div className="divider pt-6 flex flex-col sm:flex-row justify-between gap-2">
          <p className="font-mono text-2xs text-dim/60">
            {new Date().getFullYear()} SpillTheBeans. No ads. No sponsored
            spots.
          </p>
          <p className="font-mono text-2xs text-dim/60">
            Built for the plugged-in and caffeinated.
          </p>
        </div>
      </div>
    </footer>
  );
}
