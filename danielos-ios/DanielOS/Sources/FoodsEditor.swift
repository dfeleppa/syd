import SwiftUI

struct FoodsEditor: View {
  let existing: FoodItem?
  let onSave: (_ draft: FoodDraft) -> Void

  @Environment(\.dismiss) private var dismiss

  @State private var id: String = ""
  @State private var name: String = ""
  @State private var source: String = "mine"
  @State private var calories: String = ""
  @State private var protein: String = ""
  @State private var carbs: String = ""
  @State private var fiber: String = ""
  @State private var fat: String = ""
  @State private var satFat: String = ""

  var body: some View {
    NavigationStack {
      Form {
        Section("Basics") {
          TextField("Name", text: $name)

          Picker("Source", selection: $source) {
            Text("Mine").tag("mine")
            Text("Recent").tag("recent")
          }

          TextField("ID (optional)", text: $id)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            .foregroundStyle(.secondary)
        }

        Section("Macros") {
          TextField("Calories", text: $calories).keyboardType(.decimalPad)
          TextField("Protein", text: $protein).keyboardType(.decimalPad)
          TextField("Carbs", text: $carbs).keyboardType(.decimalPad)
          TextField("Fiber", text: $fiber).keyboardType(.decimalPad)
          TextField("Fat", text: $fat).keyboardType(.decimalPad)
          TextField("Sat Fat", text: $satFat).keyboardType(.decimalPad)
        }
      }
      .navigationTitle(existing == nil ? "Add Food" : "Edit Food")
      .toolbar {
        ToolbarItem(placement: .cancellationAction) {
          Button("Cancel") { dismiss() }
        }
        ToolbarItem(placement: .confirmationAction) {
          Button("Save") {
            onSave(FoodDraft(
              id: id.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : id,
              name: name,
              source: source,
              calories: Double(calories) ?? 0,
              protein: Double(protein) ?? 0,
              carbs: Double(carbs) ?? 0,
              fiber: Double(fiber) ?? 0,
              fat: Double(fat) ?? 0,
              satFat: Double(satFat) ?? 0
            ))
            dismiss()
          }
          .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }
      }
      .onAppear {
        if let f = existing {
          id = f.id
          name = f.name
          source = f.source
          calories = String(f.calories)
          protein = String(f.protein)
          carbs = String(f.carbs)
          fiber = String(f.fiber)
          fat = String(f.fat)
          satFat = String(f.satFat)
        }
      }
    }
  }
}

struct FoodDraft: Codable {
  let id: String?
  let name: String
  let source: String
  let calories: Double
  let protein: Double
  let carbs: Double
  let fiber: Double
  let fat: Double
  let satFat: Double
}
