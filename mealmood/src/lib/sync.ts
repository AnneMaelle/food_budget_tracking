import { supabase } from './supabase'
import { Data, DEFAULT_DATA, Meal } from './logic'
import { computeCycle } from './date'

export async function archiveCurrentCycle() {
  // Figure out current cycle start
  const cycle = computeCycle()

  // Fetch current cycle meals
  const { data: currentMeals, error: fetchError } = await supabase
    .from('meals')
    .select('*')
    .gte('at', cycle.startISO)
    .lt('at', cycle.endISO)

  if (fetchError) throw fetchError
  if (!currentMeals || currentMeals.length === 0) return

  // Insert into archive table
  const { error: insertError } = await supabase
    .from('meals_archive')
    .insert(
      currentMeals.map(m => ({
        ...m,
        archive_cycle_start: cycle.startISO,
      }))
    )

  if (insertError) throw insertError

  // Delete from meals table
  const { error: deleteError } = await supabase
    .from('meals')
    .delete()
    .gte('at', cycle.startISO)
    .lt('at', cycle.endISO)

  if (deleteError) throw deleteError
}

export async function fetchMeals() {
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', 'anonymous')
    .order('at', { ascending: false })
  if (error) {
    console.error("❌ fetchMeals error:", error)
    throw new Error("Failed to fetch meals from Supabase")
  }
  return data as Meal[]
}

export async function addMeal(type: Meal['type'], dateISO?: string) {
  const meal: Meal = {
    id: crypto.randomUUID(),
    type,
    at: dateISO ?? new Date().toISOString(), // default to now if no date passed
    notes: '',
    user_id: 'anonymous'
  };
  const { error } = await supabase.from('meals').insert([meal]);
  if (error) throw error;
}


export async function deleteMeal(id: string) {
  const { error } = await supabase.from('meals').delete().eq('id', id)
  if (error) throw error
}

export async function fetchMeta() {
  const { data, error } = await supabase.from('meta').select('*').single()
  if (error) {
    console.error("❌ fetchMeta error:", error)
    throw new Error("Failed to fetch meta from Supabase")
  }
  return {
    bank: data.bank ?? DEFAULT_DATA.bank,
    goals: data.goals ?? DEFAULT_DATA.goals,
    anchorISO: data.anchorISO ?? DEFAULT_DATA.anchorISO,
  }
}

export async function saveMeta(partial: Partial<Pick<Data, 'bank' | 'goals' | 'anchorISO'>>) {
  const existing = await fetchMeta()
  const merged = { ...existing, ...partial }
  const { error } = await supabase.from('meta').upsert({ ...merged, user_id: 'anonymous' })
  if (error) throw error
}

export async function resetAllData() {
  const { error: deleteError } = await supabase.from('meals').delete().not('id', 'is', null)
  if (deleteError) throw new Error(`Failed to delete meals: ${deleteError.message}`)

  const { error: metaError } = await supabase.from('meta').upsert({
    user_id: 'anonymous',
    goals: DEFAULT_DATA.goals,
    bank: DEFAULT_DATA.bank,
    anchorISO: DEFAULT_DATA.anchorISO,
  })
  if (metaError) throw new Error(`Failed to reset meta: ${metaError.message}`)
}

export async function fetchArchivedCycles() {
  const { data, error } = await supabase
    .from('meals_archive')
    .select('*')
    .order('archive_cycle_start', { ascending: false })

  if (error) throw error
  return data
}

export async function updateMealDate(mealId: string, newISODate: string) {
  const { error } = await supabase
    .from('meals')
    .update({ at: newISODate })
    .eq('id', mealId)

  if (error) throw error
}

