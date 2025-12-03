import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";
import { getLeaderboard } from "../api";
import Runner from '../components/Runner';

// This page establishes the leaderboard.  

export function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const { user, signOut } = useAuth();
  //console.log("Logged in as:", user?.username);

  // Communicate with backend to find top players 
  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const res = await getLeaderboard();
        setLeaders(res)
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err)
      }
    };
    fetchLeaders();
  }, []);


  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center"> {/* Page contianer */}
      <Link to="/" className="text-2xl font-bold mb-6 font-mono text-white hover:text-slate-300"> {/* Title that can take the user to the homepage */}
        Detect the Deepfake
      </Link>
      
      <h2 className="text-xl mb-4 font-mono">Top 5 Players</h2>

      <div className="w-full max-w-md bg-slate-800 rounded-xl p-4 shadow-lg"> {/* Leaderboard container */}
        {leaders.length === 0 ? (
          <p className="text-center text-gray-400 font-mono">No scores yet!</p>
        ) : (
          <table className="w-full text-left"> {/* Display names and high scores in a table format */}
            <thead>
              <tr className="border-b border-slate-600">
                <th className="py-2 font-mono">Username</th>
                <th className="py-2 text-right font-mono">High Score</th>
                <th className="py-2 text-center font-mono">Difficulty Tier</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((user, idx) => {
                let tierColor = "text-gray-300";
                if (user.tier === "Easy") tierColor = "text-green-400";
                else if (user.tier === "Medium") tierColor = "text-yellow-400";
                else if (user.tier === "Hard") tierColor = "text-red-400";

                return (
                  <tr key={idx} className="border-b border-slate-700">
                    <td className="py-2">{user.username}</td>
                    <td className="py-2 text-right">{user.score}</td>
                    <td className={`py-2 text-center font-mono ${tierColor}`}>
                      {user.tier || "Unrated"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

        )}
      </div>
        <Runner/>
    </div>
  )
}

export default Leaderboard;
