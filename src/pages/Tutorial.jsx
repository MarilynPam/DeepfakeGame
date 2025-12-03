import { useNavigate } from 'react-router-dom';

/* This page gives the user info on how to play the game + tips on how to spot deepfakes*/
/* Runner component is available on this page */
export function Tutorial() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 font-mono"> {/* Page container. Set text, font, and background color*/}
      <div className="max-w-3xl mx-auto"> 
        <h2 className="text-2xl font-bold mb-6 text-center">How to Play</h2>
        
        <div className="bg-slate-800 rounded-xl p-6 shadow-lg mb-8"> {/* Text container */}
          <h3 className="text-xl font-semibold mb-4">Welcome to Deepfake Detector!</h3>
          <p className="mb-6">
            Test your ability to spot AI-generated images and videos. 
            Can you tell which image is the deepfake?
          </p>
          {/* Game Rules*/}
          <h3 className="text-xl font-semibold mb-3">Game Rules:</h3>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>In each round, you'll be shown 4 images</li>
            <li>Only ONE of these images is a deepfake (AI-generated)</li>
            <li>Click on the image you believe is the deepfake</li>
            <li>Score points for correct answers</li>
            <li>Try to achieve the highest score possible!</li>
          </ul>
          {/* Detection Tips */}
          <h3 className="text-xl font-semibold mb-3">How to Spot Deepfakes:</h3>
          <ul className="list-disc pl-6 space-y-3 mb-6">
            <li>
              <strong>Unnatural Features:</strong> Look for asymmetrical facial features, 
              strange teeth, oddly shaped ears, or unusual eye placement
            </li>
            <li>
              <strong>Background Inconsistencies:</strong> AI often struggles with 
              creating coherent backgrounds or smooth transitions between foreground and background
            </li>
            <li>
              <strong>Weird Hands:</strong> AI commonly produces hands with incorrect 
              finger counts or unnatural positions
            </li>
            <li>
              <strong>Hair Details:</strong> Check for unnatural hair patterns, 
              especially where hair meets the forehead or around the edges
            </li>
            <li>
              <strong>Lighting and Shadows:</strong> Inconsistent lighting and shadows 
              that don't match the scene can indicate a deepfake
            </li>
          </ul>
          
          {/* Scoring */}
          <h3 className="text-xl font-semibold mb-3">Scoring:</h3>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>Correct answer: +10 points</li>
            <li>Your score is tracked across rounds</li>
            <li>Compete for a spot on the leaderboard!</li>
          </ul>
        </div>
                
      </div>
    </div>
  );
}