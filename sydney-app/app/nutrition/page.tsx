"use client";

import { Edit3, MoreVertical, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fiber?: number;
  fat: number;
  satFat?: number;
}

type MealName = "Breakfast" | "Lunch" | "Dinner" | "Snack";

interface MealEntry {
  id: string;
  foodId: string;
  quantity: number;
}

type DayMeals = {
  Breakfast: MealEntry[];
  Lunch: MealEntry[];
  Dinner: MealEntry[];
  Snack: MealEntry[];
};

function summarizeMeal(meals: DayMeals, allFoodsIndex: Map<string, FoodItem>, mealName: keyof DayMeals) {
  const entries = meals[mealName] || [];
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;

  for (const entry of entries) {
    const food = allFoodsIndex.get(entry.foodId);
    if (!food) continue;
    const q = entry.quantity || 1;
    calories += food.calories * q;
    protein += food.protein * q;
    carbs += food.carbs * q;
    fat += food.fat * q;
  }

  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
  };
}

interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MacroRingsProps {
  totals: MacroTotals;
  targets: MacroTotals;
}

function MacroRings({ totals, targets }: MacroRingsProps) {
  const safeRatio = (value: number, target: number) => {
    if (!target || target <= 0) return 0;
    const r = value / target;
    return r > 1 ? 1 : r < 0 ? 0 : r;
  };

  const proteinRatio = safeRatio(totals.protein, targets.protein);
  const carbsRatio = safeRatio(totals.carbs, targets.carbs);
  const fatRatio = safeRatio(totals.fat, targets.fat);

  const baseRadius = 44;
  const ringGap = 8;

  const proteinRadius = baseRadius;
  const carbsRadius = baseRadius - ringGap;
  const fatRadius = baseRadius - ringGap * 2;

  const circumference = (r: number) => 2 * Math.PI * r;

  const proteinCirc = circumference(proteinRadius);
  const carbsCirc = circumference(carbsRadius);
  const fatCirc = circumference(fatRadius);

  const proteinDash = proteinCirc * proteinRatio;
  const carbsDash = carbsCirc * carbsRatio;
  const fatDash = fatCirc * fatRatio;

  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 120 120" className="h-full w-full">
        <g transform="rotate(-90 60 60)">
          <circle
            cx="60"
            cy="60"
            r={proteinRadius}
            className="stroke-slate-200"
            strokeWidth={5}
            fill="none"
          />
          <circle
            cx="60"
            cy="60"
            r={carbsRadius}
            className="stroke-slate-200"
            strokeWidth={5}
            fill="none"
          />
          <circle
            cx="60"
            cy="60"
            r={fatRadius}
            className="stroke-slate-200"
            strokeWidth={5}
            fill="none"
          />

          <circle
            cx="60"
            cy="60"
            r={proteinRadius}
            className="stroke-sky-400"
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={proteinDash + ' ' + proteinCirc}
          />
          <circle
            cx="60"
            cy="60"
            r={carbsRadius}
            className="stroke-emerald-400"
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={carbsDash + ' ' + carbsCirc}
          />
          <circle
            cx="60"
            cy="60"
            r={fatRadius}
            className="stroke-amber-400"
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={fatDash + ' ' + fatCirc}
          />
        </g>
      </svg>
    </div>
  );
}

export default function NutritionPage() {
  const [selectedDate, setSelectedDate] = useState(
    (() => {
      if (typeof window === "undefined") {
        return new Date().toISOString().slice(0, 10);
      }
      return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
    })()
  );
  const [activeMeal, setActiveMeal] = useState<MealName | null>(null);
  const [dialogTab, setDialogTab] = useState<"recent" | "mine" | "create">("recent");
  const [search, setSearch] = useState("");
  const [allFoods, setAllFoods] = useState<FoodItem[]>([]);
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([]);
  const [myFoods, setMyFoods] = useState<FoodItem[]>([]);
  const [dayMeals, setDayMeals] = useState<DayMeals>({
    Breakfast: [],
    Lunch: [],
    Dinner: [],
    Snack: [],
  });
  const [totals, setTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [targets, setTargets] = useState({
    calories: 2350,
    protein: 192,
    carbs: 216,
    fat: 80,
  });
  const [viewMode, setViewMode] = useState<"remaining" | "consumed">("remaining");
  const [editingTargets, setEditingTargets] = useState(false);
  const remaining = {
    calories: targets.calories - totals.calories,
    protein: targets.protein - totals.protein,
    carbs: targets.carbs - totals.carbs,
    fat: targets.fat - totals.fat,
  };
  const [creatingFood, setCreatingFood] = useState(false);
  const [createFood, setCreateFood] = useState({
    id: "",
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fiber: "",
    fat: "",
    satFat: "",
  });
  const [editingEntry, setEditingEntry] = useState<{
    meal: MealName;
    id: string;
    quantity: number;
  } | null>(null);
  const [activeMenuMeal, setActiveMenuMeal] = useState<MealName | null>(null);
  const [copyMeal, setCopyMeal] = useState<{
    open: boolean;
    fromMeal: MealName;
    fromDate: string;
    toMeal: MealName;
    toDate: string;
  } | null>(null);

  const shiftDate = (days: number) => {
    setSelectedDate((prev) => {
      const parts = prev.split("-");
      if (parts.length !== 3) return prev;
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      d.setDate(d.getDate() + days);
      return d.toLocaleDateString("en-CA");
    });
  };

  const todayIso = () => new Date().toLocaleDateString("en-CA");

  const fmt = (v: number) => Math.round(v);

  const remainingClass = (
    value: number,
    target: number,
    kind: "calories" | "protein" | "carbs" | "fat"
  ) => {
    if (kind === "calories") {
      return value < 0 ? "text-red-500" : "text-slate-9000";
    }
    const abs = Math.abs(value);
    if (kind === "protein" || kind === "carbs") {
      if (value < 0) return "text-red-500";
      if (abs <= 5) return "text-emerald-500";
      return "text-slate-9000";
    }
    if (kind === "fat") {
      if (value < 0) return "text-red-500";
      if (abs <= 3) return "text-emerald-500";
      return "text-slate-9000";
    }
    return "text-slate-9000";
  };


  useEffect(() => {
    async function loadFoods() {
      try {
        const res = await fetch("/api/foods");
        if (!res.ok) return;
        const data = await res.json();
        setAllFoods(data.foods || []);
        setRecentFoods(data.recent || []);
        setMyFoods(data.mine || []);
      } catch (e) {
        console.error("Failed to load foods", e);
      }
    }

    async function loadTargets() {
      try {
        const res = await fetch("/api/nutrition-settings");
        if (!res.ok) return;
        const data = await res.json();
        setTargets({
          calories: data.calories || 0,
          protein: data.protein || 0,
          carbs: data.carbs || 0,
          fat: data.fat || 0,
        });
      } catch (e) {
        console.error("Failed to load nutrition settings", e);
      }
    }

    loadFoods();
    loadTargets();
  }, []);

  useEffect(() => {
    async function loadLog() {
      try {
        const res = await fetch(`/api/nutrition-log?date=${selectedDate}`);
        if (!res.ok) return;
        const data = await res.json();
        const meals = data.meals || { Breakfast: [], Lunch: [], Dinner: [], Snack: [] };
        setDayMeals({
          Breakfast: meals.Breakfast || [],
          Lunch: meals.Lunch || [],
          Dinner: meals.Dinner || [],
          Snack: meals.Snack || [],
        });
        if (data.totals) {
          setTotals({
            calories: data.totals.calories || 0,
            protein: data.totals.protein || 0,
            carbs: data.totals.carbs || 0,
            fat: data.totals.fat || 0,
          });
        } else {
          setTotals({ calories: 0, protein: 0, carbs: 0, fat: 0 });
        }
      } catch (e) {
        console.error("Failed to load nutrition log", e);
      }
    }

    loadLog();
  }, [selectedDate]);

  const openDialog = (meal: MealName) => {
    setActiveMeal(meal);
    setDialogTab("recent");
    setSearch("");
    setActiveMenuMeal(null);

    fetch(`/api/nutrition-recent?meal=${meal}&limit=100`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setRecentFoods(data.items || []);
      })
      .catch((e) => console.error("Failed to load recent foods", e));
  };

  const openEditFood = (meal: MealName, food: FoodItem) => {
    setActiveMeal(meal);
    setDialogTab("create");
    setSearch("");
    setActiveMenuMeal(null);
    setCreateFood({
      id: food.id,
      name: food.name,
      calories: String(food.calories ?? ""),
      protein: String(food.protein ?? ""),
      carbs: String(food.carbs ?? ""),
      fiber: String(food.fiber ?? ""),
      fat: String(food.fat ?? ""),
      satFat: String(food.satFat ?? ""),
    });
  };

  const closeDialog = () => {
    setActiveMeal(null);
  };

  const recentOrder = new Map<string, number>();
  recentFoods.forEach((food, index) => {
    recentOrder.set(food.id, index);
  });

  const sortedMyFoods = [...myFoods].sort((a, b) => {
    const aIndex = recentOrder.has(a.id) ? recentOrder.get(a.id)! : Number.POSITIVE_INFINITY;
    const bIndex = recentOrder.has(b.id) ? recentOrder.get(b.id)! : Number.POSITIVE_INFINITY;
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.name.localeCompare(b.name);
  });

  const baseFoods = dialogTab === "recent" ? recentFoods : sortedMyFoods;
  const searchTerm = search.trim().toLowerCase();
  const foods = searchTerm.length > 0 ? allFoods : baseFoods;
  const filteredFoods = foods.filter((f) =>
    f.name.toLowerCase().includes(searchTerm)
  );

  const allFoodsIndex = new Map<string, FoodItem>();
  const foodsForIndex = allFoods.length > 0 ? allFoods : [...recentFoods, ...myFoods];
  foodsForIndex.forEach((f) => {
    allFoodsIndex.set(f.id, f);
  });

  const totalEntries =
    (dayMeals.Breakfast?.length || 0) +
    (dayMeals.Lunch?.length || 0) +
    (dayMeals.Dinner?.length || 0) +
    (dayMeals.Snack?.length || 0);

  const handleAddFood = async (food: FoodItem) => {
    if (!activeMeal) return;
    try {
      const res = await fetch("/api/nutrition-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          meal: activeMeal,
          foodId: food.id,
          quantity: 1,
        }),
      });
      if (!res.ok) {
        console.error("Failed to log food");
        return;
      }
      const data = await res.json();
      setDayMeals(data.meals as DayMeals);
      setTotals(data.totals);
      closeDialog();
    } catch (e) {
      console.error("Error logging food", e);
    }
  };

  const updateEntryQuantity = async (
    meal: MealName,
    entry: MealEntry,
    nextQuantity: number
  ) => {
    try {
      const res = await fetch(`/api/nutrition-log/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          meal,
          quantity: nextQuantity,
          foodId: entry.foodId,
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setDayMeals(data.meals as DayMeals);
      setTotals(data.totals);
    } catch (e) {
      console.error("Error updating entry", e);
    }
  };

  const saveEditEntry = async () => {
    if (!editingEntry) return;
    const { meal, id, quantity } = editingEntry;
    const target = dayMeals[meal]?.find((entry) => entry.id === id);
    if (!target) return;
    if (!Number.isFinite(quantity) || quantity <= 0) return;
    await updateEntryQuantity(meal, target, quantity);
    setEditingEntry(null);
  };

  const deleteEntry = async (meal: MealName, entry: MealEntry) => {
    try {
      const res = await fetch(`/api/nutrition-log/${entry.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, meal, foodId: entry.foodId }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setDayMeals(data.meals as DayMeals);
      setTotals(data.totals);
    } catch (e) {
      console.error("Error deleting entry", e);
    }
  };

  const deleteMeal = async (meal: MealName) => {
    const entries = dayMeals[meal] || [];
    if (entries.length === 0) return;
    try {
      await Promise.all(
        entries.map((entry) =>
          fetch(`/api/nutrition-log/${entry.id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date: selectedDate,
              meal,
              foodId: entry.foodId,
            }),
          })
        )
      );
      const res = await fetch(`/api/nutrition-log?date=${selectedDate}`);
      if (!res.ok) return;
      const data = await res.json();
      setDayMeals(data.meals as DayMeals);
      setTotals(data.totals);
      if (editingEntry?.meal === meal) {
        setEditingEntry(null);
      }
    } catch (e) {
      console.error("Error deleting meal", e);
    }
  };

  const openCopyMeal = (meal: MealName) => {
    setCopyMeal({
      open: true,
      fromMeal: meal,
      fromDate: selectedDate,
      toMeal: meal,
      toDate: todayIso(),
    });
  };

  const submitCopyMeal = async () => {
    if (!copyMeal) return;
    try {
      const res = await fetch("/api/nutrition-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromDate: copyMeal.fromDate,
          fromMeal: copyMeal.fromMeal,
          toDate: copyMeal.toDate,
          toMeal: copyMeal.toMeal,
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (copyMeal.toDate === selectedDate) {
        setDayMeals(data.meals as DayMeals);
        setTotals(data.totals);
      }
      setCopyMeal(null);
    } catch (e) {
      console.error("Error copying meal", e);
    }
  };

  const handleCreateFood = async () => {
    if (!createFood.name.trim() || !createFood.calories.trim()) return;
    setCreatingFood(true);
    try {
      const res = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: createFood.id || undefined,
          name: createFood.name.trim(),
          source: "mine",
          calories: Number(createFood.calories) || 0,
          protein: Number(createFood.protein) || 0,
          carbs: Number(createFood.carbs) || 0,
          fiber: Number(createFood.fiber) || 0,
          fat: Number(createFood.fat) || 0,
          satFat: Number(createFood.satFat) || 0,
        }),
      });
      if (!res.ok) {
        console.error("Failed to create food");
        return;
      }
      const data = await res.json();
      const food = data.food as FoodItem;
      setMyFoods((prev) => {
        const existing = prev.filter((f) => f.id !== food.id);
        return [...existing, food];
      });
      setDialogTab("mine");
      setSearch(food.name);
      setCreateFood({
        id: "",
        name: "",
        calories: "",
        protein: "",
        carbs: "",
        fiber: "",
        fat: "",
        satFat: "",
      });
    } catch (e) {
      console.error("Error creating food", e);
    } finally {
      setCreatingFood(false);
    }
  };

  return (
    <div className="min-h-screen px-1 py-2 text-slate-900">
      <div className="space-y-5">
        <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-9000">
              Personal
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Nutrition
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-900">
              Plan meals, track macros, and stay on target. This is a static
              v0.1 UI inspired by your main nutrition dashboard; we can wire it
              to real data sources next.
            </p>
          </div>
          <div className="flex flex-1 items-center justify-end text-xs text-slate-9000">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1">
              <button
                type="button"
                onClick={() => shiftDate(-1)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"
                aria-label="Previous day"
              >
                <span className="text-sm">&lt;</span>
              </button>
              <input
                type="date"
                className="w-32 border-none bg-transparent text-center text-xs text-slate-900 focus:outline-none"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <button
                type="button"
                onClick={() => shiftDate(1)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"
                aria-label="Next day"
              >
                <span className="text-sm">&gt;</span>
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)]">
          {/* Macros card */}
          <section className="relative overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-white via-white to-slate-50 shadow-[0_18px_45px_rgba(15,23,42,0.08)] px-4 py-4 sm:px-5 sm:py-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-9000">Macros</div>
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-white text-[11px] font-medium text-slate-700">
                <button
                  type="button"
                  onClick={() => setViewMode("remaining")}
                  className={`rounded-full px-3 py-1 transition-colors ${viewMode === "remaining" ? "bg-slate-900 text-white" : "text-slate-700"}`}
                >
                  Remaining
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("consumed")}
                  className={`rounded-full px-3 py-1 transition-colors ${viewMode === "consumed" ? "bg-slate-900 text-white" : "text-slate-700"}`}
                >
                  Consumed
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center justify-center sm:block">
                <MacroRings totals={totals} targets={targets} />
              </div>
              <div className="flex-1 space-y-3 text-xs text-slate-900">
                <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] gap-y-2 gap-x-3">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Macro
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    {viewMode === "remaining" ? "Remaining" : "Consumed"}
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Target
                  </span>

                  <span className="inline-flex items-center gap-1"><span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400" /> Cal</span>
                  <span className={remainingClass(viewMode === "remaining" ? remaining.calories : totals.calories, targets.calories, "calories")}>{fmt(viewMode === "remaining" ? remaining.calories : totals.calories)}</span>
                  <span>{editingTargets ? (
                    <input
                      type="number"
                      className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-right text-[11px] text-slate-900"
                      value={targets.calories}
                      onChange={(e) =>
                        setTargets((prev) => ({
                          ...prev,
                          calories: Number(e.target.value) || 0,
                        }))
                      }
                    />
                  ) : (
                    <span>{targets.calories}</span>
                  )}</span>

                  <span className="inline-flex items-center gap-1"><span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-400" /> Protein</span>
                  <span className={remainingClass(viewMode === "remaining" ? remaining.protein : totals.protein, targets.protein, "protein")}>{fmt(viewMode === "remaining" ? remaining.protein : totals.protein)}</span>
                  <span>{editingTargets ? (
                    <input
                      type="number"
                      className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-right text-[11px] text-slate-900"
                      value={targets.protein}
                      onChange={(e) =>
                        setTargets((prev) => ({
                          ...prev,
                          protein: Number(e.target.value) || 0,
                        }))
                      }
                    />
                  ) : (
                    <span>{targets.protein}</span>
                  )}</span>

                  <span className="inline-flex items-center gap-1"><span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" /> Carbs</span>
                  <span className={remainingClass(viewMode === "remaining" ? remaining.carbs : totals.carbs, targets.carbs, "carbs")}>{fmt(viewMode === "remaining" ? remaining.carbs : totals.carbs)}</span>
                  <span>{editingTargets ? (
                    <input
                      type="number"
                      className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-right text-[11px] text-slate-900"
                      value={targets.carbs}
                      onChange={(e) =>
                        setTargets((prev) => ({
                          ...prev,
                          carbs: Number(e.target.value) || 0,
                        }))
                      }
                    />
                  ) : (
                    <span>{targets.carbs}</span>
                  )}</span>

                  <span className="inline-flex items-center gap-1"><span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" /> Fat</span>
                  <span className={remainingClass(viewMode === "remaining" ? remaining.fat : totals.fat, targets.fat, "fat")}>{fmt(viewMode === "remaining" ? remaining.fat : totals.fat)}</span>
                  <span>{editingTargets ? (
                    <input
                      type="number"
                      className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-right text-[11px] text-slate-900"
                      value={targets.fat}
                      onChange={(e) =>
                        setTargets((prev) => ({
                          ...prev,
                          fat: Number(e.target.value) || 0,
                        }))
                      }
                    />
                  ) : (
                    <span>{targets.fat}</span>
                  )}</span>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!editingTargets) {
                        setEditingTargets(true);
                        return;
                      }
                      try {
                        const res = await fetch("/api/nutrition-settings", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(targets),
                        });
                        if (!res.ok) {
                          console.error("Failed to save targets");
                        } else {
                          setEditingTargets(false);
                        }
                      } catch (e) {
                        console.error("Error saving targets", e);
                      }
                    }}
                    className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-medium text-white hover:bg-slate-800"
                  >
                    {editingTargets ? "Save" : "Edit"}
                  </button>
                </div>
              </div>
            </div>
          </section>

        </div>


        {/* Meals grid */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(["Breakfast", "Lunch", "Dinner", "Snack"] as MealName[]).map((meal) => {
            const summary = summarizeMeal(dayMeals, allFoodsIndex, meal);
            const entries = dayMeals[meal] || [];

            return (
              <article
                key={meal}
                className="rounded-2xl border border-white/70 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.08)] px-4 py-4 sm:px-5 sm:py-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{meal}</h3>
                    <p className="mt-1 text-xs text-slate-700">
                      {summary.calories} Cal, {summary.protein}p, {summary.carbs}c, {summary.fat}f
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMenuMeal(
                            activeMenuMeal === meal ? null : meal
                          )
                        }
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                        aria-label="Meal options"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {activeMenuMeal === meal && (
                        <div className="absolute right-0 z-10 mt-2 w-40 rounded-xl border border-slate-200 bg-white p-1 text-xs shadow-lg">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuMeal(null);
                              deleteMeal(meal);
                            }}
                            className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-red-600 hover:bg-red-50"
                          >
                            Delete meal
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuMeal(null);
                              openCopyMeal(meal);
                            }}
                            className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-slate-700 hover:bg-slate-100"
                          >
                            Copy meal
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => openDialog(meal)}
                      className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {entries.length === 0 ? (
                    <p className="text-xs text-slate-500">No entries yet.</p>
                  ) : (
                    entries.map((entry) => {
                      const food = allFoodsIndex.get(entry.foodId);
                      const qty = entry.quantity || 1;

                      if (!food) {
                        return (
                          <div
                            key={entry.id}
                            className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700"
                          >
                            <p className="font-medium">{entry.foodId}</p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {qty} x (unknown macros)
                            </p>
                          </div>
                        );
                      }

                      const cals = Math.round(food.calories * qty);
                      const p = Math.round(food.protein * qty);
                      const c = Math.round(food.carbs * qty);
                      const f = Math.round(food.fat * qty);
                      const fiber = Math.round((food.fiber || 0) * qty);
                      const sat = Math.round((food.satFat || 0) * qty);

                      const isEditing =
                        editingEntry &&
                        editingEntry.id === entry.id &&
                        editingEntry.meal === meal;

                      return (
                        <div
                          key={entry.id}
                          className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-900"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <button
                                type="button"
                                onClick={() => openEditFood(meal, food)}
                                className="text-left font-medium text-slate-900 hover:text-slate-700"
                              >
                                {food.name}
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <input
                                  type="number"
                                  min={0.1}
                                  step="0.1"
                                  className="w-16 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-900"
                                  value={editingEntry?.quantity ?? qty}
                                  onChange={(e) =>
                                    setEditingEntry((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            quantity: Number(e.target.value) || 0,
                                          }
                                        : prev
                                    )
                                  }
                                />
                              ) : null}
                              <div className="flex items-center gap-1">
                                {isEditing ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={saveEditEntry}
                                      className="text-[11px] text-emerald-600 hover:text-emerald-700"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingEntry(null)}
                                      className="text-[11px] text-slate-500 hover:text-slate-700"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingEntry({
                                        meal,
                                        id: entry.id,
                                        quantity: entry.quantity || 1,
                                      })
                                    }
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                                    aria-label={`Edit ${food.name} servings`}
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => deleteEntry(meal, entry)}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                                  aria-label={`Remove ${food.name}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-600">
                            {qty} {qty === 1 ? "serving" : "servings"} · {cals} Cal, {p}p, {c}c ({fiber} fiber), {f}f ({sat} sat)
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </article>
            );
          })}
        </section>

        {/* Food search */}
        <section className="rounded-2xl border border-white/70 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.08)] px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-9000">
                Food search
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">USDA FoodData Central</p>
              <p className="mt-1 text-xs text-slate-9000">
                Macros shown are per 100g when available.
              </p>
            </div>
            <button className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-medium text-white hover:bg-slate-800">
              Lunch
            </button>
          </div>
          <div className="mt-4 text-xs text-slate-9000">
            <p className="mb-2">Search foods</p>
            <div className="flex items-center gap-2">
              <input
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-zinc-500 focus:outline-none"
                placeholder="Search for foods to add"
              />
              <button className="rounded-md bg-zinc-100 px-3 py-2 text-xs font-medium text-black hover:bg-zinc-200">
                Search
              </button>
            </div>
          </div>
        </section>

        {/* Daily notes */}
        <section className="rounded-2xl border border-white/70 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.08)] px-4 py-4 sm:px-5 sm:py-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-9000">
            Daily notes
          </h2>
          <p className="mt-2 text-xs text-slate-900">
            Log meals and watch the totals adjust in real time.
          </p>
          <div className="mt-4 grid gap-3 text-xs text-slate-900 sm:grid-cols-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-9000">
                Status
              </p>
              <p className="mt-1 text-zinc-300">Targets not saved yet</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-9000">
                Entries
              </p>
              <p className="mt-1 text-zinc-300">{totalEntries} logged</p>
            </div>
          </div>
        </section>


        {activeMeal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/70 px-4">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-zinc-950 px-4 py-4 sm:px-5 sm:py-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-9000">
                    Add to {activeMeal}
                  </p>
                  <h2 className="mt-1 text-sm font-semibold text-slate-900">Search foods</h2>
                </div>
                <button
                  type="button"
                  onClick={closeDialog}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-xs text-white hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <input
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-zinc-500 focus:outline-none"
                  placeholder="Search foods"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="mt-4 flex gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setDialogTab("recent")}
                  className={`rounded-full px-3 py-1 ${dialogTab === "recent" ? "bg-zinc-100 text-black" : "border border-zinc-700 text-zinc-300"}`}
                >
                  Recents
                </button>
                <button
                  type="button"
                  onClick={() => setDialogTab("mine")}
                  className={`rounded-full px-3 py-1 ${dialogTab === "mine" ? "bg-zinc-100 text-black" : "border border-zinc-700 text-zinc-300"}`}
                >
                  My foods
                </button>
                <button
                  type="button"
                  onClick={() => setDialogTab("create")}
                  className={`rounded-full px-3 py-1 ${dialogTab === "create" ? "bg-zinc-100 text-black" : "border border-zinc-700 text-zinc-300"}`}
                >
                  Create food
                </button>
              </div>

              {dialogTab === "create" ? (
                <div className="mt-3 max-h-72 space-y-3 overflow-y-auto text-xs text-zinc-200">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-9000">Name</p>
                      <input
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-zinc-500 focus:outline-none"
                        placeholder="Food name"
                        value={createFood.name}
                        onChange={(e) =>
                          setCreateFood((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-9000">Brand</p>
                      <input
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-zinc-500 focus:outline-none"
                        placeholder="(optional)"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-2">
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-9000">Serving</p>
                      <div className="flex gap-2">
                        <input
                          className="w-20 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-zinc-500 focus:outline-none"
                          placeholder="1"
                        />
                        <input
                          className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-zinc-500 focus:outline-none"
                          placeholder="serving (e.g. 100g, cup)"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-9000">Barcode</p>
                      <input
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-zinc-500 focus:outline-none"
                        placeholder="(optional)"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-9000">Calories</p>
                      <input
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-zinc-500 focus:outline-none"
                        placeholder="kcal"
                        value={createFood.calories}
                        onChange={(e) =>
                          setCreateFood((prev) => ({
                            ...prev,
                            calories: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-9000">Protein</p>
                      <input
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-zinc-500 focus:outline-none"
                        placeholder="g"
                        value={createFood.protein}
                        onChange={(e) =>
                          setCreateFood((prev) => ({
                            ...prev,
                            protein: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-9000">Carbs</p>
                      <input
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-zinc-500 focus:outline-none"
                        placeholder="g"
                        value={createFood.carbs}
                        onChange={(e) =>
                          setCreateFood((prev) => ({
                            ...prev,
                            carbs: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-9000">Fiber</p>
                      <input
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-zinc-500 focus:outline-none"
                        placeholder="g"
                        value={createFood.fiber}
                        onChange={(e) =>
                          setCreateFood((prev) => ({
                            ...prev,
                            fiber: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-9000">Fat</p>
                      <input
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-zinc-500 focus:outline-none"
                        placeholder="g"
                        value={createFood.fat}
                        onChange={(e) =>
                          setCreateFood((prev) => ({
                            ...prev,
                            fat: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-9000">Sat. fat</p>
                      <input
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-zinc-500 focus:outline-none"
                        placeholder="g"
                        value={createFood.satFat}
                        onChange={(e) =>
                          setCreateFood((prev) => ({
                            ...prev,
                            satFat: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 text-[11px]">
                    <button
                      type="button"
                      className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                      disabled={creatingFood || !createFood.name.trim() || !createFood.calories.trim()}
                      onClick={handleCreateFood}
                    >
                      {creatingFood ? "Saving..." : "Save food"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 max-h-60 space-y-1 overflow-y-auto text-xs text-zinc-200">
                  {filteredFoods.length === 0 && (
                    <p className="rounded-md border border-dashed border-zinc-700 bg-zinc-950 px-3 py-3 text-slate-9000">
                      No foods found. Try a different search.
                    </p>
                  )}
                  {filteredFoods.map((food) => (
                    <button
                      key={food.id || food.name}
                      type="button"
                      onClick={() => handleAddFood(food)}
                      className="group flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-slate-100"
                    >
                      <div>
                        <p className="text-xs font-medium text-zinc-100 group-hover:text-slate-900">
                          {food.name}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-9000 group-hover:text-slate-700">
                          {food.calories} kcal · {food.protein}g P · {food.carbs}g C ({food.fiber || 0} fiber) · {food.fat}g F ({food.satFat || 0} sat)
                        </p>
                      </div>
                      <span className="text-[11px] text-slate-900 group-hover:text-slate-900">
                        Add
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {copyMeal?.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-4 text-xs text-slate-900 shadow-xl">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Copy meal
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {copyMeal.fromMeal} from {copyMeal.fromDate}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCopyMeal(null)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      To date
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900"
                      value={copyMeal.toDate}
                      onChange={(e) =>
                        setCopyMeal((prev) =>
                          prev
                            ? { ...prev, toDate: e.target.value }
                            : prev
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      To meal
                    </label>
                    <select
                      className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900"
                      value={copyMeal.toMeal}
                      onChange={(e) =>
                        setCopyMeal((prev) =>
                          prev
                            ? { ...prev, toMeal: e.target.value as MealName }
                            : prev
                        )
                      }
                    >
                      {(["Breakfast", "Lunch", "Dinner", "Snack"] as MealName[]).map(
                        (option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCopyMeal(null)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-[11px] text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submitCopyMeal}
                    className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-medium text-white hover:bg-slate-800"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

