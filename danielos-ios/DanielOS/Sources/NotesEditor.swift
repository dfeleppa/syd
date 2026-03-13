import SwiftUI

struct NotesEditor: View {
  let existing: Note?
  let onSave: (_ title: String, _ content: String) -> Void

  @Environment(\.dismiss) private var dismiss

  @State private var title: String = ""
  @State private var content: String = ""

  var body: some View {
    NavigationStack {
      Form {
        Section("Title") {
          TextField("Title", text: $title)
        }

        Section("Content") {
          TextEditor(text: $content)
            .frame(minHeight: 220)
        }
      }
      .navigationTitle(existing == nil ? "New Note" : "Edit Note")
      .toolbar {
        ToolbarItem(placement: .cancellationAction) {
          Button("Cancel") { dismiss() }
        }
        ToolbarItem(placement: .confirmationAction) {
          Button("Save") {
            onSave(title, content)
            dismiss()
          }
        }
      }
      .onAppear {
        if let n = existing {
          title = n.title
          content = n.content
        }
      }
    }
  }
}
