import SwiftUI

struct ConnectView: View {
  @State private var serverURL: String = UserDefaults.standard.string(forKey: "serverURL") ?? "http://100.78.99.91:8787/"
  @State private var token: String = Keychain.get("apiToken") ?? ""
  @State private var statusText: String = ""
  @State private var isBusy: Bool = false

  var body: some View {
    Form {
      Section("Server") {
        TextField("Base URL", text: $serverURL)
          .textInputAutocapitalization(.never)
          .autocorrectionDisabled()
      }

      Section("Auth") {
        SecureField("Bearer token", text: $token)
          .textInputAutocapitalization(.never)
          .autocorrectionDisabled()

        Button(isBusy ? "Testing…" : "Test connection") {
          Task { await test() }
        }
        .disabled(isBusy)
      }

      if !statusText.isEmpty {
        Section("Result") {
          Text(statusText)
            .font(.callout)
        }
      }
    }
  }

  @MainActor
  private func test() async {
    isBusy = true
    defer { isBusy = false }

    let cleaned = serverURL.trimmingCharacters(in: .whitespacesAndNewlines)
    UserDefaults.standard.set(cleaned, forKey: "serverURL")
    do {
      try Keychain.set(token, for: "apiToken")
    } catch {
      statusText = "Failed to save token: \(error.localizedDescription)"
      return
    }

    do {
      let client = APIClient(baseURL: cleaned, token: token)
      let res = try await client.health()
      statusText = "OK ✅\n\(res.name)\n\(res.ts)"
    } catch {
      statusText = "Error: \(error.localizedDescription)"
    }
  }
}
