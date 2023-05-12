import type { Options } from "tsup";

export default <Options>{
  entryPoints: ["./index.ts"],
  clean: true,
  format: ["cjs", "esm"],
  dts: true,
  external: ["vue"],
};
