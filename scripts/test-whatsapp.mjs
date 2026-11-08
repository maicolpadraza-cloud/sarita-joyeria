import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "59175764100";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const sourcePath = fileURLToPath(new URL("../src/lib/whatsapp.ts", import.meta.url));
const source = require("node:fs").readFileSync(sourcePath, "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
});

const whatsappModule = new Module(sourcePath);
whatsappModule.filename = sourcePath;
whatsappModule.paths = Module._nodeModulePaths(path.dirname(sourcePath));
const originalRequire = whatsappModule.require.bind(whatsappModule);
whatsappModule.require = (specifier) =>
  specifier === "@/lib/products"
    ? { materialLabels: { Acero: "Acero Inoxidable" } }
    : originalRequire(specifier);
whatsappModule._compile(outputText, sourcePath);

const { createProductOrderMessage, createProductOrderUrl } = whatsappModule.exports;
const product = {
  id: "test-product",
  code: "SJ-0001",
  name: "Arito de prueba",
  category: "Piercings",
  material: "Acero",
  price: 25,
  image: "/images/placeholder.png",
  description: "Producto de prueba",
  inStock: true,
};
const productUrl = "https://sarita-joyeria.vercel.app/productos/test-product";
const message = createProductOrderMessage(product, productUrl);
const expectedEmojis = String.fromCodePoint(
  0x1f496,
  0x2728,
  0x1f516,
  0x1f48e,
  0x1f516,
  0x1f4b0,
  0x1f517,
);
const emojiCodePoints = new Set(Array.from(expectedEmojis));
const actualEmojis = Array.from(message).filter((character) =>
  emojiCodePoints.has(character),
);

assert(!message.includes(String.fromCodePoint(0xfffd)), "Message contains U+FFFD");
assert.equal(actualEmojis.join(""), expectedEmojis, "Product message emojis differ");

const url = createProductOrderUrl(product, productUrl);
assert(url, "WhatsApp URL was not generated");
assert.equal(new URL(url).hostname, "wa.me");
assert.equal(new URL(url).pathname, "/59175764100");

const rawText = url.split("?text=")[1];
assert(rawText, "WhatsApp URL has no text parameter");
assert(rawText.includes("%0A"), "Newlines were not encoded as %0A");
assert(!rawText.includes("%25"), "Message appears to have been encoded more than once");
const decodedMessage = decodeURIComponent(rawText);
assert.equal(decodedMessage, message);
assert(decodedMessage.includes("SJ-0001"), "Product code is missing");
assert(decodedMessage.includes(expectedEmojis[0]), "Expected emoji sequence is missing");

console.log("WhatsApp message and URL checks passed.");
