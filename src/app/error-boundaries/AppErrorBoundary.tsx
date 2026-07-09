import { Component, type ErrorInfo, type ReactNode } from 'react';

type AppErrorBoundaryProps = {
  readonly children: ReactNode;
};

type AppErrorBoundaryState = {
  readonly error: Error | undefined;
};

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  override state: AppErrorBoundaryState = { error: undefined };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled application error', error, info.componentStack);
  }

  override render() {
    if (this.state.error === undefined) {
      return this.props.children;
    }

    return (
      <main className="app-shell" role="alert" aria-labelledby="app-error-title">
        <section className="panel">
          <p className="eyebrow">Recovery</p>
          <h1 id="app-error-title">Something went wrong</h1>
          <p className="lede-small">
            The app hit an unexpected local error. Your audio files were not uploaded. Reload the
            page, re-import the files, and retry the queue.
          </p>
          <p>
            Error: <code>{this.state.error.message}</code>
          </p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload app
          </button>
        </section>
      </main>
    );
  }
}
