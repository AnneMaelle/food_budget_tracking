import { supabase } from './supabase'
import { Data, DEFAULT_DATA, Meal } from './logic'

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

export async function addMeal(meal: Meal) {
  const fullMeal = { ...meal, user_id: 'anonymous' } // ✅ ensure user_id is set
  const { error } = await supabase.from('meals').insert([fullMeal])
  if (error) throw error
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
