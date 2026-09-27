import Link from "next/link";
import type { LegalSection } from "@/components/legal/LegalPage";
import { List, Owner, P, Term } from "@/components/legal/LegalText";
import { ENERGY_REGEN_HOURS, FREE_MAX_ENERGY } from "@/lib/energy/config";
import { routes } from "@/lib/site";
import { ENERGY_REFILL_COST, LESSON_COMPLETION_REWARD } from "@/lib/tokens/config";

/**
 * Texto de los Términos y Condiciones de BytePath.
 *
 * Describe el funcionamiento REAL de la plataforma en esta versión. Si cambia
 * algo de lo que aquí se afirma (cómo se gasta la energía, si hay cobros, si
 * hay publicidad de terceros, qué servicio ejecuta el código...), hay que
 * actualizar este texto y publicar una versión nueva (ver
 * `src/lib/legal/documents.ts`).
 *
 * Las cifras de energía y tokens se leen de su configuración para que el texto
 * no pueda contradecir a la aplicación.
 *
 * No es asesoría jurídica: es un borrador que debe revisar el responsable del
 * servicio, idealmente con un profesional.
 */

const link = "focus-ring rounded-control font-medium text-brand-ink hover:underline";

export const termsSections: LegalSection[] = [
  {
    id: "identificacion",
    title: "Identificación de BytePath",
    content: (
      <>
        <P>
          <Term>BytePath</Term> es una plataforma educativa en línea de programación, centrada en C++ y en
          la programación competitiva.
        </P>
        <P>
          BytePath es un proyecto educativo desarrollado por un equipo de estudiantes en{" "}
          <Owner field="location" />. No es una empresa ni una persona jurídica.
        </P>
        <P>
          Para consultas relacionadas con la plataforma, su funcionamiento o el tratamiento de datos
          personales, puedes comunicarte mediante <Owner field="email" />.
        </P>
        <P>
          En este documento, «BytePath» o «nosotros» se refiere al proyecto y al equipo de estudiantes
          que lo desarrolla, y «tú» o «usuario», a la persona que utiliza la plataforma. Estos Términos
          regulan el acceso y el uso del
          sitio web de BytePath y de todos sus servicios. Si no estás de acuerdo con ellos, no crees una
          cuenta ni utilices la plataforma.
        </P>
      </>
    ),
  },
  {
    id: "servicio",
    title: "Objeto y descripción del servicio",
    content: (
      <>
        <P>BytePath ofrece, de forma gratuita:</P>
        <List>
          <li>Cursos organizados en módulos y lecciones, con teoría y ejemplos de código.</li>
          <li>Quizzes de comprobación en las lecciones que los incluyen.</li>
          <li>
            En algunas lecciones, desafíos prácticos en los que escribes código que se compila y se
            ejecuta de verdad contra casos de prueba.
          </li>
          <li>Un camino de aprendizaje que guarda tu progreso y te indica qué lección toca después.</li>
          <li>Un sistema de energía y otro de tokens, descritos más abajo.</li>
        </List>
        <P>
          Algunas secciones que aparecen en el sitio, como Problemas o Competición, están en desarrollo y
          todavía no están disponibles.
        </P>
      </>
    ),
  },
  {
    id: "cuentas",
    title: "Registro y cuentas de usuario",
    content: (
      <>
        <P>
          Puedes ver el catálogo de cursos y el camino de cada curso sin cuenta. Para abrir las lecciones,
          hacer los quizzes y desafíos y guardar tu progreso necesitas una cuenta.
        </P>
        <P>
          Para crearla te pedimos un <Term>nombre de usuario</Term>, un <Term>correo electrónico</Term> y
          una <Term>contraseña</Term>, y dos casillas obligatorias e independientes: aceptar
          expresamente estos Términos y confirmar que tienes 14 años o más. Es posible que tengas que
          confirmar tu correo antes de poder entrar.
        </P>
        <P>
          La contraseña pasa por el servidor de BytePath solo para entregarla al servicio de
          autenticación (Supabase Auth), que guarda un hash de ella, no la contraseña en texto plano.
          BytePath no la guarda en sus propias tablas ni la escribe en sus registros.
        </P>
        <P>
          La casilla «Confirmo que tengo 14 años o más» es una <Term>declaración tuya</Term>: el
          formulario no deja continuar sin marcarla y el servidor vuelve a comprobarla, así que no se
          puede omitir manipulando la página. No te pedimos la edad ni la fecha de nacimiento, y la
          confirmación no se guarda: se comprueba al crear la cuenta y se descarta. No es una
          verificación de tu edad ni de tu identidad con documentos. Más detalles en la sección
          «Usuarios menores de edad».
        </P>
        <P>Al crear una cuenta te comprometes a:</P>
        <List>
          <li>Dar un correo electrónico real al que tengas acceso.</li>
          <li>
            Elegir un nombre de usuario que no sea ofensivo, que no suplante a otra persona y que no
            induzca a error.
          </li>
          <li>Usar la cuenta tú mismo y no cederla ni venderla.</li>
        </List>
        <P>
          Registramos qué versión de estos Términos aceptaste y cuándo, para poder distinguirla de futuras
          versiones.
        </P>
      </>
    ),
  },
  {
    id: "uso-educativo",
    title: "Uso educativo de la plataforma",
    content: (
      <>
        <P>
          BytePath es una herramienta de aprendizaje. El contenido está pensado para ayudarte a estudiar y
          practicar, y no garantiza ningún resultado concreto en concursos, exámenes, procesos de
          selección ni estudios.
        </P>
        <P>
          BytePath no emite certificados ni títulos, y completar cursos en la plataforma no equivale a
          ninguna acreditación oficial.
        </P>
      </>
    ),
  },
  {
    id: "progreso",
    title: "Progreso de aprendizaje",
    content: (
      <>
        <P>
          Tu progreso se guarda en tu cuenta: qué lecciones has empezado, qué preguntas del quiz has
          acertado, qué desafíos has resuelto y qué lecciones has completado.
        </P>
        <P>
          El camino es lineal: una lección se desbloquea cuando completas la anterior. Una lección se
          completa cuando has superado su quiz y, si lo tiene, su desafío, y confirmas su finalización.
          Esas comprobaciones las hace el servidor de BytePath; lo que muestra tu navegador es solo un
          reflejo.
        </P>
        <P>
          Podemos ajustar el progreso guardado cuando sea necesario para corregir errores técnicos,
          reorganizar el contenido de un curso o deshacer resultados obtenidos manipulando la plataforma.
        </P>
      </>
    ),
  },
  {
    id: "energia",
    title: "Sistema de energía",
    content: (
      <>
        <P>
          Las cuentas gratuitas tienen hasta <Term>{FREE_MAX_ENERGY} energías</Term>. Se recupera una cada{" "}
          {ENERGY_REGEN_HOURS} horas, hasta ese máximo, sin necesidad de hacer nada.
        </P>
        <P>
          La energía solo se gasta al <Term>completar</Term> una lección: 1 energía por lección, una sola
          vez. Abrir, leer, repasar o hacer el quiz de una lección no gasta energía. Si no te queda
          energía, puedes seguir leyendo y repasando; la lección queda en progreso hasta que puedas
          completarla.
        </P>
        <P>
          La energía no tiene valor económico, no se puede comprar, vender, transferir ni canjear por
          dinero, y no se conserva si la cuenta se elimina. Podemos cambiar las cifras de este sistema;
          si lo hacemos, se reflejará en la plataforma y en una nueva versión de estos Términos.
        </P>
      </>
    ),
  },
  {
    id: "tokens",
    title: "Sistema de tokens",
    content: (
      <>
        <P>
          Por cada lección que completas por primera vez recibes <Term>{LESSON_COMPLETION_REWARD} tokens</Term>.
          Con {ENERGY_REFILL_COST} tokens puedes recargar tu energía al máximo sin esperar.
        </P>
        <P>
          Los tokens son una unidad interna de la plataforma. No son dinero ni una moneda: no se pueden
          comprar, vender, transferir a otra cuenta ni canjear por dinero, bienes o servicios. Hoy no
          existe ninguna forma de adquirirlos pagando.
        </P>
        <P>
          Podemos corregir saldos generados por errores técnicos o por un uso indebido de la plataforma,
          y modificar cuántos tokens se obtienen o cuestan las acciones. Los tokens se pierden si la
          cuenta se elimina, sin compensación.
        </P>
      </>
    ),
  },
  {
    id: "contenido",
    title: "Cursos, lecciones, quizzes y desafíos",
    content: (
      <>
        <P>
          Revisamos el contenido con cuidado, pero puede contener errores o quedar desactualizado. Si
          encuentras uno, te agradeceremos que nos lo comuniques. Podemos corregir, ampliar, reorganizar o
          retirar cursos y lecciones en cualquier momento.
        </P>
        <P>
          Las respuestas de los quizzes las corrige el servidor. Los desafíos se evalúan de forma
          automática comparando la salida de tu programa con la esperada en varios casos de prueba,
          algunos de ellos ocultos. Una evaluación automática tiene límites: puede ocurrir que una
          solución correcta falle por un detalle de formato o que un caso de prueba no cubra todas las
          situaciones.
        </P>
      </>
    ),
  },
  {
    id: "ejecucion",
    title: "Ejecución de código y servicios externos",
    content: (
      <>
        <P>
          Cuando ejecutas un desafío, el servidor de BytePath comprueba tu sesión y que el desafío esté
          desbloqueado para ti, y envía tu código a un servicio externo de ejecución,{" "}
          <Term>Judge0</Term> (hoy, su instancia pública en ce.judge0.com), que lo compila y lo ejecuta
          con límites de tiempo y de memoria. Tu navegador nunca se comunica directamente con ese
          servicio. BytePath le envía el código, la entrada de cada caso de prueba y los límites de
          ejecución; no le envía tu correo, tu nombre de usuario, tu identificador de cuenta, tus cookies
          ni tu contraseña.
        </P>
        <P>
          BytePath no guarda tu código en su base de datos ni un historial de tus ejecuciones; solo
          anota si has superado el desafío. Judge0, en cambio, es un proveedor externo: puede conservar y
          tratar lo que recibe según sus propias condiciones, y BytePath no ha verificado durante cuánto
          tiempo lo conserva ni puede borrarlo.
        </P>
        <P>
          Por eso, no incluyas en tu código ni en los datos que envíes para ejecutar información
          personal, contraseñas, tokens, claves privadas u otros secretos. Si el servicio de ejecución no
          está disponible, BytePath te lo indicará y nunca lo contará como una respuesta incorrecta.
        </P>
        <P>
          Para ejecutar código necesitas haber iniciado sesión, y hay un límite de ejecuciones por minuto
          y por día pensado para evitar abusos, no para interrumpir el estudio normal.
        </P>
        <P>
          BytePath utiliza además <Term>Supabase</Term> para gestionar las cuentas de usuario y almacenar
          los datos de la plataforma (perfil, progreso, energía y tokens).
        </P>
      </>
    ),
  },
  {
    id: "propiedad-intelectual",
    title: "Propiedad intelectual",
    content: (
      <>
        <P>
          Los textos, explicaciones, ejercicios, quizzes, desafíos, el diseño, el logotipo y el software
          de BytePath pertenecen al equipo de BytePath o a sus respectivos titulares. Te
          concedemos permiso para usarlos con fines personales y educativos dentro de la plataforma. No
          puedes copiarlos, redistribuirlos ni publicarlos de forma total o sustancial, ni usarlos con
          fines comerciales, sin autorización.
        </P>
        <P>
          Puedes usar lo que aprendas y los fragmentos de código de los ejemplos en tus propios programas
          y soluciones.
        </P>
        <P>
          El código que escribes es tuyo. Al enviarlo nos autorizas únicamente a procesarlo, enviarlo al
          servicio de ejecución y evaluarlo para prestarte el servicio.
        </P>
      </>
    ),
  },
  {
    id: "uso-aceptable",
    title: "Uso aceptable de la plataforma",
    content: (
      <>
        <P>No está permitido:</P>
        <List>
          <li>
            Intentar saltarse los límites de la plataforma (energía, tokens, progreso, desbloqueo de
            lecciones) manipulando peticiones, el navegador o la base de datos.
          </li>
          <li>Acceder o intentar acceder a cuentas o datos de otras personas.</li>
          <li>
            Enviar código diseñado para dañar el servicio de ejecución, atacar otros sistemas, consumir
            recursos de forma abusiva o cualquier fin distinto de resolver el desafío.
          </li>
          <li>Descargar el contenido de forma masiva o automatizada.</li>
          <li>Interferir con el funcionamiento o la seguridad de BytePath.</li>
        </List>
        <P>
          Si encuentras un fallo de seguridad, te pedimos que no lo aproveches y que nos lo comuniques en{" "}
          <Owner field="email" />.
        </P>
      </>
    ),
  },
  {
    id: "seguridad",
    title: "Seguridad de la cuenta",
    content: (
      <>
        <P>
          Eres responsable de mantener tu contraseña en secreto y de lo que hagas con tu cuenta. Usa una
          contraseña que no utilices en otros servicios.
        </P>
        <P>
          Puedes cambiar tu contraseña desde la página de tu cuenta (al hacerlo se cierran las sesiones
          abiertas en otros dispositivos) y, si la olvidas, pedir un enlace para elegir una nueva desde la
          pantalla de inicio de sesión. Si crees que alguien ha accedido a tu cuenta sin permiso, cambia
          tu contraseña y escríbenos a <Owner field="email" />. BytePath nunca te pedirá tu contraseña por
          correo electrónico.
        </P>
        <P>
          Aplicamos medidas de seguridad razonables para un proyecto de este tamaño, pero ningún sistema
          es completamente seguro y no podemos garantizar que nunca se produzca un acceso no autorizado.
        </P>
      </>
    ),
  },
  {
    id: "disponibilidad",
    title: "Disponibilidad del servicio",
    content: (
      <P>
        BytePath es un proyecto en desarrollo y se ofrece tal como está y según su disponibilidad. Puede
        interrumpirse por mantenimiento, por fallos técnicos o por problemas de los servicios externos de
        los que depende. Intentaremos que las interrupciones sean breves, pero no podemos garantizar un
        funcionamiento continuo ni libre de errores.
      </P>
    ),
  },
  {
    id: "publicidad",
    title: "Publicidad",
    content: (
      <>
        <P>
          Actualmente BytePath <Term>no muestra publicidad de terceros</Term>. En algunas páginas aparece
          un espacio marcado como «Patrocinado» que está reservado para el futuro: hoy no contiene
          anuncios de terceros ni carga contenido de ningún proveedor publicitario.
        </P>
        <P>
          Si en el futuro se incorpora publicidad, lo indicaremos y actualizaremos estos Términos y la
          Política de Privacidad antes de activarla.
        </P>
      </>
    ),
  },
  {
    id: "premium",
    title: "Funcionalidades Premium",
    content: (
      <>
        <P>
          BytePath contempla una modalidad <Term>Premium</Term>, prevista para futuras versiones, que
          ofrecería energía ilimitada y la ausencia de espacios publicitarios. La página de Premium
          describe esas funcionalidades previstas.
        </P>
        <P>
          Hoy <Term>no es posible pagar ni contratar Premium</Term>: BytePath no procesa ningún pago ni
          almacena datos de pago. El estado Premium solo puede activarse de forma manual, por ejemplo para
          pruebas.
        </P>
        <P>
          Si en el futuro Premium pasa a ser de pago, sus condiciones (precio, facturación, renovación,
          cancelación y reembolsos) se publicarán y tendrás que aceptarlas expresamente antes de realizar
          cualquier pago.
        </P>
      </>
    ),
  },
  {
    id: "modificaciones",
    title: "Modificaciones del servicio y de estos Términos",
    content: (
      <>
        <P>
          Podemos añadir, cambiar o retirar funcionalidades y contenido de BytePath para mejorarlo o
          adaptarlo.
        </P>
        <P>
          También podemos actualizar estos Términos. Cada versión se identifica con un número y una fecha
          (la vigente figura al principio de esta página). Si los cambios son importantes, te lo
          indicaremos en la plataforma y podremos pedirte que aceptes la nueva versión para seguir usando
          tu cuenta.
        </P>
      </>
    ),
  },
  {
    id: "suspension",
    title: "Suspensión o eliminación de cuentas",
    content: (
      <>
        <P>
          Podemos restringir, suspender o eliminar una cuenta que incumpla estos Términos, de forma
          proporcionada a la gravedad del incumplimiento y, cuando sea posible, avisándote antes.
        </P>
        <P>
          Puedes eliminar tu cuenta tú mismo desde la página de tu cuenta, confirmándolo con tu
          contraseña, o pedirlo escribiendo a <Owner field="email" />. Al eliminarla se borran tu cuenta
          del servicio de autenticación y, de las tablas de BytePath, tu perfil, tu progreso, tu energía,
          tus tokens y su historial, tu estado de suscripción, el registro de los Términos que aceptaste
          y los contadores de límites asociados a tu cuenta.
        </P>
        <P>
          Eso no alcanza a todas las copias que puedan existir fuera de esas tablas: las copias de
          seguridad y los registros técnicos de los proveedores (Supabase, el alojamiento), el código ya
          enviado al servicio de ejecución y los contadores de límites basados en la conexión, que no
          están vinculados a tu cuenta, siguen los plazos y procesos de cada caso, que BytePath no
          controla. Los detalles están en la Política de Privacidad.
        </P>
      </>
    ),
  },
  {
    id: "responsabilidad",
    title: "Limitación de responsabilidad",
    content: (
      <>
        <P>
          BytePath es un proyecto educativo gratuito y en desarrollo. En la medida en que lo permita la
          legislación aplicable, BytePath no será responsable de:
        </P>
        <List>
          <li>Errores u omisiones en el contenido educativo.</li>
          <li>Interrupciones del servicio o pérdidas de progreso causadas por fallos técnicos.</li>
          <li>El funcionamiento de servicios externos de los que depende la plataforma.</li>
          <li>El uso que hagas de lo aprendido fuera de la plataforma.</li>
        </List>
        <P>
          Nada de lo anterior limita la responsabilidad que, según la legislación aplicable, no pueda
          limitarse o excluirse, ni afecta a los derechos que la ley te reconoce como usuario o como
          titular de tus datos personales.
        </P>
      </>
    ),
  },
  {
    id: "menores",
    title: "Usuarios menores de edad",
    content: (
      <>
        <P>BytePath está dirigido al público en general, no específicamente a menores de edad.</P>
        <P>
          <Term>Condición actual de registro.</Term> Hoy, el registro directo de cuentas en BytePath está
          disponible para personas que confirman tener 14 años o más. Por eso el formulario de registro
          pide marcar la casilla «Confirmo que tengo 14 años o más», separada de la aceptación de estos
          Términos, y no permite crear la cuenta sin marcarla; el servidor vuelve a comprobarlo.
        </P>
        <P>
          Esa confirmación es lo único que te pedimos sobre tu edad. BytePath no solicita ni almacena tu
          fecha de nacimiento ni tu edad exacta. La confirmación se comprueba al crear la cuenta y no se
          almacena. Tampoco verificamos la edad con documentos ni por otros medios: la casilla es una
          declaración de quien se registra, no una verificación de su edad ni de su identidad.
        </P>
        <P>
          <Term>Qué significa esta condición.</Term> Los 14 años son una condición del registro de
          BytePath tal como funciona hoy, no una edad mínima general para usar servicios en internet
          establecida por la Ley N.º 29733, Ley de Protección de Datos Personales. Lo que regula esa
          normativa, en su Reglamento (aprobado por el Decreto Supremo N.º 016-2024-JUS), es quién debe
          dar el consentimiento para el tratamiento de los datos personales de una persona menor de edad.
          Se es menor de edad hasta cumplir 18 años, pero no todas las personas menores de edad necesitan
          a un adulto para ese consentimiento. Según los artículos 22 y 25 del Reglamento:
        </P>
        <List>
          <li>
            <Term>Menores de 14 años:</Term> el tratamiento de sus datos personales requiere el
            consentimiento de quien ejerce la patria potestad o la tutela (su madre, su padre o su tutor),
            según corresponda.
          </li>
          <li>
            <Term>Mayores de 14 y menores de 18 años:</Term> pueden dar ellos mismos el consentimiento
            para el tratamiento de sus datos personales, de acuerdo con su capacidad, siempre que la
            información se les haya dado en un lenguaje que puedan comprender.
          </li>
        </List>
        <P>
          Estas reglas se refieren solo al consentimiento para el tratamiento de datos personales. Otras
          cuestiones, como la capacidad de un menor para celebrar contratos, se rigen por otras normas.
          Por eso, si eres menor de edad, te recomendamos leer estos Términos con tu madre, tu padre o tu
          tutor.
        </P>
        <P>
          <Term>Registro de menores de 14 años.</Term> Hoy BytePath no tiene un sistema para obtener el
          consentimiento de madres, padres o tutores, ni para verificar la identidad de quien lo da, la
          edad del usuario o la relación entre ambos. Por eso, actualmente no ofrece el registro directo
          a menores de 14 años. Si en el futuro BytePath decide permitir ese registro mediante el
          consentimiento de quien corresponda, primero tendrá que implementar las medidas necesarias y
          actualizar estos Términos y la Política de Privacidad.
        </P>
        <P>
          <Term>Si tienes 14 años o más y todavía no has cumplido 18.</Term> Hemos intentado escribir
          estos Términos con un lenguaje claro; si alguna parte no se entiende, escríbenos a{" "}
          <Owner field="email" />.
        </P>
        <P>
          Si un tratamiento concreto de datos necesitara una autorización adicional (por ejemplo, el
          consentimiento de la madre, el padre o el tutor, o un consentimiento aparte para una finalidad
          distinta del funcionamiento de la plataforma), se pedirá antes de realizarlo, y sin esa
          autorización ese tratamiento no se realizará.
        </P>
        <P>
          Las madres, padres o tutores pueden escribir a <Owner field="email" /> para cualquier consulta
          sobre la cuenta de un menor o para solicitar su eliminación. Si sabemos que una cuenta
          pertenece a una persona menor de 14 años, podremos suspenderla o eliminarla.
        </P>
      </>
    ),
  },
  {
    id: "privacidad",
    title: "Privacidad y datos personales",
    content: (
      <>
        <P>
          BytePath intenta recopilar solo la información necesaria para prestar el servicio y no usar los
          datos de sus usuarios para fines ajenos a su funcionamiento. Hoy no vendemos datos personales ni
          los usamos para crear perfiles publicitarios.
        </P>
        <P>
          El tratamiento de tus datos personales se regirá por la{" "}
          <Link href={routes.privacy} className={link}>
            Política de Privacidad
          </Link>{" "}
          de BytePath, que es un documento distinto de estos Términos y explica qué datos se tratan, con
          qué finalidad, con qué proveedores y qué puedes hacer con ellos.
        </P>
        <P>
          Aceptar estos Términos no equivale a dar tu consentimiento para ningún tratamiento de datos
          concreto: si en algún caso hiciera falta tu consentimiento, se te pediría por separado.
        </P>
      </>
    ),
  },
  {
    id: "contacto",
    title: "Contacto",
    content: (
      <>
        <P>
          Para consultas relacionadas con estos Términos, con tu cuenta o con el tratamiento de tus datos
          personales:
        </P>
        <List>
          <li>BytePath: proyecto educativo desarrollado por un equipo de estudiantes.</li>
          <li>
            Correo electrónico: <Owner field="email" />
          </li>
          <li>
            País: <Owner field="jurisdiction" />
          </li>
        </List>
      </>
    ),
  },
  {
    id: "legislacion",
    title: "Legislación aplicable",
    content: (
      <P>
        Estos Términos se rigen por la legislación de <Owner field="jurisdiction" />. Cualquier
        controversia se someterá a los juzgados y tribunales que correspondan según esa legislación, sin
        perjuicio de los derechos que la normativa de protección de las personas consumidoras reconozca a
        los usuarios.
      </P>
    ),
  },
];
