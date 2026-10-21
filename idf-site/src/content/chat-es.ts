/**
 * The assistant in Spanish.
 *
 * WHY THIS EXISTS. The owners do not speak Spanish, but plenty of homeowners
 * in the DMV do, and a visitor who can read the answer is a visitor who books.
 * Asked for by Yaz on 21 October.
 *
 * HOW IT STAYS SAFE. Exactly as in English: the model still only picks an id,
 * and the endpoint sends back the Spanish text stored here under that id. A
 * model never writes a word of Spanish either. An id with no translation here
 * falls back to the English answer, with a one-line note saying so, rather
 * than a machine translation made on the fly.
 *
 * THESE TRANSLATIONS NEED A FLUENT READER BEFORE THE CHAT GOES LIVE. They were
 * written carefully and faithfully, but nobody at the company has read them
 * yet. `reviewed` below records that; flip it once someone on the team has
 * been through them. The build does not block on it, because the assistant
 * itself is still off on master.
 *
 * Keyed by the catalog id (faq-catalog.ts). Those ids follow the order of the
 * English questions, so reordering or inserting an English question shifts
 * them: the guard at the bottom fails the build when a key here no longer
 * names a real entry, which is how that gets noticed.
 */
import { business, hours, hoursLabel } from './idf';
import { assertSafeFaqEs, type QA } from './faq-safety';

export const reviewed = false;

const DAYS: Record<string, string> = {
  Monday: 'lunes',
  Tuesday: 'martes',
  Wednesday: 'miércoles',
  Thursday: 'jueves',
  Friday: 'viernes',
  Saturday: 'sábado',
  Sunday: 'domingo',
};

/** "Monday – Friday" → "De lunes a viernes", "Saturday" → "Sábado". */
const daysEs = (days: string): string => {
  const parts = days.split(/\s*–\s*/).map((d) => DAYS[d] ?? d);
  const text = parts.length === 2 ? `de ${parts[0]} a ${parts[1]}` : parts[0];
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const hoursLineEs =
  hours
    .map((h) => `${daysEs(h.days)}: ${'note' in h ? 'con cita previa' : hoursLabel(h)}`)
    .join('. ') + '.';

const area = 'Washington D. C., Maryland y Virginia';
const areaDetail = 'Atendemos toda el área del DMV desde nuestra sala de exposición en Sterling.';
const promoHeadline = 'Hasta un 25% de descuento en su primer proyecto';
const promoFine =
  'Los descuentos están sujetos a la revisión del proyecto y pueden variar según el tamaño, ' +
  'el alcance, el tipo de trabajo, los materiales y otros factores aplicables. ' +
  'Pueden aplicarse restricciones.';

/** Spanish for every approved answer, keyed by catalog id. `q` is what the
    visitor sees on a menu button or page question; the model never reads it. */
export const answersEs: Record<string, QA> = {
  /* ---------------------------------------------- the assistant's own replies */
  'chat-hello-1': {
    q: 'Hola',
    a: ['¡Hola! Puedo contarle sobre nuestros servicios, programar un presupuesto gratuito o ponerle en contacto directo con Shawn y Nancy. ¿En qué está trabajando?'],
  },
  'chat-thanks-1': {
    q: 'Gracias',
    a: [`De nada. Si surge algo más, aquí estoy, o puede llamarnos al ${business.phonePrimary}.`],
  },
  'chat-human-1': {
    q: '¿Puedo hablar con una persona?',
    a: [
      `Soy un asistente que responde con las respuestas aprobadas por la empresa. Para lo que yo no pueda responder, Shawn y Nancy atienden en el ${business.phonePrimary}, o deje sus datos y le devolverán la llamada.`,
    ],
  },
  'chat-estimate-1': {
    q: 'Quisiera un presupuesto',
    a: [
      'Con gusto lo organizamos. Deje su nombre, teléfono y correo electrónico abajo y nos pondremos en contacto para coordinar la visita.',
      'El presupuesto es gratuito, y su presupuesto por escrito llega dentro de las 24 horas posteriores a la visita.',
    ],
  },
  'chat-callback-1': {
    q: 'Quisiera que me llamen',
    a: ['Por supuesto. Deje su nombre, teléfono y correo electrónico abajo y Shawn o Nancy le devolverán la llamada.'],
  },
  'chat-phone-1': {
    q: '¿Cuál es su teléfono?',
    a: [`Puede llamar o enviar un mensaje de texto al ${business.phonePrimary}, o escribir a ${business.email}.`],
  },
  'chat-hours-1': {
    q: '¿Cuál es su horario?',
    a: [`El horario de nuestra sala de exposición en Sterling es: ${hoursLineEs}`],
  },
  'chat-where-1': {
    q: '¿Dónde están ubicados?',
    a: [`Estamos en ${business.address}. ${areaDetail}`],
  },
  'chat-services-1': {
    q: '¿Qué servicios ofrecen?',
    a: [
      'Hacemos casas a medida y construcción nueva, ampliaciones, renovaciones completas, cocinas, baños y sótanos, pisos, techos y revestimientos, ventanas y puertas, pintura y paneles de yeso, y restauración por daños de agua.',
      'Dígame cuál le interesa y le cuento más, o puedo programar un presupuesto gratuito.',
    ],
  },
  'chat-projects-1': {
    q: '¿Puedo ver trabajos anteriores?',
    a: ['Sí, nuestros proyectos recientes están en la página de Proyectos, con fotos del trabajo terminado.'],
  },

  /* ---------------------------------------------- /faq/ */
  'faq-estimates-1': {
    q: '¿Cobran por el presupuesto?',
    a: ['No. Díganos el tipo de proyecto y la dirección. Nosotros mismos visitamos el lugar, y su presupuesto por escrito llega dentro de las 24 horas posteriores a esa visita.'],
  },
  'faq-estimates-2': {
    q: '¿Cuánto tarda el presupuesto?',
    a: ['Dentro de las 24 horas posteriores a la visita. No presupuestamos un proyecto que no hemos visto en persona, así que primero va la visita.'],
  },
  'faq-estimates-3': {
    q: '¿El presupuesto por escrito es el precio final?',
    a: [
      'El presupuesto por escrito es lo que respaldamos. Si algo cambia el alcance una vez iniciado el trabajo, se maneja con una orden de cambio por escrito acordada antes de hacer ese trabajo, no se agrega a una factura después.',
      'Nada en este sitio web fija un precio. El presupuesto firmado es el único documento que lo hace.',
    ],
  },
  'faq-estimates-4': {
    q: `¿Qué cubre la oferta “${promoHeadline}”?`,
    a: [
      'Se aplica a un primer proyecto con nosotros.',
      promoFine,
      'Pregúntenos al solicitar su presupuesto y le diremos cuánto le corresponde antes de firmar nada.',
    ],
  },
  'faq-estimates-5': {
    q: '¿Tienen descuento para militares o veteranos?',
    a: ['Sí. Menciónelo cuando se comunique con nosotros y lo revisaremos con usted.'],
  },
  'faq-estimates-6': {
    q: '¿Se puede financiar un proyecto?',
    a: [
      'Trabajamos con una entidad de financiamiento que se encarga de préstamos para renovación y construcción, y podemos presentársela cuando solicite su presupuesto.',
      'La aprobación, las tasas y las condiciones las fija la entidad, no nosotros. No hay solicitud en este sitio web y no vemos su información financiera.',
    ],
  },
  'faq-license-1': {
    q: '¿Tienen licencia?',
    a: [`Sí. ${business.name} es un contratista general Clase A de Virginia, número de licencia ${business.licenseNumber}. Ese número es público y puede verificarlo antes de llamarnos.`],
  },
  'faq-license-2': {
    q: '¿Con quién voy a tratar?',
    a: [`Con Shawn y Nancy Waziri, que dirigen esta empresa desde ${business.established}. Quien visita su casa, prepara su presupuesto y responde por el trabajo es el dueño, no un gerente de proyecto al que ve una sola vez.`],
  },
  'faq-license-3': {
    q: '¿Usan subcontratistas?',
    a: [
      'Tenemos la licencia, tramitamos los permisos, programamos los oficios en el orden que el trabajo realmente necesita, supervisamos la obra mientras está activa y atendemos al inspector.',
      'El trabajo que requiere una licencia aparte, como topografía o el sello de un ingeniero estructural, se encarga a un profesional con licencia y lo coordinamos nosotros. Usted sigue teniendo un solo número al que llamar.',
    ],
  },
  'faq-area-1': {
    q: '¿Qué zonas atienden?',
    a: [`${area}. ${areaDetail}`],
  },
  'faq-area-2': {
    q: '¿Puedo visitar la sala de exposición?',
    a: [`Sí, y allí se firman los contratos y se eligen los materiales. Estamos en ${business.address}.`, hoursLineEs],
  },
  'faq-work-1': {
    q: '¿Qué tipo de proyectos hacen?',
    a: [
      'Casas a medida y construcción desde cero, ampliaciones, renovaciones completas, cocinas, baños y sótanos, pisos, techos y revestimientos, ventanas y puertas, pintura y paneles de yeso, y restauración por daños de agua.',
      'Cada uno tiene su propia página en este sitio con lo que incluye el trabajo y hasta dónde llega.',
    ],
  },
  'faq-work-2': {
    q: '¿Cuánto durará mi proyecto?',
    a: [
      'Depende totalmente del alcance, y quien le dé una cifra antes de ver el lugar está adivinando.',
      'El calendario viene con el presupuesto por escrito después de la visita, así que lo tiene antes de comprometerse a nada.',
    ],
  },
  'faq-work-3': {
    q: '¿Construyen casas nuevas desde cero?',
    a: ['Sí. Las casas a medida y la construcción desde cero son parte de lo que hacemos, y hay una página dedicada que explica cómo avanza una obra desde el diseño hasta la entrega.'],
  },
  'faq-insurance-1': {
    q: '¿Hacen reparaciones después de daños por agua o tormentas?',
    a: [
      'Sí. Documentamos el daño con fotografías, medidas y un alcance por escrito, preparamos un presupuesto de reparación detallado apto para su expediente con el seguro, respondemos las preguntas de su aseguradora sobre nuestro propio presupuesto y alcance, y hacemos la remediación, la reparación estructural y la reconstrucción completa.',
      'Lo que no hacemos es interponernos entre usted y su aseguradora. Negociar o liquidar un reclamo en nombre del asegurado es ajuste público, que en Virginia requiere una licencia aparte y es una profesión distinta a la nuestra.',
    ],
  },
  'faq-selling-1': {
    q: '¿Debo renovar antes de vender?',
    a: [
      'Algunos trabajos rinden más de lo que cuestan y otros no, y cuál es cuál depende de la casa y de la calle.',
      'Cuéntenos sobre la propiedad y la visitaremos para decirle con franqueza qué vale la pena hacer, qué no y cuánto costaría.',
    ],
  },
  'faq-selling-2': {
    q: '¿Venden casas o trabajan con agentes?',
    a: [
      'Somos contratistas, no una inmobiliaria. El trabajo de renovación es nuestro.',
      'Trabajamos junto a agentes con licencia de la zona y con gusto le presentamos a uno si lo necesita. La venta es de ellos.',
    ],
  },

  /* ---------------------------------------------- the service pages */
  'general-contracting-1': {
    q: '¿Quién tramita los permisos y trata con el inspector?',
    a: ['Nosotros. Tenemos la licencia, tramitamos los permisos, programamos las inspecciones y atendemos al inspector en persona.'],
  },
  'general-contracting-2': {
    q: '¿Cómo se manejan los cambios una vez empezada la obra?',
    a: ['Con una orden de cambio por escrito, acordada antes de hacer ese trabajo. Nada aparece en una factura al final que usted no haya visto y aprobado antes.'],
  },
  'general-contracting-3': {
    q: '¿Hay algo que no hagan ustedes mismos?',
    a: ['El trabajo que requiere una licencia distinta a la nuestra. La topografía y cualquier sello de ingeniería estructural van a un profesional con licencia. Nosotros encargamos y coordinamos ese trabajo, así que sigue siendo un solo número al que llamar.'],
  },
  'home-remodeling-1': {
    q: '¿Pueden quitar una pared para cambiar la distribución?',
    a: [
      'Por lo general, sí. Quitar y reconstruir paredes es parte normal de una remodelación.',
      'Si una pared resulta ser estructural, el diseño pasa a un ingeniero con licencia antes de presupuestarlo. Lo sabrá en el presupuesto, no cuando el techo ya esté abierto.',
    ],
  },
  'home-remodeling-2': {
    q: '¿Tenemos que hacer toda la casa a la vez?',
    a: ['No. Cocinas, baños y áreas de estar pueden hacerse como un solo proyecto o habitación por habitación, según cómo quiera vivir en la casa mientras tanto.'],
  },
  'home-remodeling-3': {
    q: '¿Qué pasa con la instalación eléctrica y la plomería viejas detrás de las paredes?',
    a: ['Donde el trabajo deja al descubierto instalaciones eléctricas, de plomería o de climatización, se actualizan al código vigente. Abrir una pared y volver a cerrarla sobre algo que ya no cumple no vale el ahorro.'],
  },
  'kitchen-remodeling-1': {
    q: '¿Se puede mover la cocina a otra parte de la casa?',
    a: ['Sí, y las instalaciones se mueven con ella. Fregaderos, gas y conexiones de electrodomésticos se reubican donde cambia la distribución, en lugar de adaptar la distribución a donde están las tuberías.'],
  },
  'kitchen-remodeling-2': {
    q: '¿Pueden abrir la cocina hacia la sala?',
    a: ['Quitar la pared entre ambas es un trabajo habitual para nosotros. Si esa pared soporta carga, el diseño estructural se resuelve y se presupuesta antes de quitar nada.'],
  },
  'kitchen-remodeling-3': {
    q: '¿Se actualizará la instalación eléctrica?',
    a: ['Sí. Los circuitos, la iluminación y los tomacorrientes adicionales se instalan según el código como parte del trabajo, algo que una cocina moderna llena de electrodomésticos suele necesitar, estuviera previsto o no.'],
  },
  'bathroom-remodeling-1': {
    q: '¿Qué hay detrás de los azulejos?',
    a: [
      'Impermeabilización y la base adecuada, antes de colocar cualquier azulejo. Cuando el estado del baño lo requiere, desmontamos hasta los montantes primero.',
      'Un baño falla por detrás de los azulejos, no por los azulejos, y por eso el orden del trabajo se organiza en torno a esta parte.',
    ],
  },
  'bathroom-remodeling-2': {
    q: '¿Se puede hacer un baño más accesible?',
    a: ['Sí. Umbrales a nivel, refuerzos en las paredes para barras de apoyo y puertas más anchas son parte de lo que instalamos, y poner los refuerzos ahora cuesta mucho menos que agregarlos después.'],
  },
  'bathroom-remodeling-3': {
    q: '¿Se pueden mover el inodoro, la bañera o la ducha?',
    a: ['Sí. Reubicar la plomería, junto con el reemplazo de las líneas de suministro y desagüe, es parte normal del trabajo y no un extra.'],
  },
  'basement-remodeling-1': {
    q: 'Mi sótano tiene humedad. ¿Igual pueden terminarlo?',
    a: [
      'No de inmediato, y se lo diremos. Un problema de agua activo se arregla primero y luego se vigila durante una temporada de lluvias antes de colocar cualquier material de acabado.',
      'Terminar un sótano húmedo no lo soluciona. Lo esconde, y luego paga dos veces.',
    ],
  },
  'basement-remodeling-2': {
    q: '¿Puedo poner un dormitorio en el sótano?',
    a: ['Si el plan agrega un dormitorio, necesita una ventana de egreso con su pozo, y nosotros los instalamos. La separación contra incendios y los demás requisitos del código para sótanos terminados son parte del mismo trabajo.'],
  },
  'basement-remodeling-3': {
    q: '¿Podemos agregar un baño o un bar abajo?',
    a: ['Sí, incluido el sistema de desagüe bajo nivel que necesitan, que es lo que hace que un baño de sótano sea distinto a cualquier otro.'],
  },
  'home-additions-1': {
    q: '¿Cómo sé qué se me permite construir?',
    a: [
      'Lo establecemos antes de empezar cualquier diseño. Los retiros, la ocupación del terreno y, cuando aplica, la revisión de la asociación de propietarios (HOA) cambian lo que se puede construir en su terreno.',
      'Es la primera pregunta y no la última, porque la respuesta decide qué vale la pena dibujar.',
    ],
  },
  'home-additions-2': {
    q: '¿Se notará que la ampliación fue añadida?',
    a: ['Eso es lo que hay que hacer bien. El revestimiento, el techo, las molduras y los acabados interiores se igualan a la casa existente, y la cimentación, la estructura y la unión del techo se detallan para que la junta no sea lo primero que se vea.'],
  },
  'home-additions-3': {
    q: '¿Pueden construir hacia arriba en vez de hacia afuera?',
    a: ['Sí. Segundos pisos y buhardillas, y la conversión de un garaje, porche o terraza cubierta, están dentro de lo que hacemos, al igual que apartamentos para familiares o unidades accesorias donde la zonificación lo permite.'],
  },
  'flooring-1': {
    q: '¿Pueden restaurar el piso que tengo en lugar de reemplazarlo?',
    a: ['A menudo, sí. Restaurar y reparar pisos de madera existentes es parte de nuestro trabajo, y cuando las tablas están en buen estado es la opción más económica.'],
  },
  'flooring-2': {
    q: '¿Qué pasa si el contrapiso está en mal estado?',
    a: ['Se arregla antes de colocar nada. La reparación del contrapiso, la nivelación y la preparación contra la humedad son parte del trabajo, porque un piso nuevo sobre uno en mal estado falla en los mismos lugares que el anterior.'],
  },
  'flooring-3': {
    q: '¿Qué tipos de pisos instalan?',
    a: ['Madera maciza y de ingeniería, vinilo de lujo en tablas y losetas, cerámica y piedra incluidos los sistemas con calefacción, y alfombra, además de escaleras, peldaños, narices y transiciones que lo unen todo.'],
  },
  'roofing-siding-1': {
    q: '¿Reparan techos o solo los reemplazan?',
    a: ['Ambas cosas. Muchos techos necesitan una reparación y no un reemplazo, y los detalles alrededor de los tapajuntas, las limahoyas y las uniones entre techo y pared es donde la mayoría tiene la filtración.'],
  },
  'roofing-siding-2': {
    q: '¿También se encargan de canaletas, fascias y sofitos?',
    a: ['Sí, además de revestimientos, molduras exteriores, carpintería y la ventilación del ático. Es una sola envolvente y funciona como una.'],
  },
  'roofing-siding-3': {
    q: '¿Pueden reparar daños por tormenta?',
    a: ['Sí. Si el daño pasa por el seguro, la parte de documentación se explica en nuestra página de reparaciones por reclamos de seguro.'],
  },
  'windows-doors-1': {
    q: '¿Se puede agrandar una ventana o agregar una nueva?',
    a: ['Sí. Las aberturas se pueden agrandar o abrir nuevas, incluido el dintel que una abertura nueva o más ancha necesita para soportar la carga de arriba.'],
  },
  'windows-doors-2': {
    q: '¿Qué evita que entre agua alrededor de una ventana nueva?',
    a: [
      'El tapajuntas, el sellado y el aislamiento de la abertura, que es la parte del trabajo que decide si la pared alrededor se mantiene seca.',
      'Una ventana colocada en una abertura sin el tapajuntas adecuado tendrá filtraciones, por buena que sea la ventana.',
    ],
  },
  'windows-doors-3': {
    q: '¿Pueden instalar una ventana de egreso para un dormitorio en el sótano?',
    a: ['Sí, y normalmente eso es lo que permite que una habitación del sótano cuente como dormitorio.'],
  },
  'painting-drywall-1': {
    q: '¿Pueden quitar un techo texturizado?',
    a: ['Sí, y también igualamos la textura cuando solo se repara una parte de un techo o pared.'],
  },
  'painting-drywall-2': {
    q: '¿Por qué tanta preparación antes de pintar?',
    a: ['Porque la pintura no esconde nada por mucho tiempo. Las grietas, los clavos salidos y los paneles dañados se reparan, y la superficie se sella y prepara primero, que es la mayor parte del trabajo y toda la diferencia un año después.'],
  },
  'painting-drywall-3': {
    q: '¿Pintan exteriores además de interiores?',
    a: ['Sí. Pintura exterior y la preparación que necesita, así como trabajo interior, incluidas molduras y puertas.'],
  },
  'water-damage-mold-1': {
    q: '¿Qué se hace primero después de un daño por agua?',
    a: [
      'Encontrar y reparar el origen. Luego se retira el material mojado y dañado, y la estructura se seca y se confirma seca antes de reconstruir nada.',
      'Reconstruir sobre algo que sigue mojado es la forma de que el mismo problema vuelva.',
    ],
  },
  'water-damage-mold-2': {
    q: '¿También se encargan del moho además del agua?',
    a: ['Sí. La remediación de moho, la reparación estructural donde la estructura está afectada y la reconstrucción completa del área son parte del mismo trabajo, no oficios separados que usted tenga que coordinar.'],
  },
  'water-damage-mold-3': {
    q: '¿Y si mi aseguradora está involucrada?',
    a: [
      'Documentamos el daño y preparamos nuestro presupuesto para su expediente, y respondemos preguntas sobre nuestro propio alcance.',
      'No negociamos ni liquidamos reclamos de seguro. En Virginia eso es ajuste público, requiere una licencia aparte y es una profesión distinta a la nuestra.',
    ],
  },
  'insurance-claim-repairs-1': {
    q: '¿Qué me entregan exactamente para mi expediente del reclamo?',
    a: [
      'Fotografías, medidas y un alcance por escrito del daño, y un presupuesto de reparación detallado apto para el expediente.',
      'También respondemos las preguntas de la aseguradora sobre nuestro propio presupuesto y nuestro propio alcance.',
    ],
  },
  'insurance-claim-repairs-2': {
    q: '¿Tratarán con mi compañía de seguros en mi nombre?',
    a: [
      'No, y a quien le diga lo contrario conviene preguntarle qué licencia tiene.',
      'Negociar o liquidar un reclamo por cuenta del asegurado es ajuste público. En Virginia requiere una licencia aparte y no es aquello para lo que tenemos licencia. Somos el contratista: documentamos el daño, presupuestamos la reparación y hacemos el trabajo.',
    ],
  },
  'insurance-claim-repairs-3': {
    q: '¿La reparación actualiza todo al código vigente?',
    a: ['Actualizar al código vigente el trabajo afectado es parte del alcance, lo cual importa en una casa antigua donde el área dañada se construyó con una norma que ya cambió.'],
  },
};

/** The no-match reply. Same promise as the English: nothing about the
    question being answered later, and a route that works today. */
export const noMatchReplyEs: string[] = [
  'No tengo una respuesta aprobada para eso, y prefiero no adivinar.',
  `¿Quiere que Shawn o Nancy se lo respondan? Deje su número abajo y le devolverán la llamada, o llame al ${business.phonePrimary}.`,
];

/** Shown above an English answer that has no translation yet. */
export const englishOnlyNote = 'Esta respuesta todavía no está traducida, así que se muestra en inglés:';

/* ---------------------------------------------------------------- guards */

assertSafeFaqEs(Object.values(answersEs), 'chat-es');
assertSafeFaqEs([{ q: 'sin coincidencia', a: noMatchReplyEs }], 'chat-es/no-match');
