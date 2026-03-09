import { Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { registerNavigate } from "@/context/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Home } from "@/pages/Home";
import { Spots } from "@/pages/Spots";
import { SpotPage } from "@/pages/SpotPage";
import { WriteReview } from "@/pages/WriteReview";
import { MapPage } from "@/pages/MapPage";
import { Profile } from "@/pages/Profile";
import { Settings } from "@/pages/Settings";
import { Login } from "@/pages/Login";
import { AuthCallback } from "@/pages/AuthCallback";
import { AdminPanel } from "@/pages/AdminPanel";
import { Passport } from "@/pages/Passport";
import { SubmitSpot } from "@/pages/SubmitSpot";
import { Cities } from "@/pages/Cities";
import { CityPage } from "@/pages/CityPage";

function App() {
  const navigate = useNavigate();
  useEffect(() => {
    registerNavigate(navigate);
  }, [navigate]);

  return (
    <Routes>
      {/* No-layout */}
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Full-height map */}
      <Route
        path="/map"
        element={
          <Layout noFooter>
            <MapPage />
          </Layout>
        }
      />

      {/* Standard layout */}
      <Route
        path="/"
        element={
          <Layout>
            <Home />
          </Layout>
        }
      />
      <Route
        path="/spots"
        element={
          <Layout>
            <Spots />
          </Layout>
        }
      />
      <Route
        path="/spot/:slug"
        element={
          <Layout>
            <SpotPage />
          </Layout>
        }
      />
      <Route
        path="/spot/:slug"
        element={
          <Layout>
            <SpotPage />
          </Layout>
        }
      />

      {/* Protected */}
      <Route
        path="/review/new"
        element={
          <Layout>
            <ProtectedRoute>
              <WriteReview />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/profile"
        element={
          <Layout>
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/settings"
        element={
          <Layout>
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/admin"
        element={
          <Layout>
            <ProtectedRoute adminOnly>
              <AdminPanel />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/passport"
        element={
          <Layout>
            <Passport />
          </Layout>
        }
      />
      <Route
        path="/submit"
        element={
          <Layout>
            <ProtectedRoute>
              <SubmitSpot />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/cities"
        element={
          <Layout>
            <Cities />
          </Layout>
        }
      />
      <Route
        path="/city/:city"
        element={
          <Layout>
            <CityPage />
          </Layout>
        }
      />
    </Routes>
  );
}

export default App;
