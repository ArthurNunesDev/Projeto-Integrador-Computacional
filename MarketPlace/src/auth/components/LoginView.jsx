import Stikers from "../../pets/Stickers";

export default function LoginView(props) {
  const {
    modoCadastro,
    usuario,
    setUsuario,
    senha,
    setSenha,
    mostrarSenha,
    setMostrarSenha,
    erro,
    nome,
    setNome,
    cadastroEmail,
    setCadastroEmail,
    cadastroSenha,
    setCadastroSenha,
    confirmarSenha,
    setConfirmarSenha,
    mostrarCadastroSenha,
    setMostrarCadastroSenha,
    mostrarConfirmarSenha,
    setMostrarConfirmarSenha,
    erroCadastro,
    dotField,
    abrirCadastro,
    voltarLogin,
    handleSubmit,
    handleCadastro,
    onNavigate,
    particleLayerRef,
    colorTakeoverRef,
  } = props;

  return (
    <main className="login-page">
      <Stikers />
      <div className="login-background">
        <div className="login-glow login-glow-one"></div>
        <div className="login-glow login-glow-two"></div>

        <div className="login-svg-motion" aria-hidden="true">
          <svg className="motion-orbit motion-orbit-one" viewBox="0 0 900 700">
            <defs>
              <path
                id="login-motion-path-one"
                d="M90 350 C140 90 390 40 620 120 C850 200 850 500 610 590 C370 680 140 610 90 350Z"
              />
            </defs>

            <use href="#login-motion-path-one" className="motion-path" />

            <g className="motion-object">
              <circle
                cx="0"
                cy="0"
                r="8"
                className="motion-dot motion-dot-purple"
              />
              <circle
                cx="0"
                cy="0"
                r="18"
                className="motion-halo motion-halo-purple"
              />
              <animateMotion
                dur="13s"
                begin="0s"
                repeatCount="indefinite"
                rotate="auto"
              >
                <mpath href="#login-motion-path-one" />
              </animateMotion>
            </g>

            <g className="motion-object">
              <path d="M0 -11 L8 0 L0 11 L-8 0 Z" className="motion-diamond" />
              <animateMotion
                dur="18s"
                begin="-5s"
                repeatCount="indefinite"
                rotate="auto"
              >
                <mpath href="#login-motion-path-one" />
              </animateMotion>
            </g>
          </svg>

          <svg className="motion-orbit motion-orbit-two" viewBox="0 0 900 700">
            <defs>
              <path
                id="login-motion-path-two"
                d="M130 520 C250 650 510 650 690 490 C830 365 790 150 620 95 C420 30 170 150 130 350 C115 420 115 470 130 520Z"
              />
            </defs>

            <use href="#login-motion-path-two" className="motion-path" />

            <g className="motion-object">
              <circle
                cx="0"
                cy="0"
                r="6"
                className="motion-dot motion-dot-gold"
              />
              <circle
                cx="0"
                cy="0"
                r="14"
                className="motion-halo motion-halo-gold"
              />
              <animateMotion
                dur="16s"
                begin="-7s"
                repeatCount="indefinite"
                rotate="auto"
              >
                <mpath href="#login-motion-path-two" />
              </animateMotion>
            </g>

            <g className="motion-object">
              <circle
                cx="0"
                cy="0"
                r="4"
                className="motion-dot motion-dot-white"
              />
              <animateMotion
                dur="10s"
                begin="-2s"
                repeatCount="indefinite"
                rotate="auto"
              >
                <mpath href="#login-motion-path-two" />
              </animateMotion>
            </g>
          </svg>

          <svg className="motion-particles" viewBox="0 0 1000 760">
            <g className="motion-particle particle-one">
              <circle cx="130" cy="150" r="3" />
              <circle cx="130" cy="150" r="12" className="particle-glow" />
            </g>

            <g className="motion-particle particle-two">
              <circle cx="820" cy="185" r="2.5" />
              <circle cx="820" cy="185" r="11" className="particle-glow" />
            </g>

            <g className="motion-particle particle-three">
              <circle cx="770" cy="590" r="3" />
              <circle cx="770" cy="590" r="13" className="particle-glow" />
            </g>

            <g className="motion-particle particle-four">
              <circle cx="190" cy="610" r="2" />
              <circle cx="190" cy="610" r="10" className="particle-glow" />
            </g>

            <g className="motion-particle particle-five">
              <circle cx="900" cy="410" r="2" />
              <circle cx="900" cy="410" r="9" className="particle-glow" />
            </g>

            <g className="motion-particle particle-six">
              <circle cx="90" cy="390" r="2.5" />
              <circle cx="90" cy="390" r="10" className="particle-glow" />
            </g>
          </svg>

          <svg className="motion-spark motion-spark-one" viewBox="0 0 100 100">
            <path d="M50 5 L57 43 L95 50 L57 57 L50 95 L43 57 L5 50 L43 43 Z" />
          </svg>

          <svg className="motion-spark motion-spark-two" viewBox="0 0 100 100">
            <path d="M50 8 L55 45 L92 50 L55 55 L50 92 L45 55 L8 50 L45 45 Z" />
          </svg>
        </div>

        <div className="dot-field" aria-label="Campo de pontos interativos">
          {dotField.map((dot) => (
            <span
              key={dot.id}
              className="dot-field-wrapper"
              data-dot-id={dot.id}
              style={{
                top: `${dot.top}%`,
                left: `${dot.left}%`,
                animationDuration: `${dot.flyDuration}s`,
                animationDelay: `${dot.flyDelay}s`,
              }}
            >
              <span
                className="dot-field-dot"
                style={{
                  background: dot.color,
                  transformOrigin: `${dot.originX}px ${dot.originY}px`,
                  animationDuration: `${dot.rotateDuration}s`,
                  animationDelay: `${dot.rotateDelay}s`,
                }}
              />
            </span>
          ))}
        </div>

        <div
          ref={particleLayerRef}
          className="interactive-particle-layer"
        ></div>

        {/* Fundo assume a cor da mega-partícula por alguns segundos
            após ela explodir cobrindo a tela inteira. */}
        <div
          ref={colorTakeoverRef}
          className="particle-color-takeover"
          aria-hidden="true"
        ></div>
      </div>

      <div className="login-ring">
        <i></i>
        <i></i>
        <i></i>

        <div className="login-form-container">
          <div
            className={`login-slider-track ${modoCadastro ? "login-slider-track-register" : ""}`}
          >
            <section className="login-slide login-slide-login">
              <div className="login-brand">
                <div className="login-logo">M</div>

                <div className="login-brand-text">
                  <h1>
                    Market<span>Faesa</span>
                  </h1>
                  <p>MARKETPLACE UNIVERSITÁRIO</p>
                </div>
              </div>

              <div className="login-heading">
                <span>ACESSO À CONTA</span>
                <h2>Bem-vindo de volta</h2>
                <p>
                  Entre na sua conta para continuar explorando o MarketFaesa.
                </p>
              </div>

              <form className="login-form" onSubmit={handleSubmit}>
                <div className="login-field">
                  <label htmlFor="login-usuario">Usuário</label>
                  <div className="login-input-wrapper">
                    <svg
                      className="login-input-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="14"
                        rx="2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M4 7l8 6 8-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <input
                      id="login-usuario"
                      type="text"
                      value={usuario}
                      onChange={(event) => setUsuario(event.target.value)}
                      placeholder="seu usuário"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="login-field">
                  <div className="login-label-row">
                    <label htmlFor="login-senha">Senha</label>
                    <button
                      type="button"
                      className="login-forgot-button"
                      onClick={() =>
                        onNavigate && onNavigate("recuperar-senha")
                      }
                    >
                      Esqueceu a senha?
                    </button>
                  </div>

                  <div className="login-input-wrapper">
                    <svg
                      className="login-input-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <rect
                        x="5"
                        y="10"
                        width="14"
                        height="10"
                        rx="2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M8 10V7a4 4 0 018 0v3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>

                    <input
                      id="login-senha"
                      type={mostrarSenha ? "text" : "password"}
                      value={senha}
                      onChange={(event) => setSenha(event.target.value)}
                      placeholder="Digite sua senha"
                      autoComplete="current-password"
                    />

                    <button
                      type="button"
                      className="login-password-toggle"
                      onClick={() => setMostrarSenha((estado) => !estado)}
                      aria-label={
                        mostrarSenha ? "Ocultar senha" : "Mostrar senha"
                      }
                    >
                      {mostrarSenha ? (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M3 3l18 18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                          <path
                            d="M10.6 10.6a2 2 0 002.8 2.8"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                          <path
                            d="M9.9 4.4A10.8 10.8 0 0112 4c5.2 0 8.5 4 9.5 6-.4.9-1.3 2.2-2.6 3.4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                          />
                          <path
                            d="M6.1 6.1C4.2 7.5 3 9.2 2.5 10c1 2 4.3 6 9.5 6 1.1 0 2.1-.2 3-.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                          />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          />
                          <circle
                            cx="12"
                            cy="12"
                            r="2.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {erro && <div className="login-error">{erro}</div>}

                <button type="submit" className="login-submit">
                  <span>Entrar</span>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M5 12h13"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M13 6l6 6-6 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </form>

              <div className="login-register">
                <span>Ainda não possui uma conta?</span>
                <button type="button" onClick={abrirCadastro}>
                  Criar conta
                </button>
              </div>

              <div className="login-footer">
                <span>© MarketFaesa</span>
                <span>·</span>
                <span>Marketplace Universitário</span>
              </div>
            </section>

            <section className="login-slide login-slide-register">
              <div className="login-brand">
                <div className="login-logo">M</div>

                <div className="login-brand-text">
                  <h1>
                    Market<span>Faesa</span>
                  </h1>
                  <p>MARKETPLACE UNIVERSITÁRIO</p>
                </div>
              </div>

              <div className="login-heading">
                <span>NOVA CONTA</span>
                <h2>Crie sua conta</h2>
                <p>Cadastre-se para começar a usar o MarketFaesa.</p>
              </div>

              <form
                className="login-form register-form"
                onSubmit={handleCadastro}
              >
                <div className="login-field">
                  <label htmlFor="cadastro-nome">Nome</label>
                  <div className="login-input-wrapper">
                    <svg
                      className="login-input-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="8"
                        r="3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M5 20c.8-3.3 3.1-5 7-5s6.2 1.7 7 5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                    <input
                      id="cadastro-nome"
                      type="text"
                      value={nome}
                      onChange={(event) => setNome(event.target.value)}
                      placeholder="Seu nome completo"
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label htmlFor="cadastro-email">E-mail</label>
                  <div className="login-input-wrapper">
                    <svg
                      className="login-input-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="14"
                        rx="2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M4 7l8 6 8-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <input
                      id="cadastro-email"
                      type="email"
                      value={cadastroEmail}
                      onChange={(event) => setCadastroEmail(event.target.value)}
                      placeholder="seu.email@faesa.br"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label htmlFor="cadastro-senha">Senha</label>
                  <div className="login-input-wrapper">
                    <svg
                      className="login-input-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <rect
                        x="5"
                        y="10"
                        width="14"
                        height="10"
                        rx="2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M8 10V7a4 4 0 018 0v3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                    <input
                      id="cadastro-senha"
                      type={mostrarCadastroSenha ? "text" : "password"}
                      value={cadastroSenha}
                      onChange={(event) => setCadastroSenha(event.target.value)}
                      placeholder="Crie uma senha"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="login-password-toggle"
                      onClick={() =>
                        setMostrarCadastroSenha((estado) => !estado)
                      }
                      aria-label={
                        mostrarCadastroSenha ? "Ocultar senha" : "Mostrar senha"
                      }
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="2.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="login-field">
                  <label htmlFor="cadastro-confirmar">Confirmar senha</label>
                  <div className="login-input-wrapper">
                    <svg
                      className="login-input-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <rect
                        x="5"
                        y="10"
                        width="14"
                        height="10"
                        rx="2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M8 10V7a4 4 0 018 0v3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                    <input
                      id="cadastro-confirmar"
                      type={mostrarConfirmarSenha ? "text" : "password"}
                      value={confirmarSenha}
                      onChange={(event) =>
                        setConfirmarSenha(event.target.value)
                      }
                      placeholder="Repita sua senha"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="login-password-toggle"
                      onClick={() =>
                        setMostrarConfirmarSenha((estado) => !estado)
                      }
                      aria-label={
                        mostrarConfirmarSenha
                          ? "Ocultar senha"
                          : "Mostrar senha"
                      }
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="2.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {erroCadastro && (
                  <div className="login-error">{erroCadastro}</div>
                )}

                <button type="submit" className="login-submit register-submit">
                  <span>Cadastrar</span>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M5 12h13"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M13 6l6 6-6 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </form>

              <div className="login-register">
                <span>Já possui uma conta?</span>
                <button type="button" onClick={voltarLogin}>
                  Entrar
                </button>
              </div>

              <div className="login-footer">
                <span>© MarketFaesa</span>
                <span>·</span>
                <span>Marketplace Universitário</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
