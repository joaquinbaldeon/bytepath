"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

// Respeta la preferencia del sistema "reducir movimiento" en todas las animaciones.
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
