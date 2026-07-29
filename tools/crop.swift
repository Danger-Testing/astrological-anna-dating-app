import Foundation
import CoreImage

// usage: crop <in> <out> <x> <yTop> <w> <h>  (top-left origin coords)
let a = CommandLine.arguments
guard a.count == 7, let ci = CIImage(contentsOf: URL(fileURLWithPath: a[1])) else { print("bad args/load"); exit(1) }
let x = CGFloat(Double(a[3])!), yTop = CGFloat(Double(a[4])!), w = CGFloat(Double(a[5])!), h = CGFloat(Double(a[6])!)
let H = ci.extent.height
let rect = CGRect(x: x, y: H - yTop - h, width: w, height: h)
let out = ci.cropped(to: rect).transformed(by: CGAffineTransform(translationX: -rect.minX, y: -rect.minY))
let ctx = CIContext()
try ctx.writePNGRepresentation(of: out, to: URL(fileURLWithPath: a[2]), format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
print("ok")
