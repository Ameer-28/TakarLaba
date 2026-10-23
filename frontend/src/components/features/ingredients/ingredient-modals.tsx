import type { Ingredient } from "@/api/hooks/use-ingredients";
import { PurchaseModal } from "@/components/features/purchase-modal";
import { IngredientCreateModal } from "./ingredient-create-modal";
import { IngredientEditModal } from "./ingredient-edit-modal";
import { IngredientUnitManager } from "./ingredient-unit-manager";
import { IngredientDeactivateModal } from "./ingredient-deactivate-modal";
import type { IngredientFormValues, PurchaseUnitFormValues } from "./types";

interface IngredientModalsProps {
  ingredients: Ingredient[];
  isCreateOpen: boolean;
  onCloseCreate: () => void;
  onCreateSubmit: (values: IngredientFormValues) => Promise<void>;
  isCreating: boolean;
  editingIngredient: Ingredient | null;
  onCloseEdit: () => void;
  onEditSubmit: (values: IngredientFormValues) => Promise<void>;
  isUpdating: boolean;
  managingUnitsIngredient: Ingredient | null;
  onCloseUnits: () => void;
  onAddUnit: (values: PurchaseUnitFormValues) => Promise<void>;
  onDeleteUnit: (unitId: string, unitName: string) => Promise<void>;
  isAddingUnit: boolean;
  deactivatingIngredient: Ingredient | null;
  onCloseDeactivate: () => void;
  onConfirmDeactivate: () => Promise<void>;
  isDeactivating: boolean;
  isPurchaseModalOpen: boolean;
  onClosePurchaseModal: () => void;
  onPurchaseSuccess: () => void;
}

export function IngredientModals({
  ingredients,
  isCreateOpen,
  onCloseCreate,
  onCreateSubmit,
  isCreating,
  editingIngredient,
  onCloseEdit,
  onEditSubmit,
  isUpdating,
  managingUnitsIngredient,
  onCloseUnits,
  onAddUnit,
  onDeleteUnit,
  isAddingUnit,
  deactivatingIngredient,
  onCloseDeactivate,
  onConfirmDeactivate,
  isDeactivating,
  isPurchaseModalOpen,
  onClosePurchaseModal,
  onPurchaseSuccess,
}: IngredientModalsProps) {
  return (
    <>
      <IngredientCreateModal
        isOpen={isCreateOpen}
        onClose={onCloseCreate}
        onSubmit={onCreateSubmit}
        isLoading={isCreating}
      />
      <IngredientEditModal
        ingredient={editingIngredient}
        onClose={onCloseEdit}
        onSubmit={onEditSubmit}
        isLoading={isUpdating}
      />
      <IngredientUnitManager
        ingredient={managingUnitsIngredient}
        onClose={onCloseUnits}
        onAddUnit={onAddUnit}
        onDeleteUnit={onDeleteUnit}
        isAddingUnit={isAddingUnit}
      />
      <IngredientDeactivateModal
        ingredient={deactivatingIngredient}
        onClose={onCloseDeactivate}
        onConfirm={onConfirmDeactivate}
        isPending={isDeactivating}
      />
      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={onClosePurchaseModal}
        ingredients={ingredients}
        onSuccess={onPurchaseSuccess}
      />
    </>
  );
}
