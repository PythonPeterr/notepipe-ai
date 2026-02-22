"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-11 w-11 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mb-4">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-sm font-semibold text-neutral-800">
            Something went wrong
          </p>
          <p className="text-sm text-neutral-400 mt-1 max-w-xs">
            An unexpected error occurred. Try refreshing the page.
          </p>
          <Button
            className="mt-5 h-8 text-xs bg-black text-white hover:bg-neutral-800"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
