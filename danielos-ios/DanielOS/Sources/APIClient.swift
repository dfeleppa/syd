import Foundation

struct HealthResponse: Codable {
  let ok: Bool
  let name: String
  let ts: String
}

enum APIError: Error, LocalizedError {
  case invalidURL
  case unauthorized
  case badStatus(Int)
  case decode

  var errorDescription: String? {
    switch self {
    case .invalidURL: return "Invalid server URL"
    case .unauthorized: return "Unauthorized (check token)"
    case .badStatus(let s): return "Server returned HTTP \(s)"
    case .decode: return "Failed to decode server response"
    }
  }
}

struct APIClient {
  var baseURL: String
  var token: String

  func health() async throws -> HealthResponse {
    guard let url = URL(string: baseURL)?.appending(path: "health") else {
      throw APIError.invalidURL
    }

    var req = URLRequest(url: url)
    req.httpMethod = "GET"

    let (data, resp) = try await URLSession.shared.data(for: req)
    let status = (resp as? HTTPURLResponse)?.statusCode ?? 0
    guard (200..<300).contains(status) else {
      if status == 401 { throw APIError.unauthorized }
      throw APIError.badStatus(status)
    }

    guard let parsed = try? JSONDecoder().decode(HealthResponse.self, from: data) else {
      throw APIError.decode
    }
    return parsed
  }
}
