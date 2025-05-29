/* eslint-disable @typescript-eslint/no-explicit-any */

/* https://github.com/bvaughn/react-error-boundary/tree/321b4455bc222bdc06a504ae8edb099f58eae152 */

import {
    Component,
    createContext,
    createElement,
    ErrorInfo,
    ComponentType,
    PropsWithChildren,
    ReactNode
} from 'react';

export type ErrorBoundaryContextType = {
    didCatch: boolean;
    error: any;
    resetErrorBoundary: (...args: any[]) => void;
};

export const ErrorBoundaryContext = createContext<ErrorBoundaryContextType | null>(null);

export type FallbackProps = {
    error: any;
    resetErrorBoundary: (...args: any[]) => void;
};

type ErrorBoundarySharedProps = PropsWithChildren<{
    onError?: (error: Error, info: ErrorInfo) => void;
    onReset?: (
        details:
            | { reason: 'imperative-api'; args: any[] }
            | { reason: 'keys'; prev: any[] | undefined; next: any[] | undefined }
    ) => void;
    resetKeys?: any[];
}>;

export type ErrorBoundaryPropsWithComponent = ErrorBoundarySharedProps & {
    fallback?: never;
    FallbackComponent: ComponentType<FallbackProps>;
    fallbackRender?: never;
};

export type ErrorBoundaryPropsWithRender = ErrorBoundarySharedProps & {
    fallback?: never;
    FallbackComponent?: never;
    fallbackRender: (props: FallbackProps) => ReactNode;
};

export type ErrorBoundaryPropsWithFallback = ErrorBoundarySharedProps & {
    fallback: ReactNode;
    FallbackComponent?: never;
    fallbackRender?: never;
};

export type ErrorBoundaryProps =
    | ErrorBoundaryPropsWithFallback
    | ErrorBoundaryPropsWithComponent
    | ErrorBoundaryPropsWithRender;

type ErrorBoundaryState =
    | {
          didCatch: true;
          error: any;
      }
    | {
          didCatch: false;
          error: null;
      };

const initialState: ErrorBoundaryState = {
    didCatch: false,
    error: null
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);

        this.resetErrorBoundary = this.resetErrorBoundary.bind(this);
        this.state = initialState;
    }

    static getDerivedStateFromError(error: Error) {
        return { didCatch: true, error };
    }

    resetErrorBoundary(...args: any[]) {
        const { error } = this.state;

        if (error !== null) {
            this.props.onReset?.({
                args,
                reason: 'imperative-api'
            });

            this.setState(initialState);
        }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        this.props.onError?.(error, info);
    }

    componentDidUpdate(prevProps: ErrorBoundaryProps, prevState: ErrorBoundaryState) {
        const { didCatch } = this.state;
        const { resetKeys } = this.props;

        // There's an edge case where if the thing that triggered the error happens to *also* be in the resetKeys array,
        // we'd end up resetting the error boundary immediately.
        // This would likely trigger a second error to be thrown.
        // So we make sure that we don't check the resetKeys on the first call of cDU after the error is set.

        if (
            didCatch &&
            prevState.error !== null &&
            hasArrayChanged(prevProps.resetKeys, resetKeys)
        ) {
            this.props.onReset?.({
                next: resetKeys,
                prev: prevProps.resetKeys,
                reason: 'keys'
            });

            this.setState(initialState);
        }
    }

    render() {
        const { children, fallbackRender, FallbackComponent, fallback } = this.props;
        const { didCatch, error } = this.state;

        let childToRender = children;

        if (didCatch) {
            const props: FallbackProps = {
                error,
                resetErrorBoundary: this.resetErrorBoundary
            };

            if (typeof fallbackRender === 'function') {
                childToRender = fallbackRender(props);
            } else if (FallbackComponent) {
                childToRender = createElement(FallbackComponent, props);
            } else if (fallback !== undefined) {
                childToRender = fallback;
            } else {
                throw error;
            }
        }

        return createElement(
            ErrorBoundaryContext.Provider,
            {
                value: {
                    didCatch,
                    error,
                    resetErrorBoundary: this.resetErrorBoundary
                }
            },
            childToRender
        );
    }
}

function hasArrayChanged(a: any[] = [], b: any[] = []) {
    return a.length !== b.length || a.some((item, index) => !Object.is(item, b[index]));
}
