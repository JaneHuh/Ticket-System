import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    // e2e/는 Playwright 전용 스펙이므로 Vitest 수집 대상에서 제외한다.
    exclude: ["e2e/**", "node_modules/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // "server-only"는 Next.js의 react-server 빌드 조건 밖(=Vitest)에서 import되면
      // 항상 throw하도록 만들어진 마커 패키지다. 유닛 테스트에서는 no-op으로 대체한다.
      "server-only": path.resolve(__dirname, "node_modules/server-only/empty.js"),
    },
  },
});
