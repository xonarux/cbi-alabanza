// Versículos del día — Nueva Traducción Viviente (NTV), © Tyndale House Foundation, 2010.
// Se muestra uno distinto cada día, recorriendo la lista en orden.

export interface Verse {
  text: string
  ref: string
}

export const VERSES: Verse[] = [
  { ref: 'Salmos 150:1', text: '¡Alabado sea el Señor! Alaben a Dios en su santuario; ¡alábenlo en su poderoso cielo!' },
  { ref: 'Salmos 100:4', text: 'Entren por sus puertas con acción de gracias; vayan a sus atrios con alabanza. Denle gracias y alaben su nombre.' },
  { ref: 'Juan 4:24', text: 'Pues Dios es Espíritu, por eso todos los que lo adoran deben hacerlo en espíritu y en verdad.' },
  { ref: 'Salmos 23:1', text: 'El Señor es mi pastor; tengo todo lo que necesito.' },
  { ref: 'Salmos 95:1', text: '¡Vengan, cantemos al Señor! Aclamemos con alegría a la Roca de nuestra salvación.' },
  { ref: 'Filipenses 4:13', text: 'Pues todo lo puedo hacer por medio de Cristo, quien me da las fuerzas.' },
  { ref: 'Salmos 96:1', text: '¡Canten al Señor una nueva canción! ¡Que toda la tierra cante al Señor!' },
  { ref: 'Lamentaciones 3:22', text: '¡El fiel amor del Señor nunca se acaba! Sus misericordias jamás terminan.' },
  { ref: 'Salmos 34:1', text: 'Alabaré al Señor en todo tiempo; a cada momento pronunciaré sus alabanzas.' },
  { ref: 'Proverbios 3:5', text: 'Confía en el Señor con todo tu corazón; no dependas de tu propio entendimiento.' },
  { ref: 'Salmos 103:1', text: 'Que todo lo que soy alabe al Señor; con todo el corazón alabaré su santo nombre.' },
  { ref: 'Salmos 18:1', text: 'Te amo, Señor; tú eres mi fuerza.' },
  { ref: 'Salmos 145:3', text: '¡Grande es el Señor, el más digno de alabanza! Nadie puede medir su grandeza.' },
  { ref: 'Mateo 22:37', text: 'Ama al Señor tu Dios con todo tu corazón, con toda tu alma y con toda tu mente.' },
  { ref: 'Salmos 147:1', text: '¡Alabado sea el Señor! ¡Qué bueno es cantar alabanzas a nuestro Dios! ¡Qué agradable y apropiado!' },
  { ref: 'Salmos 46:10', text: '¡Quédense quietos y sepan que yo soy Dios! Toda nación me honrará. Seré honrado en el mundo entero.' },
  { ref: 'Salmos 63:3', text: 'Tu amor inagotable es mejor que la vida misma; ¡cuánto te alabo!' },
  { ref: 'Filipenses 4:4', text: 'Estén siempre llenos de alegría en el Señor. Lo repito, ¡alégrense!' },
  { ref: 'Salmos 29:2', text: 'Honren al Señor por la gloria de su nombre; adoren al Señor en la magnificencia de su santidad.' },
  { ref: 'Salmos 121:2', text: '¡Mi ayuda viene del Señor, quien hizo el cielo y la tierra!' },
  { ref: 'Salmos 92:1', text: 'Es bueno dar gracias al Señor, cantar alabanzas al Altísimo.' },
  { ref: 'Juan 14:6', text: 'Yo soy el camino, la verdad y la vida; nadie puede ir al Padre si no es por medio de mí.' },
  { ref: 'Salmos 113:3', text: 'En todas partes—del oriente al occidente—, alaben el nombre del Señor.' },
  { ref: 'Salmos 55:22', text: 'Entrégale tus cargas al Señor, y él cuidará de ti; no permitirá que los justos tropiecen y caigan.' },
  { ref: 'Salmos 33:3', text: 'Entónenle un cántico nuevo de alabanza; toquen el arpa con destreza y canten con alegría.' },
  { ref: 'Romanos 12:12', text: 'Alégrense por la esperanza segura que tenemos. Tengan paciencia en las dificultades y sigan orando.' },
  { ref: 'Salmos 16:11', text: 'Me mostrarás el camino de la vida; me concederás la alegría de tu presencia y el placer de vivir contigo para siempre.' },
  { ref: '1 Tesalonicenses 5:16', text: 'Estén siempre alegres.' },
  { ref: 'Salmos 118:24', text: 'Este es el día que hizo el Señor; nos gozaremos y alegraremos en él.' },
  { ref: 'Mateo 11:28', text: 'Vengan a mí todos los que están cansados y llevan cargas pesadas, y yo les daré descanso.' },
  { ref: 'Salmos 9:1', text: 'Te alabaré, Señor, con todo mi corazón; contaré de las cosas maravillosas que has hecho.' },
  { ref: 'Salmos 37:4', text: 'Deléitate en el Señor, y él te concederá los deseos de tu corazón.' },
  { ref: 'Salmos 22:3', text: 'Sin embargo, tú eres santo; estás entronizado en las alabanzas de Israel.' },
  { ref: 'Efesios 2:8', text: 'Dios los salvó por su gracia cuando creyeron. Ustedes no tienen ningún mérito en eso; es un regalo de Dios.' },
  { ref: 'Salmos 30:4', text: '¡Canten al Señor, ustedes los justos! Alaben su santo nombre.' },
  { ref: 'Salmos 119:105', text: 'Tu palabra es una lámpara que guía mis pies y una luz para mi camino.' },
  { ref: 'Salmos 57:7', text: 'Mi corazón está confiado en ti, oh Dios; mi corazón tiene confianza. ¡Con razón puedo cantar tus alabanzas!' },
  { ref: '1 Juan 4:19', text: 'Nos amamos unos a otros, porque él nos amó primero.' },
  { ref: 'Salmos 89:1', text: '¡Siempre cantaré acerca del amor inagotable del Señor! Jóvenes y ancianos oirán de tu fidelidad.' },
  { ref: 'Salmos 56:3', text: 'Pero cuando tenga miedo, en ti pondré mi confianza.' },
  { ref: 'Salmos 104:33', text: 'Cantaré al Señor mientras viva. ¡Alabaré a mi Dios hasta mi último suspiro!' },
  { ref: 'Colosenses 3:23', text: 'Trabajen de buena gana en todo lo que hagan, como si fuera para el Señor y no para la gente.' },
  { ref: 'Salmos 136:1', text: '¡Den gracias al Señor, porque él es bueno! Su fiel amor perdura para siempre.' },
  { ref: 'Salmos 91:1', text: 'Los que viven al amparo del Altísimo encontrarán descanso a la sombra del Todopoderoso.' },
  { ref: 'Salmos 138:1', text: 'Te doy gracias, oh Señor, con todo el corazón; delante de los dioses cantaré tus alabanzas.' },
  { ref: '1 Tesalonicenses 5:18', text: 'Sean agradecidos en toda circunstancia, pues esta es la voluntad de Dios para ustedes, los que pertenecen a Cristo Jesús.' },
  { ref: 'Salmos 146:2', text: 'Alabaré al Señor mientras viva; cantaré alabanzas a mi Dios con el último aliento.' },
  { ref: 'Salmos 139:14', text: '¡Gracias por hacerme tan maravillosamente complejo! Tu fino trabajo es maravilloso, lo sé muy bien.' },
  { ref: 'Isaías 12:5', text: 'Canten al Señor, porque ha hecho cosas maravillosas. Den a conocer su alabanza en el mundo entero.' },
  { ref: 'Salmos 5:3', text: 'Señor, escucha mi voz por la mañana; cada mañana llevo a ti mis peticiones y quedo a la espera.' },
  { ref: 'Salmos 117:2', text: 'Pues su amor inagotable por nosotros es poderoso; la fidelidad del Señor permanece para siempre. ¡Alabado sea el Señor!' },
  { ref: 'Salmos 71:8', text: 'Por eso nunca puedo dejar de alabarte; todo el día declaro tu gloria.' },
  { ref: 'Salmos 150:6', text: '¡Que todo lo que respira cante alabanzas al Señor! ¡Alabado sea el Señor!' },
]

/** Versículo del día: cambia a medianoche (hora local) y nunca se repite dos días seguidos */
export function verseOfDay(date = new Date()): Verse {
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000)
  return VERSES[day % VERSES.length]
}
