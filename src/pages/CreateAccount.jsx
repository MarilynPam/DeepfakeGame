import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { registerUser } from "../api";

/* This page handles account creation. It ensures valid credentials are being entered before submission*/

export function CreateAccount() {
  // Form 
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
  });

  // Variables 
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { signIn } = useAuth(); // bring in global auth

  // Input values into the form
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

   // Submit the form if the credentials are valid
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Username validation
    if (form.username.length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }

    // Password length validation
    if (form.password.length < 10) {
      setError("Password must be at least 10 characters long.");
      return;
    }

    // email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(""); // clear old errors

    try {
      // Post to backend
      //const response = await axios.post("http://localhost:8000/signup", form);
    let r = await registerUser({
      username: form.username,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email
    });

      if (!r.user_id) {
       setError("Username or email already exists.");
      }
     else{
       navigate("/sign-in",{state: {un: form.username, pw: form.password}});
     }


    } catch (err) {
      console.error(err);
      setError("Username or email already exists.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white px-4 font-mono"> {/* Page container */}
      <Link to="/" className="mb-2 text-2xl font-bold font-mono text-white hover:text-slate-300">
        Detect the Deepfake {/* Title that links to the home page */}
      </Link>

      <div className="fixed bottom-0 bg-transparent text-white p-2 flex justify-center z-50"> {/* Home button */}
        <button onClick={() => navigate("/")} title="Home" className="p-2 rounded-full bg-transparent hover:bg-slate-700">
          <span className="material-icons align-middle">home</span>
        </button>
      </div>
      
      <div className="bg-slate-800 p-6 rounded-lg shadow-md w-full max-w-md"> {/* Form container */}
        <h2 className="text-xl mb-4 text-center">Create Account</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
          {/* Input fields */}
          <div>
            <label htmlFor="firstName" className="block mb-1">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              className="w-full px-3 py-2 rounded bg-white text-black"
              value={form.firstName}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block mb-1">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              className="w-full px-3 py-2 rounded bg-white text-black"
              value={form.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block mb-1">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full px-3 py-2 rounded bg-white text-black"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="username" className="block mb-1">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              className="w-full px-3 py-2 rounded bg-white text-black"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-1">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="w-full px-3 py-2 rounded bg-white text-black"
              value={form.password}
              onChange={handleChange}
              required
            />
            {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="bg-indigo-700 hover:bg-indigo-600 text-white p-2 rounded"
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}
