import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { X, Send, Image as ImageIcon } from "lucide-react";

export default function ChatModal({ request, currentUser, onClose }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/requests/${request.id}/messages`);
      setMessages(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [request.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text && !imageBase64) return;
    
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/requests/${request.id}/messages`, {
        senderId: currentUser.id,
        text,
        imageBase64
      });
      setText("");
      setImageBase64(null);
      fetchMessages();
    } catch (e) {
      console.error(e);
      alert("Failed to send message");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col h-[600px]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h2 className="font-bold text-gray-900">Chat - {request.resource.title}</h2>
            <p className="text-xs text-gray-500">
              {currentUser.email === "admin@creh.com" ? "Admin View" : "Direct Message"}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50" ref={scrollRef}>
          {messages.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-10">No messages yet. Say hello!</p>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender.id === currentUser.id;
            const isAdmin = msg.sender.email === "admin@creh.com";
            
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-gray-400 mb-1 px-1">
                  {isAdmin ? "Admin" : msg.sender.name} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className={`max-w-[80%] rounded-2xl p-3 ${
                  isMe ? 'bg-emerald-600 text-white rounded-tr-none' : 
                  isAdmin ? 'bg-red-600 text-white rounded-tl-none' : 
                  'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                }`}>
                  {msg.image_url && (
                    <img src={`http://localhost:5000${msg.image_url}`} alt="Attached" className="rounded-lg mb-2 max-h-48 object-cover" />
                  )}
                  {msg.text && <p className="text-sm">{msg.text}</p>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-100">
          {imageBase64 && (
            <div className="mb-2 relative inline-block">
              <img src={imageBase64} alt="Preview" className="h-20 rounded border border-gray-200" />
              <button onClick={() => setImageBase64(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center text-xs">&times;</button>
            </div>
          )}
          <form onSubmit={handleSend} className="flex items-center space-x-2">
            <label className="cursor-pointer text-gray-400 hover:text-emerald-600 transition p-2 bg-gray-100 rounded-full">
              <ImageIcon className="w-5 h-5" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            <input 
              type="text" 
              placeholder="Type a message..."
              value={text}
              onChange={e => setText(e.target.value)}
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
            <button type="submit" disabled={!text && !imageBase64} className="bg-emerald-600 text-white p-2 rounded-full hover:bg-emerald-700 disabled:opacity-50 transition">
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
