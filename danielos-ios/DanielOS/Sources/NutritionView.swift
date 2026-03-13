import SwiftUI

struct NutritionView: View {
  @EnvironmentObject private var appState: AppState

  @State private var selectedDate: Date = Date()

  @State private var foods: [FoodItem] = []
  @State private var foodsIndex: [String: FoodItem] = [:]

  @State private var meals: DayMeals = [
    MealName.breakfast.rawValue: [],
    MealName.lunch.rawValue: [],
    MealName.dinner.rawValue: [],
    MealName.snack.rawValue: []
  ]

  @State private var totals: NutritionTotals = NutritionTotals(calories: 0, protein: 0, carbs: 0, fat: 0)

  @State private var isLoading: Bool = false
  @State private var errorText: String = ""

  private var dateString: String { DateHelpers.yyyyMMdd(selectedDate) }

  var body: some View {
    List {
      Section {
        DatePicker("Date", selection: $selectedDate, displayedComponents: .date)
          .datePickerStyle(.compact)
      }

      Section("Totals") {
        HStack { Text("Calories"); Spacer(); Text("\(Int(totals.calories))") }
        HStack { Text("Protein"); Spacer(); Text("\(Int(totals.protein))") }
        HStack { Text("Carbs"); Spacer(); Text("\(Int(totals.carbs))") }
        HStack { Text("Fat"); Spacer(); Text("\(Int(totals.fat))") }
      }

      Section {
        Button(isLoading ? "Loading…" : "Reload") {
          Task { await load() }
        }
        .disabled(isLoading)

        Button("Copy yesterday’s Breakfast → today") {
          Task { await copy(fromMeal: .breakfast, toMeal: .breakfast) }
        }
        .disabled(isLoading)

        Button("Copy yesterday’s Lunch → today") {
          Task { await copy(fromMeal: .lunch, toMeal: .lunch) }
        }
        .disabled(isLoading)
      }

      ForEach(MealName.allCases) { meal in
        Section(meal.rawValue) {
          let entries = meals[meal.rawValue] ?? []
          if entries.isEmpty {
            Text("No items")
              .foregroundStyle(.secondary)
          }
          ForEach(entries) { entry in
            HStack(alignment: .firstTextBaseline) {
              VStack(alignment: .leading, spacing: 4) {
                Text(foodsIndex[entry.foodId]?.name ?? entry.foodId)
                  .font(.body)
                Text("Qty: \(entry.quantity, specifier: "%.1f")")
                  .font(.caption)
                  .foregroundStyle(.secondary)
              }
              Spacer()
              VStack(alignment: .trailing, spacing: 4) {
                if let f = foodsIndex[entry.foodId] {
                  Text("\(f.calories * Int(entry.quantity)) cal")
                    .font(.caption)
                  Text("P \(f.protein * Int(entry.quantity))  C \(f.carbs * Int(entry.quantity))  F \(f.fat * Int(entry.quantity))")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                }
              }
            }
          }
        }
      }

      if !errorText.isEmpty {
        Section("Error") {
          Text(errorText)
            .foregroundStyle(.red)
        }
      }
    }
    .task {
      await loadFoodsIfNeeded()
      await load()
    }
    .onChange(of: selectedDate) {
      Task { await load() }
    }
  }

  @MainActor
  private func loadFoodsIfNeeded() async {
    if !foods.isEmpty { return }
    do {
      let client = APIClient(baseURL: appState.serverURL, token: appState.token)
      let res = try await client.foods()
      foods = res.foods
      foodsIndex = Dictionary(uniqueKeysWithValues: res.foods.map { ($0.id, $0) })
    } catch {
      errorText = error.localizedDescription
    }
  }

  @MainActor
  private func load() async {
    isLoading = true
    defer { isLoading = false }
    errorText = ""

    do {
      let client = APIClient(baseURL: appState.serverURL, token: appState.token)
      let res = try await client.nutritionLog(date: dateString)
      meals = res.meals
      totals = res.totals
    } catch {
      errorText = error.localizedDescription
    }
  }

  @MainActor
  private func copy(fromMeal: MealName, toMeal: MealName) async {
    isLoading = true
    defer { isLoading = false }
    errorText = ""

    let toDate = dateString
    let fromDate = DateHelpers.yyyyMMdd(DateHelpers.yesterday(selectedDate))

    do {
      let client = APIClient(baseURL: appState.serverURL, token: appState.token)
      let res = try await client.copyMeal(fromDate: fromDate, fromMeal: fromMeal, toDate: toDate, toMeal: toMeal)
      meals = res.meals
      totals = res.totals
    } catch {
      errorText = error.localizedDescription
    }
  }
}
