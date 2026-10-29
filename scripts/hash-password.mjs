import bcrypt from "bcryptjs";
import { emitKeypressEvents } from "node:readline";
import { timingSafeEqual } from "node:crypto";

function readHidden(prompt) {
  const input = process.stdin;
  if (!input.isTTY || typeof input.setRawMode !== "function") {
    throw new Error("Run this script in an interactive terminal.");
  }

  return new Promise((resolve, reject) => {
    let value = "";
    const finish = (error) => {
      input.off("keypress", onKeypress);
      input.setRawMode(false);
      input.pause();
      process.stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    };
    const onKeypress = (character, key) => {
      if (key?.ctrl && key.name === "c") {
        finish(new Error("Password hashing cancelled."));
      } else if (key?.name === "return" || key?.name === "enter") {
        finish();
      } else if (key?.name === "backspace") {
        if (value.length > 0) {
          value = Array.from(value).slice(0, -1).join("");
          process.stdout.write("\b \b");
        }
      } else if (!key?.ctrl && character && character >= " ") {
        value += character;
        process.stdout.write("*");
      }
    };

    process.stdout.write(prompt);
    emitKeypressEvents(input);
    input.setRawMode(true);
    input.resume();
    input.on("keypress", onKeypress);
  });
}

function matches(left, right) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

try {
  const password = await readHidden("Contraseña nueva: ");
  const confirmation = await readHidden("Confirma la contraseña: ");
  if (password.length === 0) {
    throw new Error("La contraseña no puede estar vacía.");
  }
  if (!matches(password, confirmation)) {
    throw new Error("Las contraseñas no coinciden.");
  }
  if (Buffer.byteLength(password, "utf8") > 72) {
    throw new Error(
      "La contraseña supera el límite de 72 bytes de bcrypt. Usa una más corta.",
    );
  }

  const hash = await bcrypt.hash(password, 12);
  console.log(hash.replaceAll("$", "\\$"));
} catch (error) {
  console.error(error instanceof Error ? error.message : "No se pudo generar el hash.");
  process.exitCode = 1;
}
