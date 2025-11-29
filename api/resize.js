import sharp from "sharp";

export default async function handler(req, res) {
  try {
    const { url, text, position, logoUrl } = req.query;

    if (!url) {
      return res.status(400).json({ error: "Falta el parámetro 'url'" });
    }

    const WIDTH = 1080;
    const HEIGHT = 1350;
    const PADDING = 200; // espacio para texto o margen

    // 1️⃣ Descargar imagen principal
    const mainBuffer = Buffer.from(await (await fetch(url)).arrayBuffer());

    // 2️⃣ Redimensionar imagen principal sin deformar
    const imageBuffer = await sharp(mainBuffer)
      .resize(WIDTH, HEIGHT - PADDING, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .toBuffer();

    // 3️⃣ Crear texto (si existe)
    let textOverlay = null;
    if (text) {
      const svgText = `
        <svg width="${WIDTH}" height="${PADDING}">
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)"/>
          <style>
            .title { fill: white; font-size: 80px; font-weight: bold; font-family: sans-serif; }
          </style>
          <text x="50%" y="50%" text-anchor="middle" alignment-baseline="middle" class="title">${text}</text>
        </svg>
      `;
      textOverlay = Buffer.from(svgText);
    }

    // 4️⃣ Crear canvas final
    let finalImage = sharp({
      create: {
        width: WIDTH,
        height: HEIGHT,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    });

    // Componer imagen + texto
    if (textOverlay) {
      if (position === "top") {
        finalImage = finalImage.composite([
          { input: textOverlay, top: 0, left: 0 },
          { input: imageBuffer, top: PADDING, left: 0 },
        ]);
      } else {
        finalImage = finalImage.composite([
          { input: imageBuffer, top: 0, left: 0 },
          { input: textOverlay, top: HEIGHT - PADDING, left: 0 },
        ]);
      }
    } else {
      finalImage = finalImage.composite([{ input: imageBuffer, top: PADDING / 2, left: 0 }]);
    }

    // 5️⃣ Agregar logo (si se pasa logoUrl)
    if (logoUrl) {
      const logoBuffer = Buffer.from(await (await fetch(logoUrl)).arrayBuffer());
      const logoResized = await sharp(logoBuffer)
        .resize(Math.floor(WIDTH * 0.15), null, { // 15% del ancho
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toBuffer();

      const logoMetadata = await sharp(logoResized).metadata();
      const margin = 20; // separación del borde

      finalImage = finalImage.composite([
        {
          input: logoResized,
          left: WIDTH - logoMetadata.width - margin,
          top: HEIGHT - logoMetadata.height - margin,
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

