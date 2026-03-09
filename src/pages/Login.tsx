import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PageSpinner } from "@/components/ui/Spinner";

export function Login() {
  const { user, loading, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/");
  }, [loading, user, navigate]);
  if (loading) return <PageSpinner />;

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — dark branding panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 border-r border-border bg-raised relative overflow-hidden">
        {/* Grid bg */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#c8c3b8 1px, transparent 1px), linear-gradient(90deg, #c8c3b8 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber/5 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-amber rounded-sm flex items-center justify-center">
              <svg viewBox="0 0 16 16" width="12" fill="none">
                <rect x="3" y="2" width="6" height="12" rx="1" fill="#0c0b09" />
                <rect
                  x="10"
                  y="5"
                  width="3"
                  height="1.5"
                  rx="0.5"
                  fill="#0c0b09"
                />
                <path
                  d="M10 6.5 Q13 7 13 9 Q13 10.5 11 10.5 L10 10.5"
                  fill="none"
                  stroke="#0c0b09"
                  strokeWidth="1.2"
                />
              </svg>
            </div>
            <span className="font-display text-head font-semibold">
              NomadCafe
            </span>
          </div>
        </div>

        <div className="relative">
          <p className="font-mono text-2xs text-amber uppercase tracking-widest mb-4">
            For the plugged-in and caffeinated
          </p>
          <h2 className="font-display text-5xl text-head leading-[1.1] mb-6">
            The cafe guide
            <br />
            built for
            <br />
            <em className="not-italic text-amber">deep work.</em>
          </h2>
          <p className="text-dim leading-relaxed max-w-xs">
            WiFi speeds, power access, noise levels. Rated by remote workers who
            actually worked there.
          </p>

          <div className="grid grid-cols-3 gap-4 mt-10 pt-8 border-t border-border">
            {[
              ["6", "Work metrics per spot"],
              ["0", "Paid placements"],
              ["Baguio", "Starting here"],
            ].map(([v, l]) => (
              <div key={l}>
                <div className="font-mono font-semibold text-amber text-lg">
                  {v}
                </div>
                <div className="font-mono text-2xs text-dim mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="font-mono text-2xs text-dim/40 relative">
          Baguio City, Philippines
        </p>
      </div>

      {/* Right — sign in */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-6 h-6 bg-amber rounded-sm flex items-center justify-center">
              <svg viewBox="0 0 16 16" width="11" fill="none">
                <rect x="3" y="2" width="6" height="12" rx="1" fill="#0c0b09" />
                <path
                  d="M10 6.5 Q13 7 13 9 Q13 10.5 11 10.5 L10 10.5"
                  fill="none"
                  stroke="#0c0b09"
                  strokeWidth="1.2"
                />
              </svg>
            </div>
            <span className="font-display text-head">NomadCafe</span>
          </div>

          <h1 className="font-display text-3xl text-head mb-2">Sign in</h1>
          <p className="text-sm text-dim mb-8">
            Rate spots, save your favorites, and help other nomads find their
            next work base.
          </p>

          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded border border-border hover:border-muted bg-card hover:bg-raised transition-all duration-150 text-sm font-medium text-body"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="text-xs text-dim/60 mt-6 text-center">
            By signing in you agree to our{" "}
            <Link
              to="/terms"
              className="text-dim hover:text-body transition-colors"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              className="text-dim hover:text-body transition-colors"
            >
              Privacy Policy
            </Link>
            .
          </p>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <Link
              to="/spots"
              className="font-mono text-xs text-dim hover:text-body transition-colors"
            >
              Browse without an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
