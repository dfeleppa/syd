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

  @State private var editorMeal: MealName? = nil
  @State private var editorExisting: MealEntry? = nil

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
        Section {
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
                Text("Qty: \(String(format: "%.1f", entry.quantity))")
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
            .swipeActions {
              Button(role: .destructive) {
                Task { await delete(entry: entry, meal: meal) }
              } label: {
                Label("Delete", systemImage: "trash")
              }

              Button {
                editorMeal = meal
                editorExisting = entry
              } label: {
                Label("Edit", systemImage: "pencil")
              }
              .tint(.blue)
            }
          }
        } header: {
          HStack {
            Text(meal.rawValue)
            Spacer()
            Button {
              editorMeal = meal
              editorExisting = nil
            } label: {
              Image(systemName: "plus.circle")
            }
            .disabled(isLoading)
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
    .sheet(item: $editorMeal) { meal in
      NutritionEntryEditor(
        meal: meal,
        foods: foods,
        initialFoodId: editorExisting?.foodId,
        initialQuantity: editorExisting?.quantity ?? 1,
        onSave: { foodId, quantity in
          Task {
            if let existing = editorExisting {
              await patch(entryId: existing.id, meal: meal, quantity: quantity)
            } else {
              await add(meal: meal, foodId: foodId, quantity: quantity)
            }
          }
        }
      )
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

  @MainActor
  private func add(meal: MealName, foodId: String, quantity: Double) async {
    isLoading = true
    defer { isLoading = false }
    errorText = ""

    do {
      let client = APIClient(baseURL: appState.serverURL, token: appState.token)
      let res = try await client.addNutritionEntry(date: dateString, meal: meal, foodId: foodId, quantity: quantity)
      meals = res.meals
      totals = res.totals
    } catch {
      errorText = error.localizedDescription
    }
  }

  @MainActor
  private func patch(entryId: String, meal: MealName, quantity: Double) async {
    isLoading = true
    defer { isLoading = false }
    errorText = ""

    do {
      let client = APIClient(baseURL: appState.serverURL, token: appState.token)
      let res = try await client.patchNutritionEntry(date: dateString, id: entryId, fromMeal: meal, toMeal: nil, quantity: quantity)
      meals = res.meals
      totals = res.totals
    } catch {
      errorText = error.localizedDescription
    }
  }

  @MainActor
  private func delete(entry: MealEntry, meal: MealName) async {
    isLoading = true
    defer { isLoading = false }
    errorText = ""

    do {
      let client = APIClient(baseURL: appState.serverURL, token: appState.token)
      let res = try await client.deleteNutritionEntry(date: dateString, id: entry.id, meal: meal)
      meals = res.meals
      totals = res.totals
    } catch {
      errorText = error.localizedDescription
    }
  }
}
