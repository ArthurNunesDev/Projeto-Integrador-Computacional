import { useMemo, useState } from "react";
import { createDotField } from "../utils/createDotField";

export default function useLoginForm({ onLogin, onNavigate, onRegister }) {
  const [modoCadastro, setModoCadastro] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [nome, setNome] = useState("");
  const [cadastroEmail, setCadastroEmail] = useState("");
  const [cadastroSenha, setCadastroSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarCadastroSenha, setMostrarCadastroSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [erroCadastro, setErroCadastro] = useState("");
  const dotField = useMemo(() => createDotField(), []);

  function abrirCadastro() { setErro(""); setErroCadastro(""); setModoCadastro(true); }
  function voltarLogin() { setErro(""); setErroCadastro(""); setModoCadastro(false); }

  function handleSubmit(event) {
    event.preventDefault(); setErro("");
    if (!usuario.trim() || !senha.trim()) { setErro("Preencha seu usuário e sua senha."); return; }
    onLogin?.({ usuario: usuario.trim(), senha });
  }

  function handleCadastro(event) {
    event.preventDefault(); setErroCadastro("");
    if (!nome.trim() || !cadastroEmail.trim() || !cadastroSenha || !confirmarSenha) { setErroCadastro("Preencha todos os campos."); return; }
    if (cadastroSenha.length < 6) { setErroCadastro("A senha deve ter pelo menos 6 caracteres."); return; }
    if (cadastroSenha !== confirmarSenha) { setErroCadastro("As senhas não coincidem."); return; }
    onRegister?.({ nome: nome.trim(), email: cadastroEmail.trim(), senha: cadastroSenha });
  }

  return { modoCadastro, usuario, setUsuario, senha, setSenha, mostrarSenha, setMostrarSenha, erro, nome, setNome, cadastroEmail, setCadastroEmail, cadastroSenha, setCadastroSenha, confirmarSenha, setConfirmarSenha, mostrarCadastroSenha, setMostrarCadastroSenha, mostrarConfirmarSenha, setMostrarConfirmarSenha, erroCadastro, dotField, abrirCadastro, voltarLogin, handleSubmit, handleCadastro, onNavigate };
}
