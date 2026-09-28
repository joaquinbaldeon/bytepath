import { type FormEvent, startTransition, useCallback, useEffect, useRef } from "react";

/**
 * Envía un formulario de cuenta sin que React lo vacíe.
 *
 * Con `<form action={…}>`, React 19 resetea el formulario tras cada envío: un
 * error de login borraba el correo, y uno de registro borraba todo (y dejaba
 * las casillas desmarcadas en pantalla pero marcadas en el estado). Aquí el
 * envío se intercepta y se llama a la MISMA acción dentro de una transición,
 * que no resetea nada. La acción, sus comprobaciones en el servidor y sus
 * mensajes no cambian.
 *
 * El formulario conserva `action={formAction}`: sin JavaScript sigue enviándose
 * de forma nativa, como antes.
 *
 * Tras un error, SOLO se vacían los campos de contraseña (por seguridad, que no
 * se queden escritos en pantalla); el resto se conserva para corregirlo.
 */
export function useSubmitKeepingValues(dispatch: (formData: FormData) => void, error: string | null) {
  const formRef = useRef<HTMLFormElement>(null);

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      startTransition(() => dispatch(formData));
    },
    [dispatch],
  );

  useEffect(() => {
    if (!error || !formRef.current) return;
    for (const input of formRef.current.querySelectorAll<HTMLInputElement>('input[type="password"]')) {
      input.value = "";
    }
  }, [error]);

  return { formRef, onSubmit };
}
