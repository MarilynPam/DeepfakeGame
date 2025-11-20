const API_BASE_URL = "const API_URL = import.meta.env.VITE_API_URL";  // Changed from local to new ENV variable for hosting/deploy

// Register a new user
export async function registerUser(userData) {
  const res = await fetch(`${API_BASE_URL}/user/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Registration failed");
  }
  
  return await res.json();
}

// Log in user
export async function loginUser(username, password) {
  const res = await fetch(`${API_BASE_URL}/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return await res.json();
}

// Get specific question by ID 
export async function getQuestion(questionId) {
  const res = await fetch(`${API_BASE_URL}/game/${questionId}`);
  return await res.json();
}

// Get a random question
export async function getRandomQuestion() {
  const res = await fetch(`${API_BASE_URL}/game/random`);
  return await res.json();
}

export async function submitAnswer(data){
  const res = await fetch("http://127.0.0.1:8000/api/game/submit",{
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
}

export async function getLeaderboard(limit = 10) {
  const res = await fetch(`http://127.0.0.1:8000/api/leaderboard?limit=${limit}`);
  return await res.json();
}


export async function submitScore(user_id, score){
  const res = await fetch(`${API_BASE_URL}/leaderboard/submit_score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, score }),
  });

  return await res.json();
}


export async function getQuestionMedia(questionId) {
  const res = await fetch(`${API_BASE_URL}/media/${questionId}`);
  return await res.json();
}

export function getFullMediaUrl(mediaPath) {
  return `http://localhost:8000/media/${mediaPath}`;
}

// Settings apis

export async function updateUsername(username, password, newUsername) {
  if (!username || !password || !newUsername) {
    throw new Error("Missing required fields for username update");
  }

  try {
    const res = await fetch(`${API_BASE_URL}/user/update-username`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        new_username: newUsername
      }),
    });

    const responseData = await res.json();
    
    if (!res.ok) {
      console.error("API error response:", responseData);
      throw new Error(responseData.detail || `Error ${res.status}: ${res.statusText}`);
    }

    return responseData;
  } catch (error) {
    console.error("Update username error:", error);
    throw error;
  }
}

// Update Password (for logged-in users) - Fixed
export async function updatePassword(username, current_password, new_password) {
  const res = await fetch(`${API_BASE_URL}/user/update-password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      current_password,
      new_password: new_password,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to update password");
  }
  return await res.json();
}



export async function updateEmail(username, password, email, newEmail) {
  const res = await fetch(`${API_BASE_URL}/user/update-email`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password,
      email,
      new_email: newEmail,
    }),
  });

  if (!res.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update email');
  }

  return await res.json();

  
}

export async function getEmail(username, password) {
  try {
    const res = await fetch(`${API_BASE_URL}/user/email?username=${username}&password=${password}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch email');
    }

    const data = await res.json();
    return data.email;
  } catch (error) {
    console.error('Error fetching email:', error);
    throw error;
  }
}

export async function deactivateAccount(username, password) {
  try {
    const res = await fetch(`${API_BASE_URL}/user/deactivate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage = `Error ${res.status}`;
      
      try {
        // Try to parse as JSON
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
       
        if (errorText) errorMessage = errorText;
      }
      
      throw new Error(errorMessage);
    }
    
    return await res.json();
  } catch (error) {
    console.error("Deactivate account error:", error);
    throw error;
  }
}
