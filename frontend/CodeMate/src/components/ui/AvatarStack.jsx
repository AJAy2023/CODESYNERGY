export function AvatarStack({ users = [], size = 36 }) {
  const overlap = -(size / 3);
  return (
    <div className="flex items-center" style={{ gap: `${overlap}px` }}>
      {users.map((u, idx) => (
        <div
          key={idx}
          className="rounded-full bg-sky-500 flex items-center justify-center text-white"
          style={{ width: size, height: size }}
        >
          {u.name?.[0] || "?"}
        </div>
      ))}
    </div>
  );
}
