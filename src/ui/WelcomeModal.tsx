import { Locale } from "../i18n/types";
import { STRINGS } from "../i18n/strings";
import { MarginBadge } from "./MarginBadge";
import { DateChip } from "./DateChip";
import styles from "./WelcomeModal.module.css";

const MARGIN_ROWS = [
  {
    margin: "luster" as const,
    desc: "Cualquier año del mismo lustro — ej: respuesta 1977 → válido 1975–1979",
  },
  {
    margin: "decade" as const,
    desc: "Cualquier año de la misma década — ej: respuesta 1977 → válido 1970–1979",
  },
  {
    margin: "century" as const,
    desc: "Cualquier año del mismo siglo — ej: respuesta 1453 → válido 1400–1499",
  },
  {
    margin: "millennium" as const,
    desc: "Cualquier año del mismo milenio — ej: respuesta 1453 → válido 1000–1999",
  },
  {
    margin: 0.02 as number,
    desc: "Cualquier año dentro del 2% del ancho de la era histórica. Por ejemplo, si la era es medieval y el margen de error es del 2%, entonces, cualquier año dentro del rango de +-20 años de la respuesta es válido. Podés tocar el emblema para saber cuánto representa en cada puzzle",
  },
];

function MarginSection({ locale }: { locale: Locale }) {
  return (
    <div className={styles.section}>
      <p className={styles.sectionHeading}>Márgenes de error</p>
      <p className={styles.sectionDesc}>
        Si ves alguno de estos emblemas significa que tenés significa que el
        puzzle tiene un margen de error para el cual la respuesta ingresada es
        considerada válida:
      </p>
      {MARGIN_ROWS.map(({ margin, desc }, i) => (
        <div key={i} className={styles.marginRow}>
          <span className={styles.badgeCell}>
            <MarginBadge answer={{ year: 1453, margin }} locale={locale} />
          </span>
          <span className={styles.badgeDesc}>{desc}</span>
        </div>
      ))}
    </div>
  );
}

function DateSection({ locale }: { locale: Locale }) {
  return (
    <div className={styles.section}>
      <p className={styles.sectionHeading}>Fecha exacta</p>
      <div className={styles.marginRow}>
        <DateChip todayIso="2025-05-29" locale={locale} />
        <span className={styles.badgeDesc}>
          Si ves este emblema, el evento ocurrió en esa fecha del calendario en
          el año de la respuesta.
        </span>
      </div>
    </div>
  );
}

export function WelcomeModal({
  isNewPlayer,
  locale,
  onClose,
}: {
  isNewPlayer: boolean;
  locale: Locale;
  onClose: () => void;
}) {
  const s = STRINGS[locale].welcome;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{s.title}</h2>

        {isNewPlayer ? (
          <div className={styles.section}>
            <p className={styles.sectionHeading}>¿Cómo se juega?</p>
            <ul className={styles.list}>
              <li className={styles.item}>
                Adiviná el año de un evento histórico con hasta 5 intentos.
              </li>
              <li className={styles.item}>
                Las flechas te indican si el año real es anterior o posterior a
                tu respuesta.
              </li>
              <li className={styles.item}>
                Cada intento te acerca más — ¡prestá atención a las pistas!
              </li>
            </ul>
          </div>
        ) : (
          <div className={styles.section}>
            <p className={styles.sectionHeading}>¿Qué hay de nuevo?</p>
            <p className={styles.sectionDesc}>
              Agregamos emblemas informativos al puzzle. Acá te explicamos qué
              significa cada uno:
            </p>
          </div>
        )}

        <MarginSection locale={locale} />
        <DateSection locale={locale} />

        <div className={styles.actions}>
          <button className={styles.close} onClick={onClose}>
            {s.close}
          </button>
        </div>
      </div>
    </div>
  );
}
