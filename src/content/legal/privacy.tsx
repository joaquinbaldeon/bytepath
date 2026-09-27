import Link from "next/link";
import type { LegalSection } from "@/components/legal/LegalPage";
import { List, Owner, P, Term } from "@/components/legal/LegalText";
import { routes } from "@/lib/site";

/**
 * Texto de la Política de Privacidad de BytePath.
 *
 * Describe lo que hace el CÓDIGO de esta versión, comprobado en la auditoría
 * de privacidad (tablas de supabase/*.sql, /api/runs, src/lib/execution,
 * src/lib/security, las cookies de src/lib/supabase y la exportación de
 * /api/cuenta/exportar). Si cambia cualquiera de esas piezas —qué se guarda,
 * qué se envía a Judge0, qué incluye la descarga, las cookies—, hay que
 * actualizar este texto y su versión (src/lib/legal/documents.ts).
 *
 * No es asesoría jurídica: los puntos que dependen de interpretación legal
 * (responsable formal, bases jurídicas, transferencias) están pendientes de
 * revisión profesional (docs/security-privacy.md).
 */

const link = "focus-ring rounded-control font-medium text-brand-ink hover:underline";

export const privacySections: LegalSection[] = [
  {
    id: "quienes-somos",
    title: "Quién trata tus datos y cómo contactarnos",
    content: (
      <>
        <P>
          BytePath es un proyecto educativo desarrollado por un equipo de estudiantes en{" "}
          <Owner field="location" />. No es una empresa ni una persona jurídica. Los datos de esta
          política los trata ese equipo para hacer funcionar la plataforma.
        </P>
        <P>
          Para consultas relacionadas con la plataforma, su funcionamiento o el tratamiento de tus datos
          personales, puedes comunicarte mediante <Owner field="email" />.
        </P>
      </>
    ),
  },
  {
    id: "enfoque",
    title: "Nuestro enfoque",
    content: (
      <>
        <P>
          BytePath procura recopilar únicamente los datos necesarios para que funcionen sus cursos,
          quizzes, desafíos y cuentas. No vendemos datos personales ni los usamos para crear perfiles
          publicitarios.
        </P>
        <P>
          Este compromiso se refiere a lo que hace BytePath. Los proveedores externos que usamos
          (descritos más abajo) tratan los datos que reciben según sus propias condiciones, que BytePath no
          controla.
        </P>
      </>
    ),
  },
  {
    id: "datos-cuenta",
    title: "Datos de tu cuenta",
    content: (
      <>
        <P>Para crear y mantener tu cuenta se tratan estos datos:</P>
        <List>
          <li>
            <Term>Correo electrónico.</Term> Identifica tu cuenta y sirve para iniciar sesión, confirmar
            el registro y recuperar la contraseña. Lo guarda el servicio de autenticación (Supabase Auth).
            Solo lo ves tú, en la página de tu cuenta.
          </li>
          <li>
            <Term>Contraseña.</Term> Pasa por el servidor de BytePath únicamente para entregarla a
            Supabase Auth, que guarda un hash de ella, no la contraseña en texto plano. BytePath no la
            guarda en sus tablas ni la escribe en sus registros. Para cambiar la contraseña (salvo justo
            después de entrar con un enlace de recuperación) o eliminar la cuenta, el servidor le pide a
            Supabase Auth que compruebe la actual.
          </li>
          <li>
            <Term>Nombre de usuario.</Term> Es el nombre que se muestra en la interfaz. Se guarda en tu
            perfil y, además, queda una copia en los datos de registro de tu cuenta en Supabase Auth, que
            no se actualiza si el nombre cambia. Hoy no hay perfiles públicos: otros usuarios no ven tu
            nombre.
          </li>
          <li>
            <Term>Identificador interno de usuario.</Term> Un código aleatorio (UUID) que genera Supabase
            Auth al crear la cuenta. Sirve para relacionar tus datos entre sí dentro de BytePath.
          </li>
          <li>
            <Term>Datos de sesión.</Term> Al iniciar sesión, Supabase Auth emite unos tokens de sesión que
            se guardan en una cookie de tu navegador (ver «Cookies»). Supabase Auth guarda también los
            datos propios de su servicio, como las sesiones abiertas y las fechas de alta, confirmación y
            último acceso.
          </li>
          <li>
            <Term>Aceptación de los Términos.</Term> Guardamos qué versión de los Términos y Condiciones
            aceptaste y cuándo, para poder demostrar qué versión aceptaste. El número de versión aceptado
            al registrarte también queda en los datos de registro de tu cuenta en Supabase Auth.
          </li>
        </List>
      </>
    ),
  },
  {
    id: "edad",
    title: "Confirmación de edad (14 años o más)",
    content: (
      <>
        <P>
          Al registrarte debes marcar la casilla «Confirmo que tengo 14 años o más». Es obligatoria y
          está separada de la aceptación de los Términos. El formulario no deja continuar sin marcarla y
          el servidor vuelve a comprobarla, así que no se puede omitir manipulando la página.
        </P>
        <P>
          Es una <Term>declaración tuya</Term>, no una verificación: BytePath no comprueba tu edad ni tu
          identidad con documentos ni por otros medios. No te pedimos la edad ni la fecha de nacimiento,
          y la confirmación <Term>no se guarda</Term> como dato de tu cuenta: se comprueba al crearla y se
          descarta.
        </P>
        <P>
          Los 14 años son una condición que BytePath ha fijado para el registro directo, porque hoy no
          dispone de un sistema para obtener y verificar el consentimiento de madres, padres o tutores.
          No es una afirmación de que la ley peruana establezca una edad mínima general para usar
          servicios digitales. Lo que regula la normativa de protección de datos es quién debe consentir
          el tratamiento de los datos de una persona menor de edad; está explicado en la sección
          «Usuarios menores de edad» de los{" "}
          <Link href={`${routes.terms}#menores`} className={link}>
            Términos y Condiciones
          </Link>
          .
        </P>
      </>
    ),
  },
  {
    id: "datos-aprendizaje",
    title: "Datos de tu aprendizaje",
    content: (
      <>
        <P>
          Para que funcionen el camino de aprendizaje, los quizzes, los desafíos, la energía y los tokens,
          se guarda, asociado a tu cuenta:
        </P>
        <List>
          <li>
            <Term>Progreso por lección:</Term> cuándo la empezaste, el estado de su quiz, qué preguntas
            has acertado, si superaste su desafío y cuándo la completaste. Sirve para desbloquear la
            lección siguiente, mostrarte tu avance y que el servidor compruebe que cumples los requisitos
            antes de completar una lección. No se guarda qué opción marcaste en cada pregunta, solo si la
            acertaste.
          </li>
          <li>
            <Term>Punto guardado de un quiz a medias:</Term> para continuar donde lo dejaste. Se vacía al
            completar la lección o al reiniciar el quiz.
          </li>
          <li>
            <Term>Energía:</Term> cuánta te queda y cuándo se recuperó la última, para aplicar el límite
            de lecciones de las cuentas gratuitas.
          </li>
          <li>
            <Term>Tokens:</Term> tu saldo y el historial de movimientos (cantidad, si fue por completar una
            lección o por recargar energía, la lección correspondiente y la fecha).
          </li>
          <li>
            <Term>Estado Premium o de suscripción:</Term> estado, plan y fecha de fin, si los hubiera. Hoy
            no se puede pagar nada en BytePath y el estado Premium solo se activa manualmente; no se
            guardan datos de pago.
          </li>
          <li>
            <Term>Contadores de uso:</Term> cuántas ejecuciones de código has hecho en el último minuto y
            en el último día, cuántas respuestas de quiz y otras acciones de progreso has enviado en el
            último minuto, y cuántas veces seguidas se ha escrito mal tu contraseña actual al cambiarla o
            al eliminar la cuenta. Sirven para prevenir abusos.
          </li>
        </List>
        <P>
          Estos registros llevan las fechas y horas necesarias para funcionar (por ejemplo, cuándo se
          completó una lección o cuándo empezó el periodo de un contador).
        </P>
      </>
    ),
  },
  {
    id: "ejecucion",
    title: "Ejecución de código (Judge0)",
    content: (
      <>
        <P>
          En los desafíos puedes enviar código para ejecutarlo. Tu navegador envía al servidor de
          BytePath el identificador del desafío, el lenguaje, el código, el curso y la lección. El
          servidor comprueba que tengas sesión, que el desafío exista, que la lección esté desbloqueada
          para ti y que no hayas superado el límite de ejecuciones.
        </P>
        <P>
          Solo entonces lo envía al servicio externo de ejecución <Term>Judge0</Term> (hoy, su instancia
          pública en ce.judge0.com), con lo necesario para ejecutarlo: el código, la entrada de cada caso
          de prueba y los límites de tiempo y memoria. <Term>No</Term> se le envían tu correo, tu nombre
          de usuario, tu identificador de cuenta, tus cookies ni tu contraseña. La petición la hace el
          servidor de BytePath, no tu navegador.
        </P>
        <P>
          Judge0 devuelve al servidor el resultado (salida, errores, tiempo y memoria), y el servidor te
          muestra lo necesario. De los casos de prueba ocultos solo te indica si los superaste. BytePath no
          guarda tu código ni un historial de ejecuciones en su base de datos: solo anota si superaste el
          desafío.
        </P>
        <P>
          Judge0 es un proveedor externo. Puede conservar y tratar lo que recibe según sus propias
          condiciones; BytePath no ha verificado durante cuánto tiempo lo conserva y no puede borrarlo.
          Por eso, <Term>no incluyas</Term> en tu código ni en los datos que envíes para ejecutar
          información personal, contraseñas, tokens, claves privadas u otros secretos.
        </P>
      </>
    ),
  },
  {
    id: "seguridad",
    title: "Dirección IP, seguridad y límites de uso",
    content: (
      <>
        <P>
          Como en cualquier sitio web, tu dirección IP llega al servicio de alojamiento de BytePath y al
          servidor en cada visita. Además, tu navegador se conecta directamente con Supabase para
          mantener tu sesión, así que Supabase también recibe tu IP y datos técnicos de tu navegador.
          BytePath no guarda tu dirección IP en claro como dato de tu cuenta.
        </P>
        <P>
          Para frenar abusos en el registro, la recuperación de contraseña y los inicios de sesión
          fallidos, BytePath cuenta intentos por conexión <Term>solo cuando el servidor está configurado</Term>{" "}
          para conocer la IP real de la conexión. En ese caso no guarda la IP, sino un{" "}
          <Term>identificador técnico</Term> derivado de ella con una clave secreta del servidor. Es una
          medida de seudonimización, <Term>no de anonimización</Term>: quien tenga esa clave y una IP
          concreta podría comprobar si corresponden. Ese identificador se usa solo para estos contadores y
          no se relaciona con tu cuenta. Sin esa configuración no se cuenta por conexión: para la
          comprobación del nombre de usuario en el registro se usa un contador común para todo el sitio,
          y en los demás casos se aplican solo los límites del propio servicio de autenticación.
        </P>
        <P>
          Los contadores no guardan historial. Cuando uno lleva más de dos días sin usarse, se borra la
          próxima vez que se usa el sistema de límites; si durante un tiempo no hay actividad, puede
          permanecer más. No hay una fecha exacta de borrado.
        </P>
        <P>
          Otras medidas: la base de datos solo permite a cada usuario leer sus propios datos, las
          operaciones que cambian el progreso, la energía o los tokens solo las puede hacer el servidor,
          y las claves privadas nunca se envían al navegador. La base de datos solo acepta altas de
          cuentas y cambios de contraseña que pasan por el servidor de BytePath: para ello el servidor
          adjunta una firma técnica al alta y un permiso de dos minutos al cambio de contraseña, que se
          comprueban y se descartan sin guardarse. El correo de una cuenta no se puede cambiar. Aun así,
          ningún sistema es completamente seguro y no podemos garantizar que nunca se produzca un acceso
          no autorizado.
        </P>
      </>
    ),
  },
  {
    id: "registros",
    title: "Registros técnicos (logs)",
    content: (
      <>
        <P>
          Los registros de errores del servidor de BytePath se han diseñado para anotar solo el tipo de
          fallo y códigos técnicos. No registran contraseñas, cookies, tokens, el código enviado a Judge0,
          las entradas de los casos de prueba ni datos personales innecesarios como tu correo o tu nombre
          de usuario.
        </P>
        <P>
          Eso se refiere a los registros que escribe BytePath. El servicio de alojamiento, Supabase y
          Judge0 tienen sus propios registros (que pueden incluir, por ejemplo, la IP, la fecha y hora, las
          páginas solicitadas o datos del navegador) y los gestionan según sus propias condiciones.
        </P>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies y almacenamiento en tu navegador",
    content: (
      <>
        <P>BytePath usa solo lo necesario para mantener tu sesión y recordar el tema:</P>
        <List>
          <li>
            <Term>Cookie de sesión de Supabase</Term> (su nombre empieza por «sb-» y termina en
            «-auth-token»; si es grande, se divide en varias numeradas). Mantiene tu sesión iniciada.
            Contiene los tokens de sesión y datos básicos de tu cuenta (identificador, correo, y el nombre
            de usuario y la versión de los Términos del registro). Dura hasta 30 días y se renueva mientras
            usas la plataforma. Es SameSite=Lax, y lleva el atributo Secure en la versión publicada por
            HTTPS (depende de la configuración del servidor).
          </li>
          <li>
            <Term>Cookie temporal de verificación</Term> (termina en «-code-verifier»). Puede crearse
            durante el registro o la recuperación de contraseña para completar de forma segura el enlace
            que te llega por correo.
          </li>
          <li>
            <Term>Preferencia de tema</Term> en el almacenamiento local del navegador
            («bytepath-theme»): recuerda si prefieres el tema claro u oscuro. No sale de tu navegador.
          </li>
        </List>
        <P>
          La cookie de sesión <Term>no es HttpOnly</Term>: el código de la propia página puede leerla,
          porque en la arquitectura actual la parte de BytePath que se ejecuta en tu navegador gestiona
          la sesión con Supabase. La consecuencia es que, si alguna vez se lograra ejecutar código
          malicioso dentro de la página, ese código podría leer tu sesión. Para reducir ese riesgo, la
          plataforma limita qué scripts puede cargar la página y no muestra contenido HTML escrito por
          usuarios. Es una limitación conocida de la versión actual.
        </P>
        <P>
          Estas cookies son propias de BytePath y solo sirven para la sesión. No usamos cookies de
          publicidad, de analítica ni de seguimiento.
        </P>
      </>
    ),
  },
  {
    id: "no-recopilamos",
    title: "Datos que no recopilamos",
    content: (
      <>
        <P>
          BytePath no te pide ni guarda deliberadamente: nombre real, fecha de nacimiento, edad exacta,
          DNI u otro documento de identidad, teléfono, dirección física, fotografía, ubicación precisa,
          datos bancarios o de tarjeta, información de salud, ni un perfil publicitario.
        </P>
        <P>
          La única excepción posible es lo que tú mismo escribas en el código de un desafío, que se envía a
          Judge0. Por eso te pedimos que no incluyas ahí datos personales.
        </P>
      </>
    ),
  },
  {
    id: "proveedores",
    title: "Proveedores externos y quién puede ver tus datos",
    content: (
      <>
        <List>
          <li>
            <Term>Supabase</Term>: autenticación de cuentas (Supabase Auth) y base de datos. Recibe y
            guarda todos los datos de cuenta y de aprendizaje descritos en esta política, recibe tu IP y
            datos del navegador cuando tu navegador se conecta con él, y envía los correos de confirmación
            y de recuperación de contraseña (directamente o mediante el servicio de correo configurado
            en Supabase). Sus registros, copias de seguridad y plazos de conservación
            los gestiona Supabase, no BytePath, y BytePath no los ha verificado.
          </li>
          <li>
            <Term>Judge0</Term> (ce.judge0.com): ejecución del código de los desafíos. Recibe lo descrito
            en «Ejecución de código».
          </li>
          <li>
            <Term>Servicio de alojamiento (hosting)</Term>: donde se ejecuta BytePath. Recibe todo el
            tráfico de la plataforma, incluidos tu IP, los datos de tu navegador, las cookies de sesión y
            lo que envíes en los formularios, y puede guardar registros técnicos según sus condiciones.
          </li>
        </List>
        <P>
          Estos proveedores pueden tratar los datos en servidores ubicados fuera del Perú.
        </P>
        <P>
          Usar BytePath no te permite ver las cuentas de otros usuarios: cada usuario solo puede acceder a
          sus propios datos. Los miembros del equipo que administran el proyecto pueden acceder a los datos
          almacenados en Supabase para el funcionamiento y el soporte de la plataforma; eso no los hace
          públicos.
        </P>
      </>
    ),
  },
  {
    id: "publicidad",
    title: "Analítica, publicidad y venta de datos",
    content: (
      <>
        <P>
          BytePath no usa herramientas de analítica (como Google Analytics), píxeles publicitarios (como
          Meta Pixel), servicios de seguimiento de errores de terceros (como Sentry), técnicas de huella
          digital del dispositivo (fingerprinting) ni perfiles publicitarios, y no vende datos personales.
        </P>
        <P>
          En algunas páginas aparece un espacio marcado como «Patrocinado» reservado para el futuro: hoy
          no muestra anuncios ni carga contenido de ningún proveedor publicitario. Si en el futuro se
          incorpora publicidad, se informará y se actualizarán esta política y los Términos antes de
          activarla.
        </P>
      </>
    ),
  },
  {
    id: "conservacion",
    title: "Cuánto tiempo se conservan los datos",
    content: (
      <>
        <P>En lo que depende de BytePath:</P>
        <List>
          <li>Los datos de tu cuenta y de tu aprendizaje se conservan mientras la cuenta exista.</li>
          <li>El punto guardado de un quiz, hasta que completas la lección o reinicias el quiz.</li>
          <li>Los contadores de uso, según lo explicado en «Dirección IP, seguridad y límites de uso».</li>
        </List>
        <P>
          BytePath no ha fijado otros plazos concretos. Lo que conservan Supabase, el servicio de
          alojamiento y Judge0 (registros, copias de seguridad, código ejecutado) depende de cada
          proveedor; BytePath no lo controla y no lo ha verificado.
        </P>
      </>
    ),
  },
  {
    id: "eliminacion",
    title: "Eliminar tu cuenta",
    content: (
      <>
        <P>
          Puedes eliminar tu cuenta desde la página de{" "}
          <Link href={routes.account} className={link}>
            tu cuenta
          </Link>
          , confirmándolo con tu contraseña y escribiendo «ELIMINAR», o pedirlo escribiendo a{" "}
          <Owner field="email" />.
        </P>
        <P>
          Al eliminarla se borran tu cuenta de Supabase Auth (correo, hash de la contraseña, sesiones) y,
          de las tablas de BytePath, tu perfil, tu progreso, tu energía, tus tokens y su historial, tu
          estado de suscripción, tus aceptaciones de los Términos y los contadores de uso asociados a tu
          cuenta. El servidor comprueba después que no quede ninguna fila tuya en esas tablas.
        </P>
        <P>
          Eso no significa que desaparezca al instante toda copia: las copias de seguridad y los registros
          de Supabase y del servicio de alojamiento, el código ya enviado a Judge0 y los contadores por
          conexión (que no están vinculados a tu cuenta) siguen los plazos y procesos de cada caso.
        </P>
      </>
    ),
  },
  {
    id: "derechos",
    title: "Tus derechos y cómo ejercerlos",
    content: (
      <>
        <P>
          La Ley N.º 29733, Ley de Protección de Datos Personales, reconoce a los titulares de datos
          personales, entre otros, los derechos de información, acceso, actualización, inclusión,
          rectificación y supresión, y oposición. Si se te deniega su ejercicio, la ley prevé que puedas
          acudir a la Autoridad Nacional de Protección de Datos Personales o al Poder Judicial. Para
          ejercer cualquiera de ellos, escribe a{" "}
          <Owner field="email" />.
        </P>
        <P>Además, la plataforma te permite hacer por tu cuenta, desde la página de tu cuenta:</P>
        <List>
          <li>Ver tu nombre de usuario, tu correo y si consta tu aceptación de los Términos vigentes.</li>
          <li>Cambiar tu contraseña.</li>
          <li>Descargar una copia de tus datos en un archivo JSON (detalle abajo).</li>
          <li>Eliminar tu cuenta.</li>
        </List>
        <P>
          Hoy no hay una opción en la interfaz para cambiar tu correo ni tu nombre de usuario: si
          necesitas corregirlos, escríbenos.
        </P>
        <P>
          <Term>Qué incluye la descarga:</Term> el identificador de tu cuenta, tu correo, las fechas de
          creación de la cuenta, de confirmación del correo y del último inicio de sesión, el método de
          acceso y los datos de registro que guarda Supabase Auth (nombre de usuario y versión de los
          Términos); tu perfil; tu suscripción, si existe, incluidos los campos reservados para un futuro
          proveedor de pagos (hoy vacíos); tu energía; tu progreso completo (incluidos el punto guardado
          de un quiz a medias y las fechas de inicio); tu saldo y tus movimientos de tokens; tus
          aceptaciones de los Términos; y los contadores de uso asociados a tu cuenta.
        </P>
        <P>
          <Term>Qué no incluye:</Term> secretos (el hash de tu contraseña, los tokens de sesión, las
          cookies), los contadores basados en la conexión (no están vinculados a tu cuenta), el código de
          los desafíos (BytePath no lo guarda) y los registros técnicos de Supabase, Judge0 o el
          alojamiento, que BytePath no controla. Si quieres información sobre alguno de ellos, escríbenos.
        </P>
      </>
    ),
  },
  {
    id: "cambios",
    title: "Cambios en esta política",
    content: (
      <P>
        Cada versión de esta política se identifica con un número y una fecha, que figuran al principio
        de esta página. Si cambia qué datos se tratan o con qué proveedores, actualizaremos esta política
        y lo indicaremos en la plataforma.
      </P>
    ),
  },
  {
    id: "normativa",
    title: "Normativa aplicable",
    content: (
      <P>
        Esta política se rige por la legislación de <Owner field="jurisdiction" />, en particular la Ley
        N.º 29733, Ley de Protección de Datos Personales, y su Reglamento, aprobado por el Decreto Supremo
        N.º 016-2024-JUS. Las condiciones de uso de la plataforma están en los{" "}
        <Link href={routes.terms} className={link}>
          Términos y Condiciones
        </Link>
        .
      </P>
    ),
  },
];
