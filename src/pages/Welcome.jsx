import { Link } from "react-router-dom";

{/*This file contains the design logic and navigation buttons of the landing page*/}

export function Welcome() {
    return(
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white px-4 font-mono"> {/* Page container. Background color, font and text properties */}
        <h2 className="text-2xl font-bold">Detect the Deepfake</h2> {/* Title */}

        {/* Login, Create Account, and Guest buttons that navigate to their respective pages */}
        <Link to="/sign-in" className="px-4 py-2  bg-slate-900 text-white rounded hover:bg-slate-800 hover:text-white">
          Log In
        </Link>
         
        <Link to="/sign-up" className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 hover:text-white">
          Create Account
        </Link>

        <Link to="/home" className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 hover:text-white">
          Continue as Guest
        </Link>

        </div>
    );
}