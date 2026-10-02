import { useState, useEffect } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Package, Search, Star, MapPin, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function DiscoveryPage() {
  const [viewState, setViewState] = useState({
    longitude: -122.4,
    latitude: 37.8,
    zoom: 12
  });
  
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [radiusKm, setRadiusKm] = useState(15);
  const [selectedResource, setSelectedResource] = useState<any>(null);

  // Ask for location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setViewState((prev) => ({
          ...prev,
          longitude: pos.coords.longitude,
          latitude: pos.coords.latitude,
          zoom: 13
        }));
      });
    }
  }, []);
  
  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["resources", viewState.latitude, viewState.longitude, radiusKm],
    queryFn: async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/resources/nearby`, {
          params: { lat: viewState.latitude, lng: viewState.longitude, radiusKm }
        });
        return res.data;
      } catch (err) {
        // Fallback for visual mock if backend is empty
        return [
          { id: 101, title: "DeWalt Power Drill", category: "Tools", description: "Hardly used power drill, perfect for home projects.", is_donation: false, lending_duration_days: 7, location: { coordinates: [-122.41, 37.79] }, owner: { name: "Alice", reputation: 4.8 } },
          { id: 102, title: "Camping Tent (4 Person)", category: "Outdoors", description: "Waterproof tent, great for weekend trips.", is_donation: false, lending_duration_days: 14, location: { coordinates: [-122.39, 37.81] }, owner: { name: "Bob", reputation: 5.0 } }
        ];
      }
    }
  });

  return (
    <div className="flex flex-1 h-[calc(100vh-64px)] relative">
      {/* Sidebar */}
      <div className="w-96 bg-white shadow-2xl z-10 flex flex-col border-r border-gray-100">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Discover Nearby</h2>
          
          <div className="relative mb-6">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-emerald-600" />
            <input 
              type="text" 
              placeholder="What do you need?" 
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center">
                <MapPin className="w-4 h-4 mr-1 text-emerald-500" /> Search Radius
              </label>
              <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{radiusKm} km</span>
            </div>
            <input 
              type="range" min="1" max="50" value={radiusKm}
              onChange={(e) => setRadiusKm(parseInt(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
          {isLoading ? (
             <div className="flex justify-center items-center h-32">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
             </div>
          ) : resources.length === 0 ? (
             <div className="text-center text-gray-500 py-10 bg-white rounded-xl border border-dashed border-gray-300">No resources found.<br/>Try expanding your radius.</div>
          ) : (
            resources.map((resource: any) => (
              <div 
                key={resource.id} 
                onClick={() => setSelectedResource(resource)}
                className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all transform hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">{resource.title}</h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase tracking-wider px-2 py-1 rounded-lg font-bold">
                    {resource.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{resource.description}</p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <div className="flex items-center text-xs text-gray-500 font-medium">
                    <Package className="w-4 h-4 mr-1.5 text-emerald-600" />
                    {resource.is_donation ? "Donation" : `Borrow (${resource.lending_duration_days} days)`}
                  </div>
                  {resource.owner && (
                    <div className="flex items-center text-xs font-semibold text-amber-500">
                      <Star className="w-3.5 h-3.5 mr-1 fill-current" />
                      {resource.owner.reputation}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mapbox Map */}
      <div className="flex-1 relative bg-gray-100">
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/light-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
        >
          <NavigationControl position="top-right" />
          
          {userLocation && (
            <Marker longitude={userLocation.lng} latitude={userLocation.lat}>
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
            </Marker>
          )}
          
          {resources.map((res: any) => {
            if (!res.location || !res.location.coordinates) return null;
            const [lng, lat] = res.location.coordinates;
            return (
              <Marker key={res.id} longitude={lng} latitude={lat}>
                <div 
                  onClick={() => setSelectedResource(res)}
                  className="bg-emerald-600 text-white p-2 rounded-xl shadow-xl cursor-pointer transform transition hover:scale-110 hover:bg-emerald-500 border-2 border-white"
                >
                   <Package className="w-4 h-4" />
                </div>
              </Marker>
            );
          })}
        </Map>
      </div>

      {/* Request Modal */}
      {selectedResource && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="relative h-48 bg-emerald-600 p-6 flex items-end" style={selectedResource.image_url ? { backgroundImage: `url(http://localhost:5000${selectedResource.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
              {selectedResource.image_url && <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>}
              <button 
                onClick={() => setSelectedResource(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full p-2 transition z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-3xl font-bold text-white drop-shadow-md z-10">{selectedResource.title}</h2>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Owner</p>
                  <p className="font-semibold text-gray-800 flex items-center">
                    {selectedResource.owner?.name || "Community Member"}
                    <span className="ml-2 flex items-center text-amber-500 text-sm bg-amber-50 px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3 mr-1 fill-current" /> {selectedResource.owner?.reputation || 5.0}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Terms</p>
                  <p className="font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                    {selectedResource.is_donation ? "Free Donation" : `Borrow for ${selectedResource.lending_duration_days} days`}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600 leading-relaxed text-sm">{selectedResource.description}</p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start space-x-3">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600 mt-0.5">
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-900">Security Deposit Escrow</h4>
                  <p className="text-xs text-blue-700 mt-1">A mock deposit of $50 will be held to ensure safe return. It will be fully refunded when the owner confirms receipt.</p>
                </div>
              </div>

              <button 
                onClick={async () => {
                  const userStr = localStorage.getItem("user");
                  if (!userStr) return alert("Please log in first!");
                  const user = JSON.parse(userStr);
                  
                  try {
                    await axios.post(`${import.meta.env.VITE_API_URL}/requests`, {
                      resourceId: selectedResource.id,
                      requesterId: user.id,
                      security_deposit_amount: 50.00
                    });
                    alert("Request sent successfully! Check your dashboard to pay the deposit once accepted.");
                    setSelectedResource(null);
                  } catch (e: any) {
                    alert(e.response?.data?.error || "Error sending request");
                  }
                }}
                className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Request Item (Awaiting Escrow)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
