import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

// This page is the game over page. It displays the score and allows the user to play again or go to the leaderboard 
// Runner component is available on this page 

export function GameFinish() {

  {/* Variables */}
  const location = useLocation()
  const navigate = useNavigate();
  const score = location.state?.score || 0;
  const str = "You have a good eye!"
  const str2 = "How about another try?"
  
  // guard against direct access
  useEffect(() => {
    if (!location.state){
      navigate("/");
    }
  }, [location, navigate]);
            
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white px-4 font-mono"> {/* Page container */}
        <h2 className="text-2xl mb-3">Game Over</h2>
       
        {score >= 80 ? ( // offer feedback based on score
          <p>{str}</p>) : (
          <p>{str2}</p>
          )}
        <p className="mb-3">Score: {score}</p>

        {/* Nav buttons */}
        <button 
          onClick={() => navigate("/play")}
          className="mb-2 px-4 py-2 bg-blue-700 rounded hover:bg-blue-600"
        >
          Play Again
        </button>

        <Link to="/leaderboard" className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 hover:text-white">
          View Leaderboard
        </Link>
    

      </div>

      
    );
  }
  export default GameFinish;
