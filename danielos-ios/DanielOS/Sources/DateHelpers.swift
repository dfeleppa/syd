import Foundation

enum DateHelpers {
  static func yyyyMMdd(_ date: Date) -> String {
    let f = DateFormatter()
    f.locale = Locale(identifier: "en_US_POSIX")
    f.timeZone = .current
    f.dateFormat = "yyyy-MM-dd"
    return f.string(from: date)
  }

  static func yesterday(_ date: Date) -> Date {
    Calendar.current.date(byAdding: .day, value: -1, to: date) ?? date
  }
}
