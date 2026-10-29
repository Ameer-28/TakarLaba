import { describe, it, expect } from "vitest";
import {
  cartReducer,
  initialCartState,
  getCartTotalQty,
  getCartTotalAmount,
  MAX_CART_ITEMS,
  MAX_ITEM_QTY,
} from "./cart-reducer.js";

describe("POS Shopping Cart Reducer (T-042 — FR-POS-01)", () => {
  it("initializes with an empty item list", () => {
    expect(initialCartState.items).toHaveLength(0);
  });

  it("adds a new menu item to cart with qty 1", () => {
    const state = cartReducer(initialCartState, {
      type: "ADD_ITEM",
      payload: {
        menuId: "menu-1",
        name: "Es Kopi Susu Aren",
        category: "Minuman",
        sellingPrice: 18000,
      },
    });

    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toEqual({
      menuId: "menu-1",
      name: "Es Kopi Susu Aren",
      category: "Minuman",
      sellingPrice: 18000,
      qty: 1,
    });
  });

  it("increments quantity when adding an item already in the cart", () => {
    let state = cartReducer(initialCartState, {
      type: "ADD_ITEM",
      payload: {
        menuId: "menu-1",
        name: "Es Kopi Susu Aren",
        category: "Minuman",
        sellingPrice: 18000,
      },
    });

    state = cartReducer(state, {
      type: "ADD_ITEM",
      payload: {
        menuId: "menu-1",
        name: "Es Kopi Susu Aren",
        category: "Minuman",
        sellingPrice: 18000,
      },
    });

    expect(state.items).toHaveLength(1);
    expect(state.items[0]!.qty).toBe(2);
  });

  it("steppers increment and decrement properly", () => {
    let state = cartReducer(initialCartState, {
      type: "ADD_ITEM",
      payload: {
        menuId: "menu-1",
        name: "Es Teh",
        category: "Minuman",
        sellingPrice: 5000,
      },
    });

    state = cartReducer(state, {
      type: "INCREMENT_QTY",
      payload: { menuId: "menu-1" },
    });
    expect(state.items[0]!.qty).toBe(2);

    state = cartReducer(state, {
      type: "DECREMENT_QTY",
      payload: { menuId: "menu-1" },
    });
    expect(state.items[0]!.qty).toBe(1);

    // Decrementing when qty is 1 removes the item
    state = cartReducer(state, {
      type: "DECREMENT_QTY",
      payload: { menuId: "menu-1" },
    });
    expect(state.items).toHaveLength(0);
  });

  it("updates quantity directly and clamps between 1 and 999", () => {
    let state = cartReducer(initialCartState, {
      type: "ADD_ITEM",
      payload: {
        menuId: "menu-1",
        name: "Americano",
        category: "Minuman",
        sellingPrice: 15000,
      },
    });

    state = cartReducer(state, {
      type: "UPDATE_QTY",
      payload: { menuId: "menu-1", qty: 25 },
    });
    expect(state.items[0]!.qty).toBe(25);

    // Clamps to max 999
    state = cartReducer(state, {
      type: "UPDATE_QTY",
      payload: { menuId: "menu-1", qty: 2000 },
    });
    expect(state.items[0]!.qty).toBe(MAX_ITEM_QTY);

    // Setting qty to 0 or negative removes item
    state = cartReducer(state, {
      type: "UPDATE_QTY",
      payload: { menuId: "menu-1", qty: 0 },
    });
    expect(state.items).toHaveLength(0);
  });

  it("removes an item explicitly", () => {
    let state = cartReducer(initialCartState, {
      type: "ADD_ITEM",
      payload: { menuId: "menu-1", name: "Menu 1", category: null, sellingPrice: 10000 },
    });
    state = cartReducer(state, {
      type: "ADD_ITEM",
      payload: { menuId: "menu-2", name: "Menu 2", category: null, sellingPrice: 12000 },
    });

    expect(state.items).toHaveLength(2);

    state = cartReducer(state, {
      type: "REMOVE_ITEM",
      payload: { menuId: "menu-1" },
    });

    expect(state.items).toHaveLength(1);
    expect(state.items[0]!.menuId).toBe("menu-2");
  });

  it("clears the cart completely", () => {
    let state = cartReducer(initialCartState, {
      type: "ADD_ITEM",
      payload: { menuId: "menu-1", name: "Menu 1", category: null, sellingPrice: 10000 },
    });
    state = cartReducer(state, { type: "CLEAR_CART" });
    expect(state.items).toHaveLength(0);
  });

  it("enforces maximum 50 unique items in cart", () => {
    let state = initialCartState;
    for (let i = 1; i <= MAX_CART_ITEMS; i++) {
      state = cartReducer(state, {
        type: "ADD_ITEM",
        payload: {
          menuId: `menu-${i}`,
          name: `Menu ${i}`,
          category: null,
          sellingPrice: 10000,
        },
      });
    }

    expect(state.items).toHaveLength(MAX_CART_ITEMS);

    // 51st item should be rejected
    state = cartReducer(state, {
      type: "ADD_ITEM",
      payload: {
        menuId: "menu-51",
        name: "Menu 51",
        category: null,
        sellingPrice: 10000,
      },
    });

    expect(state.items).toHaveLength(MAX_CART_ITEMS);
  });

  it("calculates total quantity and total amount accurately", () => {
    const items = [
      { menuId: "m1", name: "Kopi", category: null, sellingPrice: 18000, qty: 2 }, // 36.000
      { menuId: "m2", name: "Roti", category: null, sellingPrice: 16000, qty: 3 }, // 48.000
    ];

    expect(getCartTotalQty(items)).toBe(5);
    expect(getCartTotalAmount(items)).toBe(84000);
  });
});
