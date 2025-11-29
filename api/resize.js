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

    // Tamaño final Instagram vertical
    const WIDTH = 1080;
    const HEIGHT = 1350;

    const original = sharp(buffer);

    // Redimensionar manteniendo proporciones y rellenando con negro
    const resized = await original
      .resize(WIDTH, HEIGHT, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 1 } // FONDO NEGRO
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Devolver imagen final
    res.setHeader("Content-Type", "image/jpeg");
    res.send(resized);

  } catch (err) {
    res.status(500).json({
      error: "Error procesando la imagen",
      details: err.message
    });
  }
}
