import { useState } from "react";
import { loginUser } from "./api"; //  import your API call

function SignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const result = await loginUser(username, password);
    if (result.user_id) {
      alert("Login successful!");
      localStorage.setItem("user_id", result.user_id); // or use Context
    } else {
      alert(result.detail || "Login failed");
    }
  };

  return (
    <div>
      <input placeholder="Username" onChange={e => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
      <button onClick={handleLogin}>Log In</button>
    </div>
  );
}

export default SignIn;
