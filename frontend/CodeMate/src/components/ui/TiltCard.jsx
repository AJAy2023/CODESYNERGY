export function TiltCard({ children, className = "" }) {
  return (
    <div className={`transform hover:scale-[1.02] transition-transform duration-300 rounded-2xl shadow-lg ${className}`}>
      {children}
    </div>
  );
}
