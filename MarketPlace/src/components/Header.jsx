import { useEffect, useRef, useState } from "react";

function Header({ paginaAtual, onNavigate, onLogout }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const [perfilMenuAberto, setPerfilMenuAberto] = useState(false);

  const perfilMenuRef = useRef(null);

  /*
   * Fecha o menu do perfil quando clicar fora dele.
   */
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        perfilMenuRef.current &&
        !perfilMenuRef.current.contains(event.target)
      ) {
        setPerfilMenuAberto(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /*
   * Navegação.
   */
  function navegar(pagina) {
    setPerfilMenuAberto(false);
    setMenuAberto(false);

    onNavigate(pagina);
  }

  return (
    <header className="div-main">
      <div className="header-conteudo">
        <button
          className={`menu-button ${menuAberto ? "ativo" : ""}`}
          type="button"
          aria-label={
            menuAberto ? "Fechar menu principal" : "Abrir menu principal"
          }
          aria-expanded={menuAberto}
          onClick={() => {
            setMenuAberto((estado) => !estado);

            /*
             * Se abrir o menu principal,
             * fecha o menu do perfil.
             */
            setPerfilMenuAberto(false);
          }}
        >
          <span className="menu-lines">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        <button
          className="div-market"
          type="button"
          onClick={() => navegar("inicio")}
          aria-label="Ir para o início"
        >
          <div className="market-logo">M</div>

          <div className="market-text">
            <h1>
              Market<span>Faesa</span>
            </h1>

            <p>MARKETPLACE UNIVERSITÁRIO</p>
          </div>
        </button>

        <div className="campo">
          <div className="campo-busca-wrapper">
            <span className="campo-busca-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle
                  cx="11"
                  cy="11"
                  r="6.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />

                <path
                  d="M16 16L21 21"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>

            <input
              type="text"
              placeholder="Buscar oportunidades, habilidades, estudantes..."
              className="campo-busca"
            />
          </div>
        </div>

        <div className="div-icons">
          {/* NOTIFICAÇÕES */}

          <button
            className="header-icon-button notification-button"
            type="button"
            aria-label="Notificações"
          >
            <img className="sino-svg" src="./Imagens/Sino.svg" alt="" />

            <span className="notification-dot"></span>
          </button>

          <div className="profile-menu-wrapper" ref={perfilMenuRef}>
            <button
              className={`profile-button ${perfilMenuAberto ? "ativo" : ""}`}
              type="button"
              aria-label="Menu do perfil"
              aria-expanded={perfilMenuAberto}
              onClick={() => {
                setPerfilMenuAberto((estado) => !estado);

                /*
                 * Fecha o menu lateral caso esteja aberto.
                 */
                setMenuAberto(false);
              }}
            >
              JS
            </button>

            {perfilMenuAberto && (
              <div className="profile-dropdown">
                <div className="profile-dropdown__user">
                  <div className="profile-dropdown__avatar">JS</div>

                  <div className="profile-dropdown__user-info">
                    <strong>João Silva</strong>

                    <span>Ciência da Computação</span>
                  </div>
                </div>

                <div className="profile-dropdown__divider"></div>

                <button
                  className={`profile-dropdown__item ${
                    paginaAtual === "perfil" ? "ativo" : ""
                  }`}
                  type="button"
                  onClick={() => navegar("perfil")}
                >
                  <span className="profile-dropdown__icon">
                    <svg viewBox="0 0 24 24">
                      <circle
                        cx="12"
                        cy="8"
                        r="3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />

                      <path
                        d="M5 20c.8-3.4 3.2-5 7-5s6.2 1.6 7 5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>

                  <span>Meu Perfil</span>

                  <span className="profile-dropdown__arrow">→</span>
                </button>

                <button
                  className={`profile-dropdown__item ${
                    paginaAtual === "configuracoes" ? "ativo" : ""
                  }`}
                  type="button"
                  onClick={() => navegar("configuracoes")}
                >
                  <span className="profile-dropdown__icon">
                    <svg viewBox="0 0 24 24">
                      <path
                        d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />

                      <path
                        d="M19 13.5v-3l-2-.6a7.3 7.3 0 0 0-.8-1.4l.9-1.9-2.1-2.1-1.9.9a7.3 7.3 0 0 0-1.6-.7L11 3H9l-.5 2a7.3 7.3 0 0 0-1.6.7L5 4.5 2.9 6.6l.9 1.9A7.3 7.3 0 0 0 3 10.1l-2 .5v3l2 .5c.2.5.4 1 .8 1.4l-.9 1.9L5 19.5l1.9-.9c.5.3 1 .5 1.6.7l.5 2h3l.5-2c.6-.2 1.1-.4 1.6-.7l1.9.9 2.1-2.1-.9-1.9c.3-.5.6-.9.8-1.4l2-.6Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>

                  <span>Configurações</span>

                  <span className="profile-dropdown__arrow">→</span>
                </button>

                <div className="profile-dropdown__divider"></div>

                <button
                  className="profile-dropdown__item"
                  type="button"
                  onClick={() => {
                    setPerfilMenuAberto(false);
                    setMenuAberto(false);
                    onLogout();
                  }}
                >
                  <span className="profile-dropdown__icon">
                    <svg viewBox="0 0 24 24">
                      <path
                        d="M10 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4M14 8l4 4-4 4M18 12H9"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>

                  <span>Sair</span>

                  <span className="profile-dropdown__arrow">→</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav
        className={`menu-lateral ${menuAberto ? "aberto" : ""}`}
        aria-hidden={!menuAberto}
      >
        <div className="menu-header">
          <div className="menu-brand">
            <div className="menu-brand-logo">M</div>

            <div>
              <strong>MarketFaesa</strong>

              <small>Marketplace universitário</small>
            </div>
          </div>
        </div>

        <div className="menu-section">
          <span className="menu-section-title">PRINCIPAL</span>

          <ul className="menu-lista">
            <li>
              <button
                className={`menu-item ${
                  paginaAtual === "inicio" ? "ativo" : ""
                }`}
                type="button"
                onClick={() => navegar("inicio")}
              >
                <span className="menu-item-icon">🏠</span>

                <span>Início</span>
              </button>
            </li>

            <li>
              <button className="menu-item" type="button">
                <span className="menu-item-icon">▣</span>

                <span>Oportunidades</span>

                <span className="menu-badge">12</span>
              </button>
            </li>

            <li>
              <button className="menu-item" type="button">
                <span className="menu-item-icon">💡</span>

                <span>Habilidades</span>
              </button>
            </li>

            <li>
              <button className="menu-item" type="button">
                <span className="menu-item-icon">♡</span>

                <span>Conexões</span>
              </button>
            </li>

            <li>
              <button className="menu-item" type="button">
                <span className="menu-item-icon">□</span>

                <span>Mensagens</span>

                <span className="menu-badge">3</span>
              </button>
            </li>
          </ul>
        </div>

        <div className="menu-section">
          <span className="menu-section-title">MINHA ÁREA</span>

          <ul className="menu-lista">
            <li>
              <button className="menu-item" type="button">
                <span className="menu-item-icon">♡</span>

                <span>Salvos</span>
              </button>
            </li>

            <li>
              <button className="menu-item" type="button">
                <span className="menu-item-icon">▤</span>

                <span>Minhas Publicações</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {menuAberto && (
        <div
          className="overlay"
          onClick={() => setMenuAberto(false)}
          aria-hidden="true"
        />
      )}
    </header>
  );
}

export default Header;
