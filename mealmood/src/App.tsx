// src/App.tsx
import React, { useEffect, useMemo, useState } from 'react'
import MealButtons from './components/MealButtons'
import Progress from './components/Progress'
import { computeCycle, formatRange } from './lib/date'
import { DEFAULT_DATA, Data, Meal, MealType, progressFor, leftovers, addToBank, convertVegetarian } from './lib/logic'
import { addMeal, getData, setBank, setAnchorISO, clearAll, mealsBetween, migrateFromLocalStorageIfNeeded, exportJSON, importJSON } from './lib/db'

export default function App() {
  const [data, setData] = useState<Data>(DEFAULT_DATA)
  const [loading, setLoading] = useState(true)

  // Initial load + migrate from localStorage if present
  useEffect(() => {
    (async () => {
      await migrateFromLocalStorageIfNeeded()
      const d = await getData()
      setData(d)
      setLoading(false)
    })()
  }, [])

  const cycle = useMemo(() => computeCycle(undefined, data.anchorISO), [data.anchorISO])
  const [cycleMeals, setCycleMeals] = useState<Meal[]>([])
  useEffect(() => {
    (async () => {
      const ms = await mealsBetween(cycle.startISO, cycle.endISO)
      setCycleMeals(ms.sort((a,b) => b.at.localeCompare(a.at)))
    })()
  }, [cycle, loading])

  const prog = useMemo(() => progressFor(cycleMeals, cycle.startISO, cycle.endISO), [cycleMeals, cycle])
  const left = useMemo(() => leftovers(data.goals, prog), [data.goals, prog])

  const onLog = async (type: MealType) => {
    const meal: Meal = { id: crypto.randomUUID(), type, at: new Date().toISOString() }
    await addMeal(meal)
    const ms = await mealsBetween(cycle.startISO, cycle.endISO)
    setCycleMeals(ms.sort((a,b) => b.at.localeCompare(a.at)))
  }

  const endCycleAndBank = async () => {
    const nextBank = addToBank(data.bank, left)
    await setBank(nextBank)
    const fresh = await getData()
    setData(fresh)
    alert('Leftovers added to bank!')
  }

  const convert = async () => {
    const nextBank = convertVegetarian(data.bank)
    await setBank(nextBank)
    const fresh = await getData()
    setData(fresh)
  }

  const resetAll = async () => {
    if (!confirm('Reset all data?')) return
    await clearAll()
    const fresh = await getData()
    setData(fresh); setCycleMeals([])
  }

  const setAnchor = async () => {
    const v = prompt('Set cycle anchor date (YYYY-MM-DD). 14-day periods start from this date.', data.anchorISO.slice(0,10))
    if (!v) return
    await setAnchorISO(`${v}T00:00:00.000Z`)
    const fresh = await getData()
    setData(fresh)
  }

  const handleExport = async () => {
    const json = await exportJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mealmood-export-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (file: File) => {
    const text = await file.text()
    await importJSON(text)
    const fresh = await getData()
    setData(fresh)
    const ms = await mealsBetween(cycle.startISO, cycle.endISO)
    setCycleMeals(ms.sort((a,b) => b.at.localeCompare(a.at)))
  }

  if (loading) {
    return <div className="container"><div className="card">Loading…</div></div>
  }

  return (
    <div className="container">
      <div className="card">
        <h1>MealMood</h1>
        <div className="muted">Cute 14‑day meal budget tracker (IndexedDB)</div>
        <div className="row" style={{marginTop:8, gap:8, flexWrap:'wrap'}}>
          <button className="pill" onClick={setAnchor}>⚙️ Cycle: {formatRange(cycle)}</button>
          <button className="pill" onClick={resetAll}>🧹 Reset</button>
          <button className="pill" onClick={handleExport}>⬇️ Export</button>
          <label className="pill" style={{cursor:'pointer'}}>
            ⬆️ Import
            <input type="file" accept="application/json" style={{display:'none'}} onChange={e => e.target.files && handleImport(e.target.files[0])} />
          </label>
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
        <div className="row" style={{flexWrap:'wrap'}}>
          <h2>End of cycle</h2>
          <button className="pill" onClick={endCycleAndBank}>📥 Add leftovers to bank</button>
          <button className="pill" onClick={convert}>🔄 Convert 2 🧀 → 1 🥦 + 1 🍗</button>
        </div>
        <div className="muted" style={{marginTop:6}}>
          Leftovers if the cycle ended today: 🥦 {left.vegan}, 🧀 {left.vegetarian}, 🍗 {left.small}
        </div>
        <div className="muted" style={{marginTop:6}}>
          Bank now: 🥦 {data.bank.vegan} • 🧀 {data.bank.vegetarian} • 🍗 {data.bank.small}
        </div>
      </div>

      <div className="card">
        <h2>Recent meals (this cycle)</h2>
        {cycleMeals.length === 0 ? <div className="muted">No meals logged yet.</div> : (
          <ul>
            {cycleMeals.slice(0,12).map(m => (
              <li key={m.id}>{new Date(m.at).toLocaleString()} — {m.type}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="footer muted">Install as an app: browser menu → “Add to Home Screen”.</div>
    </div>
  )
}
