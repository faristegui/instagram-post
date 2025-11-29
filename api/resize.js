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

    const isHorizontal = meta.width > meta.height;
    
    let gradientSVG;

    if (isHorizontal) {
      // Imagen horizontal → degradado vertical
      gradientSVG = `
        <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gradTop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#000000"/>
              <stop offset="50%" stop-color="#ffffff"/>
            </linearGradient>
            <linearGradient id="gradBottom" x1="0" y1="0" x2="0" y2="1">
              <stop offset="50%" stop-color="#ffffff"/>
              <stop offset="100%" stop-color="#000000"/>
            </linearGradient>
          </defs>
          <!-- Arriba -->
          <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT/2}" fill="url(#gradTop)"/>
          <!-- Abajo -->
          <rect x="0" y="${HEIGHT/2}" width="${WIDTH}" height="${HEIGHT/2}" fill="url(#gradBottom)"/>
        </svg>
      `;
    } else {
      // Imagen vertical → degradado horizontal
      gradientSVG = `
        <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gradLeft" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#000000"/>
              <stop offset="50%" stop-color="#ffffff"/>
            </linearGradient>
            <linearGradient id="gradRight" x1="0" y1="0" x2="1" y2="0">
              <stop offset="50%" stop-color="#ffffff"/>
              <stop offset="100%" stop-color="#000000"/>
            </linearGradient>
          </defs>
          <!-- Izquierda -->
          <rect x="0" y="0" width="${WIDTH/2}" height="${HEIGHT}" fill="url(#gradLeft)"/>
          <!-- Derecha -->
          <rect x="${WIDTH/2}" y="0" width="${WIDTH/2}" height="${HEIGHT}" fill="url(#gradRight)"/>
        </svg>
      `;
    }

    const gradientBuffer = Buffer.from(gradientSVG);

    const mainImage = await original
      .resize(WIDTH, HEIGHT, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 } // transparencia para overlay limpio
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
