import { Outlet, Link } from "react-router-dom";
import { HeartHandshake, User, Bell, Map } from "lucide-react";

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center space-x-2 text-emerald-600 font-bold text-xl">
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
              
              {localStorage.getItem("token") ? (
                <div className="flex items-center space-x-4">
                  <Link to="/profile" className="text-gray-600 hover:text-emerald-600">
                    <User className="w-5 h-5" />
                  </Link>
                  <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-sm font-semibold text-gray-500 hover:text-gray-900">
                    Logout
                  </button>
                </div>
              ) : (
                <Link to="/auth" className="text-sm font-bold bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
                  Login / Sign Up
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
