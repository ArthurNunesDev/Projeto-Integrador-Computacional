function Footer({ onNavigate }) {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <button className="site-footer-logo" type="button" onClick={() => onNavigate?.("inicio")} aria-label="Voltar para o início">
            <img src={`${baseUrl}marketfaesa-symbol.svg`} alt="" className="site-footer-logo-light" />
            <img src={`${baseUrl}marketfaesa-symbol-dark.svg`} alt="" className="site-footer-logo-dark" />
          </button>
          <div>
            <strong>MARKETFAESA</strong>
            <p>Conectando estudantes, habilidades e oportunidades.</p>
          </div>
        </div>

        <div className="site-footer-links">
          <div className="site-footer-column">
            <h3>Explorar</h3>
            <button type="button" onClick={() => onNavigate?.("inicio")}>Início</button>
            <button type="button" onClick={() => onNavigate?.("oportunidades")}>Oportunidades</button>
            <button type="button" onClick={() => onNavigate?.("habilidades")}>Habilidades</button>
          </div>

          <div className="site-footer-column">
            <h3>Minha conta</h3>
            <button type="button" onClick={() => onNavigate?.("conexoes")}>Conexões</button>
            <button type="button" onClick={() => onNavigate?.("mensagens")}>Mensagens</button>
            <button type="button" onClick={() => onNavigate?.("publicacoes")}>Minhas Publicações</button>
          </div>

          <div className="site-footer-column">
            <h3>Plataforma</h3>
            <button type="button" onClick={() => onNavigate?.("salvos")}>Salvos</button>
            <button type="button" onClick={() => onNavigate?.("perfil")}>Meu perfil</button>
            <button type="button" onClick={() => onNavigate?.("configuracoes")}>Configurações</button>
          </div>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>© 2026 MarketFAESA. Todos os direitos reservados.</span>
        <span>Feito para conectar talentos e oportunidades.</span>
      </div>
    </footer>
  );
}

export default Footer;
