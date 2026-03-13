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
        NutritionView()
          .navigationTitle("Nutrition")
      }
      .tabItem {
        Label("Nutrition", systemImage: "fork.knife")
      }

      NavigationStack {
        NotesView()
          .navigationTitle("Notes")
      }
      .tabItem {
        Label("Notes", systemImage: "note.text")
      }

      NavigationStack {
        FoodsView()
          .navigationTitle("Foods")
      }
      .tabItem {
        Label("Foods", systemImage: "leaf")
      }

      NavigationStack {
        ConnectView()
          .navigationTitle("Connect")
      }
      .tabItem {
        Label("Connect", systemImage: "link")
      }
    }
    .environmentObject(appState)
  }
}
