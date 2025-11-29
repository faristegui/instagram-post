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
    const LOGO_SIZE_RATIO = 0.17;
    const BORDER_RADIUS = 10;
    const BORDER_STROKE = 3;
    const BORDER_COLOR = "rgba(0,0,0,0.4)";

    // Descargar imagen principal
    const mainBuffer = Buffer.from(await (await fetch(url)).arrayBuffer());

    // Redimensionar imagen principal
    let image = sharp(mainBuffer)
      .resize(WIDTH, HEIGHT, { fit: "contain", background: { r: 255, g: 255, b: 255 } })
      .flatten({ background: { r: 255, g: 255, b: 255 } });

    // Procesar logo si existe
    if (logoUrl) {
      const logoBuffer = Buffer.from(await (await fetch(logoUrl)).arrayBuffer());

      const logoResized = await sharp(logoBuffer)
        .resize(Math.floor(WIDTH * LOGO_SIZE_RATIO), null, { fit: "contain" })
        .png()
        .toBuffer();

      const logoMeta = await sharp(logoResized).metadata();
      const logoBase64 = logoResized.toString("base64");

      // SVG: logo + borde visible encima
      const svgOverlay = `
        <svg width="${logoMeta.width}" height="${logoMeta.height}">
          <defs>
            <clipPath id="clip">
              <rect width="100%" height="100%" rx="${BORDER_RADIUS}" ry="${BORDER_RADIUS}" />
            </clipPath>
          </defs>
          <!-- Logo recortado -->
          <image href="data:image/png;base64,${logoBase64}" width="100%" height="100%" clip-path="url(#clip)" />
          <!-- Borde encima -->
          <rect x="0" y="0" width="100%" height="100%" rx="${BORDER_RADIUS}" ry="${BORDER_RADIUS}"
                fill="transparent" stroke="${BORDER_COLOR}" stroke-width="${BORDER_STROKE}" />
        </svg>
      `;

      const logoRounded = Buffer.from(svgOverlay);

      image = image.composite([
        {
          input: logoRounded,
          left: WIDTH - logoMeta.width - MARGIN,
          top: HEIGHT - logoMeta.height - MARGIN,
        },
      ]);
    }

    const output = await image.jpeg({ quality: 90 }).toBuffer();
    res.setHeader("Content-Type", "image/jpeg");
    res.send(output);

  } catch (err) {
    res.status(500).json({ error: "Error procesando la imagen", details: err.message });
  }
}
