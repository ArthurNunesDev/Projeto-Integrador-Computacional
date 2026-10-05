import { useEffect, useRef, useState } from "react";

function Header({ paginaAtual, onNavigate, onLogout }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const [perfilMenuAberto, setPerfilMenuAberto] = useState(false);
  const perfilMenuRef = useRef(null);
  const baseUrl = import.meta.env.BASE_URL;

  useEffect(() => {
    function handleClickOutside(event) {
      if (perfilMenuRef.current && !perfilMenuRef.current.contains(event.target)) {
        setPerfilMenuAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          aria-label={menuAberto ? "Fechar menu principal" : "Abrir menu principal"}
          aria-expanded={menuAberto}
          onClick={() => {
            setMenuAberto((estado) => !estado);
            setPerfilMenuAberto(false);
          }}
        >
          <span className="menu-lines"><span></span><span></span><span></span></span>
        </button>

        <button className="div-market" type="button" onClick={() => navegar("inicio")} aria-label="Ir para o início">
          <img className="market-symbol market-symbol-light" src={`${baseUrl}marketfaesa-symbol.svg`} alt="" />
          <img className="market-symbol market-symbol-dark" src={`${baseUrl}marketfaesa-symbol-dark.svg`} alt="" />
          <span className="market-text">
            <strong>MARKET</strong>
            <span>FAESA</span>
          </span>
        </button>

        <div className="campo">
          <div className="campo-busca-wrapper">
            <span className="campo-busca-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M16 16L21 21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <input type="text" placeholder="Buscar freelas, monitorias, aulas" className="campo-busca" />
          </div>
        </div>

        <div className="div-icons">
          <button className="header-icon-button notification-button" type="button" aria-label="Notificações">
            <span className="notification-icon" aria-hidden="true">♢</span>
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
                setMenuAberto(false);
              }}
            >
              JS
            </button>

            {perfilMenuAberto && (
              <div className="profile-dropdown animate__animated animate__fadeIn">
                <div className="profile-dropdown__user">
                  <div className="profile-dropdown__avatar">JS</div>
                  <div className="profile-dropdown__user-info">
                    <strong>João Silva</strong>
                    <span>Ciência da Computação</span>
                  </div>
                </div>
                <div className="profile-dropdown__divider"></div>

                <button className={`profile-dropdown__item ${paginaAtual === "perfil" ? "ativo" : ""}`} type="button" onClick={() => navegar("perfil")}>
                  <span className="profile-dropdown__icon">◎</span>
                  <span>Meu Perfil</span>
                  <span className="profile-dropdown__arrow">→</span>
                </button>

                <button className={`profile-dropdown__item ${paginaAtual === "configuracoes" ? "ativo" : ""}`} type="button" onClick={() => navegar("configuracoes")}>
                  <span className="profile-dropdown__icon">⚙</span>
                  <span>Configurações</span>
                  <span className="profile-dropdown__arrow">→</span>
                </button>

                <div className="profile-dropdown__divider"></div>

                <button className="profile-dropdown__item" type="button" onClick={onLogout}>
                  <span className="profile-dropdown__icon">↪</span>
                  <span>Sair</span>
                  <span className="profile-dropdown__arrow">→</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav className={`menu-lateral ${menuAberto ? "aberto" : ""}`} aria-hidden={!menuAberto}>
        <div className="menu-header">
          <div className="menu-brand">
            <img className="menu-brand-logo menu-brand-logo-light" src={`${baseUrl}marketfaesa-symbol.svg`} alt="" />
            <img className="menu-brand-logo menu-brand-logo-dark" src={`${baseUrl}marketfaesa-symbol-dark.svg`} alt="" />
            <div><strong>MARKET FAESA</strong><small>Marketplace universitário</small></div>
          </div>
        </div>

        <div className="menu-section">
          <span className="menu-section-title">PRINCIPAL</span>
          <ul className="menu-lista">
            <li><button className={`menu-item ${paginaAtual === "inicio" ? "ativo" : ""}`} type="button" onClick={() => navegar("inicio")}><span className="menu-item-icon">⌂</span><span>Início</span></button></li>
            <li><button className={`menu-item ${paginaAtual === "oportunidades" ? "ativo" : ""}`} type="button" onClick={() => navegar("oportunidades")}><span className="menu-item-icon">□</span><span>Oportunidades</span><span className="menu-badge">12</span></button></li>
            <li><button className={`menu-item ${paginaAtual === "habilidades" ? "ativo" : ""}`} type="button" onClick={() => navegar("habilidades")}><span className="menu-item-icon">✦</span><span>Habilidades</span></button></li>
            <li><button className={`menu-item ${paginaAtual === "conexoes" ? "ativo" : ""}`} type="button" onClick={() => navegar("conexoes")}><span className="menu-item-icon">♡</span><span>Conexões</span></button></li>
            <li><button className={`menu-item ${paginaAtual === "mensagens" ? "ativo" : ""}`} type="button" onClick={() => navegar("mensagens")}><span className="menu-item-icon">□</span><span>Mensagens</span><span className="menu-badge">3</span></button></li>
          </ul>
        </div>

        <div className="menu-section">
          <span className="menu-section-title">MINHA ÁREA</span>
          <ul className="menu-lista">
            <li><button className={`menu-item ${paginaAtual === "salvos" ? "ativo" : ""}`} type="button" onClick={() => navegar("salvos")}><span className="menu-item-icon">♡</span><span>Salvos</span></button></li>
            <li><button className="menu-item" type="button"><span className="menu-item-icon">▤</span><span>Minhas Publicações</span></button></li>
          </ul>
        </div>
      </nav>

      {menuAberto && <div className="overlay" onClick={() => setMenuAberto(false)} aria-hidden="true" />}
    </header>
  );
}

export default Header;