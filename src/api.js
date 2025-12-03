// Base URL comes from Amplify env variable (VITE_API_URL)
//export const API_BASE_URL = import.meta.env.VITE_API_URL;
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";


// For local development only:
//const API_BASE_URL = "http://127.0.0.1:8000";

// Small helper to handle errors consistently
async function handleResponse(res, defaultErrorMsg = "Request failed") {
  if (!res.ok) {
    let msg = defaultErrorMsg;
    try {
      const data = await res.json();
      msg = data.detail || data.message || msg;
    } catch {
      const text = await res.text();
      if (text) msg = text;
    }
    throw new Error(msg);
  }
  return res.json();
}

// -------- USER / AUTH --------

// Register a new user
export async function registerUser(userData) {
  const res = await fetch(`${API_BASE_URL}/api/user/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return handleResponse(res, "Registration failed");
}

// Log in user
export async function loginUser(username, password) {
  const res = await fetch(`${API_BASE_URL}/api/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res, "Login failed");
}

export async function getMyTier(userId) {
  const res = await fetch(`${API_BASE_URL}/api/game/my_tier/${userId}`);
  return handleResponse(res, "Failed to fetch tier");
}


// -------- GAME --------

// Get specific question by ID (if your backend supports it)
export async function getQuestion(questionId) {
  const res = await fetch(`${API_BASE_URL}/api/game/${questionId}`);
  return handleResponse(res, "Failed to fetch question");
}

// Get a random question
export async function getRandomQuestion() {
  const res = await fetch(`${API_BASE_URL}/api/game/random`);
  return handleResponse(res, "Failed to fetch random question");
}

// Submit answer
export async function submitAnswer(data) {
  const res = await fetch(`${API_BASE_URL}/api/game/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to submit answer");
}

// -------- LEADERBOARD --------

export async function getLeaderboard(limit = 10) {
  const res = await fetch(
    `${API_BASE_URL}/api/leaderboard?limit=${encodeURIComponent(limit)}`
  );
  return handleResponse(res, "Failed to fetch leaderboard");
}

export async function submitScore(user_id, score) {
  const res = await fetch(`${API_BASE_URL}/api/leaderboard/submit_score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, score }),
  });
  return handleResponse(res, "Failed to submit score");
}

// -------- MEDIA --------

export async function getQuestionMedia(questionId) {
  const res = await fetch(`${API_BASE_URL}/api/media/${questionId}`);
  return handleResponse(res, "Failed to fetch media");
}

export function getFullMediaUrl(mediaPath) {
  // Adjust to /api/media if that’s your actual route
  return `${API_BASE_URL}/media/${mediaPath}`;
}

// -------- SETTINGS / ACCOUNT --------

export async function updateUsername(username, password, newUsername) {
  if (!username || !password || !newUsername) {
    throw new Error("Missing required fields for username update");
  }

  const res = await fetch(`${API_BASE_URL}/api/user/update-username`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password,
      new_username: newUsername,
    }),
  });

  return handleResponse(res, "Failed to update username");
}

// Update Password
export async function updatePassword(username, current_password, new_password) {
  const res = await fetch(`${API_BASE_URL}/api/user/update-password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      current_password,
      new_password,
    }),
  });

  return handleResponse(res, "Failed to update password");
}

export async function updateEmail(username, password, email, newEmail) {
  const res = await fetch(`${API_BASE_URL}/api/user/update-email`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password,
      email,
      new_email: newEmail,
    }),
  });

  return handleResponse(res, "Failed to update email");
}

export async function getEmail(username, password) {
  const res = await fetch(
    `${API_BASE_URL}/api/user/email?username=${encodeURIComponent(
      username
    )}&password=${encodeURIComponent(password)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );

  const data = await handleResponse(res, "Failed to fetch email");
  return data.email;
}

export async function deactivateAccount(username, password) {
  const res = await fetch(`${API_BASE_URL}/api/user/deactivate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  return handleResponse(res, "Failed to deactivate account");
}
