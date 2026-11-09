import { defineConfig } from "rolldown";
import { dts } from "rolldown-plugin-dts";

// The published declarations, rolled up from source with respond-core,
// respond-ui and cip-179 inlined. Oxc declares each file on its own, so every
// export along the way carries an explicit type; the build names any that
// doesn't.
export default defineConfig({
  input: { "tessera-respond.es": "src/element.tsx" },
  plugins: [dts({ generator: "oxc", dtsOnly: true })],
  // respond-ui's modules import solid-js: inlined, its `declare global`
  // blocks would reach every host's types. The artifact bundles Solid, so no
  // published type may name it; external, an unused import is dropped.
  external: [/^solid-js(\/|$)/],
  output: { dir: "dist" },
});
