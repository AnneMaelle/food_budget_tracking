// src/lib/db.ts
import Dexie, { Table } from 'dexie'
import { DEFAULT_DATA, Data, Meal } from './logic'

export class MealMoodDB extends Dexie {
  meals!: Table<Meal, string>
  meta!: Table<{ key: string; value: any }, string>

  constructor() {
    super('MealMoodDB')
    this.version(1).stores({
      meals: '&id, at, type',
      meta: '&key',
    })
  }
}
export const db = new MealMoodDB()

// --- Meta helpers ---
export async function getData(): Promise<Data> {
  const goals = (await db.meta.get('goals'))?.value ?? DEFAULT_DATA.goals
  const bank = (await db.meta.get('bank'))?.value ?? DEFAULT_DATA.bank
  const anchorISO = (await db.meta.get('anchorISO'))?.value ?? DEFAULT_DATA.anchorISO
  const meals = await db.meals.orderBy('at').reverse().toArray()
  return { goals, bank, anchorISO, meals }
}
export async function setGoals(goals: Data['goals']) {
  await db.meta.put({ key: 'goals', value: goals })
}
export async function setBank(bank: Data['bank']) {
  await db.meta.put({ key: 'bank', value: bank })
}
export async function setAnchorISO(anchorISO: string) {
  await db.meta.put({ key: 'anchorISO', value: anchorISO })
}

// --- Meals ---
export async function addMeal(meal: Meal) {
  await db.meals.add(meal)
}
export async function mealsBetween(startISO: string, endISO: string) {
  return db.meals.where('at').between(startISO, endISO, true, false).toArray()
}

// --- Export / Import ---
export async function exportJSON() {
  const data = await getData()
  return JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2)
}
export async function importJSON(jsonStr: string) {
  const parsed = JSON.parse(jsonStr)
  const data: Data = parsed.data ?? parsed
  await db.transaction('readwrite', db.meals, db.meta, async () => {
    await db.meals.clear()
    if (data.meals?.length) await db.meals.bulkAdd(data.meals)
    await db.meta.put({ key: 'goals', value: data.goals })
    await db.meta.put({ key: 'bank', value: data.bank })
    await db.meta.put({ key: 'anchorISO', value: data.anchorISO })
  })
}

// --- One-time migration from the old localStorage key ---
const LS_KEY = 'mealmood:data:v1'
export async function migrateFromLocalStorageIfNeeded() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return
    const data = JSON.parse(raw) as Data
    const existing = await db.meals.count()
    if (existing > 0) return // already migrated
    await importJSON(JSON.stringify({ data }))
    console.info('MealMood: Migrated from localStorage to IndexedDB')
    localStorage.removeItem(LS_KEY)
  } catch (e) {
    console.warn('MealMood: migration skipped', e)
  }
}

export async function clearAll() {
  await db.transaction('readwrite', db.meals, db.meta, async () => {
    await db.meals.clear()
    await db.meta.clear()
    await db.meta.put({ key: 'goals', value: DEFAULT_DATA.goals })
    await db.meta.put({ key: 'bank', value: DEFAULT_DATA.bank })
    await db.meta.put({ key: 'anchorISO', value: DEFAULT_DATA.anchorISO })
  })
}
