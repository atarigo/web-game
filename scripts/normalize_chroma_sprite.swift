#!/usr/bin/env swift

import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

struct Config {
	var input = ""
	var output = ""
	var canvasW = 256
	var canvasH = 256
	var anchorX = 128
	var anchorY = 220
	var targetHeight = 164
	var keyR = 0
	var keyG = 255
	var keyB = 0
	var autoKey = "none"
	var transparentThreshold = 22.0
	var opaqueThreshold = 190.0
	var force = false
}

func fail(_ message: String) -> Never {
	FileHandle.standardError.write(Data((message + "\n").utf8))
	exit(1)
}

func parsePair(_ value: String, name: String) -> (Int, Int) {
	let parts = value.split(separator: "x")
	if parts.count == 2, let a = Int(parts[0]), let b = Int(parts[1]) {
		return (a, b)
	}
	let commaParts = value.split(separator: ",")
	if commaParts.count == 2, let a = Int(commaParts[0]), let b = Int(commaParts[1]) {
		return (a, b)
	}
	fail("Invalid \(name): \(value)")
}

func parseHexColor(_ value: String) -> (Int, Int, Int) {
	let hex = value.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
	guard hex.count == 6, let intValue = Int(hex, radix: 16) else {
		fail("Invalid --key color: \(value)")
	}
	return ((intValue >> 16) & 255, (intValue >> 8) & 255, intValue & 255)
}

var config = Config()
var args = Array(CommandLine.arguments.dropFirst())
while !args.isEmpty {
	let key = args.removeFirst()
	switch key {
	case "--input":
		config.input = args.removeFirst()
	case "--out":
		config.output = args.removeFirst()
	case "--canvas":
		let parsed = parsePair(args.removeFirst(), name: "--canvas")
		config.canvasW = parsed.0
		config.canvasH = parsed.1
	case "--anchor":
		let parsed = parsePair(args.removeFirst(), name: "--anchor")
		config.anchorX = parsed.0
		config.anchorY = parsed.1
	case "--target-height":
		config.targetHeight = Int(args.removeFirst()) ?? config.targetHeight
	case "--key":
		let parsed = parseHexColor(args.removeFirst())
		config.keyR = parsed.0
		config.keyG = parsed.1
		config.keyB = parsed.2
	case "--auto-key":
		config.autoKey = args.removeFirst()
	case "--transparent-threshold":
		config.transparentThreshold = Double(args.removeFirst()) ?? config.transparentThreshold
	case "--opaque-threshold":
		config.opaqueThreshold = Double(args.removeFirst()) ?? config.opaqueThreshold
	case "--force":
		config.force = true
	default:
		fail("Unknown argument: \(key)")
	}
}

guard !config.input.isEmpty, !config.output.isEmpty else {
	fail("Usage: normalize_chroma_sprite.swift --input source.png --out final.png [--canvas 256x256] [--anchor 128,220] [--target-height 164] [--key #00ff00] [--force]")
}

if FileManager.default.fileExists(atPath: config.output), !config.force {
	fail("Output exists. Pass --force to overwrite: \(config.output)")
}

let inputURL = URL(fileURLWithPath: config.input)
guard
	let source = CGImageSourceCreateWithURL(inputURL as CFURL, nil),
	let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
else {
	fail("Could not read image: \(config.input)")
}

let srcW = image.width
let srcH = image.height
let colorSpace = CGColorSpaceCreateDeviceRGB()
let bitmapInfo = CGImageAlphaInfo.premultipliedLast.rawValue

var src = [UInt8](repeating: 0, count: srcW * srcH * 4)
guard let readContext = CGContext(
	data: &src,
	width: srcW,
	height: srcH,
	bitsPerComponent: 8,
	bytesPerRow: srcW * 4,
	space: colorSpace,
	bitmapInfo: bitmapInfo
) else {
	fail("Could not create source bitmap context.")
}
readContext.draw(image, in: CGRect(x: 0, y: 0, width: srcW, height: srcH))

if config.autoKey == "border" || config.autoKey == "corners" {
	var samples: [(Int, Int)] = []
	if config.autoKey == "corners" {
		let inset = max(0, min(srcW, srcH) / 40)
		samples = [
			(inset, inset),
			(srcW - 1 - inset, inset),
			(inset, srcH - 1 - inset),
			(srcW - 1 - inset, srcH - 1 - inset)
		]
	} else {
		let step = max(1, min(srcW, srcH) / 80)
		for x in stride(from: 0, to: srcW, by: step) {
			samples.append((x, 0))
			samples.append((x, srcH - 1))
		}
		for y in stride(from: 0, to: srcH, by: step) {
			samples.append((0, y))
			samples.append((srcW - 1, y))
		}
	}
	var totalR = 0
	var totalG = 0
	var totalB = 0
	for (x, y) in samples {
		let i = (y * srcW + x) * 4
		totalR += Int(src[i])
		totalG += Int(src[i + 1])
		totalB += Int(src[i + 2])
	}
	if !samples.isEmpty {
		config.keyR = totalR / samples.count
		config.keyG = totalG / samples.count
		config.keyB = totalB / samples.count
	}
}

var minX = srcW
var minY = srcH
var maxX = -1
var maxY = -1

for y in 0..<srcH {
	for x in 0..<srcW {
		let i = (y * srcW + x) * 4
		let r = Int(src[i])
		let g = Int(src[i + 1])
		let b = Int(src[i + 2])
		let originalAlpha = Int(src[i + 3])
		let dr = Double(r - config.keyR)
		let dg = Double(g - config.keyG)
		let db = Double(b - config.keyB)
		let dist = sqrt(dr * dr + dg * dg + db * db)
		let matte: Double
		if dist <= config.transparentThreshold {
			matte = 0
		} else if dist >= config.opaqueThreshold {
			matte = 1
		} else {
			matte = (dist - config.transparentThreshold) / (config.opaqueThreshold - config.transparentThreshold)
		}
		let alpha = Int((Double(originalAlpha) * matte).rounded())
		src[i + 3] = UInt8(max(0, min(255, alpha)))
		if alpha > 12 {
			src[i] = UInt8(max(0, min(255, r)))
			src[i + 1] = UInt8(max(0, min(255, min(g, max(r, b) + 24))))
			src[i + 2] = UInt8(max(0, min(255, b)))
			minX = min(minX, x)
			minY = min(minY, y)
			maxX = max(maxX, x)
			maxY = max(maxY, y)
		}
	}
}

guard maxX >= minX, maxY >= minY else {
	fail("No foreground pixels found after chroma-key removal.")
}

let bboxW = maxX - minX + 1
let bboxH = maxY - minY + 1
let maxDrawW = config.canvasW - 24
let maxDrawH = min(config.targetHeight, config.anchorY - 8)
let scale = min(Double(maxDrawW) / Double(bboxW), Double(maxDrawH) / Double(bboxH))
let drawW = max(1, Int((Double(bboxW) * scale).rounded()))
let drawH = max(1, Int((Double(bboxH) * scale).rounded()))
let destX = max(0, min(config.canvasW - drawW, config.anchorX - drawW / 2))
let destY = max(0, min(config.canvasH - drawH, config.anchorY - drawH))

var out = [UInt8](repeating: 0, count: config.canvasW * config.canvasH * 4)

for dy in 0..<drawH {
	for dx in 0..<drawW {
		let sx = min(maxX, minX + Int((Double(dx) / scale).rounded()))
		let sy = min(maxY, minY + Int((Double(dy) / scale).rounded()))
		let si = (sy * srcW + sx) * 4
		let ox = destX + dx
		let oy = destY + dy
		let oi = (oy * config.canvasW + ox) * 4
		out[oi] = src[si]
		out[oi + 1] = src[si + 1]
		out[oi + 2] = src[si + 2]
		out[oi + 3] = src[si + 3]
	}
}

try FileManager.default.createDirectory(
	at: URL(fileURLWithPath: config.output).deletingLastPathComponent(),
	withIntermediateDirectories: true
)

guard let provider = CGDataProvider(data: Data(out) as CFData),
	let outputImage = CGImage(
		width: config.canvasW,
		height: config.canvasH,
		bitsPerComponent: 8,
		bitsPerPixel: 32,
		bytesPerRow: config.canvasW * 4,
		space: colorSpace,
		bitmapInfo: CGBitmapInfo(rawValue: bitmapInfo),
		provider: provider,
		decode: nil,
		shouldInterpolate: true,
		intent: .defaultIntent
	)
else {
	fail("Could not create output image.")
}

let outputURL = URL(fileURLWithPath: config.output)
guard let destination = CGImageDestinationCreateWithURL(outputURL as CFURL, UTType.png.identifier as CFString, 1, nil) else {
	fail("Could not create PNG destination: \(config.output)")
}
CGImageDestinationAddImage(destination, outputImage, nil)
guard CGImageDestinationFinalize(destination) else {
	fail("Could not write PNG: \(config.output)")
}

print("wrote \(config.output)")
print("source=\(srcW)x\(srcH) key=\(config.keyR),\(config.keyG),\(config.keyB) bbox=\(bboxW)x\(bboxH) draw=\(drawW)x\(drawH) dest=\(destX),\(destY) anchor=\(config.anchorX),\(config.anchorY)")
