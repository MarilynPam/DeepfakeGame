import { Link } from "react-router-dom";
import Runner from "../components/Runner";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { getMyTier } from "../api";

export function HomeScreen() {
    const { user } = useAuth();
    const [userTier, setUserTier] = useState(null);

    // Fetch the user's tier only when logged in
    useEffect(() => {
        if (!user?.user_id) return;

        (async () => {
            try {
                const data = await getMyTier(user.user_id);
                setUserTier(data.tier);
            } catch (err) {
                console.error("Failed to fetch tier:", err);
            }
        })();
    }, [user]);

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white px-4 font-mono">

        <h2 className="text-2xl font-bold mb-6">Detect the Deepfake</h2>

        {/* Logged-in greeting */}
        {user?.username && (
          <p className="text-slate-300 mb-2 text-sm">
            Welcome back, <span className="font-bold">{user.username}</span>!
          </p>
        )}

        {/* Show the user's current tier */}
        {user?.username && userTier && (
          <span className="px-3 py-1 mb-4 rounded-full text-xs bg-slate-800 border border-slate-700">
            Your Tier:&nbsp;
            <span
              className={
                userTier === "Easy"
                  ? "text-green-400"
                  : userTier === "Medium"
                  ? "text-yellow-400"
                  : "text-red-400"
              }
            >
              {userTier}
            </span>
          </span>
        )}

        {/* Navigation buttons */}
        <Link to="/play" className="px-4 py-2 mb-3 bg-slate-900 text-white rounded hover:bg-slate-800">
          Start Game
        </Link>

        <Link to="/leaderboard" className="px-4 py-2 mb-3 bg-slate-900 text-white rounded hover:bg-slate-800">
          View Leaderboard
        </Link>

        <Link to="/tutorial" className="px-4 py-2 mb-6 bg-slate-900 text-white rounded hover:bg-slate-800">
          Tutorial
        </Link>

        {/* Motivational static message (ONLY for logged-in users) */}
        {user?.username && (
          <p className="text-sm text-slate-300 text-center mb-8 max-w-xs">
            Play and try to reach the <span className="text-green-400 font-bold">Easy</span> tier — 
            it means you're fast and accurate at spotting deepfakes!
          </p>
        )}

        <Runner />
      </div>
    );
}
