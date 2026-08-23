"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/components/LanguageProvider";
import PageContainer from "@/components/ui/PageContainer";

interface SupplementItem {
  id: string;
  name: string;
  dosage: string;
  taken: boolean;
}

interface CalcResults {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export default function NutritionPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t, locale } = useTranslation();

  // Route protection
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role === "ADMIN") {
        router.push("/admin/users");
      } else if (user?.role === "TRAINER") {
        router.push("/trainer/players/my-players");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // State for Hydration Tracker (Liters * 1000 to keep ml)
  const [hydrationMl, setHydrationMl] = useState<number>(0);
  const hydrationGoalMl = 3000;

  // State for Supplement Checklist
  const [supplements, setSupplements] = useState<SupplementItem[]>([
    { id: "creatine", name: "Creatina", dosage: "5g", taken: false },
    { id: "omega3", name: "Omega 3", dosage: "2 cap", taken: false },
    { id: "protein", name: "Whey Protein Shake", dosage: "30g", taken: false },
    { id: "multivitamin", name: "Multivitamínic", dosage: "1 tab", taken: false },
    { id: "vitd3", name: "Vitamina D3", dosage: "2000 UI", taken: false },
  ]);

  // State for Calorie Calculator
  const [calcWeight, setCalcWeight] = useState<string>("73");
  const [calcActivity, setCalcActivity] = useState<string>("med");
  const [calcResults, setCalcResults] = useState<CalcResults | null>(null);

  // Load localStorage data on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const todayStr = new Date().toDateString();
      
      // Load Hydration (reset if it's a new day)
      const savedHydrationDate = localStorage.getItem("hydration_log_date");
      const savedHydrationMl = localStorage.getItem("hydration_log_ml");
      if (savedHydrationDate === todayStr && savedHydrationMl) {
        setHydrationMl(parseInt(savedHydrationMl) || 0);
      } else {
        setHydrationMl(0);
        localStorage.setItem("hydration_log_date", todayStr);
        localStorage.setItem("hydration_log_ml", "0");
      }

      // Load Supplements (reset if new day)
      const savedSuppsDate = localStorage.getItem("supplements_log_date");
      const savedSupps = localStorage.getItem("supplements_log_data");
      if (savedSuppsDate === todayStr && savedSupps) {
        try {
          setSupplements(JSON.parse(savedSupps));
        } catch (e) {
          console.error(e);
        }
      } else {
        localStorage.setItem("supplements_log_date", todayStr);
        const localizedSupplements = supplements.map(s => {
          if (locale === "en") {
            if (s.id === "creatine") return { ...s, name: "Creatine Monohydrate" };
            if (s.id === "multivitamin") return { ...s, name: "Multivitamin" };
          } else if (locale === "es") {
            if (s.id === "creatine") return { ...s, name: "Creatina" };
            if (s.id === "multivitamin") return { ...s, name: "Multivitamínico" };
          }
          return s;
        });
        setSupplements(localizedSupplements);
        localStorage.setItem("supplements_log_data", JSON.stringify(localizedSupplements));
      }

      // Load previous Calculator settings
      const savedWeight = localStorage.getItem("nutrition_calc_weight");
      if (savedWeight) {
        setCalcWeight(savedWeight);
      }
    }
  }, [locale]);

  const handleAddHydration = (amount: number) => {
    const updated = Math.min(hydrationMl + amount, 6000);
    setHydrationMl(updated);
    localStorage.setItem("hydration_log_ml", updated.toString());
  };

  const handleResetHydration = () => {
    setHydrationMl(0);
    localStorage.setItem("hydration_log_ml", "0");
  };

  const handleToggleSupplement = (id: string) => {
    const updated = supplements.map((s) => {
      if (s.id === id) {
        return { ...s, taken: !s.taken };
      }
      return s;
    });
    setSupplements(updated);
    localStorage.setItem("supplements_log_data", JSON.stringify(updated));
  };

  const handleCalculateTargets = (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseFloat(calcWeight);
    if (isNaN(weightNum) || weightNum <= 0) return;

    localStorage.setItem("nutrition_calc_weight", calcWeight);

    let multiplier = 38; // Moderate
    let proteinFactor = 2.0;
    let carbsFactor = 6.0;
    let fatsFactor = 1.0;

    if (calcActivity === "low") {
      multiplier = 32;
      proteinFactor = 1.8;
      carbsFactor = 4.5;
      fatsFactor = 0.9;
    } else if (calcActivity === "high") {
      multiplier = 45;
      proteinFactor = 2.2;
      carbsFactor = 7.5;
      fatsFactor = 1.2;
    }

    const calories = Math.round(weightNum * multiplier);
    const protein = Math.round(weightNum * proteinFactor);
    const carbs = Math.round(weightNum * carbsFactor);
    const fats = Math.round(weightNum * fatsFactor);

    setCalcResults({
      calories,
      protein,
      carbs,
      fats,
    });
  };

  // Mock macro values for meal plans
  const meals = [
    {
      key: "breakfast",
      title: t("nutrition_page.meal_breakfast"),
      desc: locale === "ca"
        ? "Farina d'avena amb plàtan, mel, nous i 3 ous bullits."
        : locale === "es"
        ? "Avena con plátano, miel, nueces y 3 huevos cocidos."
        : "Oatmeal with banana, honey, walnuts, and 3 boiled eggs.",
      macros: "Pro: 32g | Carb: 75g | Fat: 16g",
      calories: "580 kcal",
      time: "08:00",
    },
    {
      key: "midmorning",
      title: t("nutrition_page.meal_midmorning"),
      desc: locale === "ca"
        ? "Iogurt grec amb gerds i ametlles."
        : locale === "es"
        ? "Yogur griego con frambuesas y almendras."
        : "Greek yogurt with raspberries and almonds.",
      macros: "Pro: 20g | Carb: 12g | Fat: 9g",
      calories: "210 kcal",
      time: "11:30",
    },
    {
      key: "lunch",
      title: t("nutrition_page.meal_lunch"),
      desc: locale === "ca"
        ? "Pit de pollastre a la planxa amb arròs integral, bròquil i oli d'oliva."
        : locale === "es"
        ? "Pechuga de pollo a la plancha con arroz integral, brócoli y aceite de oliva."
        : "Grilled chicken breast with brown rice, broccoli, and olive oil.",
      macros: "Pro: 45g | Carb: 85g | Fat: 14g",
      calories: "680 kcal",
      time: "14:00",
    },
    {
      key: "preworkout",
      title: t("nutrition_page.meal_preworkout"),
      desc: locale === "ca"
        ? "Torrada de pa integral amb mantega de cacauet i rodanxes de plàtan."
        : locale === "es"
        ? "Tostada de pan integral con mantequilla de cacahuete y rodajas de plátano."
        : "Whole wheat toast with peanut butter and banana slices.",
      macros: "Pro: 12g | Carb: 48g | Fat: 15g",
      calories: "380 kcal",
      time: "17:00",
    },
    {
      key: "postworkout",
      title: t("nutrition_page.meal_postworkout"),
      desc: locale === "ca"
        ? "Batut de proteïna Whey amb aigua/llet desnatada i 1 plàtan."
        : locale === "es"
        ? "Batido de proteína Whey con agua/leche desnatada y 1 plátano."
        : "Whey protein shake with water/skimmed milk and 1 banana.",
      macros: "Pro: 30g | Carb: 32g | Fat: 2g",
      calories: "280 kcal",
      time: "19:30",
    },
    {
      key: "dinner",
      title: t("nutrition_page.meal_dinner"),
      desc: locale === "ca"
        ? "Filet de salmó al forn amb patata dolça i amanida verda."
        : locale === "es"
        ? "Filete de salmón al horno con batata y ensalada verde."
        : "Baked salmon fillet with sweet potato and mixed green salad.",
      macros: "Pro: 38g | Carb: 55g | Fat: 20g",
      calories: "550 kcal",
      time: "21:30",
    },
  ];

  // Hydration Percent
  const hydrationPercent = Math.round((hydrationMl / hydrationGoalMl) * 100);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== "PLAYER" && user?.role !== "GOAL_KEEPER")) {
    return null;
  }

  return (
    <PageContainer className="py-10">
      {/* Header Banner */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-primary">
          {t("nutrition_page.title")}
        </h1>
        <p className="text-base-content/70 mt-2">
          {t("nutrition_page.subtitle")}
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Recommended Meals Plan & Target Calculator */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Meal Plan List */}
          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
              <div className="flex justify-between items-center mb-6">
                <h2 className="card-title text-2xl font-bold text-secondary">
                  {t("nutrition_page.daily_meals")}
                </h2>
                <div className="badge badge-accent font-semibold">Standard Athlete Plan</div>
              </div>

              <div className="space-y-4">
                {meals.map((meal) => (
                  <div
                    key={meal.key}
                    className="p-4 rounded-xl bg-base-200/50 border border-base-content/5 hover:border-primary/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge badge-primary badge-sm font-bold text-[10px]">{meal.time}</span>
                        <h3 className="font-bold text-base-content">{meal.title}</h3>
                      </div>
                      <p className="text-sm text-base-content/70">{meal.desc}</p>
                    </div>
                    <div className="text-right flex flex-col items-start md:items-end gap-1 shrink-0">
                      <span className="text-sm font-bold text-primary">{meal.calories}</span>
                      <span className="text-xs text-base-content/50 uppercase tracking-wider font-semibold font-mono">
                        {meal.macros}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Calorie & Macro Target Calculator */}
          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
              <h2 className="card-title text-2xl font-bold text-secondary mb-4">
                {t("nutrition_page.calculator_title")}
              </h2>

              <form onSubmit={handleCalculateTargets} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold">{t("nutrition_page.calc_weight_label")}</span>
                  </label>
                  <input
                    type="number"
                    value={calcWeight}
                    onChange={(e) => setCalcWeight(e.target.value)}
                    className="input input-bordered w-full"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold">{t("nutrition_page.calc_activity_label")}</span>
                  </label>
                  <select
                    value={calcActivity}
                    onChange={(e) => setCalcActivity(e.target.value)}
                    className="select select-bordered w-full"
                  >
                    <option value="low">{t("nutrition_page.calc_activity_low")}</option>
                    <option value="med">{t("nutrition_page.calc_activity_med")}</option>
                    <option value="high">{t("nutrition_page.calc_activity_high")}</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary w-full">
                  {t("nutrition_page.calc_btn")}
                </button>
              </form>

              {calcResults && (
                <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20">
                  <h3 className="font-bold text-lg text-primary mb-4 text-center">
                    {t("nutrition_page.calc_results")}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-base-100 rounded-xl p-3 shadow-sm border border-base-content/5">
                      <p className="text-xs text-base-content/60 font-semibold">{t("nutrition_page.calc_calories")}</p>
                      <p className="text-xl font-black text-secondary mt-1">{calcResults.calories} kcal</p>
                    </div>
                    <div className="bg-base-100 rounded-xl p-3 shadow-sm border border-base-content/5">
                      <p className="text-xs text-base-content/60 font-semibold">{t("nutrition_page.calc_protein")}</p>
                      <p className="text-xl font-black text-primary mt-1">{calcResults.protein}g</p>
                    </div>
                    <div className="bg-base-100 rounded-xl p-3 shadow-sm border border-base-content/5">
                      <p className="text-xs text-base-content/60 font-semibold">{t("nutrition_page.calc_carbs")}</p>
                      <p className="text-xl font-black text-accent mt-1">{calcResults.carbs}g</p>
                    </div>
                    <div className="bg-base-100 rounded-xl p-3 shadow-sm border border-base-content/5">
                      <p className="text-xs text-base-content/60 font-semibold">{t("nutrition_page.calc_fats")}</p>
                      <p className="text-xl font-black text-neutral-content mt-1">{calcResults.fats}g</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Hydration Tracker & Supplements Checklist */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Hydration Tracker Card */}
          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body items-center text-center">
              <h2 className="card-title text-2xl font-bold text-secondary mb-4 w-full justify-start">
                {t("nutrition_page.hydration_title")}
              </h2>

              {/* Circular Hydration Display */}
              <div className="relative w-44 h-44 flex items-center justify-center mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  {/* Background Circle */}
                  <circle
                    cx="88"
                    cy="88"
                    r="80"
                    className="stroke-base-200 fill-none"
                    strokeWidth="12"
                  />
                  {/* Progress Wave Circle */}
                  <circle
                    cx="88"
                    cy="88"
                    r="80"
                    className="stroke-primary fill-none transition-all duration-500 ease-out"
                    strokeWidth="12"
                    strokeDasharray={2 * Math.PI * 80}
                    strokeDashoffset={2 * Math.PI * 80 * (1 - Math.min(hydrationMl / hydrationGoalMl, 1))}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-3xl">💧</span>
                  <div className="text-2xl font-black text-primary mt-1">{hydrationPercent}%</div>
                  <p className="text-xs text-base-content/60 mt-0.5">
                    {t("nutrition_page.hydration_logged", { logged: (hydrationMl / 1000).toFixed(2) })}
                  </p>
                </div>
              </div>

              {/* Goal description */}
              <div className="text-sm font-bold text-secondary mb-6">
                {t("nutrition_page.hydration_goal")}
              </div>

              {/* Add Water Controls */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => handleAddHydration(250)}
                  className="btn btn-outline btn-primary flex-1 gap-1"
                >
                  <span>+ 250ml</span>
                  <span className="text-xs text-base-content/50">(Glass)</span>
                </button>
                <button
                  onClick={() => handleAddHydration(500)}
                  className="btn btn-primary flex-1 gap-1"
                >
                  <span>+ 500ml</span>
                  <span className="text-xs text-primary-content/65">(Bottle)</span>
                </button>
              </div>

              <button
                onClick={handleResetHydration}
                className="btn btn-ghost btn-xs text-base-content/50 hover:bg-transparent mt-4"
              >
                Reset Daily Hydration
              </button>
            </div>
          </div>

          {/* Supplement Checklist Card */}
          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
              <h2 className="card-title text-2xl font-bold text-secondary mb-1">
                {t("nutrition_page.supplements_title")}
              </h2>
              <p className="text-xs text-base-content/60 mb-6">Track your daily vitamins and athletic supplements.</p>

              <div className="space-y-3">
                {supplements.map((supp) => (
                  <div
                    key={supp.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      supp.taken
                        ? "bg-success/5 border-success/30 text-base-content/60"
                        : "bg-base-200/50 border-base-content/5"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={supp.taken}
                        onChange={() => handleToggleSupplement(supp.id)}
                        className="checkbox checkbox-success checkbox-md"
                      />
                      <div>
                        <span className={`font-semibold text-sm ${supp.taken ? "line-through" : ""}`}>
                          {supp.name}
                        </span>
                        <span className="text-xs text-base-content/50 block font-mono">
                          {supp.dosage}
                        </span>
                      </div>
                    </div>
                    <div className="badge badge-outline badge-xs uppercase font-semibold text-[8px] opacity-75">
                      Supplement
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </PageContainer>
  );
}
