import { Skeleton } from "@/components/ui/skeleton";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import Layout from "./components/Layout";

// ─── Lazy pages ───────────────────────────────────────────────────────────────
const MarketOverview = lazy(() => import("./pages/MarketOverview"));
const PairDetail = lazy(() => import("./pages/PairDetail"));

// ─── Page loading fallback ────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="p-4 space-y-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="grid grid-cols-4 gap-3 pt-2">
        {Array.from({ length: 8 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items have no id
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}

// ─── Root layout route ─────────────────────────────────────────────────────────
const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Suspense fallback={<PageSkeleton />}>
        <Outlet />
      </Suspense>
    </Layout>
  ),
});

// ─── Market overview (/) ───────────────────────────────────────────────────────
const marketRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: MarketOverview,
});

// ─── Screener (/screener) ──────────────────────────────────────────────────────
const screenerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/screener",
  component: MarketOverview,
});

// ─── Pair detail (/pair/$pairId) ───────────────────────────────────────────────
const pairRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pair/$pairId",
  component: PairDetail,
});

// ─── Router ────────────────────────────────────────────────────────────────────
const routeTree = rootRoute.addChildren([
  marketRoute,
  screenerRoute,
  pairRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
