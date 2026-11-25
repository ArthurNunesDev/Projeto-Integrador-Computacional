import { useEffect } from "react";

/**
 * Comportamento dos modais: foca o primeiro campo, prende o Tab dentro do modal, fecha com Escape
 * e devolve o foco a quem abriu. fechar deve ser estável (useCallback).
 */
export function useDialogo(modalRef, aberto, fechar) {
  useEffect(() => {
    if (!aberto || !modalRef.current) return undefined;

    const modal = modalRef.current;
    const elementoAnterior = document.activeElement;
    const primeiroCampo = modal.querySelector("form input, form select, form textarea");
    // Consultados a cada Tab: o conteúdo do modal pode mudar depois de aberto (ex.: lista carregada pela API).
    const listarControles = () => Array.from(
      modal.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );

    (primeiroCampo || listarControles()[0])?.focus();

    function tratarTeclado(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        fechar();
        return;
      }

      if (event.key !== "Tab") return;
      const controles = listarControles();
      if (controles.length === 0) return;

      const primeiro = controles[0];
      const ultimo = controles[controles.length - 1];

      if (event.shiftKey && (document.activeElement === primeiro || !modal.contains(document.activeElement))) {
        event.preventDefault();
        ultimo.focus();
      } else if (!event.shiftKey && (document.activeElement === ultimo || !modal.contains(document.activeElement))) {
        event.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", tratarTeclado);

    return () => {
      document.removeEventListener("keydown", tratarTeclado);
      if (elementoAnterior instanceof HTMLElement && elementoAnterior.isConnected) {
        elementoAnterior.focus();
      }
    };
  }, [modalRef, aberto, fechar]);
}
