import SwiftUI

struct NotesView: View {
  @EnvironmentObject private var appState: AppState

  @State private var notes: [Note] = []
  @State private var search: String = ""

  @State private var isLoading: Bool = false
  @State private var errorText: String = ""

  @State private var editorNote: Note? = nil
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

        Button("New note") {
          showAdd = true
        }
        .disabled(isLoading)
      }

      Section("Notes") {
        ForEach(filteredNotes, id: \.id) { n in
          Button {
            editorNote = n
          } label: {
            VStack(alignment: .leading, spacing: 4) {
              Text(n.title.isEmpty ? "(Untitled)" : n.title)
                .font(.body)
              Text(n.updatedAt)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .lineLimit(1)
            }
          }
          .swipeActions {
            Button(role: .destructive) {
              Task { await delete(id: n.id) }
            } label: {
              Label("Delete", systemImage: "trash")
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
    .sheet(item: $editorNote) { n in
      NotesEditor(existing: n) { title, content in
        Task { await save(id: n.id, title: title, content: content) }
      }
    }
    .sheet(isPresented: $showAdd) {
      NotesEditor(existing: nil) { title, content in
        Task { await save(id: nil, title: title, content: content) }
      }
    }
    .task {
      await load()
    }
  }

  private var filteredNotes: [Note] {
    let s = search.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    if s.isEmpty { return notes }
    return notes.filter {
      $0.title.lowercased().contains(s) || $0.content.lowercased().contains(s)
    }
  }

  @MainActor
  private func load() async {
    isLoading = true
    defer { isLoading = false }
    errorText = ""

    do {
      let client = APIClient(baseURL: appState.serverURL, token: appState.token)
      let res = try await client.notes()
      notes = res.notes
    } catch {
      errorText = error.localizedDescription
    }
  }

  @MainActor
  private func save(id: String?, title: String, content: String) async {
    isLoading = true
    defer { isLoading = false }
    errorText = ""

    do {
      let client = APIClient(baseURL: appState.serverURL, token: appState.token)
      let res = try await client.upsertNote(id: id, title: title, content: content)
      notes = res.notes
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
      let res = try await client.deleteNote(id: id)
      notes = res.notes
    } catch {
      errorText = error.localizedDescription
    }
  }
}
