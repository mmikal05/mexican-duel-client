import "../styles/login.css";
import { useState } from "react";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // The player's Firestore document is created by GameContext on first load,
  // so registering only has to create the auth account.
  const submit = async (authAction) => {
    setError("");
    try {
      await authAction(auth, email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1 className="login-title">MEXICAN DUEL</h1>

        <input
          className="login-input"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="login-input"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <div style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 8 }}>
            {error}
          </div>
        )}

        <div className="login-buttons">
          <button
            onClick={() => submit(signInWithEmailAndPassword)}
            className="login-btn"
          >
            LOGIN
          </button>
          <button
            onClick={() => submit(createUserWithEmailAndPassword)}
            className="register-btn"
          >
            REGISTER
          </button>
        </div>
      </div>
    </div>
  );
}
