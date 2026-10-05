import { useState } from "react";

const CONFIG_SECTIONS = [
  { id:"conta", label:"Conta", description:"Informações pessoais", icon:"👤" },
  { id:"seguranca", label:"Segurança", description:"Senha e acesso", icon:"🔒" },
  { id:"privacidade", label:"Privacidade", description:"Controle sua visibilidade", icon:"◉" },
  { id:"notificacoes", label:"Notificações", description:"Alertas e mensagens", icon:"🔔" },
  { id:"aparencia", label:"Aparência", description:"Visual do aplicativo", icon:"◐" },
  { id:"preferencias", label:"Preferências", description:"Personalize sua experiência", icon:"⚙" },
];

function Configs({
  onNavigate, tema, onChangeTema, configuracoes, onAlterarConfiguracao,
  preferencias, onAlterarPreferencia, onAlterarSenha, onDeleteAccount, usuario, onLogout, onUpdateUsuario,
}) {
  const [secaoAtiva, setSecaoAtiva] = useState("conta");
  const [salvo, setSalvo] = useState(false);
  const [conta, setConta] = useState({
    nome: usuario?.nome || "João Silva",
    email: usuario?.email || "joao.silva@faesa.br",
    curso: "Ciência da Computação",
    periodo: "4º período",
  });
  const [senha, setSenha] = useState({ atual:"", nova:"", confirmar:"" });
  const [mensagemSenha, setMensagemSenha] = useState("");
  const [doisFatores, setDoisFatores] = useState(() => localStorage.getItem("marketfaesa-2fa") === "true");

  function mostrarSalvo() {
    setSalvo(true);
    window.setTimeout(() => setSalvo(false), 2500);
  }

  function salvarConta() {
    const nome = conta.nome.trim();
    const email = conta.email.trim().toLowerCase();
    if (!nome || !email) return;
    localStorage.setItem("marketfaesa-perfil", JSON.stringify({
      nome, email, curso: conta.curso, periodo: conta.periodo,
      cidade: "Vitória, ES",
      bio: "Estudante de Ciência da Computação interessado em desenvolvimento web, tecnologia e projetos colaborativos.",
    }));
    onUpdateUsuario?.({ nome, email, usuario: email });
    mostrarSalvo();
  }

  function alterarCampoConta(campo, valor) {
    setConta((estado) => ({ ...estado, [campo]: valor }));
  }

  function alterarTema(novoTema) {
    onChangeTema(novoTema);
    mostrarSalvo();
  }

  function alterarConfiguracao(campo) {
    onAlterarConfiguracao(campo);
    mostrarSalvo();
  }

  function alterarPreferencia(campo, valor) {
    onAlterarPreferencia(campo, valor);
    mostrarSalvo();
  }

  function trocarSenha() {
    setMensagemSenha("");
    if (!senha.atual || !senha.nova || !senha.confirmar) {
      setMensagemSenha("Preencha os três campos da senha.");
      return;
    }
    if (senha.nova.length < 6) {
      setMensagemSenha("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (senha.nova !== senha.confirmar) {
      setMensagemSenha("A confirmação da nova senha não confere.");
      return;
    }
    if (!onAlterarSenha?.(senha.atual, senha.nova)) {
      setMensagemSenha("A senha atual está incorreta.");
      return;
    }
    setSenha({ atual:"", nova:"", confirmar:"" });
    setMensagemSenha("✓ Senha alterada com sucesso.");
  }

  function alternarDoisFatores() {
    const novoValor = !doisFatores;
    setDoisFatores(novoValor);
    localStorage.setItem("marketfaesa-2fa", String(novoValor));
    mostrarSalvo();
  }

  function renderizarConteudo() {
    switch (secaoAtiva) {
      case "conta":
        return <section className="configs-content-card animate__animated animate__fadeIn">
          <ConfigHeader eyebrow="CONTA" title="Informações da conta" description="Gerencie suas informações pessoais do MarketFaesa." />
          <div className="configs-form-grid">
            <ConfigField label="Nome completo" value={conta.nome} onChange={(v)=>alterarCampoConta("nome",v)} />
            <ConfigField label="E-mail" value={conta.email} onChange={(v)=>alterarCampoConta("email",v)} type="email" />
            <ConfigField label="Curso" value={conta.curso} onChange={(v)=>alterarCampoConta("curso",v)} />
            <ConfigField label="Período" value={conta.periodo} onChange={(v)=>alterarCampoConta("periodo",v)} />
          </div>
          <div className="configs-inline-save"><button type="button" className="configs-save-button" onClick={salvarConta}>Salvar dados da conta</button></div>
          <ConfigDivider />
          <div className="configs-danger-zone">
            <div><strong>Excluir conta</strong><p>Esta ação remove os dados locais desta conta e encerra sua sessão.</p></div>
            <button type="button" className="configs-danger-button" onClick={()=>{if(window.confirm("Deseja realmente excluir sua conta? Esta ação não pode ser desfeita.")) onDeleteAccount?.();}}>Excluir conta</button>
          </div>
        </section>;

      case "seguranca":
        return <section className="configs-content-card animate__animated animate__fadeIn">
          <ConfigHeader eyebrow="SEGURANÇA" title="Segurança e acesso" description="Mantenha sua conta protegida." />
          <div className="configs-password-box">
            <h3>Alterar senha</h3>
            <div className="configs-password-grid">
              <ConfigField label="Senha atual" value={senha.atual} onChange={(v)=>setSenha(s=>({...s,atual:v}))} type="password" />
              <ConfigField label="Nova senha" value={senha.nova} onChange={(v)=>setSenha(s=>({...s,nova:v}))} type="password" />
              <ConfigField label="Confirmar nova senha" value={senha.confirmar} onChange={(v)=>setSenha(s=>({...s,confirmar:v}))} type="password" />
            </div>
            <button type="button" className="configs-action-primary" onClick={trocarSenha}>Alterar senha</button>
            {mensagemSenha && <p className={"configs-action-message " + (mensagemSenha.startsWith("✓") ? "sucesso" : "")}>{mensagemSenha}</p>}
          </div>
          <ConfigDivider />
          <div className="configs-security-list">
            <ConfigToggle title="Verificação em duas etapas" description="Exige uma segunda confirmação ao acessar a conta. A preferência fica salva neste dispositivo." checked={doisFatores} onChange={alternarDoisFatores} />
            <div className="configs-action-row"><div className="configs-action-icon">📱</div><div className="configs-action-info"><strong>Sessão atual</strong><p>Esta é a sessão ativa neste navegador.</p></div><button type="button" onClick={onLogout}>Sair</button></div>
          </div>
        </section>;

      case "privacidade":
        return <section className="configs-content-card animate__animated animate__fadeIn">
          <ConfigHeader eyebrow="PRIVACIDADE" title="Privacidade" description="Escolha o que outros estudantes podem visualizar." />
          <div className="configs-options">
            <ConfigToggle title="Perfil público" description="Permite que outros estudantes encontrem seu perfil." checked={configuracoes.perfilPublico} onChange={()=>alterarConfiguracao("perfilPublico")} />
            <ConfigToggle title="Exibir e-mail" description="Mostra seu e-mail na página pública do perfil." checked={configuracoes.mostrarEmail} onChange={()=>alterarConfiguracao("mostrarEmail")} />
            <ConfigToggle title="Permitir mensagens" description="Outros estudantes poderão iniciar uma conversa." checked={configuracoes.permitirMensagens} onChange={()=>alterarConfiguracao("permitirMensagens")} />
          </div>
        </section>;

      case "notificacoes":
        return <section className="configs-content-card animate__animated animate__fadeIn">
          <ConfigHeader eyebrow="NOTIFICAÇÕES" title="Notificações" description="Escolha quais atualizações deseja receber." />
          <div className="configs-options">
            <ConfigToggle title="Novas oportunidades" description="Receba avisos sobre oportunidades compatíveis com você." checked={configuracoes.novasOportunidades} onChange={()=>alterarConfiguracao("novasOportunidades")} />
            <ConfigToggle title="Mensagens" description="Seja avisado quando receber uma nova mensagem." checked={configuracoes.mensagens} onChange={()=>alterarConfiguracao("mensagens")} />
            <ConfigToggle title="Novas conexões" description="Receba avisos sobre solicitações e conexões." checked={configuracoes.conexoes} onChange={()=>alterarConfiguracao("conexoes")} />
            <ConfigToggle title="Publicações" description="Receba atualizações relacionadas às suas publicações." checked={configuracoes.publicacoes} onChange={()=>alterarConfiguracao("publicacoes")} />
            <ConfigToggle title="Resumo semanal" description="Receba um resumo semanal das atividades relevantes." checked={configuracoes.resumoSemanal} onChange={()=>alterarConfiguracao("resumoSemanal")} />
          </div>
        </section>;

      case "aparencia":
        return <section className="configs-content-card animate__animated animate__fadeIn">
          <ConfigHeader eyebrow="APARÊNCIA" title="Aparência" description="Personalize a forma como o MarketFaesa é exibido." />
          <div className="configs-theme-grid">
            <button className={"configs-theme-option "+(tema==="light"?"ativo":"")} type="button" onClick={()=>alterarTema("light")} aria-pressed={tema==="light"}><span className="configs-theme-preview light">Aa</span><span>Claro</span><small>{tema==="light"?"Tema atual":"Tema claro"}</small></button>
            <button className={"configs-theme-option "+(tema==="dark"?"ativo":"")} type="button" onClick={()=>alterarTema("dark")} aria-pressed={tema==="dark"}><span className="configs-theme-preview dark">Aa</span><span>Escuro</span><small>{tema==="dark"?"Tema atual":"Tema escuro"}</small></button>
          </div>
        </section>;

      case "preferencias":
        return <section className="configs-content-card animate__animated animate__fadeIn">
          <ConfigHeader eyebrow="PREFERÊNCIAS" title="Preferências" description="Personalize o conteúdo que aparece para você." />
          <div className="configs-select-list">
            <ConfigSelect label="Área principal de interesse" value={preferencias.area} onChange={(v)=>alterarPreferencia("area",v)} options={[["tecnologia","Tecnologia"],["design","Design"],["engenharia","Engenharia"],["saude","Saúde"],["direito","Direito"],["administracao","Administração"]]} />
            <ConfigSelect label="Modalidade preferida" value={preferencias.modalidade} onChange={(v)=>alterarPreferencia("modalidade",v)} options={[["todas","Todas"],["remoto","Remoto"],["presencial","Presencial"],["hibrido","Híbrido"]]} />
            <ConfigSelect label="Frequência dos avisos" value={preferencias.frequencia} onChange={(v)=>alterarPreferencia("frequencia",v)} options={[["imediato","Imediatamente"],["diario","Resumo diário"],["semanal","Resumo semanal"]]} />
          </div>
        </section>;

      default: return null;
    }
  }

  return <main className="configs-page">
    <div className="configs-container">
      <header className="configs-page-header animate__animated animate__fadeInDown">
        <div><span>PREFERÊNCIAS DA CONTA</span><h1>Configurações</h1><p>Gerencie sua conta, privacidade, notificações e preferências do MarketFaesa.</p></div>
        <button type="button" className="configs-back-button" onClick={()=>onNavigate("inicio")}>← Voltar ao início</button>
      </header>
      <div className="configs-layout">
        <aside className="configs-sidebar animate__animated animate__fadeInLeft">
          <span className="configs-sidebar-title">CONFIGURAÇÕES</span>
          <nav>{CONFIG_SECTIONS.map(section=><button type="button" key={section.id} className={"configs-nav-item "+(secaoAtiva===section.id?"ativo":"")} onClick={()=>setSecaoAtiva(section.id)}><span className="configs-nav-icon">{section.icon}</span><span className="configs-nav-text"><strong>{section.label}</strong><small>{section.description}</small></span><span className="configs-nav-arrow">→</span></button>)}</nav>
          <div className="configs-sidebar-help"><span>?</span><div><strong>Precisa de ajuda?</strong><p>Entre em contato com nosso suporte.</p></div></div>
        </aside>
        <div className="configs-main">
          {renderizarConteudo()}
          <div className="configs-save-bar"><div>{salvo?<span className="configs-saved">✓ Alterações salvas</span>:<span>As alterações são salvas automaticamente.</span>}</div><button type="button" className="configs-save-button" onClick={mostrarSalvo}>Salvar alterações</button></div>
        </div>
      </div>
    </div>
  </main>;
}

function ConfigHeader({eyebrow,title,description}) { return <div className="configs-content-header"><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>; }
function ConfigDivider(){return <div className="configs-divider"></div>;}
function ConfigField({label,value,onChange,type="text"}){return <label className="configs-field"><span>{label}</span><input type={type} value={value} onChange={(e)=>onChange?.(e.target.value)} /></label>;}
function ConfigSelect({label,value,onChange,options}){return <label className="configs-select-field"><span>{label}</span><select value={value} onChange={(e)=>onChange(e.target.value)}>{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>;}
function ConfigToggle({title,description,checked,onChange}){return <div className="configs-toggle-row"><div className="configs-toggle-info"><strong>{title}</strong><p>{description}</p></div><button type="button" className={"configs-switch "+(checked?"ativo":"")} onClick={onChange} role="switch" aria-checked={checked}><span></span></button></div>;}

export default Configs;
