import type { CartState, CartAction, CartItem } from "./types.js";

export const initialCartState: CartState = {
  items: [],
};

export const MAX_CART_ITEMS = 50;
export const MAX_ITEM_QTY = 999;

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const { menuId, name, category, sellingPrice } = action.payload;
      const existingIndex = state.items.findIndex((item) => item.menuId === menuId);

      if (existingIndex >= 0) {
        // Increment quantity of existing item
        const updatedItems = [...state.items];
        const currentItem = updatedItems[existingIndex]!;
        const newQty = Math.min(currentItem.qty + 1, MAX_ITEM_QTY);
        updatedItems[existingIndex] = { ...currentItem, qty: newQty };
        return { ...state, items: updatedItems };
      }

      // Check max items limit
      if (state.items.length >= MAX_CART_ITEMS) {
        return state;
      }

      const newItem: CartItem = {
        menuId,
        name,
        category,
        sellingPrice,
        qty: 1,
      };

      return {
        ...state,
        items: [...state.items, newItem],
      };
    }

    case "INCREMENT_QTY": {
      return {
        ...state,
        items: state.items.map((item) => {
          if (item.menuId === action.payload.menuId) {
            return {
              ...item,
              qty: Math.min(item.qty + 1, MAX_ITEM_QTY),
            };
          }
          return item;
        }),
      };
    }

    case "DECREMENT_QTY": {
      const targetItem = state.items.find((item) => item.menuId === action.payload.menuId);
      if (!targetItem) return state;

      if (targetItem.qty <= 1) {
        // Remove item if decremented below 1
        return {
          ...state,
          items: state.items.filter((item) => item.menuId !== action.payload.menuId),
        };
      }

      return {
        ...state,
        items: state.items.map((item) => {
          if (item.menuId === action.payload.menuId) {
            return {
              ...item,
              qty: item.qty - 1,
            };
          }
          return item;
        }),
      };
    }

    case "UPDATE_QTY": {
      const { menuId, qty } = action.payload;
      if (qty <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => item.menuId !== menuId),
        };
      }

      const clampedQty = Math.min(Math.floor(qty), MAX_ITEM_QTY);
      return {
        ...state,
        items: state.items.map((item) => {
          if (item.menuId === menuId) {
            return {
              ...item,
              qty: clampedQty,
            };
          }
          return item;
        }),
      };
    }

    case "REMOVE_ITEM": {
      return {
        ...state,
        items: state.items.filter((item) => item.menuId !== action.payload.menuId),
      };
    }

    case "CLEAR_CART": {
      return initialCartState;
    }

    default:
      return state;
  }
}

/**
 * Calculate total quantity of items in the cart.
 */
export function getCartTotalQty(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

/**
 * Calculate total price of all items in the cart.
 */
export function getCartTotalAmount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.qty * item.sellingPrice, 0);
}
