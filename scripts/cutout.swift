import Foundation
import Vision
import CoreImage

let args = CommandLine.arguments
guard args.count == 3 else { print("usage: cutout <in> <out>"); exit(1) }
let input = URL(fileURLWithPath: args[1])
let output = URL(fileURLWithPath: args[2])
guard let ci = CIImage(contentsOf: input) else { print("load fail"); exit(1) }
let req = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(ciImage: ci)
try handler.perform([req])
guard let res = req.results?.first else { print("no foreground found"); exit(1) }
let mask = try res.generateScaledMaskForImage(forInstances: res.allInstances, from: handler)
let maskCI = CIImage(cvPixelBuffer: mask)
let blend = CIFilter(name: "CIBlendWithMask")!
blend.setValue(ci, forKey: kCIInputImageKey)
blend.setValue(CIImage(color: CIColor.clear).cropped(to: ci.extent), forKey: kCIInputBackgroundImageKey)
blend.setValue(maskCI, forKey: kCIInputMaskImageKey)
guard let out = blend.outputImage else { print("blend fail"); exit(1) }
let ctx = CIContext()
let cs = CGColorSpace(name: CGColorSpace.sRGB)!
try ctx.writePNGRepresentation(of: out, to: output, format: .RGBA8, colorSpace: cs)
print("ok")
