import React from 'react'
import { MealType } from '@/lib/logic'

type Props = {
  onLog: (type: MealType) => void
}
export default function MealButtons({ onLog }: Props) {
  return (
    <div className="grid">
      <button className="btn veg" onClick={() => onLog('vegan')}>🥦 Vegan</button>
      <button className="btn vegetarian" onClick={() => onLog('vegetarian')}>🧀 Vegetarian</button>
      <button className="btn small" onClick={() => onLog('small')}>🍗 Small Meat</button>
      <button className="btn big" onClick={() => onLog('big')}>🐂 Big Meat (costs 2)</button>
    </div>
  )
}
