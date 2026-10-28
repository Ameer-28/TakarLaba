export const queryKeys = {
  health: ["health"] as const,
  auth: {
    session: ["auth", "session"] as const,
  },
  ingredients: {
    all: ["ingredients"] as const,
    list: (filter?: Record<string, unknown>) =>
      filter
        ? ([...queryKeys.ingredients.all, "list", filter] as const)
        : ([...queryKeys.ingredients.all, "list"] as const),
    detail: (id: string) => [...queryKeys.ingredients.all, "detail", id] as const,
  },
  menus: {
    all: ["menus"] as const,
    list: (filter?: Record<string, unknown>) =>
      filter
        ? ([...queryKeys.menus.all, "list", filter] as const)
        : ([...queryKeys.menus.all, "list"] as const),
    detail: (id: string) => [...queryKeys.menus.all, "detail", id] as const,
  },
  sales: {
    all: ["sales"] as const,
    list: () => [...queryKeys.sales.all, "list"] as const,
  },
  alerts: {
    all: ["alerts"] as const,
    list: () => [...queryKeys.alerts.all, "list"] as const,
  },
  purchases: {
    all: ["purchases"] as const,
    list: (filter?: Record<string, unknown>) =>
      filter
        ? ([...queryKeys.purchases.all, "list", filter] as const)
        : ([...queryKeys.purchases.all, "list"] as const),
    detail: (id: string) => [...queryKeys.purchases.all, "detail", id] as const,
  },
  inventory: {
    all: ["inventory"] as const,
    summary: (warnDays?: number) => [...queryKeys.inventory.all, "summary", warnDays] as const,
    batches: (filter?: Record<string, unknown>) =>
      filter
        ? ([...queryKeys.inventory.all, "batches", filter] as const)
        : ([...queryKeys.inventory.all, "batches"] as const),
  },
  settings: {
    all: ["settings"] as const,
    detail: () => [...queryKeys.settings.all, "detail"] as const,
  },
  overheads: {
    all: ["overheads"] as const,
    list: (filter?: Record<string, unknown>) =>
      filter
        ? ([...queryKeys.overheads.all, "list", filter] as const)
        : ([...queryKeys.overheads.all, "list"] as const),
  },
};
