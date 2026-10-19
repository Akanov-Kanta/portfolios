// Extracts an image sequence from a video with AVFoundation (no ffmpeg needed).
// usage: swift scripts/extract-frames.swift <video> <outDir> [fps=30] [start=0] [end=duration]
//        [cropX cropY cropW cropH] [outWidth] [format=jpg|avif] [quality=0.8]
// env COVER="x,y,w,h,sigma,t0,t1;..." paints a feathered black patch (output pixels, top-left origin)
// over every frame whose time is in [t0, t1). Used to hide burned-in captions that sit on dark ground.
import AVFoundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers
import Foundation

let a = CommandLine.arguments
guard a.count >= 3 else { print("usage: extract-frames <video> <outDir> [fps] [start] [end] [cx cy cw ch] [outW] [fmt] [q]"); exit(1) }
let url = URL(fileURLWithPath: a[1])
let outDir = URL(fileURLWithPath: a[2])
let fps = a.count > 3 ? Double(a[3])! : 30
let asset = AVURLAsset(url: url)
let duration = CMTimeGetSeconds(asset.duration)
let start = a.count > 4 ? Double(a[4])! : 0
let end = a.count > 5 ? Double(a[5])! : duration
var crop: CGRect? = nil
if a.count > 9 { crop = CGRect(x: Double(a[6])!, y: Double(a[7])!, width: Double(a[8])!, height: Double(a[9])!) }
let outW = a.count > 10 ? Int(a[10])! : 0
let fmt = a.count > 11 ? a[11] : "jpg"
let quality = a.count > 12 ? Double(a[12])! : 0.8

try? FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)
let gen = AVAssetImageGenerator(asset: asset)
gen.appliesPreferredTrackTransform = true
gen.requestedTimeToleranceBefore = .zero
gen.requestedTimeToleranceAfter = .zero

struct Cover { let rect: CGRect; let sigma: Double; let t0: Double; let t1: Double }
let covers: [Cover] = (ProcessInfo.processInfo.environment["COVER"] ?? "").split(separator: ";").compactMap { part in
  let v = part.split(separator: ",").compactMap { Double($0.trimmingCharacters(in: .whitespaces)) }
  guard v.count == 7 else { return nil }
  return Cover(rect: CGRect(x: v[0], y: v[1], width: v[2], height: v[3]), sigma: v[4], t0: v[5], t1: v[6])
}
// Darkens pixels by a feathered rectangle: alpha = 1 inside, falling to 0 over `sigma`*2 px outside.
func applyCovers(_ img: CGImage, _ t: Double) -> CGImage {
  let active = covers.filter { t >= $0.t0 - 0.0001 && t < $0.t1 }
  if active.isEmpty { return img }
  let w = img.width, h = img.height
  guard let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                            space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue),
        let data = ctx.data else { return img }
  ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
  let px = data.bindMemory(to: UInt8.self, capacity: w * h * 4)
  for c in active {
    let f = c.sigma * 2
    let x0 = max(0, Int(c.rect.minX - f)), x1 = min(w, Int(c.rect.maxX + f))
    let y0 = max(0, Int(c.rect.minY - f)), y1 = min(h, Int(c.rect.maxY + f))
    if x0 >= x1 || y0 >= y1 { continue }
    for y in y0..<y1 {
      // memory row 0 is the top of the image
      let dy = max(0, max(c.rect.minY - Double(y), Double(y) - c.rect.maxY))
      for x in x0..<x1 {
        let dx = max(0, max(c.rect.minX - Double(x), Double(x) - c.rect.maxX))
        let d = (dx * dx + dy * dy).squareRoot() / f
        if d >= 1 { continue }
        let s = d * d * (3 - 2 * d) // smoothstep
        let k = s // keep factor
        let i = (y * w + x) * 4
        px[i] = UInt8(Double(px[i]) * k)
        px[i + 1] = UInt8(Double(px[i + 1]) * k)
        px[i + 2] = UInt8(Double(px[i + 2]) * k)
      }
    }
  }
  return ctx.makeImage() ?? img
}

let uti = fmt == "avif" ? "public.avif" : "public.jpeg"
var i = 0
var total = 0
var lumas: [Double] = []
// mean luminance of a frame (0..1), measured on a 16x16 downscale
func meanLuma(_ img: CGImage) -> Double {
  let n = 16
  var px = [UInt8](repeating: 0, count: n * n * 4)
  let ctx = CGContext(data: &px, width: n, height: n, bitsPerComponent: 8, bytesPerRow: n * 4,
                      space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
  ctx.interpolationQuality = .medium
  ctx.draw(img, in: CGRect(x: 0, y: 0, width: n, height: n))
  var sum = 0.0
  for k in 0..<(n * n) { sum += 0.2126 * Double(px[k * 4]) + 0.7152 * Double(px[k * 4 + 1]) + 0.0722 * Double(px[k * 4 + 2]) }
  return sum / Double(n * n) / 255.0
}
var t = start
while t < end - 0.0001 {
  let time = CMTime(seconds: t, preferredTimescale: 600)
  do {
    var img = try gen.copyCGImage(at: time, actualTime: nil)
    if let c = crop, let cropped = img.cropping(to: c) { img = cropped }
    if outW > 0 && outW != img.width {
      let h = Int((Double(img.height) * Double(outW) / Double(img.width)).rounded())
      let ctx = CGContext(data: nil, width: outW, height: h, bitsPerComponent: 8, bytesPerRow: 0,
                          space: CGColorSpace(name: CGColorSpace.sRGB)!,
                          bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
      ctx.interpolationQuality = .high
      ctx.draw(img, in: CGRect(x: 0, y: 0, width: outW, height: h))
      img = ctx.makeImage()!
    }
    img = applyCovers(img, t)
    lumas.append(meanLuma(img))
    let name = String(format: "f%04d.%@", i, fmt)
    let dest = CGImageDestinationCreateWithURL(outDir.appendingPathComponent(name) as CFURL, uti as CFString, 1, nil)!
    CGImageDestinationAddImage(dest, img, [kCGImageDestinationLossyCompressionQuality: quality] as CFDictionary)
    CGImageDestinationFinalize(dest)
    if let attrs = try? FileManager.default.attributesOfItem(atPath: outDir.appendingPathComponent(name).path) {
      total += (attrs[.size] as? Int) ?? 0
    }
  } catch {
    print("failed at \(t): \(error)")
  }
  i += 1
  t = start + Double(i) / fps
}
let lumaJSON = "[" + lumas.map { String(format: "%.3f", $0) }.joined(separator: ",") + "]"
try? lumaJSON.write(to: outDir.appendingPathComponent("luma.json"), atomically: true, encoding: .utf8)
print("wrote \(i) frames, \(total / 1024) KB, \(img_dims())")
func img_dims() -> String { "fps=\(fps) range=\(start)-\(end) dur=\(duration)" }
