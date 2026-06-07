/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { VisibilityProvider } from "./context/ModuleVisibilityContext";
import { NotificationProvider } from "./context/NotificationContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import Home from "./pages/Home";
import PerformanceDashboard from "./pages/PerformanceDashboard";
import PlaceholderPage from "./pages/PlaceholderPage";
import UserPermissions from "./pages/UserPermissions";
import AiCopilot from "./pages/AiCopilot";
import ProductionSummarizer from "./pages/ProductionSummarizer";
import ProductionCalendar from "./pages/ProductionCalendar";
import MasterItem from "./pages/MasterItem";
import BatterMatrix from "./pages/BatterMatrix";
import ConfigGeneral from "./pages/ConfigGeneral";
import DevPermit from "./pages/DevPermit";
import SystemConfig from "./pages/SystemConfig";
import SystemLogs from "./pages/SystemLogs";
import StdProcessTime from "./pages/StdProcessTime";
import EquipmentRegistry from "./pages/EquipmentRegistry";
import PlanningPL from "./pages/PlanningPL";

import ProductionPlanning from "./pages/ProductionPlanning";
import ProductionTracking from "./pages/ProductionTracking";
import MixingBoard from "./pages/MixingBoard";
import PackingBoard from "./pages/PackingBoard";
import BatchTraceability from "./pages/BatchTraceability";
import MachineBreakdown from "./pages/MachineBreakdown";
import AiPlannerAsst from "./pages/AiPlannerAsst";
import UnplannedJobs from "./pages/UnplannedJobs";
import OeeMonitoring from "./pages/OeeMonitoring";
import YieldAnalysis from "./pages/YieldAnalysis";
import DowntimeTracking from "./pages/DowntimeTracking";
import QualityMetrics from "./pages/QualityMetrics";
import RejectAnalysis from "./pages/RejectAnalysis";
import DailyProdReport from "./pages/DailyProdReport";
import EfficiencySummary from "./pages/EfficiencySummary";
import CostAnalysis from "./pages/CostAnalysis";

export default function App() {
  return (
    <AuthProvider>
      <VisibilityProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* Protected Routes */}
              <Route element={<Layout />}>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/production-calendar"
                element={
                  <ProtectedRoute>
                    <ProductionCalendar />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/copilot"
                element={
                  <ProtectedRoute>
                    <AiCopilot />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/production-summarizer"
                element={
                  <ProtectedRoute>
                    <ProductionSummarizer />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/config/master"
                element={
                  <ProtectedRoute>
                    <MasterItem />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/config/batter-matrix"
                element={
                  <ProtectedRoute>
                    <BatterMatrix />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/config/std-time"
                element={
                  <ProtectedRoute>
                    <StdProcessTime />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/config/equipment"
                element={
                  <ProtectedRoute>
                    <EquipmentRegistry />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/config/general"
                element={
                  <ProtectedRoute>
                    <ConfigGeneral />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/planning/pl"
                element={
                  <ProtectedRoute>
                    <PlanningPL />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/planning/production"
                element={
                  <ProtectedRoute>
                    <ProductionPlanning />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/planning/ai"
                element={
                  <ProtectedRoute>
                    <AiPlannerAsst />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/board/tracking"
                element={
                  <ProtectedRoute>
                    <ProductionTracking />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/board/mixing"
                element={
                  <ProtectedRoute>
                    <MixingBoard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/board/packing"
                element={
                  <ProtectedRoute>
                    <PackingBoard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/process/traceability"
                element={
                  <ProtectedRoute>
                    <BatchTraceability />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/problem/machine"
                element={
                  <ProtectedRoute>
                    <MachineBreakdown />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/problem/unplanned"
                element={
                  <ProtectedRoute>
                    <UnplannedJobs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics/performance"
                element={
                  <ProtectedRoute>
                    <PerformanceDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics/oee"
                element={
                  <ProtectedRoute>
                    <OeeMonitoring />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics/yield"
                element={
                  <ProtectedRoute>
                    <YieldAnalysis />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics/downtime"
                element={
                  <ProtectedRoute>
                    <DowntimeTracking />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics/quality"
                element={
                  <ProtectedRoute>
                    <QualityMetrics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics/reject"
                element={
                  <ProtectedRoute>
                    <RejectAnalysis />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics/daily"
                element={
                  <ProtectedRoute>
                    <DailyProdReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics/efficiency"
                element={
                  <ProtectedRoute>
                    <EfficiencySummary />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics/cost"
                element={
                  <ProtectedRoute>
                    <CostAnalysis />
                  </ProtectedRoute>
                }
              />

              {/* General Modules (Read-only by default) */}
              <Route
                path="/sale/order-placeholder"
                element={
                  <ProtectedRoute>
                    <PlaceholderPage title="SALE ORDER" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employees"
                element={
                  <ProtectedRoute>
                    <PlaceholderPage title="Employees Directory" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruitment"
                element={
                  <ProtectedRoute>
                    <PlaceholderPage title="Recruitment" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance"
                element={
                  <ProtectedRoute>
                    <PlaceholderPage title="Attendance Core" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leave"
                element={
                  <ProtectedRoute>
                    <PlaceholderPage title="Leave Requests" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payroll"
                element={
                  <ProtectedRoute>
                    <PlaceholderPage title="Payroll" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/appraisals"
                element={
                  <ProtectedRoute>
                    <PlaceholderPage title="Appraisals" />
                  </ProtectedRoute>
                }
              />

              {/* Confidential Modules */}
              <Route
                path="/dev-permit"
                element={
                  <ProtectedRoute isConfidential>
                    <DevPermit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dev-logs"
                element={
                  <ProtectedRoute isConfidential>
                    <SystemLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute isConfidential>
                    <SystemConfig />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/permissions"
                element={
                  <ProtectedRoute isConfidential>
                    <UserPermissions />
                  </ProtectedRoute>
                }
              />

              {/* Catch all */}
              <Route
                path="*"
                element={<PlaceholderPage title="Module Loading" />}
              />
            </Route>
          </Routes>
        </BrowserRouter>
        </NotificationProvider>
      </VisibilityProvider>
    </AuthProvider>
  );
}
