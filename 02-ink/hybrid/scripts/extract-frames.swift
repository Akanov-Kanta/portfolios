// Extracts an image sequence from a video with AVFoundation (no ffmpeg needed).
// usage: swift scripts/extract-frames.swift <video> <outDir> [fps=30] [start=0] [end=duration]
//        [cropX cropY cropW cropH] [outWidth] [format=jpg|avif] [quality=0.8] [flat=a,b,p]
// `flat` undoes a burned-in radial vignette before cropping: every pixel of the full source frame
// is divided by 1 - a*|dx|^p - b*|dy|^p (dx, dy = -1..1 from the frame centre), gain capped at 2.
import AVFoundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers
import Foundation

let a = CommandLine.arguments
guard a.count >= 3 else { print("usage: extract-frames <video> <outDir> [fps] [start] [end] [cx cy cw ch] [outW] [fmt] [q] [flat]"); exit(1) }
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
var flat: [Double]? = nil
if a.count > 13 { flat = a[13].split(separator: ",").map { Double($0)! } }

try? FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)
let gen = AVAssetImageGenerator(asset: asset)
gen.appliesPreferredTrackTransform = true
gen.requestedTimeToleranceBefore = .zero
gen.requestedTimeToleranceAfter = .zero
let srgb = CGColorSpace(name: CGColorSpace.sRGB)!

// precomputed per-pixel gain for the flat-field correction
var gainLUT: [Float] = []
var gainW = 0
var gainH = 0
func flatten(_ img: CGImage, _ f: [Double]) -> CGImage {
  let w = img.width, h = img.height
  if gainW != w || gainH != h {
    gainW = w; gainH = h
    gainLUT = [Float](repeating: 1, count: w * h)
    for y in 0..<h {
      let dy = abs((Double(y) + 0.5) / Double(h) * 2 - 1)
      for x in 0..<w {
        let dx = abs((Double(x) + 0.5) / Double(w) * 2 - 1)
        let m = 1 - f[0] * pow(dx, f[2]) - f[1] * pow(dy, f[2])
        gainLUT[y * w + x] = Float(min(2.0, 1.0 / max(m, 0.05)))
      }
    }
  }
  var px = [UInt8](repeating: 0, count: w * h * 4)
  let ctx = CGContext(data: &px, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                      space: srgb, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
  ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
  px.withUnsafeMutableBufferPointer { p in
    gainLUT.withUnsafeBufferPointer { g in
      for i in 0..<(w * h) {
        let k = g[i]
        let o = i * 4
        p[o] = UInt8(min(255, Float(p[o]) * k))
        p[o + 1] = UInt8(min(255, Float(p[o + 1]) * k))
        p[o + 2] = UInt8(min(255, Float(p[o + 2]) * k))
      }
    }
  }
  return ctx.makeImage()!
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
                      space: srgb, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
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
    if let f = flat { img = flatten(img, f) }
    if let c = crop, let cropped = img.cropping(to: c) { img = cropped }
    if outW > 0 && outW != img.width {
      let h = Int((Double(img.height) * Double(outW) / Double(img.width)).rounded())
      let ctx = CGContext(data: nil, width: outW, height: h, bitsPerComponent: 8, bytesPerRow: 0,
                          space: srgb, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
      ctx.interpolationQuality = .high
      ctx.draw(img, in: CGRect(x: 0, y: 0, width: outW, height: h))
      img = ctx.makeImage()!
    }
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
print("wrote \(i) frames, \(total / 1024) KB, fps=\(fps) range=\(start)-\(end)")
