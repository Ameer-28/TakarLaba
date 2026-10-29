import type { PaymentMethod } from "../../../api/hooks/use-sales.js";

export interface CartItem {
  menuId: string;
  name: string;
  category: string | null;
  sellingPrice: number;
  qty: number;
}

export type CartAction =
  | {
      type: "ADD_ITEM";
      payload: { menuId: string; name: string; category: string | null; sellingPrice: number };
    }
  | { type: "UPDATE_QTY"; payload: { menuId: string; qty: number } }
  | { type: "INCREMENT_QTY"; payload: { menuId: string } }
  | { type: "DECREMENT_QTY"; payload: { menuId: string } }
  | { type: "REMOVE_ITEM"; payload: { menuId: string } }
  | { type: "CLEAR_CART" };

export interface CartState {
  items: CartItem[];
}

export interface CheckoutState {
  isOpen: boolean;
  paymentMethod: PaymentMethod;
  cashReceived: number;
}
