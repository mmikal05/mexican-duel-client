import "../styles/login.css";
import { useState } from "react";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useGame } from "../context/GameContext";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export default function Login() {
  const {user} = useGame();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {await signInWithEmailAndPassword(auth, email, password);};

  const register = async () => {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCred.user;

    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      exp: 0,
      coins: 100,
      inventory: {},
      createdAt: Date.now(),
    });
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

        <div className="login-buttons">
          <button onClick={login} className="login-btn">LOGIN</button>
          <button onClick={register} className="register-btn">REGISTER</button>
        </div>
      </div>
    </div>
  );
}