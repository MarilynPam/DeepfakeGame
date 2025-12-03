import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from "../context/AuthContext";
import { getFullMediaUrl, getRandomQuestion, submitAnswer, getQuestionMedia, submitScore } from "../api";
import Runner from '../components/Runner';

// This page is the game container. It displays 4 images or videos which the user may choose from. 
// Runner component is available on this page 
let askedQuestions = Array(100).fill(false);

function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function GameScreen() {
  const navigate = useNavigate()
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isAnswered, setIsAnswered] = useState(false)
  const [correctId, setCorrectId] = useState(null)
  const [question, setQuestion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, signOut } = useAuth();
  const maxRounds = 5;
  const [questionCount, setQuestionCount] = useState(1);
  const [gameFinished, setGameFinished] = useState(false);
  const [feedback, setFeedback] = useState({
    show: false,
    isCorrect: false,
    correctAnswer: null,
    explanation: null,
    tier: null,
  });
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [userTier, setUserTier] = useState(null);
  // console.log("Logged in as:", user);

  // Reset askedQuestions when component mounts
  useEffect(() => {
    askedQuestions = Array(100).fill(false);
  }, []);

  useEffect(() => {
    const fetchQuestion = async () => {
      setIsLoading(true);
      let result = await getRandomQuestion();

      while (askedQuestions[result.question_id] === true) {
        result = await getRandomQuestion();
      }

      askedQuestions[result.question_id] = true;

      if (result !== "undefined" && !result.error) {
        const media = await getQuestionMedia(result.question_id);
        // transform backend image paths to match my folder
        const images = result.answers.map((a, index) => {
          const isTextQuestion =
            !a.text.includes('.jpg') &&
            !a.text.includes('.png') &&
            !a.text.includes('.mp4');
          const isVideo = a.text.includes('.mp4');
          return {
            id: a.id,
            url: isTextQuestion ? null : getFullMediaUrl(media.media_urls[index]),
            text: isTextQuestion ? a.text : null,
            isDeepfake: a.correct,
            isVideo: isVideo,
            feedback: a.feedback
          }
        });

        // Shuffle the images array
        const shuffledImages = shuffleArray(images);

        // Find the index of the correct answer after shuffling
        const correctIndex = shuffledImages.findIndex(img => img.isDeepfake);

        setQuestion({
          question_id: result.question_id,
          question_text: result.question_text,
          images: shuffledImages,
          correctIndex: correctIndex
        });
        setQuestionStartTime(Date.now());
      }
      setIsLoading(false);
    };
    fetchQuestion();
  }, [questionCount]);

  useEffect(() => {
    if (question) {
      const correct = question.images[question.correctIndex];
      if (correct) setCorrectId(correct.id);
    }
  }, [question]);

  useEffect(() => {
    if (gameFinished) {
      const submitFinalScore = async () => {
        if (user?.user_id) {
          await submitScore(user.user_id, score);
        }
        navigate("/fin", { state: { score } });
      };
      submitFinalScore();
    }
  }, [gameFinished, score, user, navigate]);

  // Function to handle user answer selection
  const handleAnswer = async (image) => {
    if (isAnswered) return;

    const now = Date.now();
    const responseTimeMs = questionStartTime ? (now - questionStartTime) : 0;

    setSelected(image.id);
    setShowFeedback(true);

    let earned = 0;
    const isCorrect = image.id === correctId;

    if (isCorrect) {
      earned = 10;
      setScore((prev) => prev + earned);
    }

    // Set feedback using the question data
    const correctAnswer = question.images.find(img => img.isDeepfake);
    setFeedback({
      show: true,
      isCorrect: isCorrect,
      correctAnswer: correctAnswer,
      explanation:
        correctAnswer?.feedback ||
        'This was the real image. Look for unnatural features, background inconsistencies, or unusual details.',
      tier: null,   // will be filled after backend call (if logged in)
    });

    setIsAnswered(true);

    // Only log to backend / ML if the user is logged in
    if (user?.user_id) {
      try {
        const res = await submitAnswer({
          user_id: user.user_id,
          question_id: question.question_id,
          selected_id: image.id,
          correct_id: correctId,
          score_earned: earned,
          response_time_ms: responseTimeMs,
        });

        console.log("Submit response:", res);

        setFeedback(prev => ({
          ...prev,
          tier: res.tier || "Unrated",
        }));

        if (res.tier){
          setUserTier(res.tier);
        }

      } catch (err) {
        console.error("Failed to submit answer:", err);
      }
    }
  };

  // Function to go to the next question
  const handleNext = () => {
    setSelected(null);
    setShowFeedback(false);
    setIsAnswered(false);
    setCorrectId(null);
    setFeedback({
      show: false,
      isCorrect: false,
      correctAnswer: null,
      explanation: null,
      tier: null,
    });
    setIsLoading(true);

    setQuestionCount((prev) => {
      const newCount = prev + 1;
      if (newCount > maxRounds) {
        askedQuestions = Array(100).fill(false);
        setGameFinished(true);
      }
      return newCount;
    });
  };

  if (isLoading || !question) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-xl font-mono">Loading question...</p>
          <p className="text-slate-400 text-sm">Preparing your deepfake challenge</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center gap-8 p-4">
      {user?.username ? (
        <p className="text-sm text-slate-400 font-mono">
          Welcome, {user.username}!
        </p>
      ) : (
        <p className="text-sm text-yellow-400 font-mono">
          Playing as guest – your scores won't be saved.
        </p>
      )}

      {user?.username && userTier && (
        <span className="mt-1 px-3 py-1 rounded-full text-xs font-mono bg-slate-800 border border-slate-600">
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

      <p className="text-sm text-slate-400 font-mono">
        Round {questionCount} / {maxRounds}
      </p>

      {/* Question text display */}
      <div className="text-center max-w-2xl">
        <p className="text-2xl font-mono mb-4">{question.question_text}</p>
      </div>

      {feedback.show && (
        <div className={`p-4 rounded-lg mb-4 ${feedback.isCorrect ? 'bg-green-900' : 'bg-red-900'}`}>
          {feedback.isCorrect ? (
            <div className="text-green-300">
              <p>Correct! +10 points</p>
              <p className="text-sm mt-2">
                {feedback.correctAnswer?.text
                  ? 'Correct answer!'
                  : 'You correctly identified the deepfake!'}
              </p>
            </div>
          ) : (
            <div className="text-red-300">
              <p>Incorrect!</p>
              <p className="text-sm mt-2">{feedback.explanation}</p>
            </div>
          )}

          {feedback.tier && (
            <p className="text-sm mt-2 text-blue-300">
              Difficulty Tier: {feedback.tier}
            </p>
          )}
        </div>
      )}

      {/* Answers grid - supports both images and text */}
      <div className="grid grid-cols-2 gap-4">
        {question.images.map((item) => {
          let borderColor = 'border-transparent'

          if (isAnswered) {
            if (item.id === correctId) {
              borderColor = 'border-green-500'
            } else if (item.id === selected) {
              borderColor = 'border-red-500'
            }
          }

          return (
            <button
              key={item.id}
              onClick={() => handleAnswer(item)}
              disabled={isAnswered}
              className={`border-4 rounded-lg overflow-hidden ${borderColor} hover:bg-slate-800 transition-colors flex items-center justify-center`}
            >
              {item.url ? (
                item.isVideo ? (
                  // Video answer
                  <video
                    src={item.url}
                    className="w-80 h-80 object-cover"
                    controls
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  // Image answer
                  <img
                    src={item.url}
                    alt="choice"
                    className="w-80 h-80 object-contain"
                  />
                )
              ) : (
                // Text answer
                <div className="p-6 min-w-[300px]">
                  <p className="text-center break-words">
                    {item.text}
                  </p>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {showFeedback && (
        <div className="flex flex-col items-center">
          <button
            onClick={handleNext}
            className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 font-mono"
          >
            Continue
          </button>
        </div>
      )}
      <Runner />
    </div>
  )
}