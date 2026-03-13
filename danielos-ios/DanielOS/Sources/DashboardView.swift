import SwiftUI

struct DashboardView: View {
  var body: some View {
    List {
      Section("Quick Links") {
        NavigationLink("Nutrition", destination: NutritionView())
        NavigationLink("Notes", destination: NotesView())
        NavigationLink("Foods", destination: FoodsView())
        NavigationLink("Connect", destination: ConnectView())
      }

      Section("Status") {
        Text("Backend: configure in Connect tab")
          .foregroundStyle(.secondary)
      }
    }
  }
}
