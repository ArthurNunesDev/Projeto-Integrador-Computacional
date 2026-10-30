import { useState } from "react";
import { listarCursos } from "../api/catalogos.js";
import { alterarSenha, excluirConta } from "../api/usuarios.js";
import { formatarPeriodo } from "../perfil.js";
import { PERIODOS } from "../rotulos.js";
import { chaveUsuario, lerValorSeguro, salvarValorSeguro } from "../storage.js";
import { mensagemDoErro, useCarregar } from "../useCarregar.js";

const SENHA_VAZIA = { senhaAtual: "", novaSenha: "", confirmar: "" };

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
  erroConfiguracoes, configuracoesCarregadas = true, erroCarregarConfiguracoes = "", onRecarregarConfiguracoes,
  preferencias, onAlterarPreferencia, usuario, onLogout, onUpdateUsuario, onContaExcluida,
}) {
  // Opções salvas na API ficam travadas até o GET de configurações terminar.
  const bloqueado = !configuracoesCarregadas;
  const [secaoAtiva, setSecaoAtiva] = useState("conta");
  const [salvo, setSalvo] = useState(false);
  const [erroAcao, setErroAcao] = useState("");
  const [conta, setConta] = useState({
    nome: usuario?.nome || "",
    email: usuario?.email || "",
    cursoId: String(usuario?.cursoId ?? ""),
    periodo: String(usuario?.periodoNumero ?? ""),
  });
  const { dados: cursos } = useCarregar(listarCursos, []);
  const [senha, setSenha] = useState(SENHA_VAZIA);
  const [mensagemSenha, setMensagemSenha] = useState({ erro: "", sucesso: "" });
  const [senhaExclusao, setSenhaExclusao] = useState("");
  const [erroExclusao, setErroExclusao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [doisFatores, setDoisFatores] = useState(() => lerValorSeguro(chaveUsuario("marketfaesa-2fa", usuario?.id)) === "true");

  function mostrarSalvo() {
    setErroAcao("");
    setSalvo(true);
    window.setTimeout(() => setSalvo(false), 2500);
  }

  function registrarResultado(resultado, mensagem) {
    if (resultado === false) {
      setSalvo(false);
      setErroAcao(mensagem || "Não foi possível salvar as alterações. Tente novamente.");
      return false;
    }
    mostrarSalvo();
    return true;
  }

  async function salvarConta() {
    const nome = conta.nome.trim();
    if (!nome) {
      setSalvo(false);
      setErroAcao("Informe seu nome completo antes de salvar.");
      return;
    }
    const resultado = await onUpdateUsuario?.({
      nome,
      cursoId: conta.cursoId ? Number(conta.cursoId) : null,
      periodo: conta.periodo ? Number(conta.periodo) : null,
    });
    registrarResultado(resultado?.sucesso === true, resultado?.mensagem);
  }

  async function trocarSenha() {
    const { senhaAtual, novaSenha, confirmar } = senha;
    let erro = "";
    if (!senhaAtual || !novaSenha) erro = "Preencha a senha atual e a nova senha.";
    else if (novaSenha.length < 8 || novaSenha.length > 72) erro = "A nova senha deve ter de 8 a 72 caracteres.";
    else if (novaSenha !== confirmar) erro = "A confirmação não confere com a nova senha.";
    if (erro) {
      setMensagemSenha({ erro, sucesso: "" });
      return;
    }

    setEnviando(true);
    try {
      await alterarSenha({ senhaAtual, novaSenha });
      setSenha(SENHA_VAZIA);
      setMensagemSenha({ erro: "", sucesso: "Senha alterada." });
    } catch (e) {
      const campo = e?.campos?.senhaAtual ? `Senha atual: ${e.campos.senhaAtual}.` : e?.campos?.novaSenha ? `Nova senha: ${e.campos.novaSenha}.` : "";
      setMensagemSenha({ erro: campo || mensagemDoErro(e), sucesso: "" });
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarExclusao() {
    if (!senhaExclusao) {
      setErroExclusao("Digite sua senha para confirmar a exclusão.");
      return;
    }
    setEnviando(true);
    try {
      await excluirConta(senhaExclusao);
    } catch (e) {
      setErroExclusao(e?.campos?.senha ? `Senha: ${e.campos.senha}.` : mensagemDoErro(e));
      setEnviando(false);
      return;
    }
    onContaExcluida?.();
  }

  function alterarCampoConta(campo, valor) {
    setConta((estado) => ({ ...estado, [campo]: valor }));
  }

  function alterarTema(novoTema) {
    if (bloqueado) return;
    registrarResultado(onChangeTema(novoTema));
  }

  function alterarConfiguracao(campo) {
    if (bloqueado) return;
    registrarResultado(onAlterarConfiguracao(campo));
  }

  function alterarPreferencia(campo, valor) {
    registrarResultado(onAlterarPreferencia(campo, valor));
  }

  function alternarDoisFatores() {
    const novoValor = !doisFatores;
    const sucesso = salvarValorSeguro(chaveUsuario("marketfaesa-2fa", usuario?.id), String(novoValor));
    if (!sucesso) {
      registrarResultado(false);
      return;
    }
    setDoisFatores(novoValor);
    registrarResultado(true);
  }

  const avisoCarregamento = erroCarregarConfiguracoes ? (
    <div className="configs-load-status" role="alert">
      <span className="configs-action-message">{erroCarregarConfiguracoes}</span>
      <button type="button" className="configs-action-primary" onClick={onRecarregarConfiguracoes}>Tentar novamente</button>
    </div>
  ) : bloqueado ? (
    <p className="configs-load-status" role="status">Carregando suas configurações...</p>
  ) : null;

  function renderizarConteudo() {
    switch (secaoAtiva) {
      case "conta":
        return <section className="configs-content-card animate__animated animate__fadeIn">
          <ConfigHeader eyebrow="CONTA" title="Informações da conta" description="Gerencie suas informações pessoais do MarketFaesa." />
          <div className="configs-form-grid">
            <ConfigField label="Nome completo" value={conta.nome} onChange={(v)=>alterarCampoConta("nome",v)} />
            <ConfigField label="E-mail" value={conta.email} type="email" readOnly />
            <ConfigSelect label="Curso" value={conta.cursoId} onChange={(v)=>alterarCampoConta("cursoId",v)} options={[["","Curso não informado"],...cursos.map((curso)=>[String(curso.id),curso.nome])]} />
            <ConfigSelect label="Período" value={conta.periodo} onChange={(v)=>alterarCampoConta("periodo",v)} options={[["","Não informado"],...PERIODOS.map((p)=>[String(p),formatarPeriodo(p)])]} />
          </div>
          <div className="configs-inline-save"><button type="button" className="configs-save-button" onClick={salvarConta}>Salvar dados da conta</button></div>
          <ConfigDivider />
          <div className="configs-danger-zone">
            <div><strong>Excluir conta</strong><p>Apaga sua conta e todos os seus dados. Essa ação não pode ser desfeita.</p></div>
            <ConfigField label="Confirme sua senha" value={senhaExclusao} type="password" onChange={(v)=>{setSenhaExclusao(v);setErroExclusao("");}} />
            <button type="button" className="configs-danger-button" onClick={confirmarExclusao} disabled={enviando}>Excluir conta</button>
            {erroExclusao && <p className="configs-action-message" role="alert">{erroExclusao}</p>}
          </div>
        </section>;

      case "seguranca":
        return <section className="configs-content-card animate__animated animate__fadeIn">
          <ConfigHeader eyebrow="SEGURANÇA" title="Segurança e acesso" description="Mantenha sua conta protegida." />
          <div className="configs-password-box">
            <h3>Alterar senha</h3>
            <div className="configs-password-grid">
              <ConfigField label="Senha atual" value={senha.senhaAtual} type="password" onChange={(v)=>setSenha((s)=>({...s,senhaAtual:v}))} />
              <ConfigField label="Nova senha" value={senha.novaSenha} type="password" onChange={(v)=>setSenha((s)=>({...s,novaSenha:v}))} />
              <ConfigField label="Confirmar nova senha" value={senha.confirmar} type="password" onChange={(v)=>setSenha((s)=>({...s,confirmar:v}))} />
            </div>
            <button type="button" className="configs-action-primary" onClick={trocarSenha} disabled={enviando}>Alterar senha</button>
            {mensagemSenha.erro && <p className="configs-action-message" role="alert">{mensagemSenha.erro}</p>}
            {mensagemSenha.sucesso && <p className="configs-saved" role="status">✓ {mensagemSenha.sucesso}</p>}
          </div>
          <ConfigDivider />
          <div className="configs-security-list">
            <ConfigToggle title="Verificação em duas etapas (demonstrativa)" description="Ainda não protege o login: a API não oferece autenticação em duas etapas. Esta opção apenas registra uma preferência neste dispositivo." checked={doisFatores} onChange={alternarDoisFatores} />
            <div className="configs-action-row"><div className="configs-action-icon">📱</div><div className="configs-action-info"><strong>Sessão atual</strong><p>Esta é a sessão ativa neste navegador.</p></div><button type="button" onClick={onLogout}>Sair</button></div>
          </div>
        </section>;

      case "privacidade":
        return <section className="configs-content-card animate__animated animate__fadeIn">
          <ConfigHeader eyebrow="PRIVACIDADE" title="Privacidade" description="Escolha o que outros estudantes podem visualizar." />
          {avisoCarregamento}
          <div className="configs-options">
            <ConfigToggle title="Perfil público" description="Permite que outros estudantes encontrem seu perfil." checked={configuracoes.perfilPublico} onChange={()=>alterarConfiguracao("perfilPublico")} disabled={bloqueado} />
            <ConfigToggle title="Exibir e-mail" description="Mostra seu e-mail na página pública do perfil." checked={configuracoes.mostrarEmail} onChange={()=>alterarConfiguracao("mostrarEmail")} disabled={bloqueado} />
            <ConfigToggle title="Permitir mensagens" description="Outros estudantes poderão iniciar uma conversa." checked={configuracoes.permitirMensagens} onChange={()=>alterarConfiguracao("permitirMensagens")} disabled={bloqueado} />
          </div>
        </section>;

      case "notificacoes":
        return <section className="configs-content-card animate__animated animate__fadeIn">
          <ConfigHeader eyebrow="NOTIFICAÇÕES" title="Notificações" description="Escolha quais atualizações deseja receber." />
          {avisoCarregamento}
          <div className="configs-options">
            <ConfigToggle title="Novas oportunidades" description="Receba avisos sobre oportunidades compatíveis com você." checked={configuracoes.novasOportunidades} onChange={()=>alterarConfiguracao("novasOportunidades")} disabled={bloqueado} />
            <ConfigToggle title="Mensagens" description="Seja avisado quando receber uma nova mensagem." checked={configuracoes.mensagens} onChange={()=>alterarConfiguracao("mensagens")} disabled={bloqueado} />
            <ConfigToggle title="Novas conexões" description="Receba avisos sobre solicitações e conexões." checked={configuracoes.conexoes} onChange={()=>alterarConfiguracao("conexoes")} disabled={bloqueado} />
            <ConfigToggle title="Publicações" description="Receba atualizações relacionadas às suas publicações." checked={configuracoes.publicacoes} onChange={()=>alterarConfiguracao("publicacoes")} disabled={bloqueado} />
            <ConfigToggle title="Resumo semanal" description="Receba um resumo semanal das atividades relevantes." checked={configuracoes.resumoSemanal} onChange={()=>alterarConfiguracao("resumoSemanal")} disabled={bloqueado} />
          </div>
        </section>;

      case "aparencia":
        return <section className="configs-content-card animate__animated animate__fadeIn">
          <ConfigHeader eyebrow="APARÊNCIA" title="Aparência" description="Personalize a forma como o MarketFaesa é exibido." />
          {avisoCarregamento}
          <div className="configs-theme-grid">
            <button className={"configs-theme-option "+(tema==="light"?"ativo":"")} type="button" onClick={()=>alterarTema("light")} aria-pressed={tema==="light"} disabled={bloqueado}><span className="configs-theme-preview light">Aa</span><span>Claro</span><small>{tema==="light"?"Tema atual":"Tema claro"}</small></button>
            <button className={"configs-theme-option "+(tema==="dark"?"ativo":"")} type="button" onClick={()=>alterarTema("dark")} aria-pressed={tema==="dark"} disabled={bloqueado}><span className="configs-theme-preview dark">Aa</span><span>Escuro</span><small>{tema==="dark"?"Tema atual":"Tema escuro"}</small></button>
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
        <button type="button" className="page-back-button configs-back-button" onClick={()=>onNavigate("inicio")}>← Voltar ao início</button>
      </header>
      <div className="configs-layout">
        <aside className="configs-sidebar animate__animated animate__fadeInLeft">
          <span className="configs-sidebar-title">CONFIGURAÇÕES</span>
          <nav>{CONFIG_SECTIONS.map(section=><button type="button" key={section.id} className={"configs-nav-item "+(secaoAtiva===section.id?"ativo":"")} onClick={()=>setSecaoAtiva(section.id)}><span className="configs-nav-icon">{section.icon}</span><span className="configs-nav-text"><strong>{section.label}</strong><small>{section.description}</small></span><span className="configs-nav-arrow">→</span></button>)}</nav>
          <div className="configs-sidebar-help"><span>?</span><div><strong>Precisa de ajuda?</strong><p>Entre em contato com nosso suporte.</p></div></div>
        </aside>
        <div className="configs-main">
          {renderizarConteudo()}
          <div className="configs-save-bar"><div>{erroAcao || erroConfiguracoes ? <span className="configs-action-message" role="alert">{erroAcao || erroConfiguracoes}</span> : salvo ? <span className="configs-saved" role="status">✓ Alterações salvas</span> : <span>As alterações são salvas automaticamente.</span>}</div><span className="configs-auto-save-note">Salvamento automático</span></div>
        </div>
      </div>
    </div>
  </main>;
}

function ConfigHeader({eyebrow,title,description}) { return <div className="configs-content-header"><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>; }
function ConfigDivider(){return <div className="configs-divider"></div>;}
function ConfigField({label,value,onChange,type="text",readOnly=false,disabled=false}){return <label className="configs-field"><span>{label}</span><input type={type} value={value} onChange={(e)=>onChange?.(e.target.value)} readOnly={readOnly||!onChange} disabled={disabled} /></label>;}
function ConfigSelect({label,value,onChange,options}){return <label className="configs-select-field"><span>{label}</span><select value={value} onChange={(e)=>onChange(e.target.value)}>{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>;}
function ConfigToggle({title,description,checked,onChange,disabled=false}){return <div className="configs-toggle-row"><div className="configs-toggle-info"><strong>{title}</strong><p>{description}</p></div><button type="button" className={"configs-switch "+(checked?"ativo":"")} onClick={onChange} role="switch" aria-checked={checked} aria-label={title} disabled={disabled}><span></span></button></div>;}

export default Configs;
