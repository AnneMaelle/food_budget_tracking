import React from 'react'

type Props = {
  label: string
  value: number
  total: number
  hint?: string
}
export default function Progress({ label, value, total, hint }: Props) {
  const pct = Math.min(100, Math.round((value/total)*100))
  return (
    <div className="card">
      <div className="row">
        <strong>{label}</strong>
        <span className="pill">{value} / {total}</span>
      </div>
      <div className="bar" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={total}>
        <span style={{ width: `${pct}%` }} />
      </div>
      {hint && <div className="muted" style={{marginTop:8}}>{hint}</div>}
    </div>
  )
}
