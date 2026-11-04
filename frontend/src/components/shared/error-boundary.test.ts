import { describe, it, expect, vi } from "vitest";
import { ErrorBoundary } from "./error-boundary";

describe("ErrorBoundary (T-109)", () => {
  it("initializes state with hasError false and error null", () => {
    const instance = new ErrorBoundary({ children: null });
    expect(instance.state.hasError).toBe(false);
    expect(instance.state.error).toBeNull();
  });

  it("getDerivedStateFromError updates state with hasError true and error instance", () => {
    const error = new Error("Simulasi kendala komponen");
    const nextState = ErrorBoundary.getDerivedStateFromError(error);

    expect(nextState.hasError).toBe(true);
    expect(nextState.error).toBe(error);
  });

  it("handleReset invokes setState and triggers optional onReset callback", () => {
    const onReset = vi.fn();
    const instance = new ErrorBoundary({ children: null, onReset });
    const setStateSpy = vi.fn();
    instance.setState = setStateSpy;

    instance.handleReset();

    expect(setStateSpy).toHaveBeenCalledWith({ hasError: false, error: null });
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("handles reset gracefully when onReset callback is not provided", () => {
    const instance = new ErrorBoundary({ children: null });
    const setStateSpy = vi.fn();
    instance.setState = setStateSpy;

    expect(() => instance.handleReset()).not.toThrow();
    expect(setStateSpy).toHaveBeenCalledWith({ hasError: false, error: null });
  });
});
