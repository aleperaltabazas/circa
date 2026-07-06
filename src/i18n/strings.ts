export const STRINGS = {
  es: {
    appTitle: "Circa",
    guess: "Adivinar",
    share: "Compartir",
    copied: "¡Copiado!",
    close: "Cerrar",
    currentStreak: "Actual",
    maxStreak: "Máxima",
    rangeHint: (min: number, max: number) => `Ingresá un año entre ${min} y ${max}`,
    locked: "Bloqueada — adiviná para revelar",
    duplicateGuess: "Ya intentaste ese año",
    puzzleMeta: (n: number, date: string) => `Puzzle #${n} — ${date}`,
    legendFar: "muy lejos",
    legendCloser: "más cerca",
    legendExact: "exacto",
    noPuzzle: "No hay puzzle hoy, volvé mañana.",
    triviaTitle: "Sobre este puzzle",
    outcomeWinHeadline: "¡Lo lograste!",
    outcomeWinSub: (g: number) => `en ${g}/5`,
    outcomeLossHeadline: "Te quedaste sin intentos",
    outcomeLossSub: (a: string) => `La respuesta era ${a}`,
    outcomeLossOffBy: (n: number) => n === 1 ? "Te fuiste por 1 año" : `Te fuiste por ${n} años`,
    outcomeWinOffBy: (n: number) => n === 1 ? "a 1 año del exacto" : `a ${n} años del exacto`,
    shareTail: (url: string) => `${url}`,
    directionLabel: { earlier: "muy tarde", later: "muy temprano", match: "exacto" },
    eraLabel: {
      prehistory: "prehistoria",
      ancient: "antigua",
      medieval: "medieval",
      modern: "moderna",
      recent: "reciente",
    },
    marginLabel: {
      luster: "Lustro",
      decade: "Década",
      century: "Siglo",
      millennium: "Milenio",
      percent: (n: number) => `${n}%`,
    },
    marginTooltip: {
      luster: "Cualquier año dentro del lustro",
      decade: "Cualquier año dentro de la década",
      century: "Cualquier año dentro del siglo",
      millennium: "Cualquier año dentro del milenio",
      percent: (n: number, years?: number) =>
        years !== undefined
          ? `Cualquier año en el margen del ${n}% (±${years} años)`
          : `Cualquier año en el margen del ${n}%`,
    },
    eraTooltip: "Era histórica de la respuesta",
    welcome: {
      title: "Novedades en Circa",
      close: "¡Entendido!",
    },
    dateTooltip: "El evento ocurrió en esta fecha del calendario",
    closenessHints: {
      tooFar: "muy lejos",
      close: "cerca",
      veryClose: "muy cerca",
      soClose: "¡por poco!",
      closer: "más cerca",
      wentTooFar: "te alejaste",
    },
    guessAria: (year: number, dirLabel: string) => `${year}, ${dirLabel}`,
  },
} as const;

export type StringsBundle = typeof STRINGS["es"];
