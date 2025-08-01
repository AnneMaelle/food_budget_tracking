export type MealType = 'vegan' | 'vegetarian' | 'small' | 'big'

export interface Goals {
  vegan: number
  vegetarian: number
  small: number
}
export interface Bank { vegan: number; vegetarian: number; small: number }
export interface Meal { id: string; type: MealType; at: string; notes?: string }
export interface Data {
  goals: Goals
  bank: Bank
  anchorISO: string
  meals: Meal[] // all meals (history), filtered by cycle for views
}

export const DEFAULT_GOALS: Goals = { vegan: 10, vegetarian: 9, small: 9 }
export const DEFAULT_DATA: Data = {
  goals: DEFAULT_GOALS,
  bank: { vegan: 0, vegetarian: 0, small: 0 },
  anchorISO: '2025-01-01',
  meals: []
}

export type Progress = {
  vegan: number
  vegetarian: number
  smallPointsUsed: number // small meat points consumed (big = 2)
  bigCount: number
}

// Calculate progress within a cycle
export function progressFor(meals: Meal[], startISO: string, endISO: string): Progress {
  const inCycle = meals.filter(m => m.at >= startISO && m.at < endISO)
  let vegan=0, vegetarian=0, small=0, big=0
  for (const m of inCycle) {
    if (m.type==='vegan') vegan++
    else if (m.type==='vegetarian') vegetarian++
    else if (m.type==='small') small++
    else if (m.type==='big') big++
  }
  return { vegan, vegetarian, smallPointsUsed: small + (big*2), bigCount: big }
}

// Compute leftovers (never negative)
export function leftovers(goals: Goals, prog: Progress): { vegan:number; vegetarian:number; small:number } {
  return {
    vegan: Math.max(0, goals.vegan - prog.vegan),
    vegetarian: Math.max(0, goals.vegetarian - prog.vegetarian),
    small: Math.max(0, goals.small - prog.smallPointsUsed),
  }
}

// End-of-cycle bank update: add leftovers to bank
export function addToBank(bank: Bank, left: {vegan:number; vegetarian:number; small:number}) : Bank {
  return {
    vegan: bank.vegan + left.vegan,
    vegetarian: bank.vegetarian + left.vegetarian,
    small: bank.small + left.small,
  }
}

// Apply bank when over budget in a cycle (borrowing). Returns {bankAfter, missing}
export function borrowFromBank(bank: Bank, goals: Goals, prog: Progress) {
  const overVegan = Math.max(0, prog.vegan - goals.vegan)
  const overVegetarian = Math.max(0, prog.vegetarian - goals.vegetarian)
  const overSmall = Math.max(0, prog.smallPointsUsed - goals.small)

  let b = { ...bank }
  const borrow = (k: keyof Bank, amount: number) => {
    const take = Math.min(b[k], amount)
    b[k] -= take
    return amount - take // missing after borrow
  }
  const missV = borrow('vegan', overVegan)
  const missVe = borrow('vegetarian', overVegetarian)
  const missS = borrow('small', overSmall)
  return { bankAfter: b, missing: { vegan: missV, vegetarian: missVe, small: missS } }
}

// Conversion rule: 2 vegetarian -> 1 vegan + 1 small
export function convertVegetarian(bank: Bank): Bank {
  if (bank.vegetarian < 2) return bank
  const times = Math.floor(bank.vegetarian / 2)
  return {
    vegan: bank.vegan + times,
    vegetarian: bank.vegetarian - times*2,
    small: bank.small + times
  }
}
