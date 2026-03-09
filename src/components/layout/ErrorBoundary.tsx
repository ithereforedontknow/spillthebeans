import { Component } from "react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console in dev — swap for Sentry/LogRocket in production
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f2f4ef",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: "440px",
            textAlign: "center",
            background: "#dfe5d8",
            border: "1px solid #c8d4be",
            borderRadius: "8px",
            padding: "40px 32px",
          }}
        >
          <p
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "10px",
              color: "#4a7c3f",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "10px",
            }}
          >
            Unexpected error
          </p>
          <h2
            style={{
              fontFamily: "Fraunces, serif",
              fontSize: "26px",
              color: "#1a2314",
              marginBottom: "12px",
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "#3d4a35",
              marginBottom: "24px",
              lineHeight: "1.6",
            }}
          >
            The app hit an unexpected error. Try refreshing the page — if it
            keeps happening, the issue will resolve on its own shortly.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.href = "/";
            }}
            style={{
              background: "#4a7c3f",
              color: "#f2f4ef",
              border: "none",
              borderRadius: "3px",
              padding: "8px 20px",
              fontFamily: "Geist, sans-serif",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Go home
          </button>
        </div>
      </div>
    );
  }
}
