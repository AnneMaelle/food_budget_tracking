import React, { useMemo, useState } from 'react'
import MealButtons from './components/MealButtons'
import Progress from './components/Progress'
import { load, save } from './lib/storage'
import { computeCycle, formatRange } from './lib/date'
import { DEFAULT_DATA, Data, Meal, MealType, progressFor, leftovers, addToBank, borrowFromBank, convertVegetarian } from './lib/logic'

const KEY = 'mealmood:data:v1'

export default function App() {
  const [data, setData] = useState<Data>(() => load<Data>(KEY, DEFAULT_DATA))
  const cycle = useMemo(() => computeCycle(undefined, data.anchorISO), [data.anchorISO])

  const prog = useMemo(() => progressFor(data.meals, cycle.startISO, cycle.endISO), [data.meals, cycle])
  const left = useMemo(() => leftovers(data.goals, prog), [data.goals, prog])
  const borrowed = useMemo(() => borrowFromBank(data.bank, data.goals, prog), [data.bank, data.goals, prog])

  const onLog = (type: MealType) => {
    const meal: Meal = { id: crypto.randomUUID(), type, at: new Date().toISOString() }
    const next = { ...data, meals: [meal, ...data.meals] }
    setData(next); save(KEY, next)
  }

  const endCycleAndBank = () => {
    const nextBank = addToBank(data.bank, left)
    const next = { ...data, bank: nextBank }
    setData(next); save(KEY, next)
    alert('Leftovers added to bank!')
  }

  const convert = () => {
    const nextBank = convertVegetarian(data.bank)
    const next = { ...data, bank: nextBank }
    setData(next); save(KEY, next)
  }

  const resetAll = () => {
    if (!confirm('Reset all data?')) return
    setData(DEFAULT_DATA); save(KEY, DEFAULT_DATA)
  }

  const setAnchor = () => {
    const v = prompt('Set cycle anchor date (YYYY-MM-DD). 14-day periods start from this date.', data.anchorISO.slice(0,10))
    if (!v) return
    const next = { ...data, anchorISO: `${v}T00:00:00.000Z` }
    setData(next); save(KEY, next)
  }

  const missing = borrowed.missing
  const hasOver = missing.vegan>0 || missing.vegetarian>0 || missing.small>0

  return (
    <div className="container">
      <div className="card">
        <h1>MealMood</h1>
        <div className="muted">Cute 14‑day meal budget tracker</div>
        <div className="row" style={{marginTop:8, gap:8}}>
          <button className="pill" onClick={setAnchor}>⚙️ Cycle: {formatRange(cycle)}</button>
          <button className="pill" onClick={resetAll}>🧹 Reset</button>
        </div>
      </div>

      <div className="card">
        <h2>What did you eat?</h2>
        <MealButtons onLog={onLog} />
      </div>

      <Progress label="Vegan" value={prog.vegan} total={data.goals.vegan + data.bank.vegan} hint={`Goal ${data.goals.vegan} • Bank ${data.bank.vegan}`} />
      <Progress label="Vegetarian" value={prog.vegetarian} total={data.goals.vegetarian + data.bank.vegetarian} hint={`Goal ${data.goals.vegetarian} • Bank ${data.bank.vegetarian}`} />
      <Progress label="Small Meat (points)" value={prog.smallPointsUsed} total={data.goals.small + data.bank.small} hint={`Goal ${data.goals.small} • Bank ${data.bank.small} • Big meat used: ${prog.bigCount}× (cost 2)`} />

      <div className="card">
        <div className="row">
          <h2>End of cycle</h2>
          <button className="pill" onClick={endCycleAndBank}>📥 Add leftovers to bank</button>
        </div>
        <div className="muted">
          Leftovers if the cycle ended today: 🥦 {left.vegan}, 🧀 {left.vegetarian}, 🍗 {left.small}
        </div>
        <div style={{marginTop:10}} className="row">
          <button className="pill" onClick={convert}>🔄 Convert 2 🧀 → 1 🥦 + 1 🍗</button>
          <span className="muted">Bank now: 🥦 {data.bank.vegan} • 🧀 {data.bank.vegetarian} • 🍗 {data.bank.small}</span>
        </div>
      </div>

      {hasOver && (
        <div className="card">
          <strong>Over budget this cycle</strong>
          <div className="muted">After borrowing from bank, still missing:</div>
          <ul>
            <li>🥦 Vegan: {missing.vegan}</li>
            <li>🧀 Vegetarian: {missing.vegetarian}</li>
            <li>🍗 Small meat points: {missing.small}</li>
          </ul>
        </div>
      )}

      <div className="footer muted">Install as an app: browser menu → “Add to Home Screen”.</div>
    </div>
  )
}
