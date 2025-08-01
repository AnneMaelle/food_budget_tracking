import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MEAT_BUDGET = 7;
const VEGAN_BUDGET = 7;
const STORAGE_KEY = 'MEALS';

function mealCost(type) {
  switch (type) {
    case 'bigMeat':
      return { meat: 2, vegan: 0 };
    case 'smallMeat':
      return { meat: 1, vegan: 0 };
    case 'vegetarian':
      return { meat: 0.5, vegan: 0.5 };
    case 'vegan':
      return { meat: 0, vegan: 1 };
    default:
      return { meat: 0, vegan: 0 };
  }
}

export default function App() {
  const [meals, setMeals] = useState([]);
  const [budget, setBudget] = useState({ meat: MEAT_BUDGET, vegan: VEGAN_BUDGET });

  useEffect(() => {
    (async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) setMeals(JSON.parse(data));
      } catch (e) {
        console.log('load error', e);
      }
    })();
  }, []);

  useEffect(() => {
    updateBudget();
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(meals)).catch(e => console.log('save error', e));
  }, [meals]);

  const addMeal = type => {
    setMeals([...meals, { type, date: new Date().toISOString() }]);
  };

  const updateBudget = () => {
    const now = Date.now();
    const twoWeeks = 14 * 24 * 60 * 60 * 1000;
    const recent = meals.filter(m => new Date(m.date).getTime() > now - twoWeeks);
    const used = recent.reduce((acc, m) => {
      const cost = mealCost(m.type);
      return { meat: acc.meat + cost.meat, vegan: acc.vegan + cost.vegan };
    }, { meat: 0, vegan: 0 });
    setBudget({
      meat: Math.max(0, MEAT_BUDGET - used.meat),
      vegan: Math.max(0, VEGAN_BUDGET - used.vegan)
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Remaining Budget</Text>
      <Text style={styles.budget}>{budget.meat.toFixed(1)} meat meals</Text>
      <Text style={styles.budget}>{budget.vegan.toFixed(1)} vegan meals</Text>
      <View style={styles.buttons}>
        <Button title="Vegan" onPress={() => addMeal('vegan')} />
        <Button title="Vegetarian" onPress={() => addMeal('vegetarian')} />
        <Button title="Small Meat" onPress={() => addMeal('smallMeat')} />
        <Button title="Big Meat" onPress={() => addMeal('bigMeat')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  header: { fontSize: 24, marginBottom: 16 },
  budget: { fontSize: 18, marginBottom: 4 },
  buttons: { marginTop: 20, height: 240, justifyContent: 'space-between' }
});
