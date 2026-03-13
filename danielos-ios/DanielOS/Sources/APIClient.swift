import Foundation

import Foundation

struct HealthResponse: Codable {
  let ok: Bool
  let name: String
  let ts: String
}

struct FoodItem: Codable, Identifiable, Hashable {
  let id: String
  let name: String
  let source: String
  let calories: Int
  let protein: Int
  let carbs: Int
  let fiber: Int
  let fat: Int
  let satFat: Int
}

struct FoodsResponse: Codable {
  let foods: [FoodItem]
  let recent: [FoodItem]
  let mine: [FoodItem]
}

enum MealName: String, Codable, CaseIterable, Identifiable {
  case breakfast = "Breakfast"
  case lunch = "Lunch"
  case dinner = "Dinner"
  case snack = "Snack"

  var id: String { rawValue }
}

struct MealEntry: Codable, Identifiable, Hashable {
  let id: String
  let foodId: String
  var quantity: Double
}

typealias DayMeals = [String: [MealEntry]] // keys: Breakfast|Lunch|Dinner|Snack

struct NutritionTotals: Codable, Hashable {
  let calories: Double
  let protein: Double
  let carbs: Double
  let fat: Double
}

struct NutritionLogResponse: Codable {
  let date: String
  let meals: DayMeals
  let totals: NutritionTotals
}

struct NutritionCopyRequest: Codable {
  let fromDate: String
  let fromMeal: String
  let toDate: String
  let toMeal: String
}

struct NutritionAddRequest: Codable {
  let date: String
  let meal: String
  let foodId: String
  let quantity: Double
}

struct NutritionEntryPatchRequest: Codable {
  let date: String
  let id: String
  let fromMeal: String?
  let toMeal: String?
  let quantity: Double?
}

struct NutritionEntryDeleteRequest: Codable {
  let date: String
  let id: String
  let meal: String?
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

  private func makeURL(_ path: String, query: [URLQueryItem] = []) throws -> URL {
    guard var url = URL(string: baseURL) else { throw APIError.invalidURL }
    if !url.absoluteString.hasSuffix("/") {
      url = URL(string: url.absoluteString + "/")!
    }
    url = url.appending(path: path)
    if !query.isEmpty {
      var comps = URLComponents(url: url, resolvingAgainstBaseURL: false)!
      comps.queryItems = query
      return comps.url!
    }
    return url
  }

  private func authed(_ req: inout URLRequest) {
    if !token.isEmpty {
      req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    }
  }

  private func send<T: Decodable>(_ req: URLRequest, as type: T.Type) async throws -> T {
    let (data, resp) = try await URLSession.shared.data(for: req)
    let status = (resp as? HTTPURLResponse)?.statusCode ?? 0
    guard (200..<300).contains(status) else {
      if status == 401 { throw APIError.unauthorized }
      throw APIError.badStatus(status)
    }
    guard let parsed = try? JSONDecoder().decode(T.self, from: data) else {
      throw APIError.decode
    }
    return parsed
  }

  func health() async throws -> HealthResponse {
    let url = try makeURL("health")
    var req = URLRequest(url: url)
    req.httpMethod = "GET"
    return try await send(req, as: HealthResponse.self)
  }

  func foods() async throws -> FoodsResponse {
    let url = try makeURL("foods")
    var req = URLRequest(url: url)
    req.httpMethod = "GET"
    authed(&req)
    return try await send(req, as: FoodsResponse.self)
  }

  func upsertFood(_ draft: FoodDraft) async throws -> FoodsResponse {
    let url = try makeURL("foods")
    var req = URLRequest(url: url)
    req.httpMethod = "POST"
    authed(&req)
    req.setValue("application/json", forHTTPHeaderField: "Content-Type")
    req.httpBody = try JSONEncoder().encode(draft)
    return try await send(req, as: FoodsResponse.self)
  }

  func nutritionLog(date: String) async throws -> NutritionLogResponse {
    let url = try makeURL("nutrition/log", query: [URLQueryItem(name: "date", value: date)])
    var req = URLRequest(url: url)
    req.httpMethod = "GET"
    authed(&req)
    return try await send(req, as: NutritionLogResponse.self)
  }

  func copyMeal(fromDate: String, fromMeal: MealName, toDate: String, toMeal: MealName) async throws -> NutritionLogResponse {
    let url = try makeURL("nutrition/copy")
    var req = URLRequest(url: url)
    req.httpMethod = "POST"
    authed(&req)
    req.setValue("application/json", forHTTPHeaderField: "Content-Type")
    req.httpBody = try JSONEncoder().encode(NutritionCopyRequest(fromDate: fromDate, fromMeal: fromMeal.rawValue, toDate: toDate, toMeal: toMeal.rawValue))
    return try await send(req, as: NutritionLogResponse.self)
  }

  func addNutritionEntry(date: String, meal: MealName, foodId: String, quantity: Double) async throws -> NutritionLogResponse {
    let url = try makeURL("nutrition/log")
    var req = URLRequest(url: url)
    req.httpMethod = "POST"
    authed(&req)
    req.setValue("application/json", forHTTPHeaderField: "Content-Type")
    req.httpBody = try JSONEncoder().encode(NutritionAddRequest(date: date, meal: meal.rawValue, foodId: foodId, quantity: quantity))
    return try await send(req, as: NutritionLogResponse.self)
  }

  func patchNutritionEntry(date: String, id: String, fromMeal: MealName?, toMeal: MealName?, quantity: Double?) async throws -> NutritionLogResponse {
    let url = try makeURL("nutrition/entry")
    var req = URLRequest(url: url)
    req.httpMethod = "PATCH"
    authed(&req)
    req.setValue("application/json", forHTTPHeaderField: "Content-Type")
    req.httpBody = try JSONEncoder().encode(NutritionEntryPatchRequest(date: date, id: id, fromMeal: fromMeal?.rawValue, toMeal: toMeal?.rawValue, quantity: quantity))
    return try await send(req, as: NutritionLogResponse.self)
  }

  func deleteNutritionEntry(date: String, id: String, meal: MealName?) async throws -> NutritionLogResponse {
    let url = try makeURL("nutrition/entry")
    var req = URLRequest(url: url)
    req.httpMethod = "DELETE"
    authed(&req)
    req.setValue("application/json", forHTTPHeaderField: "Content-Type")
    req.httpBody = try JSONEncoder().encode(NutritionEntryDeleteRequest(date: date, id: id, meal: meal?.rawValue))
    return try await send(req, as: NutritionLogResponse.self)
  }
}
