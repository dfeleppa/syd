import SwiftUI

struct ConnectView: View {
  @EnvironmentObject private var appState: AppState

  @State private var statusText: String = ""
  @State private var isBusy: Bool = false

  var body: some View {
    Form {
      Section("Server") {
        TextField("Base URL", text: $appState.serverURL)
          .textInputAutocapitalization(.never)
          .autocorrectionDisabled()
      }

      Section("Auth") {
        SecureField("Bearer token", text: $appState.token)
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

    do {
      try appState.save()
    } catch {
      statusText = "Failed to save token: \(error.localizedDescription)"
      return
    }

    do {
      let client = APIClient(baseURL: appState.serverURL, token: appState.token)
      let res = try await client.health()
      statusText = "OK ✅\n\(res.name)\n\(res.ts)"
    } catch {
      statusText = "Error: \(error.localizedDescription)"
    }
  }
}
