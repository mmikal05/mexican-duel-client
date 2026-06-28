export default function ScreenWrapper({ title, children }) {
  return (
    <div className="screen">
      <h2>{title}</h2>
      {children}
    </div>
  );
}