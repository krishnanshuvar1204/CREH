import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HeartHandshake, UserCircle, ShieldAlert } from "lucide-react";
import axios from "axios";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState("user"); // "user" or "admin"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin ? { email, password } : { name, email, password };
      
      const res = await axios.post(`${import.meta.env.VITE_API_URL}${endpoint}`, payload);
      const user = res.data.user;
      
      if (role === "admin" && user.email !== "admin@creh.com") {
         return alert("This account does not have Admin privileges.");
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(user));
      
      if (user.email === "admin@creh.com" && role === "admin") {
         navigate("/admin");
      } else {
         navigate("/profile");
      }
      
    } catch (error) {
      alert("Authentication failed. Check credentials.");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex justify-center mb-6 text-emerald-600">
          <HeartHandshake className="w-16 h-16" />
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          {isLogin ? "Welcome Back to CREH" : "Join the Community"}
        </h2>

        {/* Role Selector */}
        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
           <button 
             type="button"
             onClick={() => { setRole("user"); }}
             className={`flex-1 flex justify-center items-center py-2 text-sm font-bold rounded-md transition ${role === "user" ? "bg-white shadow-sm text-emerald-700" : "text-gray-500 hover:text-gray-700"}`}
           >
             <UserCircle className="w-4 h-4 mr-2" /> User
           </button>
           <button 
             type="button"
             onClick={() => { setRole("admin"); setIsLogin(true); }}
             className={`flex-1 flex justify-center items-center py-2 text-sm font-bold rounded-md transition ${role === "admin" ? "bg-white shadow-sm text-red-600" : "text-gray-500 hover:text-gray-700"}`}
           >
             <ShieldAlert className="w-4 h-4 mr-2" /> Admin
           </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && role === "user" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input 
                type="text" required
                value={name} onChange={e => setName(e.target.value)}
                className="mt-1 w-full p-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500" 
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input 
              type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              className="mt-1 w-full p-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" required
              value={password} onChange={e => setPassword(e.target.value)}
              className="mt-1 w-full p-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500" 
            />
          </div>
          <button type="submit" className={`w-full text-white font-bold py-2 rounded-lg transition ${role === "admin" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>
            {isLogin ? `Sign In as ${role === 'admin' ? 'Admin' : 'User'}` : "Create Account"}
          </button>
        </form>

        {role === "user" && (
          <p className="mt-6 text-center text-sm text-gray-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-emerald-600 font-semibold hover:underline">
              {isLogin ? "Sign Up" : "Log In"}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
