export default function PathChips({ path }: { path: string }) {
  const segments = path.split("/").filter(Boolean);

  return (
    <span className="inline-flex items-center font-mono text-[12px]">
      <span className="text-text-faint">/</span>
      {segments.map((seg, i) => {
        const isParam = seg.startsWith(":");
        return (
          <span key={i} className="inline-flex items-center">
            <span
              className={
                isParam
                  ? "rounded bg-route/10 px-1 py-0.5 text-route"
                  : "px-0.5 py-0.5 text-text"
              }
            >
              {seg}
            </span>
            {i < segments.length - 1 && <span className="text-text-faint">/</span>}
          </span>
        );
      })}
    </span>
  );
}
