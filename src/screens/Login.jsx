import "../styles/login.css";
import { useState } from "react";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { friendlyAuthError } from "../authErrors";

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const registering = mode === "register";

  // The player's Firestore document is created by GameContext on first load,
  // so registering only has to create the auth account.
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;

    setError("");
    setBusy(true);
    try {
      const action = registering ? createUserWithEmailAndPassword : signInWithEmailAndPassword;
      await action(auth, email.trim(), password);
    } catch (err) {
      setError(friendlyAuthError(err));
      setBusy(false);
    }
    // on success the app swaps this screen out, nothing left to reset
  };

  const switchMode = (next) => {
    setMode(next);
    setError("");
  };

  return (
    <main className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo" aria-hidden="true">⚔️</div>
        <h1 className="login-title">Mexican Duel</h1>
        <p className="login-tagline muted">Farm, trade and duel your way to the top.</p>

        <div className="login-tabs" role="tablist" aria-label="Account">
          <button
            type="button"
            role="tab"
            aria-selected={!registering}
            className={!registering ? "active" : ""}
            onClick={() => switchMode("login")}
          >
            Log in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={registering}
            className={registering ? "active" : ""}
            onClick={() => switchMode("register")}
          >
            Sign up
          </button>
        </div>

        <div className="login-field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            className="input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="login-field">
          <label htmlFor="login-password">Password</label>
          <div className="login-password">
            <input
              id="login-password"
              className="input"
              type={showPassword ? "text" : "password"}
              autoComplete={registering ? "new-password" : "current-password"}
              placeholder={registering ? "At least 6 characters" : "Your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="login-eye"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}

        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? "Please wait…" : registering ? "Create account" : "Log in"}
        </button>
      </form>
    </main>
  );
}
