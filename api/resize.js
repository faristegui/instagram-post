import sharp from "sharp";

export default async function handler(req, res) {
  try {
    const { url, logoUrl } = req.query;

    if (!url) {
      return res.status(400).json({ error: "Falta el parámetro 'url'" });
    }

    const WIDTH = 1080;
    const HEIGHT = 1350;
    const MARGIN = 20; // margen para el logo desde los bordes

    // 1️⃣ Descargar imagen principal
    const mainBuffer = Buffer.from(await (await fetch(url)).arrayBuffer());

    // 2️⃣ Redimensionar imagen principal sin deformar
    const imageBuffer = await sharp(mainBuffer)
      .resize(WIDTH, HEIGHT, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 }, // fondo blanco
      })
      .toBuffer();

    // 3️⃣ Crear canvas final y centrar la imagen
    let finalImage = sharp({
      create: {
        width: WIDTH,
        height: HEIGHT,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    }).composite([{ input: imageBuffer, gravity: "center" }]);

    // 4️⃣ Agregar logo (si se pasa logoUrl)
    if (logoUrl) {
      const logoBuffer = Buffer.from(await (await fetch(logoUrl)).arrayBuffer());
      const logoResized = await sharp(logoBuffer)
        .resize(Math.floor(WIDTH * 0.15), null, { // 15% del ancho
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toBuffer();

      const logoMetadata = await sharp(logoResized).metadata();

      finalImage = finalImage.composite([
        {
          input: logoResized,
          left: WIDTH - logoMetadata.width - MARGIN,
          top: HEIGHT - logoMetadata.height - MARGIN,
        },
      ]);
    }

    const output = await finalImage.jpeg({ quality: 90 }).toBuffer();
    res.setHeader("Content-Type", "image/jpeg");
    res.send(output);

  } catch (err) {
    res.status(500).json({
      error: "Error procesando la imagen",
      details: err.message,
    });
  }
}
