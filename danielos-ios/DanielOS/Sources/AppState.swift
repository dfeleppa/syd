import Foundation

@MainActor
final class AppState: ObservableObject {
  @Published var serverURL: String
  @Published var token: String

  init() {
    self.serverURL = UserDefaults.standard.string(forKey: "serverURL") ?? "http://100.78.99.91:8787/"
    self.token = Keychain.get("apiToken") ?? ""
  }

  func save() throws {
    let cleaned = serverURL.trimmingCharacters(in: .whitespacesAndNewlines)
    UserDefaults.standard.set(cleaned, forKey: "serverURL")
    try Keychain.set(token, for: "apiToken")
    self.serverURL = cleaned
  }
}
