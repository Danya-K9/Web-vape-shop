import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import "./App.css";
import Header from "./components/Header";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Notification from "./components/Notification";
import AdminPickupLocations from "./admin/AdminPickupLocations";
import AdminRoute from "./routes/AdminRoute";
import AdminLayout from "./admin/AdminLayout";
import AdminAnalytic from "./admin/AdminAnalytics";
import AdminProducts from "./admin/AdminProducts";
import AdminUsers from "./admin/AdminUsers";
import Checkout from "./pages/Checkout";
import AdminOrders from "./admin/AdminOrders";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-transition">
      <Routes>
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/cart" element={<Cart />} />
  <Route path="/profile" element={<Profile />} />
  <Route path="/checkout" element={<Checkout/>} />

  <Route
    path="/admin"
    element={
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    }
  >
    <Route path="/admin/orders" element={<AdminOrders />} />
    <Route index element={<AdminAnalytic />} />
    <Route path="products" element={<AdminProducts />} />
    <Route path="users" element={<AdminUsers />} />
    <Route path="pickup" element={<AdminPickupLocations />} />
  </Route>
</Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Header />
      <Notification />
      <AnimatedRoutes />
    </Router>
  );
}
