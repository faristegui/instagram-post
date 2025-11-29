import sharp from "sharp";

export default async function handler(req, res) {
  try {
    const { url, logoUrl } = req.query;

    if (!url) {
      return res.status(400).json({ error: "Falta el parámetro 'url'" });
    }

    const WIDTH = 1080;
    const HEIGHT = 1350;
    const MARGIN = 20;
    const LOGO_SIZE_RATIO = 0.15; // 15% del ancho

    // 1️⃣ Descargar imagen principal
    const mainBuffer = Buffer.from(await (await fetch(url)).arrayBuffer());

    // 2️⃣ Redimensionar imagen principal sin deformar y con fondo blanco
    let image = sharp(mainBuffer)
      .resize(WIDTH, HEIGHT, { fit: "contain", background: { r: 255, g: 255, b: 255 } })
      .flatten({ background: { r: 255, g: 255, b: 255 } });

    // 3️⃣ Agregar logo si se pasa
    if (logoUrl) {
      const logoBuffer = Buffer.from(await (await fetch(logoUrl)).arrayBuffer());

      // Redimensionar logo
      const logoResized = await sharp(logoBuffer)
        .resize(Math.floor(WIDTH * LOGO_SIZE_RATIO), null, { fit: "contain" })
        .toBuffer();

      const logoMeta = await sharp(logoResized).metadata();

      // Componer logo sobre la imagen
      image = image.composite([
        {
          input: logoResized,
          left: WIDTH - logoMeta.width - MARGIN,
          top: HEIGHT - logoMeta.height - MARGIN,
        },
      ]);
    }

    // 4️⃣ Guardar como JPEG y enviar
    const output = await image.jpeg({ quality: 90 }).toBuffer();
    res.setHeader("Content-Type", "image/jpeg");
    res.send(output);

  } catch (err) {
    res.status(500).json({ error: "Error procesando la imagen", details: err.message });
  }
}
