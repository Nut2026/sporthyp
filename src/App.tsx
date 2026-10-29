import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MainController from "./pages/MainController";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<MainController />} />
            {/* The experience is a single flow: any other URL restarts it. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
