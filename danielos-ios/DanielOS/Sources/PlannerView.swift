import SwiftUI

struct PlannerView: View {
  @EnvironmentObject private var appState: AppState

  @State private var tasks: [TaskItem] = []
  @State private var isLoading: Bool = false
  @State private var errorText: String = ""

  @State private var showAdd: Bool = false
  @State private var editorTask: TaskItem? = nil

  var body: some View {
    List {
      Section {
        Button(isLoading ? "Loading…" : "Reload") {
          Task { await load() }
        }
        .disabled(isLoading)

        Button("New task") {
          showAdd = true
        }
        .disabled(isLoading)
      }

      tasksSection(title: "Todo", status: "todo")
      tasksSection(title: "Doing", status: "doing")
      tasksSection(title: "Done", status: "done")

      if !errorText.isEmpty {
        Section("Error") {
          Text(errorText)
            .foregroundStyle(.red)
        }
      }
    }
    .sheet(item: $editorTask) { t in
      TaskEditor(existing: t) { title, notes, status, dueAt, priority in
        Task { await save(id: t.id, title: title, notes: notes, status: status, dueAt: dueAt, priority: priority) }
      }
    }
    .sheet(isPresented: $showAdd) {
      TaskEditor(existing: nil) { title, notes, status, dueAt, priority in
        Task { await save(id: nil, title: title, notes: notes, status: status, dueAt: dueAt, priority: priority) }
      }
    }
    .task {
      await load()
    }
  }

  @ViewBuilder
  private func tasksSection(title: String, status: String) -> some View {
    let filtered = tasks.filter { $0.status == status }

    Section(title) {
      if filtered.isEmpty {
        Text("None")
          .foregroundStyle(.secondary)
      }

      ForEach(filtered, id: \.id) { t in
        Button {
          editorTask = t
        } label: {
          VStack(alignment: .leading, spacing: 4) {
            Text(t.title)
              .font(.body)
            if !t.notes.isEmpty {
              Text(t.notes)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(2)
            }
            if let due = t.dueAt {
              Text("Due: \(due)")
                .font(.caption2)
                .foregroundStyle(.secondary)
                .lineLimit(1)
            }
          }
        }
        .swipeActions {
          if status != "done" {
            Button {
              Task { await setStatus(id: t.id, status: "done") }
            } label: {
              Label("Done", systemImage: "checkmark")
            }
            .tint(.green)
          }

          Button(role: .destructive) {
            Task { await delete(id: t.id) }
          } label: {
            Label("Delete", systemImage: "trash")
          }
        }
      }
    }
  }

  @MainActor
  private func load() async {
    isLoading = true
    defer { isLoading = false }
    errorText = ""

    do {
      let client = APIClient(baseURL: appState.serverURL, token: appState.token)
      let res = try await client.tasks()
      tasks = res.tasks
    } catch {
      errorText = error.localizedDescription
    }
  }

  @MainActor
  private func save(id: String?, title: String, notes: String, status: String, dueAt: String?, priority: Int) async {
    isLoading = true
    defer { isLoading = false }
    errorText = ""

    do {
      let client = APIClient(baseURL: appState.serverURL, token: appState.token)
      let res = try await client.upsertTask(id: id, title: title, notes: notes, status: status, dueAt: dueAt, priority: priority)
      tasks = res.tasks
    } catch {
      errorText = error.localizedDescription
    }
  }

  @MainActor
  private func setStatus(id: String, status: String) async {
    isLoading = true
    defer { isLoading = false }
    errorText = ""

    do {
      let client = APIClient(baseURL: appState.serverURL, token: appState.token)
      let res = try await client.patchTask(id: id, status: status)
      tasks = res.tasks
    } catch {
      errorText = error.localizedDescription
    }
  }

  @MainActor
  private func delete(id: String) async {
    isLoading = true
    defer { isLoading = false }
    errorText = ""

    do {
      let client = APIClient(baseURL: appState.serverURL, token: appState.token)
      let res = try await client.deleteTask(id: id)
      tasks = res.tasks
    } catch {
      errorText = error.localizedDescription
    }
  }
}
