import SwiftUI

struct FoodsView: View {
  @EnvironmentObject private var appState: AppState

  @State private var foods: [FoodItem] = []
  @State private var search: String = ""

  @State private var isLoading: Bool = false
  @State private var errorText: String = ""

  @State private var editorFood: FoodItem? = nil
  @State private var showAdd: Bool = false

  var body: some View {
    List {
      Section {
        TextField("Search", text: $search)
          .textInputAutocapitalization(.never)
          .autocorrectionDisabled()
      }

      Section {
        Button(isLoading ? "Loading…" : "Reload") {
          Task { await load() }
        }
        .disabled(isLoading)

        Button("Add food") {
          showAdd = true
        }
        .disabled(isLoading)
      }

      Section("Foods") {
        ForEach(filteredFoods, id: \.id) { f in
          Button {
            editorFood = f
          } label: {
            VStack(alignment: .leading, spacing: 4) {
              Text(f.name)
                .font(.body)
              Text("\(f.calories) cal • P\(f.protein) C\(f.carbs) F\(f.fat)")
                .font(.caption)
                .foregroundStyle(.secondary)
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
    .sheet(item: $editorFood) { f in
      FoodsEditor(existing: f) { draft in
        Task { await save(draft) }
      }
    }
    .sheet(isPresented: $showAdd) {
      FoodsEditor(existing: nil) { draft in
        Task { await save(draft) }
      }
    }
    .task {
      await load()
    }
  }

  private var filteredFoods: [FoodItem] {
    let s = search.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    if s.isEmpty { return foods }
    return foods.filter { $0.name.lowercased().contains(s) || $0.id.lowercased().contains(s) }
  }

  @MainActor
  private func load() async {
    isLoading = true
    defer { isLoading = false }
    errorText = ""

    do {
      let client = APIClient(baseURL: appState.serverURL, token: appState.token)
      let res = try await client.foods()
      foods = res.foods
    } catch {
      errorText = error.localizedDescription
    }
  }

  @MainActor
  private func save(_ draft: FoodDraft) async {
    isLoading = true
    defer { isLoading = false }
    errorText = ""

    do {
      let client = APIClient(baseURL: appState.serverURL, token: appState.token)
      let res = try await client.upsertFood(draft)
      foods = res.foods
    } catch {
      errorText = error.localizedDescription
    }
  }
}
