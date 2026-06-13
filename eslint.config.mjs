// SPDX-License-Identifier: MIT

import nextConfig from "eslint-config-next";

const config = [
  ...nextConfig,
  {
    ignores: ["coverage/**", ".next/**", "lib/jsx-loc-plugin.mjs"],
  },
  {
    rules: {
      // Conflicts with the canonical localStorage hydration pattern (AGENTS.md §4.8)
      "react-hooks/set-state-in-effect": "off",
      // React Compiler purity rule is too strict for event handlers
      "react-hooks/purity": "off",
    },
  },
];

export default config;
