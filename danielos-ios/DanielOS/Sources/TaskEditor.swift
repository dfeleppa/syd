import SwiftUI

struct TaskEditor: View {
  let existing: TaskItem?
  let onSave: (_ title: String, _ notes: String, _ status: String, _ dueAt: String?, _ priority: Int) -> Void

  @Environment(\.dismiss) private var dismiss

  @State private var title: String = ""
  @State private var notes: String = ""
  @State private var status: String = "todo"
  @State private var dueDate: Date = Date()
  @State private var hasDue: Bool = false
  @State private var priority: Int = 0

  var body: some View {
    NavigationStack {
      Form {
        Section("Title") {
          TextField("Title", text: $title)
        }

        Section("Notes") {
          TextEditor(text: $notes)
            .frame(minHeight: 120)
        }

        Section("Status") {
          Picker("Status", selection: $status) {
            Text("Todo").tag("todo")
            Text("Doing").tag("doing")
            Text("Done").tag("done")
          }
          .pickerStyle(.segmented)
        }

        Section("Due") {
          Toggle("Has due date", isOn: $hasDue)
          if hasDue {
            DatePicker("Due", selection: $dueDate)
          }
        }

        Section("Priority") {
          Stepper(value: $priority, in: 0...5, step: 1) {
            Text("\(priority)")
          }
        }
      }
      .navigationTitle(existing == nil ? "New Task" : "Edit Task")
      .toolbar {
        ToolbarItem(placement: .cancellationAction) {
          Button("Cancel") { dismiss() }
        }
        ToolbarItem(placement: .confirmationAction) {
          Button("Save") {
            let dueAt = hasDue ? dueDate.toISO8601() : nil
            onSave(title, notes, status, dueAt, priority)
            dismiss()
          }
          .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }
      }
      .onAppear {
        if let t = existing {
          title = t.title
          notes = t.notes
          status = t.status
          priority = t.priority
          if let d = t.dueAt, let parsed = Date.fromISO8601(d) {
            hasDue = true
            dueDate = parsed
          }
        }
      }
    }
  }
}

private extension Date {
  func toISO8601() -> String {
    ISO8601DateFormatter().string(from: self)
  }

  static func fromISO8601(_ s: String) -> Date? {
    ISO8601DateFormatter().date(from: s)
  }
}
