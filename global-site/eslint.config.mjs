import next from "eslint-config-next/core-web-vitals";
export default [
  ...next.filter((c) => !c.ignores),
  { ignores: ["dist/**", "node_modules/**"] },
  { rules: { "@next/next/no-img-element": "off" } },
];
