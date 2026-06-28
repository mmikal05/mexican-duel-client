export default function BottomNav({ setScreen }) {
  return (
    <div className="bottom-nav">
      <button onClick={() => setScreen("farm")}>Farm</button>
      <button onClick={() => setScreen("forest")}>Forest</button>
      <button onClick={() => setScreen("mine")}>Mine</button>
      <button onClick={() => setScreen("shed")}>Shed</button>
      <button onClick={() => setScreen("workshop")}>Workshop</button>
      <button onClick={() => setScreen("armoury")}>Armoury</button>
      <button onClick={() => setScreen("duel")}>Duel</button>
      <button onClick={() => setScreen("profile")}>Profile</button>
      <button onClick={() => setScreen("shop")}>Shop</button>
    </div>
  );
}