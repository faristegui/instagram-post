import sharp from "sharp";

export default async function handler(req, res) {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "Falta el parámetro 'url'" });
    }

    // Descarga la imagen
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Tamaño final Instagram vertical
    const WIDTH = 1080;
    const HEIGHT = 1350;

    const original = sharp(buffer);

    // Fondo difuminado
    const blurredBackground = await original
      .resize(WIDTH, HEIGHT, { fit: "cover" })
      .blur(40)
      .toBuffer();

    // Imagen principal encajada sin recorte
    const resizedMain = await original
      .resize(WIDTH, HEIGHT, { fit: "contain" })
      .toBuffer();

    // Composición final
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
