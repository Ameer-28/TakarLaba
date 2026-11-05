import type { PaymentMethod } from "../../../api/hooks/use-sales.js";

export type PosOrderType = "DINE_IN" | "TAKE_AWAY" | "DELIVERY";
export type DrinkTemperature = "ICE" | "HOT";

export interface CartItem {
  cartKey?: string;
  menuId: string;
  name: string;
  category: string | null;
  sellingPrice: number;
  qty: number;
  temperature?: DrinkTemperature;
}

export type CartAction =
  | {
      type: "ADD_ITEM";
      payload: {
        menuId: string;
        name: string;
        category: string | null;
        sellingPrice: number;
        temperature?: DrinkTemperature;
        cartKey?: string;
      };
    }
  | { type: "UPDATE_QTY"; payload: { cartKey?: string; menuId?: string; qty: number } }
  | { type: "INCREMENT_QTY"; payload: { cartKey?: string; menuId?: string } }
  | { type: "DECREMENT_QTY"; payload: { cartKey?: string; menuId?: string } }
  | { type: "REMOVE_ITEM"; payload: { cartKey?: string; menuId?: string } }
  | { type: "CLEAR_CART" };

export interface CartState {
  items: CartItem[];
}

export interface CheckoutState {
  isOpen: boolean;
  paymentMethod: PaymentMethod;
  cashReceived: number;
}
