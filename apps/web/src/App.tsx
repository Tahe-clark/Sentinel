import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import MainLayout
  from "./layouts/MainLayout";

import DashboardPage
  from "./pages/Dashboard/DashboardPage";

import DevicePage
  from "./pages/Device/DevicePage";

import EmitterPage
  from "./pages/Emitter/EmitterPage";

import ForgotPasswordPage
  from "./pages/ForgotPassword/ForgotPasswordPage";

import LoginPage
  from "./pages/Login/LoginPage";

import PairDevicePage
  from "./pages/PairDevice/PairDevicePage";

import RegisterPage
  from "./pages/Register/RegisterPage";

import ResetPasswordPage
  from "./pages/ResetPassword/ResetPasswordPage";

import ProtectedRoute
  from "./components/common/ProtectedRoute";


function App() {
  return (
    <Routes>
      <Route
        element={
          <MainLayout />
        }
      >
        <Route
          path="/"

          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
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
          path="/device/:deviceId"

          element={
            <ProtectedRoute>
              <DevicePage />
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


        <Route
          path="/emitter"

          element={
            <EmitterPage />
          }
        />


        <Route
          path="/login"

          element={
            <LoginPage />
          }
        />


        <Route
          path="/register"

          element={
            <RegisterPage />
          }
        />


        <Route
          path="/forgot-password"

          element={
            <ForgotPasswordPage />
          }
        />


        <Route
          path="/reset-password/:uid/:token"

          element={
            <ResetPasswordPage />
          }
        />
      </Route>
    </Routes>
  );
}


export default App;