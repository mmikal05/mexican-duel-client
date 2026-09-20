// Firebase error codes -> something a player can act on.
const MESSAGES = {
  "auth/invalid-email": "That doesn't look like a valid email address.",
  "auth/missing-password": "Enter your password.",
  "auth/invalid-credential": "Wrong email or password.",
  "auth/wrong-password": "Wrong email or password.",
  "auth/user-not-found": "Wrong email or password.",
  "auth/email-already-in-use": "An account with this email already exists. Try logging in.",
  "auth/weak-password": "Pick a longer password (at least 6 characters).",
  "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
  "auth/network-request-failed": "Can't reach the server. Check your connection.",
};

export const friendlyAuthError = (err) =>
  MESSAGES[err?.code] ?? "Something went wrong. Please try again.";
