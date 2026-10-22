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
    list: () => [...queryKeys.menus.all, "list"] as const,
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
};
