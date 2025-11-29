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

    // Descargar imagen principal
    const mainBuffer = Buffer.from(await (await fetch(url)).arrayBuffer());

    // Redimensionar imagen manteniendo proporciones
    const mainImage = await sharp(mainBuffer)
      .resize(WIDTH, HEIGHT, { fit: "contain", background: { r: 255, g: 255, b: 255 } })
      .toBuffer();

    // Crear canvas blanco
    let finalImage = sharp({
      create: {
        width: WIDTH,
        height: HEIGHT,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    }).composite([{ input: mainImage, gravity: "center" }]);

    // Agregar logo si se pasa
    if (logoUrl) {
      const logoBuffer = Buffer.from(await (await fetch(logoUrl)).arrayBuffer());
      const logoResized = await sharp(logoBuffer)
        .resize(Math.floor(WIDTH * 0.15), null, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer();

      const logoMeta = await sharp(logoResized).metadata();

      finalImage = finalImage.composite([
        {
          input: logoResized,
          left: WIDTH - logoMeta.width - MARGIN,
          top: HEIGHT - logoMeta.height - MARGIN,
        },
      ]);
    }

    const output = await finalImage.jpeg({ quality: 90 }).toBuffer();
    res.setHeader("Content-Type", "image/jpeg");
    res.send(output);

  } catch (err) {
    res.status(500).json({ error: "Error procesando la imagen", details: err.message });
  }
}
