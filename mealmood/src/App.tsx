
import React, { useEffect, useMemo, useState } from 'react'
import MealPlannerCalendar from './components/MealPlannerCalendar'
import Progress from './components/Progress'
import { computeCycle, formatRange } from './lib/date'
import { DEFAULT_DATA, Data, Meal, progressFor, leftovers, addToBank, convertVegetarian } from './lib/logic'
import { fetchMeals, fetchMeta, saveMeta, resetAllData, archiveCurrentCycle } from './lib/sync'

export default function App() {
  const [data, setData] = useState<Omit<Data, 'meals'>>(DEFAULT_DATA)
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        console.log("📦 Starting Supabase fetch...")

        const meta = await fetchMeta()
        console.log("✅ Meta loaded:", meta)

        const allMeals = await fetchMeals()
        console.log("✅ Meals loaded:", allMeals)

        setData({ ...meta })
        setMeals(allMeals)
      } catch (err) {
        console.error("❌ Failed to load Supabase data:", err)
        alert("Supabase error: check browser console")
      } finally {
        setLoading(false)
      }
    })()
  }, [])


  const cycle = useMemo(() => computeCycle(undefined, data.anchorISO), [data.anchorISO])
  const cycleMeals = useMemo(() => meals.filter(m => m.at >= cycle.startISO && m.at < cycle.endISO), [meals, cycle])
  const prog = useMemo(() => progressFor(cycleMeals, cycle.startISO, cycle.endISO), [cycleMeals, cycle])
  const left = useMemo(() => leftovers(data.goals, prog), [data.goals, prog])

  const endCycleAndBank = async () => {
    const nextBank = addToBank(data.bank, left)
    await saveMeta({ bank: nextBank })
    await archiveCurrentCycle()
    const updatedMeta = await fetchMeta()
    setData(updatedMeta)
    alert('Cycle archived and leftovers added to bank!')
  }

  const convert = async () => {
    const nextBank = convertVegetarian(data.bank)
    await saveMeta({ bank: nextBank })
    const updatedMeta = await fetchMeta()
    setData(updatedMeta)
  }

  const resetAll = async () => {
    if (!confirm('Reset all data (meals + bank/goals)?')) return
    try {
      await resetAllData()
      const meta = await fetchMeta()
      setData(meta)
      setMeals([])
    } catch (err) {
      console.error(err)
      alert("Reset failed. See console for details.")
    }
  }

  const setAnchor = async () => {
    const v = prompt('Set cycle anchor date (YYYY-MM-DD)', data.anchorISO.slice(0, 10))
    if (!v) return
    await saveMeta({ anchorISO: `${v}T00:00:00.000Z` })
    const updatedMeta = await fetchMeta()
    setData(updatedMeta)
  }

  if (loading) {
    return <div className="container"><div className="card">Loading…</div></div>
  }

  return (
    <div className="container">
      <div className="card">
        <h1>MealMood</h1>
        <div className="muted">Supabase synced meal tracker</div>
        <div className="row" style={{marginTop:8, gap:8}}>
          <button className="pill" onClick={setAnchor}>⚙️ Cycle: {formatRange(cycle)}</button>
          <button className="pill" onClick={resetAll}>🧹 Reset</button>
        </div>
      </div>

      <MealPlannerCalendar
        meals={cycleMeals}
        remaining={{
          vegan: data.goals.vegan + data.bank.vegan - prog.vegan,
          vegetarian: data.goals.vegetarian + data.bank.vegetarian - prog.vegetarian,
          small: data.goals.small + data.bank.small - prog.smallPointsUsed,
          big: 0 // if you want to track big separately
        }}
        onMealsUpdated={async () => {
          const refreshed = await fetchMeals()
          setMeals(refreshed)
        }}
      />
     
      {/* Progress bars */}
      <Progress label="Vegan" value={prog.vegan} total={data.goals.vegan + data.bank.vegan} hint={`Goal ${data.goals.vegan} • Bank ${data.bank.vegan}`} />
      <Progress label="Vegetarian" value={prog.vegetarian} total={data.goals.vegetarian + data.bank.vegetarian} hint={`Goal ${data.goals.vegetarian} • Bank ${data.bank.vegetarian}`} />
      <Progress label="Small Meat (points)" value={prog.smallPointsUsed} total={data.goals.small + data.bank.small} hint={`Goal ${data.goals.small} • Bank ${data.bank.small} • Big meat used: ${prog.bigCount}× (cost 2)`} />
      
      {/* End of cycle tools */}
      <div className="card">
        <div className="row" style={{flexWrap:'wrap'}}>
          <h2>End of cycle</h2>
          <button className="pill" onClick={endCycleAndBank}>📥 End the cycle and add leftovers to bank</button>
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
        <h2>Recent meals</h2>
        {cycleMeals.length === 0 ? <div className="muted">No meals logged this cycle.</div> : (
          <ul>
            {cycleMeals.map(m => (
              <li key={m.id}>{new Date(m.at).toLocaleString()} — {m.type}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="footer muted">Install as an app: browser menu → “Add to Home Screen”.</div>
    </div>
  )
}
