import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/core/Button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Unhandled application error", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper-100)", padding: 24 }}>
          <div style={{ maxWidth: 480, width: "100%", padding: 28, borderRadius: "var(--radius-xl)", background: "var(--paper-50)", border: "1px solid var(--line-300)", boxShadow: "var(--shadow-lg)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", display: "grid", placeItems: "center", background: "var(--danger-100)", color: "var(--danger-600)" }}>
                <AlertTriangle size={20} strokeWidth={1.9} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 22, color: "var(--ink-900)" }}>Something went wrong</h2>
                <p style={{ margin: "4px 0 0", color: "var(--slate-600)", fontSize: 14 }}>The app hit an unexpected error. Please refresh to recover.</p>
              </div>
            </div>
            <Button variant="gold" block onClick={this.handleReset} iconLeft={<RotateCcw size={16} strokeWidth={1.9} />}>
              Reload app
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
