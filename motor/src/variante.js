// Combina la marca con una de sus variantes visuales. Puro (sin Node ni
// Remotion): lo usan los scripts y la vista previa de Root.tsx.

export const ESTILO_BASE = { logo_escala: 1, alineacion: "izquierda", enfasis: "color" };

/**
 * Marca lista para las plantillas: los colores base con los cambios de la
 * variante elegida (si hay), la paleta de superficies, el logo y el estilo.
 */
/**
 * @param {any} marca
 * @param {string | null | undefined} [variante]
 */
export function aplicarVariante(marca, variante) {
  const base = { ...marca, colores_superficie: { ...marca.colores }, estilo: { ...ESTILO_BASE, ...(marca.estilo ?? {}) } };
  delete base.variantes;
  if (!variante) return base;
  const v = marca.variantes?.[variante];
  if (!v) throw new Error(`La marca no tiene la variante «${variante}»`);
  return {
    ...base,
    colores: { ...marca.colores, ...v.colores },
    colores_superficie: { ...marca.colores, ...v.colores_superficie },
    logo: v.logo ?? marca.logo,
    estilo: { ...base.estilo, ...v.estilo },
  };
}
