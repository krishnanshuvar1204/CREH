import { useEffect, useState } from "react";
import axios from "axios";
import { ShieldAlert, CheckCircle, XCircle, MessageCircle } from "lucide-react";
import ChatModal from "../components/ChatModal";

export default function AdminDashboard() {
  const [disputes, setDisputes] = useState([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    const fetchDisputes = async () => {
       try {
         const res = await axios.get(`${import.meta.env.VITE_API_URL}/disputes`);
         setDisputes(res.data);
       } catch (e) {
         console.error(e);
       }
    };
    fetchDisputes();
  }, []);

  if (!user || user.email !== "admin@creh.com") {
    return <div className="p-10 text-center text-lg text-red-500 font-bold">Unauthorized. Admin only.</div>;
  }

  const handleResolve = async (disputeId: number, refundRequester: boolean) => {
      const notes = prompt("Enter admin resolution notes:");
      if (notes === null) return;
      try {
          await axios.post(`${import.meta.env.VITE_API_URL}/disputes/${disputeId}/resolve`, {
              refundRequester,
              adminNotes: notes
          });
          alert("Dispute resolved successfully.");
          window.location.reload();
      } catch (e) {
          alert("Failed to resolve dispute");
      }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <h1 className="text-3xl font-bold text-gray-900 flex items-center mb-8">
        <ShieldAlert className="w-8 h-8 mr-3 text-red-600" /> Admin Dispute Resolution Panel
      </h1>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
         {disputes.length === 0 ? (
             <p className="text-gray-500 italic text-center py-10">No active disputes.</p>
         ) : (
             <div className="space-y-4">
                 {disputes.map((d: any) => (
                     <div key={d.id} className="border border-red-200 bg-red-50 p-4 rounded-xl">
                         <div className="flex justify-between">
                             <h3 className="font-bold text-red-900">Dispute #{d.id} - {d.request.resource.title}</h3>
                             <span className="bg-red-200 text-red-800 px-2 py-1 rounded text-xs font-bold">{d.status}</span>
                         </div>
                         <div className="mt-2 grid grid-cols-2 gap-4 text-sm bg-white p-3 rounded border border-red-100">
                             <div>
                                 <strong>Raised By:</strong> {d.raised_by.name} ({d.raised_by.email})
                             </div>
                             <div>
                                 <strong>Requester:</strong> {d.request.requester.name} ({d.request.requester.email})
                             </div>
                         </div>
                         <p className="text-sm mt-3"><strong>Reason:</strong> {d.reason}</p>
                         
                         {d.status === "OPEN" && (
                             <div className="mt-4 flex space-x-3 border-t border-red-200 pt-3">
                                 <button onClick={() => handleResolve(d.id, true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center hover:bg-blue-700">
                                     <CheckCircle className="w-4 h-4 mr-1" /> Rule for Requester (Refund Deposit)
                                 </button>
                                 <button onClick={() => handleResolve(d.id, false)} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm flex items-center hover:bg-amber-700">
                                     <XCircle className="w-4 h-4 mr-1" /> Rule for Owner (Pay Escrow to Owner)
                                 </button>
                                 <button onClick={() => setActiveChat(d.request)} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm flex items-center hover:bg-gray-900 ml-auto">
                                     <MessageCircle className="w-4 h-4 mr-1" /> Open Chat Thread
                                 </button>
                             </div>
                         )}
                         {d.status === "RESOLVED" && (
                             <div className="mt-4 bg-white p-3 rounded border border-gray-200">
                                 <p className="text-sm text-gray-600"><strong>Resolution Notes:</strong> {d.admin_notes}</p>
                             </div>
                         )}
                     </div>
                 ))}
             </div>
         )}
      </div>

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
