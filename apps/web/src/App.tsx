import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import HomePage from "./pages/Home/Homepages";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import EmitterPage from "./pages/Emitter/EmitterPage";
import DevicePage from "./pages/Device/DevicePage";
import PairDevicePage from "./pages/PairDevice/PairDevicePage";

import LoginPage
  from "./pages/Login/LoginPage";

import RegisterPage
  from "./pages/Register/RegisterPage";

import ProtectedRoute
  from "./components/common/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
        <Route
  path="/pair-device"
  element={<PairDevicePage />}
/>
          <Route path="/" element={<HomePage />} />

          <Route
            path="/emitter"
            element={<EmitterPage />}
          />

          <Route
            path="/device/:deviceId"
            element={<DevicePage />}
          />

          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/register"
            element={<RegisterPage />}
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pair-device"
            element={
              <ProtectedRoute>
                <PairDevicePage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          path="/device/:deviceId"
          element={
            <ProtectedRoute>
              <DevicePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;