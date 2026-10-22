-- database/sql/constraints.sql
-- Manual constraints and partial indexes required by TakarLaba architecture (ARCHITECTURE.md §3)
-- Injected into initial migration or run directly during database setup.

-- 1. Check constraint: Stock batch remaining quantity must be between 0 and initial quantity, initial > 0
ALTER TABLE "StockBatch" ADD CONSTRAINT stock_batch_qty_chk
  CHECK ("remainingQtyBase" >= 0 AND "remainingQtyBase" <= "initialQtyBase" AND "initialQtyBase" > 0);

-- 2. Check constraint: Ingredient yield percentage must be between 1 and 100
ALTER TABLE "Ingredient" ADD CONSTRAINT ingredient_yield_chk
  CHECK ("yieldPercent" BETWEEN 1 AND 100);

-- 3. Check constraint: Recipe item usable quantity must be strictly positive
ALTER TABLE "RecipeItem" ADD CONSTRAINT recipe_qty_chk
  CHECK ("qtyUsableBase" > 0);

-- 4. Check constraint: Menu selling price must be strictly positive
ALTER TABLE "Menu" ADD CONSTRAINT menu_price_chk
  CHECK ("sellingPrice" > 0);

-- 5. Check constraint: Sale item quantity must be strictly positive
ALTER TABLE "SaleItem" ADD CONSTRAINT sale_item_qty_chk
  CHECK (qty > 0);

-- 6. Partial unique index: At most ONE OPEN MarginAlert per menu
CREATE UNIQUE INDEX margin_alert_one_open_per_menu ON "MarginAlert"("menuId")
  WHERE status = 'OPEN';

-- 7. Partial index: FEFO allocation query optimization (only non-depleted batches)
CREATE INDEX stock_batch_fefo_idx ON "StockBatch"("businessId", "ingredientId", "expiryDate", "receivedAt")
  WHERE "remainingQtyBase" > 0;
