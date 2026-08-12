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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />

          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="/emitter"
            element={<EmitterPage />}
          />

          <Route
            path="/device/:deviceId"
            element={<DevicePage />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;