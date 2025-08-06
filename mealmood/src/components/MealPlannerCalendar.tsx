import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { computeCycle } from '@/lib/date'
import { addMeal } from '@/lib/sync'
import { Meal } from '@/lib/logic'
import {
  draggable,
  dropTargetForElements,
  monitorForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'

interface Props {
  meals: Meal[]
  remaining: { vegan: number; vegetarian: number; small: number; big: number }
  onMealsUpdated: () => void
}

export default function MealPlannerCalendar({ meals, remaining, onMealsUpdated }: Readonly<Props>) {
  const cycle = computeCycle()
  const days = Array.from({ length: 14 }).map((_, i) =>
    dayjs(cycle.startISO).add(i, 'day')
  )

  const [mealsByDay, setMealsByDay] = useState<Meal[][]>(
    Array.from({ length: 14 }, () => [])
  )

  // Group meals into days
  useEffect(() => {
    setMealsByDay(days.map(d => meals.filter(m => dayjs(m.at).tz().isSame(d.tz(), 'day'))))
  }, [meals])

  // Setup droppables for days
  useEffect(() => {
    const cleanupFns: (() => void)[] = [];

    days.forEach((_, index) => {
        const el = document.getElementById(`day-${index}`);
        if (!el) {
        console.warn(`❌ No droppable element found for #day-${index}`);
        return;
        }

        const cleanup = dropTargetForElements({
            element: el,
            getData: () => ({ dayIndex: index }),
            canDrop: () => mealsByDay[index]?.length < 2
        });
        cleanupFns.push(cleanup);
    });

    return () => {
        cleanupFns.forEach(fn => fn());
    };
    }, [days, mealsByDay]);

  // Setup draggables for palette icons
  useEffect(() => {
    const cleanupFns: (() => void)[] = [];

    // Wait for DOM paint
    const timeout = setTimeout(() => {
        const types: Meal['type'][] = ['vegan', 'vegetarian', 'small', 'big'];

        types.forEach(type => {
            const el = document.getElementById(`palette-${type}`);
            if (!el) {
                console.warn(`❌ No element found for #palette-${type}`);
                return;
            }

            const cleanup = draggable({
                element: el,
                getInitialData: () => ({ type:type })
            });
            cleanupFns.push(cleanup);
            });
        }, 0);

    return () => {
        clearTimeout(timeout);
        cleanupFns.forEach(fn => fn());
    };
    }, [remaining]);

  // Handle drops using monitorForElements
  useEffect(() => {
    const unsubscribe = monitorForElements({
      onDrop: ({ source, location }) => {
        const type = source?.data?.type as Meal['type']
        const dayIndex = location?.current?.dropTargets?.[0]?.data?.dayIndex
        console.log("DRAG END - source", source)
        console.log("DRAG END - location", location)
        console.log("Dragged", type, "to day", dayIndex)

        if (typeof type == 'string' && typeof dayIndex == 'number') {
            const targetDay = days[dayIndex].set('hour', 12)
            void (async () => {
                await addMeal(type, targetDay.toISOString())
                onMealsUpdated()
        })()
        }
      }
    })
    return () => unsubscribe()
  }, [days, onMealsUpdated])

  return (
    <div>
      {/* Palette */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        {[
          { type: 'vegan', emoji: '🥦', count: remaining.vegan },
          { type: 'vegetarian', emoji: '🧀', count: remaining.vegetarian },
          { type: 'small', emoji: '🍗', count: remaining.small },
          { type: 'big', emoji: '🐂', count: remaining.big }
        ].map(cat => (
          <div
            id={`palette-${cat.type}`}
            key={cat.type}
            style={{
              fontSize: '2rem',
              opacity: cat.count > 0 ? 1 : 0.3,
              cursor: cat.count > 0 ? 'grab' : 'not-allowed'
            }}
          >
            {cat.emoji} ({cat.count})
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {days.map((day, dayIndex) => (
          <div
            id={`day-${dayIndex}`}
            key={day.toISOString()}
            style={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '8px',
              minWidth: '120px',
              flexShrink: 0,
              background: '#fafafa'
            }}
          >
            <strong>{day.format('MMM D')}</strong>
            {mealsByDay[dayIndex]?.map(meal => (
              <div
                key={meal.id}
                style={{
                  padding: '6px',
                  margin: '4px 0',
                  background: '#f0f0f0',
                  borderRadius: '4px'
                }}
              >
                {meal.type}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
