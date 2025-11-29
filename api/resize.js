import sharp from "sharp";

export default async function handler(req, res) {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "Falta el parámetro 'url'" });
    }

    // Descargar la imagen
    const resp = await fetch(url);
    const arrayBuffer = await resp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Tamaño final Instagram vertical
    const WIDTH = 1080;
    const HEIGHT = 1350;

    const original = sharp(buffer);

    // 1️⃣ Fondo difuminado (usar la imagen, pero cubriendo todo)
    const blurredBackground = await original
      .resize(WIDTH, HEIGHT, { fit: "cover" })
      .blur(40)
      .jpeg() // ya puede ser JPEG porque es solo fondo
      .toBuffer();

    // 2️⃣ Imagen principal encima (contain + fondo transparente)
    const mainImage = await original
      .resize(WIDTH, HEIGHT, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 } // transparencia real
      })
      .png() // PNG mantiene transparencia mientras se compone
      .toBuffer();

    // 3️⃣ Componer: blur de fondo + imagen encima centrada
    const finalImage = await sharp(blurredBackground)
      .composite([
        {
          input: mainImage,
          gravity: "center"
        }
      ])
      .jpeg({ quality: 90 }) // salida final
      .toBuffer();

    res.setHeader("Content-Type", "image/jpeg");
    res.send(finalImage);

  } catch (err) {
    res.status(500).json({
      error: "Error procesando la imagen",
      details: err.message
    });
  }
}
