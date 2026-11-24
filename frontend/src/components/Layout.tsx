import { Outlet, Link, useNavigate } from "react-router-dom";
import { HeartHandshake, User, Bell, Map, MailWarning } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { signOut } from "../lib/api";

export default function Layout() {
  const token = useAuthStore((st) => st.token);
  const user = useAuthStore((st) => st.user);
  const navigate = useNavigate();
  const logout = async () => {
    await signOut();
    navigate("/");
  };
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-cream/85 backdrop-blur-md border-b border-ink/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center space-x-2 text-emerald-700 font-display font-extrabold text-xl tracking-tight">
              <HeartHandshake className="w-8 h-8" />
              <span>CREH</span>
            </Link>
            <nav className="flex space-x-6 items-center">
              <Link to="/discover" className="text-gray-600 hover:text-emerald-600 flex items-center space-x-1">
                <Map className="w-5 h-5" />
                <span className="hidden sm:inline">Discover</span>
              </Link>
              <button className="text-gray-600 hover:text-emerald-600 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">2</span>
              </button>
              
              {token ? (
                <div className="flex items-center space-x-4">
                  <Link to="/profile" className="text-gray-600 hover:text-emerald-600" aria-label="Dashboard" title="Dashboard">
                    <User className="w-5 h-5" />
                  </Link>
                  <Link to="/settings" className="text-sm font-semibold text-gray-600 hover:text-emerald-600">
                    Settings
                  </Link>
                  <button onClick={logout} className="text-sm font-semibold text-gray-500 hover:text-gray-900">
                    Logout
                  </button>
                </div>
              ) : (
                <Link to="/auth" className="text-sm font-bold bg-emerald-600 text-white px-5 py-2.5 rounded-full hover:bg-emerald-700 transition">
                  Login / Sign Up
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {user?.verification_status === "unverified" && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-amber-900">
            <MailWarning className="w-4 h-4 shrink-0" />
            <span>Verify your email to list items and send requests.</span>
            <Link to="/verify-email" className="font-bold underline underline-offset-2 hover:text-amber-950">
              Enter your code
            </Link>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
