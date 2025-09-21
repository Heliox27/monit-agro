// app/src/theme.js

// Paleta base (mantiene lo que ya tenías)
export const colors = {
  green:  "#568203",  // Primario
  lime:   "#8DB600",  // Acento
  brown:  "#7B3F00",  // Acento neutro

  bg:     "#F6F7F5",  // Fondo app
  card:   "#FFFFFF",
  text:   "#192225",
  muted:  "#707A7F",
  border: "#E5E7EB",

  // Gradientes
  gradientHeader: ["#8DB600", "#568203"], // lime → green
  gradientHero:   ["#F7FBF1", "#FFFFFF"], // banda suave
};

// Espaciados y radios reutilizables
export const spacing = { xs: 6, sm: 10, md: 14, lg: 18, xl: 24 };
export const radius  = { sm: 8, md: 12, lg: 16, pill: 999 };

// Tipografía (nombres de familia que ya cargamos con Poppins)
export const font = {
  heavy: "Poppins_800ExtraBold",
  light: "Poppins_300Light",
};

// Estilos tipográficos de uso rápido (opcional)
export const text = {
  h1:   { fontFamily: "Poppins_800ExtraBold", fontSize: 22, color: colors.text },
  h2:   { fontFamily: "Poppins_800ExtraBold", fontSize: 18, color: colors.text },
  body: { fontFamily: "Poppins_300Light",    fontSize: 14, color: colors.text },
  muted:{ fontFamily: "Poppins_300Light",    fontSize: 14, color: colors.muted },
};

// Alturas estándar para navegaciones
export const layout = {
  headerHeight: 64,
  tabBarHeight: 58,
};

// Sombra reutilizable (Android/iOS/Web)
export const shadow = (level = 2) => ({
  shadowColor: "#000",
  shadowOpacity: 0.06 * level,
  shadowRadius: 3 * level,
  shadowOffset: { width: 0, height: 1 * level },
  elevation: level,
});
