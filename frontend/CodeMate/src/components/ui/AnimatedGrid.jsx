export function AnimatedGrid({ children, columns = { base: 1, md: 2 }, gap = 6, className = "" }) {
  const [baseCols, mdCols] = [columns.base, columns.md];
  return (
    <div className={`grid grid-cols-${baseCols} md:grid-cols-${mdCols} gap-${gap} ${className}`}>
      {children}
    </div>
  );
}
