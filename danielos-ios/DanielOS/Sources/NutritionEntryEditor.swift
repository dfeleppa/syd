import SwiftUI

struct NutritionEntryEditor: View {
  let meal: MealName
  let foods: [FoodItem]
  let initialFoodId: String?
  let initialQuantity: Double

  let onSave: (_ foodId: String, _ quantity: Double) -> Void

  @Environment(\.dismiss) private var dismiss

  @State private var search: String = ""
  @State private var selectedFoodId: String = ""
  @State private var quantity: Double = 1

  var body: some View {
    NavigationStack {
      Form {
        Section("Meal") {
          Text(meal.rawValue)
        }

        Section("Food") {
          TextField("Search", text: $search)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()

          Picker("Select", selection: $selectedFoodId) {
            ForEach(filteredFoods, id: \.id) { f in
              Text(f.name).tag(f.id)
            }
          }
        }

        Section("Quantity") {
          Stepper(value: $quantity, in: 0.5...50, step: 0.5) {
            Text(String(format: "%.1f", quantity))
          }
        }
      }
      .navigationTitle(initialFoodId == nil ? "Add item" : "Edit item")
      .toolbar {
        ToolbarItem(placement: .cancellationAction) {
          Button("Cancel") { dismiss() }
        }
        ToolbarItem(placement: .confirmationAction) {
          Button("Save") {
            guard !selectedFoodId.isEmpty else { return }
            onSave(selectedFoodId, quantity)
            dismiss()
          }
          .disabled(selectedFoodId.isEmpty)
        }
      }
      .onAppear {
        quantity = initialQuantity
        if let fid = initialFoodId {
          selectedFoodId = fid
        } else {
          selectedFoodId = foods.first?.id ?? ""
        }
      }
    }
  }

  private var filteredFoods: [FoodItem] {
    let s = search.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    if s.isEmpty { return foods }
    return foods.filter { $0.name.lowercased().contains(s) || $0.id.lowercased().contains(s) }
  }
}
