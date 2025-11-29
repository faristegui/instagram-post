import sharp from "sharp";

export default async function handler(req, res) {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "Falta el parámetro 'url'" });
    }

    // Descargar imagen
    const resp = await fetch(url);
    const arrayBuffer = await resp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Tamaño final vertical
    const WIDTH = 1080;
    const HEIGHT = 1350;

    const original = sharp(buffer);
    const meta = await original.metadata();

    const isHorizontal = meta.width > meta.height; // detectar orientación

    let gradientSVG;

    if (isHorizontal) {
      // Imagen horizontal → degradado vertical desde el centro
      gradientSVG = `
        <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0" y1="0.5" x2="0" y2="0">
              <stop offset="0%" stop-color="#000000" />
              <stop offset="100%" stop-color="#eeeeee" />
            </linearGradient>

            <linearGradient id="grad2" x1="0" y1="0.5" x2="0" y2="1">
              <stop offset="0%" stop-color="#000000" />
              <stop offset="100%" stop-color="#eeeeee" />
            </linearGradient>
          </defs>

          <!-- Arriba -->
          <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT / 2}" fill="url(#grad)" />

          <!-- Abajo -->
          <rect x="0" y="${HEIGHT / 2}" width="${WIDTH}" height="${HEIGHT / 2}" fill="url(#grad2)" />
        </svg>
      `;
    } else {
      // Imagen vertical → degradado horizontal desde el centro
      gradientSVG = `
        <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gradL" x1="0.5" y1="0" x2="0" y2="0">
              <stop offset="0%" stop-color="#000000" />
              <stop offset="100%" stop-color="#eeeeee" />
            </linearGradient>

            <linearGradient id="gradR" x1="0.5" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#000000" />
              <stop offset="100%" stop-color="#eeeeee" />
            </linearGradient>
          </defs>

          <!-- Izquierda -->
          <rect x="0" y="0" width="${WIDTH / 2}" height="${HEIGHT}" fill="url(#gradL)" />

          <!-- Derecha -->
          <rect x="${WIDTH / 2}" y="0" width="${WIDTH / 2}" height="${HEIGHT}" fill="url(#gradR)" />
        </svg>
      `;
    }

    const gradientBuffer = Buffer.from(gradientSVG);

    const mainImage = await original
      .resize(WIDTH, HEIGHT, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();

    const finalImage = await sharp(gradientBuffer)
      .composite([
        {
          input: mainImage,
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
