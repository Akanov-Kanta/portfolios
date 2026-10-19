// Exports the audio track of a video to AAC (.m4a) with AVFoundation (no ffmpeg needed).
// usage: swift scripts/extract-audio.swift <video> <out.m4a>
import AVFoundation
import Foundation

let a = CommandLine.arguments
guard a.count >= 3 else { print("usage: extract-audio <video> <out.m4a>"); exit(1) }
let asset = AVURLAsset(url: URL(fileURLWithPath: a[1]))
let out = URL(fileURLWithPath: a[2])
try? FileManager.default.removeItem(at: out)
guard let session = AVAssetExportSession(asset: asset, presetName: AVAssetExportPresetAppleM4A) else {
  print("no export session"); exit(1)
}
session.outputURL = out
session.outputFileType = .m4a
let done = DispatchSemaphore(value: 0)
session.exportAsynchronously { done.signal() }
done.wait()
if session.status != .completed {
  print("export failed: \(String(describing: session.error))"); exit(1)
}
let size = (try? FileManager.default.attributesOfItem(atPath: out.path)[.size] as? Int) ?? 0
print("wrote \(out.lastPathComponent), \(size / 1024) KB")
