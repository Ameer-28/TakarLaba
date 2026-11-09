import { useEffect, useCallback } from "react";

export interface PosShortcutsOptions {
  onSearchFocus?: () => void;
  onOpenCheckout?: () => void;
  onClearCart?: () => void;
  onCloseModals?: () => void;
  isModalOpen?: boolean;
  hasCartItems?: boolean;
  enabled?: boolean;
}

/**
 * Checks whether the event target is an interactive text input element.
 */
function isInputElement(target: unknown): boolean {
  if (!target || typeof target !== "object") return false;
  const tagName = (target as { tagName?: string }).tagName?.toUpperCase();
  const isContentEditable = Boolean((target as { isContentEditable?: boolean }).isContentEditable);
  return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT" || isContentEditable;
}

function hasBlurMethod(target: unknown): target is { blur: () => void } {
  return (
    typeof target === "object" &&
    target !== null &&
    "blur" in target &&
    typeof (target as Record<string, unknown>)["blur"] === "function"
  );
}

/**
 * Pure handler for POS keyboard shortcuts.
 * Separated for direct unit testing and event handling.
 */
export function handlePosKeyDown(e: KeyboardEvent, options: PosShortcutsOptions) {
  if (options.enabled === false) return;

  const target = e.target;
  const isInputActive = isInputElement(target);

  // Escape closes any open modal or blurs active input
  if (e.key === "Escape") {
    if (options.isModalOpen) {
      e.preventDefault();
      options.onCloseModals?.();
      return;
    }
    if (isInputActive) {
      if (typeof HTMLElement !== "undefined" && target instanceof HTMLElement) {
        target.blur();
      } else if (hasBlurMethod(target)) {
        target.blur();
      }
      options.onCloseModals?.();
      return;
    }
  }

  // F1 or / focuses search input (when not currently typing in another input)
  if (e.key === "F1" || (e.key === "/" && !isInputActive)) {
    if (!options.isModalOpen) {
      e.preventDefault();
      options.onSearchFocus?.();
      return;
    }
  }

  // F2 triggers payment / checkout if cart has items
  if (e.key === "F2") {
    if (!options.isModalOpen && options.hasCartItems) {
      e.preventDefault();
      options.onOpenCheckout?.();
      return;
    }
  }

  // F4 clears the cart if it has items
  if (e.key === "F4") {
    if (!options.isModalOpen && options.hasCartItems) {
      e.preventDefault();
      options.onClearCart?.();
      return;
    }
  }
}

/**
 * React hook that registers POS global keyboard shortcuts.
 */
export function usePosShortcuts(options: PosShortcutsOptions) {
  const {
    onSearchFocus,
    onOpenCheckout,
    onClearCart,
    onCloseModals,
    isModalOpen = false,
    hasCartItems = false,
    enabled = true,
  } = options;

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      handlePosKeyDown(e, {
        onSearchFocus,
        onOpenCheckout,
        onClearCart,
        onCloseModals,
        isModalOpen,
        hasCartItems,
        enabled,
      });
    },
    [onSearchFocus, onOpenCheckout, onClearCart, onCloseModals, isModalOpen, hasCartItems, enabled]
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled, onKeyDown]);
}
