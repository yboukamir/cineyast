/**
 * Pays du visiteur, pour afficher les offres de streaming de son pays.
 *
 * Vercel ajoute à chaque requête l'en-tête x-vercel-ip-country : un code ISO à deux lettres,
 * déduit de l'adresse IP. Seul ce code est renvoyé ; l'adresse n'est ni lue ni conservée.
 * Le navigateur vérifie ensuite que le pays fait partie de la liste (src/lib/pays.ts).
 *
 * Volontairement sans import, comme api/share.js.
 */

export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Réponse propre à chaque visiteur : jamais dans un cache partagé.
  res.setHeader("Cache-Control", "private, no-store");

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const code = String(req.headers["x-vercel-ip-country"] ?? "").trim().toUpperCase();
  return res.status(200).json({ pays: /^[A-Z]{2}$/.test(code) ? code : null });
}
