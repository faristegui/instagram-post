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

    // 2️⃣ Redimensionar la imagen principal sin deformar y rellenando con blanco
    let image = sharp(mainBuffer)
      .resize(WIDTH, HEIGHT, { fit: "contain", background: { r: 255, g: 255, b: 255 } })
      .flatten({ background: { r: 255, g: 255, b: 255 } });

    // 3️⃣ Agregar logo con bordes redondeados y sombra gris
    if (logoUrl) {
      const logoBuffer = Buffer.from(await (await fetch(logoUrl)).arrayBuffer());

      // Redimensionar logo
      const logoResized = await sharp(logoBuffer)
        .resize(Math.floor(WIDTH * LOGO_SIZE_RATIO), null, { fit: "contain" })
        .composite([{
          input: Buffer.from(
            `<svg><rect x="0" y="0" width="100%" height="100%" rx="20" ry="20"/></svg>`
          ),
          blend: "dest-in"
        }])
        .toBuffer();

      const logoMeta = await sharp(logoResized).metadata();

      // Crear sombra gris simple: rectángulo gris con blur
      const shadow = await sharp({
        create: {
          width: logoMeta.width,
          height: logoMeta.height,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0.2 } // gris semitransparente
        }
      })
      .blur(3)
      .toBuffer();

      // Componer sombra y logo sobre la imagen principal
      image = image.composite([
        // sombra
        {
          input: shadow,
          left: WIDTH - logoMeta.width - MARGIN + 5, // desplazamiento sutil
          top: HEIGHT - logoMeta.height - MARGIN + 5,
        },
        // logo principal
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
