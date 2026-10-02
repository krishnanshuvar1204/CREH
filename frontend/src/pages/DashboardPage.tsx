import { useEffect, useState } from "react";
import { CreditCard, Package, Star, ShieldAlert, CheckCircle, ArrowLeftRight, X, PlusCircle, MessageCircle } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ChatModal from "../components/ChatModal";

export default function DashboardPage() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const [requests, setRequests] = useState([]);
  const [myResources, setMyResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [resourceImageBase64, setResourceImageBase64] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/users/${user.id}/requests`),
        axios.get(`${import.meta.env.VITE_API_URL}/users/${user.id}/resources`)
      ]).then(([reqRes, resRes]) => {
        setRequests(reqRes.data);
        setMyResources(resRes.data);
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [user]);

  if (!user) {
    return <div className="p-10 text-center text-lg font-bold">Please log in to view your dashboard.</div>;
  }

  // Actions
  const handleAccept = async (reqId: number) => {
    await axios.post(`${import.meta.env.VITE_API_URL}/requests/${reqId}/accept`);
    window.location.reload();
  };

  const handlePay = async (reqId: number) => {
    await axios.post(`${import.meta.env.VITE_API_URL}/requests/${reqId}/pay`);
    alert("Deposit Paid successfully! Escrow mock complete.");
    window.location.reload();
  };

  const handleReturn = async (reqId: number) => {
    await axios.post(`${import.meta.env.VITE_API_URL}/requests/${reqId}/return`);
    window.location.reload();
  };

  const handleReviewReturn = async (reqId: number, isOk: boolean) => {
    const reason = isOk ? "" : prompt("Please describe the damage or missing item:");
    if (!isOk && !reason) return;
    
    await axios.post(`${import.meta.env.VITE_API_URL}/requests/${reqId}/review-return`, { isOk, reason });
    window.location.reload();
  };

  const handleResourceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setResourceImageBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddResource = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          
          await axios.post(`${import.meta.env.VITE_API_URL}/resources`, {
            ownerId: user.id,
            title: formData.get("title"),
            description: formData.get("description"),
            category: formData.get("category"),
            sharing_radius_km: Number(formData.get("radius")),
            lending_duration_days: Number(formData.get("duration")),
            is_donation: formData.get("type") === "donation",
            location: { lat, lng },
            imageBase64: resourceImageBase64
          });
          alert("Resource added successfully!");
          window.location.reload();
        } catch (err) {
          alert("Failed to add resource");
        }
      }, () => {
         alert("Location access is required to share an item.");
      });
    } else {
       alert("Geolocation is not supported by your browser.");
    }
  };

  const myBorrowing = requests.filter((r: any) => r.requester.id === user.id);
  const myLending = requests.filter((r: any) => r.resource.owner.id === user.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="bg-emerald-100 p-4 rounded-full text-emerald-600 shadow-sm border border-emerald-200">
            <Star className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.name}</h1>
            <p className="text-gray-500 font-medium">Reputation Score: 5.0 / 5.0</p>
          </div>
        </div>
        {user.email === "admin@creh.com" && (
          <button onClick={() => navigate('/admin')} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-bold flex items-center shadow-lg">
            <ShieldAlert className="w-5 h-5 mr-2" /> Admin Panel
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Borrowing Requests */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center border-b pb-4">
            <ArrowLeftRight className="mr-3 text-emerald-600" /> Items I'm Borrowing
          </h2>
          <div className="space-y-4">
            {myBorrowing.length === 0 && <p className="text-gray-400 text-center py-4">No active requests.</p>}
            {myBorrowing.map((req: any) => (
              <div key={req.id} className="p-5 border border-gray-100 rounded-xl flex flex-col justify-between bg-gray-50/50 hover:shadow-sm transition">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{req.resource.title}</h3>
                    <p className="text-sm text-gray-500">Owner: {req.resource.owner.name}</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                    {req.status}
                  </span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end space-x-2">
                  {req.status === "ACCEPTED" && (
                    <button onClick={() => handlePay(req.id)} className="flex items-center text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium shadow-sm transition">
                      <CreditCard className="w-4 h-4 mr-2" /> Pay Escrow (${req.security_deposit_amount || 50})
                    </button>
                  )}
                  {req.status === "ACTIVE" && (
                    <button onClick={() => handleReturn(req.id)} className="flex items-center text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium shadow-sm transition">
                      <CheckCircle className="w-4 h-4 mr-2" /> Return Item
                    </button>
                  )}
                  {req.status !== "PENDING" && req.status !== "REJECTED" && (
                     <button onClick={() => setActiveChat(req)} className="flex items-center text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 font-medium transition border border-gray-200">
                       <MessageCircle className="w-4 h-4 mr-2" /> Chat
                     </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lending Requests */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center border-b pb-4">
            <Package className="mr-3 text-amber-600" /> Items I'm Lending (Requests)
          </h2>
          <div className="space-y-4">
            {myLending.length === 0 && <p className="text-gray-400 text-center py-4">You aren't lending anything right now.</p>}
            {myLending.map((req: any) => (
              <div key={req.id} className="p-5 border border-gray-100 rounded-xl flex flex-col justify-between bg-gray-50/50 hover:shadow-sm transition">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{req.resource.title}</h3>
                    <p className="text-sm text-gray-500">Requested by: {req.requester.name}</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                    {req.status}
                  </span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end space-x-2">
                  {req.status === "PENDING" && (
                    <button onClick={() => handleAccept(req.id)} className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium shadow-sm transition">
                      Accept Request
                    </button>
                  )}
                  {req.status === "RETURNED_PENDING_REVIEW" && (
                    <>
                      <button onClick={() => handleReviewReturn(req.id, true)} className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium shadow-sm transition">
                        Confirm OK
                      </button>
                      <button onClick={() => handleReviewReturn(req.id, false)} className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium shadow-sm transition">
                        Report Issue
                      </button>
                    </>
                  )}
                  {req.status !== "PENDING" && req.status !== "REJECTED" && (
                     <button onClick={() => setActiveChat(req)} className="flex items-center text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 font-medium transition border border-gray-200">
                       <MessageCircle className="w-4 h-4 mr-2" /> Chat
                     </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* My Resources Inventory */}
      <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Package className="mr-3 text-emerald-600" /> My Resources Inventory
          </h2>
          <button 
            onClick={() => setIsAddingResource(true)}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition flex items-center shadow-lg hover:-translate-y-0.5"
          >
            <PlusCircle className="w-5 h-5 mr-2" /> Share New Item
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myResources.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-10 border-2 border-dashed border-gray-200 rounded-xl">
              You haven't shared any resources yet.<br/>Help your community by sharing today!
            </div>
          )}
          {myResources.map((res: any) => (
            <div key={res.id} className="border border-gray-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className={`absolute top-0 right-0 px-2 py-1 text-[10px] font-bold text-white ${res.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-gray-500'} rounded-bl-lg`}>
                {res.status}
              </div>
              <h3 className="font-bold text-gray-800 mb-1">{res.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{res.description}</p>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">{res.category}</span>
                <span className="text-gray-600">{res.is_donation ? "Donation" : `${res.lending_duration_days} days`}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Resource Modal */}
      {isAddingResource && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-emerald-50/50">
              <h2 className="text-2xl font-bold text-gray-900">Share New Item</h2>
              <button onClick={() => setIsAddingResource(false)} className="text-gray-400 hover:text-gray-800">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddResource} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                <input name="title" required placeholder="e.g. Cordless Power Drill" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea name="description" required placeholder="Describe the item condition..." className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500" rows={3}></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                  <select name="category" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white">
                    <option>Tools</option>
                    <option>Electronics</option>
                    <option>Outdoors</option>
                    <option>Furniture</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                  <select name="type" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white">
                    <option value="borrow">Lend for Borrowing</option>
                    <option value="donation">Permanent Donation</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Radius (km)</label>
                  <input name="radius" type="number" defaultValue="5" min="1" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Duration (days)</label>
                  <input name="duration" type="number" defaultValue="3" min="1" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Product Photo</label>
                <input type="file" accept="image/*" onChange={handleResourceImageUpload} className="w-full p-2 border rounded-xl" />
                {resourceImageBase64 && <img src={resourceImageBase64} alt="Preview" className="mt-2 h-24 rounded object-cover" />}
              </div>
              
              <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition mt-4">
                List Item for Community
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {activeChat && (
         <ChatModal 
           request={activeChat} 
           currentUser={user} 
           onClose={() => setActiveChat(null)} 
         />
      )}
    </div>
  );
}
