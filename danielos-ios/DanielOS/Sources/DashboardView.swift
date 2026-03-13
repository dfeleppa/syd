import SwiftUI

struct DashboardView: View {
  var body: some View {
    List {
      Section("Quick Links") {
        NavigationLink("Planner", destination: PlannerView())
        NavigationLink("Calendar", destination: CalendarView())
        NavigationLink("Notes", destination: NotesView())
        NavigationLink("Nutrition", destination: NutritionView())
      }

      Section("Status") {
        Text("Backend: configure in Connect tab")
          .foregroundStyle(.secondary)
      }
    }
  }
}
