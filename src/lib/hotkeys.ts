import type React from "react";

export const isCtrl = (
  e: KeyboardEvent | React.KeyboardEvent,
): boolean => e.ctrlKey || e.metaKey;
