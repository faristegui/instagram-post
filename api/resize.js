import sharp from "sharp";

export default async function handler(req, res) {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "Falta el parámetro 'url'" });
    }

    // Descarga
    const resp = await fetch(url);
    const arrayBuffer = await resp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Tamaño final
    const WIDTH = 1080;
    const HEIGHT = 1350;

    const original = sharp(buffer);

    // 1️⃣ Fondo difuminado (cover)
    const blurredBackground = await original
      .resize(WIDTH, HEIGHT, { fit: "cover" })
      .blur(40)
      .toBuffer();

    // 2️⃣ Imagen principal (contain) con fondo TRANSPARENTE
    const resizedMain = await original
      .resize(WIDTH, HEIGHT, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 } // transparente
      })
      .png() // usamos PNG para mantener transparencia
      .toBuffer();

    // 3️⃣ Composición final
    const finalImage = await sharp(blurredBackground)
      .composite([
        {
          input: resizedMain,
          gravity: "center"
        }
      ])
      .jpeg({ quality: 90 })
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
