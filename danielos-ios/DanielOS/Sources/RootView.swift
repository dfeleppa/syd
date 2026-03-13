import SwiftUI

struct RootView: View {
  @StateObject private var appState = AppState()

  var body: some View {
    TabView {
      NavigationStack {
        DashboardView()
          .navigationTitle("DanielOS")
      }
      .tabItem {
        Label("Home", systemImage: "house")
      }

      NavigationStack {
        PlannerView()
          .navigationTitle("Planner")
      }
      .tabItem {
        Label("Planner", systemImage: "checklist")
      }

      NavigationStack {
        CalendarView()
          .navigationTitle("Calendar")
      }
      .tabItem {
        Label("Calendar", systemImage: "calendar")
      }

      NavigationStack {
        NotesView()
          .navigationTitle("Notes")
      }
      .tabItem {
        Label("Notes", systemImage: "note.text")
      }

      NavigationStack {
        NutritionView()
          .navigationTitle("Nutrition")
      }
      .tabItem {
        Label("Nutrition", systemImage: "fork.knife")
      }
    }
    .environmentObject(appState)
  }
}
