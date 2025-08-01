# Food Budget Tracking App

This repository contains a minimal React Native (Expo) application to log daily meals and track a 14‑day food budget.

## Running

Install dependencies with `npm install` inside the `app` directory and then start Expo:

```bash
cd app
npm install
npm start
```

You can run on web with `npm run web` or on a device using the Expo Go app.

## Features

* Log four meal categories: **vegan**, **vegetarian**, **small meat** and **big meat**.
* Meal data is stored locally using `AsyncStorage`.
* Budgets are tracked over the last 14 days.
  * Two vegetarian meals count as **one meat** plus **one vegan** meal.
  * A big meat meal costs **two meat** meals.
* The home screen displays remaining meat and vegan meals in the current budget window.
