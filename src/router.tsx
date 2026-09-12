import { createBrowserRouter } from "react-router";
import { Layout } from "@/components/layout/Layout";
import { RouteError } from "@/components/layout/RouteError";
import HomePage from "@/pages/HomePage";

// L'accueil est dans le bundle principal ; les autres pages sont chargées à la demande.
export const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "explorer", lazy: () => import("@/pages/ExplorePage").then((m) => ({ Component: m.default })) },
      { path: "film/:id", lazy: () => import("@/pages/MoviePage").then((m) => ({ Component: m.default })) },
      { path: "favoris", lazy: () => import("@/pages/FavoritesPage").then((m) => ({ Component: m.default })) },
      { path: "*", lazy: () => import("@/pages/NotFoundPage").then((m) => ({ Component: m.default })) },
    ],
  },
]);
