import { useState } from "react";
import "./Login.css";

// Mesmos limites da API (CadastroRequisicao): 8 a 72 caracteres, até 72 bytes em UTF-8.
const SENHA_MINIMA = 8;
const SENHA_MAXIMA = 72;

function tamanhoEmBytes(texto) {
  return new TextEncoder().encode(texto).length;
}

function ErroCampo({ id, mensagem }) {
  if (!mensagem) return null;
  return (
    <span id={id} className="login-field-error">
      {mensagem}
    </span>
  );
}

function CampoSenha({ id, label, value, onChange, placeholder, autoComplete, erro }) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div className="login-field">
      <label htmlFor={id}>{label}</label>
      <div className="login-input-wrapper">
        <input
          id={id}
          type={visivel ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? `${id}-erro` : undefined}
        />
        <button
          type="button"
          className="login-password-toggle"
          onClick={() => setVisivel((estado) => !estado)}
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visivel}
        >
          {visivel ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      <ErroCampo id={`${id}-erro`} mensagem={erro} />
    </div>
  );
}

function Marca() {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <div className="login-brand">
      <img className="login-logo" src={`${baseUrl}marketfaesa-symbol.svg`} alt="" />
      <h1>
        MARKET<span>FAESA</span>
      </h1>
    </div>
  );
}

function Login({ onLogin, onNavigate, onRegister, aviso }) {
  const [modoCadastro, setModoCadastro] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const [nome, setNome] = useState("");
  const [cadastroEmail, setCadastroEmail] = useState("");
  const [cadastroSenha, setCadastroSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erroCadastro, setErroCadastro] = useState("");
  const [errosCampos, setErrosCampos] = useState({});

  function alternarModo(cadastro) {
    setErro("");
    setErroCadastro("");
    setErrosCampos({});
    setModoCadastro(cadastro);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");

    if (!email.trim() || !senha.trim()) {
      setErro("Preencha seu e-mail e sua senha.");
      return;
    }

    setEnviando(true);
    const resultado = await onLogin?.({ email: email.trim(), senha });

    // Com sucesso o App troca de tela e este componente sai.
    if (!resultado?.sucesso) {
      setEnviando(false);
      setErro(resultado?.mensagem || "Não foi possível entrar.");
    }
  }

  async function handleCadastro(event) {
    event.preventDefault();
    setErroCadastro("");
    setErrosCampos({});

    if (
      !nome.trim() ||
      !cadastroEmail.trim() ||
      !cadastroSenha ||
      !confirmarSenha
    ) {
      setErroCadastro("Preencha todos os campos.");
      return;
    }

    if (cadastroSenha.length < SENHA_MINIMA) {
      setErroCadastro(`A senha deve ter pelo menos ${SENHA_MINIMA} caracteres.`);
      return;
    }

    if (tamanhoEmBytes(cadastroSenha) > SENHA_MAXIMA) {
      setErroCadastro(`A senha deve ter no máximo ${SENHA_MAXIMA} caracteres.`);
      return;
    }

    if (cadastroSenha !== confirmarSenha) {
      setErroCadastro("As senhas não coincidem.");
      return;
    }

    setEnviando(true);
    const resultado = await onRegister?.({
      nome: nome.trim(),
      email: cadastroEmail.trim(),
      senha: cadastroSenha,
    });

    if (resultado?.sucesso) return;
    setEnviando(false);

    if (!resultado) {
      setErroCadastro("Não foi possível processar o cadastro.");
      return;
    }

    // Conta criada mas o login automático falhou: volta para a tela de entrar.
    if (resultado.contaCriada) {
      alternarModo(false);
      setEmail(cadastroEmail.trim());
      setErro(resultado.mensagem);
      return;
    }

    setErrosCampos(resultado.campos || {});
    setErroCadastro(resultado.mensagem || "Não foi possível criar a conta.");
  }

  if (modoCadastro) {
    return (
      <main className="login-page">
        <div className="login-card">
          <Marca />
          <h2>Crie sua conta</h2>

          <form className="login-form" onSubmit={handleCadastro}>
            <div className="login-field">
              <label htmlFor="cadastro-nome">Nome</label>
              <input
                id="cadastro-nome"
                type="text"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Seu nome completo"
                autoComplete="name"
                aria-invalid={errosCampos.nome ? true : undefined}
                aria-describedby={errosCampos.nome ? "cadastro-nome-erro" : undefined}
              />
              <ErroCampo id="cadastro-nome-erro" mensagem={errosCampos.nome} />
            </div>

            <div className="login-field">
              <label htmlFor="cadastro-email">E-mail</label>
              <input
                id="cadastro-email"
                type="email"
                value={cadastroEmail}
                onChange={(event) => setCadastroEmail(event.target.value)}
                placeholder="seu.email@faesa.br"
                autoComplete="email"
                aria-invalid={errosCampos.email ? true : undefined}
                aria-describedby={errosCampos.email ? "cadastro-email-erro" : undefined}
              />
              <ErroCampo id="cadastro-email-erro" mensagem={errosCampos.email} />
            </div>

            <CampoSenha
              id="cadastro-senha"
              label="Senha"
              value={cadastroSenha}
              onChange={setCadastroSenha}
              placeholder={`Crie uma senha (mínimo ${SENHA_MINIMA} caracteres)`}
              autoComplete="new-password"
              erro={errosCampos.senha}
            />

            <CampoSenha
              id="cadastro-confirmar"
              label="Confirmar senha"
              value={confirmarSenha}
              onChange={setConfirmarSenha}
              placeholder="Repita sua senha"
              autoComplete="new-password"
            />

            {erroCadastro && (
              <div className="login-error" role="alert">
                {erroCadastro}
              </div>
            )}

            <button type="submit" className="login-submit" disabled={enviando}>
              {enviando ? "Cadastrando..." : "Cadastrar"}
            </button>
          </form>

          <p className="login-switch">
            Já possui uma conta?{" "}
            <button type="button" onClick={() => alternarModo(false)}>
              Entrar
            </button>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <Marca />
        <h2>Entrar</h2>

        <form className="login-form" onSubmit={handleSubmit}>
          {aviso && !erro && (
            <div className="login-error" role="status">
              {aviso}
            </div>
          )}

          <div className="login-field">
            <label htmlFor="login-email">E-mail</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu.email@faesa.br"
              autoComplete="email"
            />
          </div>

          <CampoSenha
            id="login-senha"
            label="Senha"
            value={senha}
            onChange={setSenha}
            placeholder="Digite sua senha"
            autoComplete="current-password"
          />

          <button
            type="button"
            className="login-link login-forgot"
            onClick={() => onNavigate?.("recuperar-senha")}
          >
            Esqueceu a senha?
          </button>

          {erro && (
            <div className="login-error" role="alert">
              {erro}
            </div>
          )}

          <button type="submit" className="login-submit" disabled={enviando}>
            {enviando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="login-switch">
          Ainda não possui uma conta?{" "}
          <button type="button" onClick={() => alternarModo(true)}>
            Criar conta
          </button>
        </p>
      </div>
    </main>
  );
}

export default Login;
