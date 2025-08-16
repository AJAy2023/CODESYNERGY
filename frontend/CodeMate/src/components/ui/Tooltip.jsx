export function Tooltip({ content, children }) {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
        {content}
      </div>
    </div>
  );
}
