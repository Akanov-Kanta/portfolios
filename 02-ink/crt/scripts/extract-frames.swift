// Extracts an image sequence from a video with AVFoundation (no ffmpeg needed).
// usage: swift scripts/extract-frames.swift <video> <outDir> [fps=30] [start=0] [end=duration]
//        [cropX cropY cropW cropH] [outWidth] [format=jpg|avif] [quality=0.8]
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
