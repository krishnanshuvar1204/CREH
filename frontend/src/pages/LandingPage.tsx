import { Link } from "react-router-dom";
import { Map, ShieldCheck, HeartHandshake, PackageOpen } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="bg-emerald-600 text-white flex-1 flex flex-col justify-center items-center px-4 text-center py-20">
        <HeartHandshake className="w-24 h-24 mb-6 opacity-90" />
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 drop-shadow-md tracking-tight">
          Share More. Buy Less.
        </h1>
        <p className="text-xl md:text-2xl mb-10 max-w-2xl opacity-90 font-medium">
          The Community Resource Exchange Hub (CREH) connects neighbors to securely lend, borrow, and share resources.
        </p>
        <Link 
          to="/discover" 
          className="bg-white text-emerald-700 font-bold text-lg px-8 py-4 rounded-full shadow-xl hover:bg-emerald-50 transition transform hover:-translate-y-1"
        >
          Explore Local Items
        </Link>
      </div>

      {/* Features */}
      <div className="bg-gray-50 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center">
              <div className="bg-emerald-100 p-6 rounded-full mb-6 shadow-sm border border-emerald-200">
                <Map className="w-12 h-12 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Location-Based</h3>
              <p className="text-gray-600 text-lg">Find items right in your neighborhood. Set your radius and discover what your community has to offer.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-blue-100 p-6 rounded-full mb-6 shadow-sm border border-blue-200">
                <ShieldCheck className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Secure Escrow</h3>
              <p className="text-gray-600 text-lg">Borrow with peace of mind. Our escrow system holds deposits securely until items are safely returned.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-amber-100 p-6 rounded-full mb-6 shadow-sm border border-amber-200">
                <PackageOpen className="w-12 h-12 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Easy Sharing</h3>
              <p className="text-gray-600 text-lg">Got tools gathering dust? List them in seconds with photos, manage requests, and chat directly with borrowers.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
