// The name other players see: the part of the email before the @, capitalised.
// (Never send the full email to the server or to opponents.)
export const playerName = (email = "") => {
  const local = email.split("@")[0] || "Player";
  return local.charAt(0).toUpperCase() + local.slice(1);
};
