import { describe, it, expect, vi } from "vitest";
import { handlePosKeyDown } from "./use-pos-shortcuts.js";

function createMockEvent(key: string, target?: Record<string, unknown>): KeyboardEvent {
  const event = {
    key,
    target: target ?? { tagName: "DIV" },
    preventDefault: vi.fn(),
  } as unknown as KeyboardEvent;
  return event;
}

describe("handlePosKeyDown", () => {
  it("should focus search on F1 key press and prevent default", () => {
    const onSearchFocus = vi.fn();
    const event = createMockEvent("F1");

    handlePosKeyDown(event, { onSearchFocus, isModalOpen: false });

    expect(onSearchFocus).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("should focus search on slash (/) key press when outside input", () => {
    const onSearchFocus = vi.fn();
    const event = createMockEvent("/");

    handlePosKeyDown(event, { onSearchFocus, isModalOpen: false });

    expect(onSearchFocus).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("should not trigger search shortcut when typing slash inside an input", () => {
    const onSearchFocus = vi.fn();
    const inputElement = { tagName: "INPUT" };
    const event = createMockEvent("/", inputElement);

    handlePosKeyDown(event, { onSearchFocus, isModalOpen: false });

    expect(onSearchFocus).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("should open checkout on F2 when cart has items", () => {
    const onOpenCheckout = vi.fn();
    const event = createMockEvent("F2");

    handlePosKeyDown(event, {
      onOpenCheckout,
      hasCartItems: true,
      isModalOpen: false,
    });

    expect(onOpenCheckout).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("should not open checkout on F2 when cart is empty", () => {
    const onOpenCheckout = vi.fn();
    const event = createMockEvent("F2");

    handlePosKeyDown(event, {
      onOpenCheckout,
      hasCartItems: false,
      isModalOpen: false,
    });

    expect(onOpenCheckout).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("should clear cart on F4 when cart has items", () => {
    const onClearCart = vi.fn();
    const event = createMockEvent("F4");

    handlePosKeyDown(event, {
      onClearCart,
      hasCartItems: true,
      isModalOpen: false,
    });

    expect(onClearCart).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("should not clear cart on F4 when cart is empty", () => {
    const onClearCart = vi.fn();
    const event = createMockEvent("F4");

    handlePosKeyDown(event, {
      onClearCart,
      hasCartItems: false,
      isModalOpen: false,
    });

    expect(onClearCart).not.toHaveBeenCalled();
  });

  it("should close modals on Escape when a modal is open", () => {
    const onCloseModals = vi.fn();
    const event = createMockEvent("Escape");

    handlePosKeyDown(event, {
      onCloseModals,
      isModalOpen: true,
    });

    expect(onCloseModals).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("should blur active input on Escape", () => {
    const blur = vi.fn();
    const inputElement = { tagName: "INPUT", blur };
    const event = createMockEvent("Escape", inputElement);

    handlePosKeyDown(event, {
      isModalOpen: false,
    });

    expect(blur).toHaveBeenCalledTimes(1);
  });

  it("should ignore shortcuts when enabled is false", () => {
    const onSearchFocus = vi.fn();
    const event = createMockEvent("F1");

    handlePosKeyDown(event, {
      onSearchFocus,
      enabled: false,
    });

    expect(onSearchFocus).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("should not trigger F1 or F2 or F4 when modal is open", () => {
    const onSearchFocus = vi.fn();
    const onOpenCheckout = vi.fn();
    const onClearCart = vi.fn();

    handlePosKeyDown(createMockEvent("F1"), {
      onSearchFocus,
      isModalOpen: true,
    });
    handlePosKeyDown(createMockEvent("F2"), {
      onOpenCheckout,
      hasCartItems: true,
      isModalOpen: true,
    });
    handlePosKeyDown(createMockEvent("F4"), {
      onClearCart,
      hasCartItems: true,
      isModalOpen: true,
    });

    expect(onSearchFocus).not.toHaveBeenCalled();
    expect(onOpenCheckout).not.toHaveBeenCalled();
    expect(onClearCart).not.toHaveBeenCalled();
  });
});
