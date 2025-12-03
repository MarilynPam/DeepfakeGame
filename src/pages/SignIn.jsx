import { useState } from "react";
import {useNavigate, Link, useLocation} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {loginUser} from "../api.js";

{/* This page handles user sign in and designs a standard sign in page. */}
{/* Communicates with the db to verify user credentials */}

export function SignIn() {
const l = useLocation();
const un = l.state?.un || "";
const pw = l.state?.pw || "";

  {/* Define variables from imported components */}
  const [username, setUsername] = useState(un);
  const [password, setPassword] = useState(pw);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const { signIn } = useAuth();

  const destination = l.state?.from || '/home';
  const message = l.state?.message;



  {/* Function to handle sign in. Communicate with backend to verify credentials. Once verified, navigate to home page */}
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");

    try {
       const response = await loginUser(username, password);
     //  console.log(response)
       if(response.user_id >= 0){
         // save username
        signIn({username: username, user_id: response.user_id})
         // navigate to home
         navigate(destination, { replace: true });
       }
       else if (response.detail === 'Invalid credentials.'){
         setError("Invalid login credentials");
       }

    //  navigate("/home");
    } catch (err) {
      console.error(err);
      setError("Invalid login credentials"); {/* Catch error */}
    }
  };

  return (
    
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white px-4 font-mono"> {/* Page container. Define bckgrnd, text, and font */}
      {/* Home button at bottom that navigates to landing page */}
      <div className="fixed bottom-0 w-full bg-slate-900 text-white p-2 flex justify-center z-50">
        <button onClick={() => navigate("/")} title="Home" className="p-2 rounded-full bg-slate-900 hover:bg-slate-700">
          <span className="material-icons align-middle">home</span>
        </button>
      </div>
      {message && (
        <div className="alert alert-info text-red-500 text-sm">
          {message}
        </div>
      )}

      {/* Title */}
      <Link to="/" className="mb-6 text-2xl font-bold font-mono text-white hover:text-slate-300">
        Detect the Deepfake
      </Link>


      {/* Sign in form */}
      <div className="bg-slate-800 p-6 rounded-lg shadow-md w-full max-w-md">
        <form onSubmit={handleSignIn} className="bg-slate-800 p-8 rounded space-y-4">
          <h2 className="text-xl text-center">Welcome Back</h2>

          <input
            type="username"
            placeholder="Username"
            className="w-full p-2 rounded text-black bg-white"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 rounded text-black bg-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="w-full bg-indigo-700 hover:bg-indigo-600 text-white p-2 rounded">
            Sign In
          </button>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </form>
      </div>
    </div>
  );
}
