/**
 * Convertit un File en base64 pur (sans préfixe data:...;base64,)
 * et redimensionne si la largeur dépasse maxWidth (JPEG 0.8) pour limiter la taille du corps API.
 */
export function fileToBase64(
  file: File,
  maxWidth = 1024,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ratio = Math.min(1, maxWidth / img.width);
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Canvas non disponible"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(objectUrl);
        const base64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
        resolve(base64);
      } catch (e) {
        URL.revokeObjectURL(objectUrl);
        reject(e instanceof Error ? e : new Error("Conversion image impossible"));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Impossible de charger l'image"));
    };

    img.src = objectUrl;
  });
}
