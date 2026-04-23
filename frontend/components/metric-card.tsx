export function MetricCard({
  label,
  value,
  detail,
  progress,
  tone = 'primary'
}: Readonly<{
  label: string;
  value: string;
  detail: string;
  progress: number;
  tone?: 'primary' | 'accent' | 'success';
}>) {
  return (
    <article className="card metric">
      <div className="stack" style={{ gap: 10 }}>
        <span className="badge">{label}</span>
        <div className="metric__value">{value}</div>
      </div>
      <p className="metric__meta">{detail}</p>
      <div className="metric__bar" aria-hidden="true">
        <span
          style={{
            width: `${progress}%`,
            background:
              tone === 'accent'
                ? 'linear-gradient(90deg, #bfff75, #d4d4d4)'
                : tone === 'success'
                  ? 'linear-gradient(90deg, #8bc34a, #bfff75)'
                  : 'linear-gradient(90deg, #8bc34a, #d4d4d4)'
          }}
        />
      </div>
    </article>
  );
}
