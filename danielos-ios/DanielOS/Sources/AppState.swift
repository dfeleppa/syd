import Foundation

@MainActor
final class AppState: ObservableObject {
  @Published var serverURL: String
  @Published var token: String

  init() {
    self.serverURL = UserDefaults.standard.string(forKey: "serverURL") ?? "https://daniels-mac-mini.tail166065.ts.net/"
    self.token = Keychain.get("apiToken") ?? ""
  }

  func save() throws {
    let cleaned = serverURL.trimmingCharacters(in: .whitespacesAndNewlines)
    UserDefaults.standard.set(cleaned, forKey: "serverURL")
    try Keychain.set(token, for: "apiToken")
    self.serverURL = cleaned
  }
}
