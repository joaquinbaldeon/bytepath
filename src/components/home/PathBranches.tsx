"use client";

import { motion } from "framer-motion";

// Una ruta que baja del encabezado y se reparte hacia las tres tarjetas de pilares.
const branches = [
  { d: "M500 0 V24 C500 56 167 40 167 80", className: "stroke-learn/60" },
  { d: "M500 0 V80", className: "stroke-practice/60" },
  { d: "M500 0 V24 C500 56 833 40 833 80", className: "stroke-compete/60" },
];

export function PathBranches({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1000 80"
      preserveAspectRatio="none"
      aria-hidden
      className={`w-full ${className}`}
    >
      {branches.map((branch, i) => (
        <motion.path
          key={branch.d}
          d={branch.d}
          fill="none"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          className={branch.className}
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay: 0.2 + i * 0.1, ease: "easeInOut" }}
        />
      ))}
    </svg>
  );
}
