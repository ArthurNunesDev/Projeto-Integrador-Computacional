import { useState } from "react";
import "./Login.css";

function CampoSenha({ id, label, value, onChange, placeholder, autoComplete }) {
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

function Login({ onLogin, onNavigate, onRegister }) {
  const [modoCadastro, setModoCadastro] = useState(false);

  const [usuario, setUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const [nome, setNome] = useState("");
  const [cadastroEmail, setCadastroEmail] = useState("");
  const [cadastroSenha, setCadastroSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erroCadastro, setErroCadastro] = useState("");

  function alternarModo(cadastro) {
    setErro("");
    setErroCadastro("");
    setModoCadastro(cadastro);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setErro("");

    if (!usuario.trim() || !email.trim() || !senha.trim()) {
      setErro("Preencha seu usuário, e-mail e senha.");
      return;
    }

    const resultado = onLogin?.({ usuario: usuario.trim(), email: email.trim(), senha });

    if (resultado && !resultado.sucesso) {
      setErro(resultado.mensagem || "Não foi possível entrar.");
    }
  }

  function handleCadastro(event) {
    event.preventDefault();
    setErroCadastro("");

    if (
      !nome.trim() ||
      !cadastroEmail.trim() ||
      !cadastroSenha ||
      !confirmarSenha
    ) {
      setErroCadastro("Preencha todos os campos.");
      return;
    }

    if (cadastroSenha.length < 6) {
      setErroCadastro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (cadastroSenha !== confirmarSenha) {
      setErroCadastro("As senhas não coincidem.");
      return;
    }

    const resultado = onRegister?.({
      nome: nome.trim(),
      email: cadastroEmail.trim(),
      senha: cadastroSenha,
    });

    if (!resultado) {
      setErroCadastro("Não foi possível processar o cadastro.");
      return;
    }

    if (!resultado.sucesso) {
      setErroCadastro(resultado.mensagem || "Não foi possível criar a conta.");
    }
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
              />
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
              />
            </div>

            <CampoSenha
              id="cadastro-senha"
              label="Senha"
              value={cadastroSenha}
              onChange={setCadastroSenha}
              placeholder="Crie uma senha"
              autoComplete="new-password"
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

            <button type="submit" className="login-submit">
              Cadastrar
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
          <div className="login-field">
            <label htmlFor="login-usuario">Usuário</label>
            <input
              id="login-usuario"
              type="text"
              value={usuario}
              onChange={(event) => setUsuario(event.target.value)}
              placeholder="seu usuário"
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-usuario">Usuário / E-mail</label>
            <input
              id="login-usuario"
              type="text"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="usuário ou seu.email@faesa.br"
              autoComplete="username"
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

          <button type="submit" className="login-submit">
            Entrar
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
