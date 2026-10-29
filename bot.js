// CiberBot — flujo de concientización en seguridad online
// Cada paso puede ser: mensaje del bot (type:"bot"), espera de respuesta del usuario (type:"input")
// Los pasos de tipo "input" tienen opciones o campo libre y una función next(answer) que retorna el índice del siguiente paso.

const TYPING_DELAY = 700; // ms de "está escribiendo..." antes de mostrar mensaje

// Puntaje acumulado (0-100)
let score = 0;
let userName = '';
const answers = {}; // guardamos respuestas clave para el resumen final

// ─── FLUJO ───────────────────────────────────────────────────────────────────
// Cada elemento es un "paso".
// type:"bot"   → muestra burbuja del bot, luego avanza automáticamente al siguiente paso
// type:"input" → muestra opciones o texto libre, espera respuesta, llama a next(val) → índice siguiente
// type:"fn"    → ejecuta función dinámica (para inyectar HTML calculado), luego avanza

const flow = [

  // 0 — Bienvenida
  { type: 'bot', html: `<span class="emoji-big">🛡️</span><strong>¡Hola! Soy CiberBot.</strong><br>
Estoy acá para ayudarte a entender qué tan bien estás protegiendo tus cuentas en internet.<br><br>
No hay respuestas correctas ni incorrectas: solo quiero que descubras si estás en riesgo… ¡y cómo mejorar!` },

  // 1 — Pedir nombre
  { type: 'input', inputType: 'text', placeholder: 'Escribí tu nombre o apodo…',
    next: val => { userName = val.trim() || 'amigo'; return 2; } },

  // 2 — Saludo personalizado
  { type: 'bot', html: () => `¡Genial, <strong>${userName}</strong>! 👋 Vamos con algunas preguntas rápidas. Son solo <strong>8 preguntas</strong> y te lleva menos de 3 minutos.` },

  // 3 — Pregunta 1: Contraseñas repetidas
  { type: 'bot', html: `<strong>Pregunta 1 de 8 — Contraseñas</strong> 🔑<br>
¿Usás la misma contraseña en varias cuentas (redes sociales, email, banco)?` },
  { type: 'input', inputType: 'options', options: [
      { label: '😅 Sí, en casi todas',  value: 'all' },
      { label: '🤔 En algunas sí',       value: 'some' },
      { label: '✅ No, todas distintas', value: 'none' },
    ],
    next: val => {
      answers.passwords = val;
      if (val === 'all')  { score += 0;  return 5; }
      if (val === 'some') { score += 10; return 5; }
      score += 25; return 5;
    }
  },

  // 5 — Feedback contraseñas
  { type: 'fn', fn: () => {
      if (answers.passwords === 'all') return `<span class="emoji-big">😱</span>
<strong>¡Eso es un riesgo enorme!</strong><br>
Si alguien descubre <em>una</em> de tus contraseñas, puede entrar a <em>todas</em> tus cuentas.
<span class="tip danger">💡 Usá una contraseña diferente en cada cuenta. Un gestor de contraseñas como <strong>Bitwarden</strong> (gratis) te ayuda a recordarlas todas.</span>`;
      if (answers.passwords === 'some') return `<span class="emoji-big">⚠️</span>
<strong>Estás a medio camino.</strong> Repetir contraseñas en alguna cuenta sigue siendo peligroso.
<span class="tip warn">💡 Intentá que al menos el email y el banco tengan contraseñas únicas y largas.</span>`;
      return `<span class="emoji-big">✅</span>
<strong>¡Excelente hábito!</strong> Tener contraseñas únicas es una de las mejores protecciones.
<span class="tip ok">Seguí así. Si todavía las recordás de memoria, un gestor como Bitwarden puede hacerlo aún más fácil.</span>`;
    }
  },

  // 6 — Pregunta 2: Longitud de contraseña
  { type: 'bot', html: `<strong>Pregunta 2 de 8 — Fortaleza</strong> 💪<br>
¿Cómo son tus contraseñas?` },
  { type: 'input', inputType: 'options', options: [
      { label: '📛 Cortas (menos de 8 letras)', value: 'short' },
      { label: '🟡 Medianas (una palabra + números)', value: 'medium' },
      { label: '🔒 Largas y con símbolos',          value: 'strong' },
    ],
    next: val => {
      answers.passStrength = val;
      if (val === 'short')  { score += 0;  return 8; }
      if (val === 'medium') { score += 8;  return 8; }
      score += 15; return 8;
    }
  },

  // 8 — Feedback fortaleza
  { type: 'fn', fn: () => {
      if (answers.passStrength === 'short') return `Una contraseña corta se puede descifrar en <strong>segundos</strong> con programas automatizados.
<span class="tip danger">💡 Una buena contraseña tiene al menos 12 caracteres. Por ejemplo: <em>CafeNube!23Gato</em></span>`;
      if (answers.passStrength === 'medium') return `No está mal, pero se puede mejorar.
<span class="tip warn">💡 Agregá símbolos (!@#$%) y más longitud. ¡Más larga = más difícil de adivinar!</span>`;
      return `<strong>¡Genial!</strong> Las contraseñas largas con símbolos son muy difíciles de hackear. 🎉
<span class="tip ok">Un secreto: la longitud importa más que los símbolos. 20 letras aleatorias es mejor que 8 con símbolos.</span>`;
    }
  },

  // 9 — Pregunta 3: Doble factor
  { type: 'bot', html: `<strong>Pregunta 3 de 8 — Doble Factor (2FA)</strong> 📲<br>
¿Usás verificación en dos pasos en alguna cuenta? (Te mandan un código por SMS o app cuando iniciás sesión)` },
  { type: 'input', inputType: 'options', options: [
      { label: '❓ ¿Qué es eso?',            value: 'no_idea' },
      { label: '❌ No lo uso',                value: 'no' },
      { label: '⚡ En algunas cuentas',       value: 'some' },
      { label: '✅ Sí, en todas las que puedo', value: 'yes' },
    ],
    next: val => {
      answers.twofa = val;
      if (val === 'no_idea' || val === 'no') { score += 0;  return 11; }
      if (val === 'some')                    { score += 10; return 11; }
      score += 20; return 11;
    }
  },

  // 11 — Feedback 2FA
  { type: 'fn', fn: () => {
      if (answers.twofa === 'no_idea') return `<span class="emoji-big">🤔</span>
<strong>El doble factor es como una segunda llave para tu cuenta.</strong><br>
Aunque alguien robe tu contraseña, no puede entrar sin ese código extra que llega a tu celular.
<span class="tip danger">💡 Activalo ya en tu email y redes sociales. Buscá "verificación en dos pasos" en la configuración de seguridad de cada app.</span>`;
      if (answers.twofa === 'no') return `<span class="emoji-big">⚠️</span>
El doble factor es una de las protecciones más fáciles de activar y más efectivas que existen.
<span class="tip warn">💡 Solo toma 2 minutos activarlo. Recomendamos la app <strong>Google Authenticator</strong> o <strong>Authy</strong> en vez de SMS (más seguro).</span>`;
      if (answers.twofa === 'some') return `¡Bien, ya vas por buen camino! Intentá activarlo especialmente en tu <strong>email principal</strong> y <strong>banco</strong>.
<span class="tip ok">Si perdés el acceso al email, podés perder el control de TODAS tus cuentas (porque ahí llegan los "olvidé mi contraseña").</span>`;
      return `<span class="emoji-big">🌟</span>
<strong>¡Excelente!</strong> El doble factor te protege incluso si alguien roba tu contraseña. Sos un ejemplo a seguir.`;
    }
  },

  // 12 — Pregunta 4: Actualizaciones
  { type: 'bot', html: `<strong>Pregunta 4 de 8 — Actualizaciones</strong> 🔄<br>
¿Actualizás el sistema operativo y las apps de tu celular/computadora?` },
  { type: 'input', inputType: 'options', options: [
      { label: '😬 Siempre las ignoro',       value: 'never' },
      { label: '🤷 A veces, cuando me acuerdo', value: 'sometimes' },
      { label: '✅ Sí, las instalo rápido',   value: 'always' },
    ],
    next: val => {
      answers.updates = val;
      if (val === 'never')     { score += 0;  return 14; }
      if (val === 'sometimes') { score += 5;  return 14; }
      score += 10; return 14;
    }
  },

  // 14 — Feedback actualizaciones
  { type: 'fn', fn: () => {
      if (answers.updates === 'never') return `<span class="emoji-big">🚨</span>
Las actualizaciones corrigen <strong>agujeros de seguridad</strong> que los hackers explotan. Ignorarlas es como dejar la puerta abierta.
<span class="tip danger">💡 Activá las actualizaciones automáticas. Cuando aparezca la notificación, instalala ese mismo día.</span>`;
      if (answers.updates === 'sometimes') return `Mejor que nada, ¡pero podés mejorarlo!
<span class="tip warn">💡 Las actualizaciones de seguridad son urgentes. Cuanto más tiempo esperás, más tiempo tenés el agujero abierto.</span>`;
      return `<strong>¡Muy bien!</strong> 🙌 Mantener todo actualizado cierra las puertas que los atacantes buscan.
<span class="tip ok">Igual recordá revisar también los navegadores (Chrome, Firefox) y las extensiones.</span>`;
    }
  },

  // 15 — Pregunta 5: WiFi público
  { type: 'bot', html: `<strong>Pregunta 5 de 8 — WiFi Público</strong> 📡<br>
¿Te conectás a redes WiFi públicas (shopping, café, aeropuerto) para ver tu banco o correo?` },
  { type: 'input', inputType: 'options', options: [
      { label: '😬 Sí, siempre que puedo',      value: 'always' },
      { label: '🤷 A veces, si necesito',        value: 'sometimes' },
      { label: '✅ No, evito datos sensibles',   value: 'never' },
    ],
    next: val => {
      answers.wifi = val;
      if (val === 'always')    { score += 0;  return 17; }
      if (val === 'sometimes') { score += 5;  return 17; }
      score += 10; return 17;
    }
  },

  // 17 — Feedback WiFi
  { type: 'fn', fn: () => {
      if (answers.wifi === 'always') return `<span class="emoji-big">⚠️</span>
En un WiFi público, <strong>cualquiera en esa red puede interceptar tu tráfico</strong> si no estás bien protegido.
<span class="tip danger">💡 Nunca uses tu banco o correo en WiFi público. Si es urgente, usá los datos móviles de tu celular.</span>`;
      if (answers.wifi === 'sometimes') return `Entendemos que a veces es necesario, pero hay riesgos.
<span class="tip warn">💡 Si necesitás conectarte, usá una <strong>VPN</strong> (como ProtonVPN, tiene plan gratis). Cifra todo tu tráfico.</span>`;
      return `<strong>¡Excelente criterio!</strong> Los WiFi públicos son una fuente clásica de robo de datos.
<span class="tip ok">Si alguna vez necesitás usarlos, una VPN te protege bien.</span>`;
    }
  },

  // 18 — Pregunta 6: Phishing
  { type: 'bot', html: `<strong>Pregunta 6 de 8 — Mensajes sospechosos</strong> 🎣<br>
¿Qué hacés si recibís un email o mensaje que dice "¡Ganaste un premio! Hacé clic acá"?` },
  { type: 'input', inputType: 'options', options: [
      { label: '👆 Lo abro, por si acaso',           value: 'click' },
      { label: '🤔 Depende de quién viene',           value: 'depends' },
      { label: '🗑️ Lo ignoro o lo elimino',          value: 'ignore' },
      { label: '🚨 Lo reporto como spam/phishing',   value: 'report' },
    ],
    next: val => {
      answers.phishing = val;
      if (val === 'click')   { score += 0;  return 20; }
      if (val === 'depends') { score += 5;  return 20; }
      if (val === 'ignore')  { score += 8;  return 20; }
      score += 12; return 20;
    }
  },

  // 20 — Feedback phishing
  { type: 'fn', fn: () => {
      if (answers.phishing === 'click') return `<span class="emoji-big">🎣</span>
Eso se llama <strong>phishing</strong> — es la forma más común de robar cuentas y datos. Un clic puede ser todo lo que necesitan.
<span class="tip danger">💡 La regla de oro: si no lo pediste, no lo abrás. Los premios de verdad no llegan por email inesperado.</span>`;
      if (answers.phishing === 'depends') return `Buen instinto chequearlo. El problema es que los hackers imitan muy bien remitentes conocidos.
<span class="tip warn">💡 Además de ver quién lo manda, fijate en el link: pasá el mouse por encima (sin hacer clic) para ver la URL real. Si parece raro, no lo abras.</span>`;
      if (answers.phishing === 'ignore') return `<strong>¡Bien hecho!</strong> Ignorarlo es la respuesta correcta.
<span class="tip ok">Un paso extra: reportarlo como "phishing" o "spam" ayuda a que el proveedor lo bloquee para otros usuarios también.</span>`;
      return `<span class="emoji-big">🌟</span>
<strong>¡Perfecto!</strong> Reportar el phishing protege a toda la comunidad. Sos un usuario responsable.`;
    }
  },

  // 21 — Pregunta 7: Respaldo de datos
  { type: 'bot', html: `<strong>Pregunta 7 de 8 — Respaldo</strong> 💾<br>
¿Tenés una copia de seguridad de tus fotos y archivos importantes?` },
  { type: 'input', inputType: 'options', options: [
      { label: '❌ No, nunca lo hice',              value: 'never' },
      { label: '🤷 Tenía pero hace mucho',          value: 'old' },
      { label: '☁️ Sí, en la nube (Drive, iCloud)', value: 'cloud' },
      { label: '✅ Sí, nube + disco físico',        value: 'both' },
    ],
    next: val => {
      answers.backup = val;
      if (val === 'never') { score += 0;  return 23; }
      if (val === 'old')   { score += 3;  return 23; }
      if (val === 'cloud') { score += 8;  return 23; }
      score += 12; return 23;
    }
  },

  // 23 — Feedback backup
  { type: 'fn', fn: () => {
      if (answers.backup === 'never') return `<span class="emoji-big">😬</span>
Los <strong>ransomwares</strong> (virus que bloquean tu computadora y piden dinero) son cada vez más comunes. Sin backup, podés perderlo todo.
<span class="tip danger">💡 Empezá hoy: activá Google Fotos o iCloud para tus fotos. Es gratis y automático.</span>`;
      if (answers.backup === 'old') return `Un backup viejo es mejor que nada, ¡pero podés perder todo lo nuevo!
<span class="tip warn">💡 Configurá un backup automático para que se haga solo. Así no dependés de recordarlo.</span>`;
      if (answers.backup === 'cloud') return `<strong>¡Bien!</strong> La nube te cubre ante pérdida del dispositivo.
<span class="tip ok">Igual considerá tener también una copia en un disco físico (una vez al mes). Si te hackean la cuenta de la nube, tenés el respaldo local.</span>`;
      return `<span class="emoji-big">🏆</span>
<strong>¡Sos un ejemplo!</strong> La regla 3-2-1 (3 copias, 2 medios distintos, 1 fuera de tu casa) es el estándar profesional.`;
    }
  },

  // 24 — Pregunta 8: Redes sociales
  { type: 'bot', html: `<strong>Pregunta 8 de 8 — Redes sociales</strong> 📸<br>
¿Tu perfil de Instagram, Facebook o TikTok es público (lo puede ver cualquiera)?` },
  { type: 'input', inputType: 'options', options: [
      { label: '🌐 Sí, completamente público', value: 'public' },
      { label: '🤔 No sé cómo verlo',          value: 'unsure' },
      { label: '🔒 Solo mis seguidores/amigos', value: 'private' },
    ],
    next: val => {
      answers.social = val;
      if (val === 'public')  { score += 0;  return 26; }
      if (val === 'unsure')  { score += 3;  return 26; }
      score += 6; return 26;
    }
  },

  // 26 — Feedback redes
  { type: 'fn', fn: () => {
      if (answers.social === 'public') return `Un perfil público comparte con el mundo tu ubicación, rutinas, cara, familia y amigos. Eso es información valiosa para estafadores.
<span class="tip danger">💡 Poné tus cuentas en "privado" en la configuración de privacidad. Solo tus contactos deberían ver tus fotos.</span>`;
      if (answers.social === 'unsure') return `¡Vale la pena verificarlo! Es fácil y toma 1 minuto.
<span class="tip warn">💡 En Instagram: Configuración → Privacidad → Cuenta privada. En Facebook: Configuración → Privacidad → ¿Quién puede ver tus publicaciones futuras?</span>`;
      return `<strong>¡Muy bien!</strong> Controlar quién ve tu contenido protege tu privacidad y reduce el riesgo de ingeniería social.
<span class="tip ok">Recordá también revisar qué aplicaciones de terceros tienen acceso a tus redes: Configuración → Apps conectadas.</span>`;
    }
  },

  // 27 — Mensaje de transición
  { type: 'bot', html: () => `¡Listo, <strong>${userName}</strong>! Ya terminamos las preguntas. 🎉<br>Calculando tu puntuación…` },

  // 28 — Score final
  { type: 'fn', fn: () => {
      const s = Math.round(score / 110 * 100);
      let color, msg, emoji;
      if (s < 25) {
        color = '#f75f5f'; msg = 'Nivel de protección: muy bajo. ¡Pero no te preocupes! Con algunos cambios simples podés mejorar mucho.'; emoji = '😰';
      } else if (s < 50) {
        color = '#f7a648'; msg = 'Nivel de protección: básico. Tenés algunas buenas prácticas pero hay brechas importantes que cerrar.'; emoji = '😐';
      } else if (s < 75) {
        color = '#f7c948'; msg = 'Nivel de protección: intermedio. ¡Vas bien! Unos ajustes más y vas a estar muy protegido.'; emoji = '🙂';
      } else {
        color = '#3dd68c'; msg = 'Nivel de protección: alto. ¡Excelente! Tenés hábitos digitales muy seguros.'; emoji = '😎';
      }
      const pct = s;
      return `<span class="emoji-big">${emoji}</span>
<div class="score-card">
  <div class="score-label">Tu puntuación de seguridad</div>
  <div class="score-bar-wrap"><div class="score-bar" id="sb" style="width:0%;background:${color}"></div></div>
  <div class="score-value" style="color:${color}">${pct} / 100</div>
  <div class="score-msg">${msg}</div>
</div>`;
    },
    afterRender: () => {
      setTimeout(() => {
        const bar = document.getElementById('sb');
        if (bar) bar.style.width = Math.round(score / 110 * 100) + '%';
      }, 100);
    }
  },

  // 29 — Resumen de acciones
  { type: 'fn', fn: () => {
      const items = [];
      if (answers.passwords === 'all' || answers.passwords === 'some')
        items.push('🔑 Usar contraseñas únicas (probá <strong>Bitwarden</strong> gratis)');
      if (answers.passStrength !== 'strong')
        items.push('💪 Crear contraseñas de al menos 12 caracteres con símbolos');
      if (answers.twofa === 'no_idea' || answers.twofa === 'no')
        items.push('📲 Activar verificación en dos pasos en email y redes sociales');
      if (answers.updates !== 'always')
        items.push('🔄 Activar actualizaciones automáticas en todos tus dispositivos');
      if (answers.wifi === 'always' || answers.wifi === 'sometimes')
        items.push('📡 Evitar WiFi público para datos sensibles (o usar VPN)');
      if (answers.phishing === 'click' || answers.phishing === 'depends')
        items.push('🎣 Nunca hacer clic en links de mensajes no esperados');
      if (answers.backup === 'never' || answers.backup === 'old')
        items.push('💾 Activar backup automático en la nube (Google Fotos / iCloud)');
      if (answers.social !== 'private')
        items.push('🔒 Poner tus perfiles de redes sociales en privado');

      if (items.length === 0) return `<span class="emoji-big">🏆</span>
<strong>¡No tenés acciones pendientes!</strong> Seguís siendo un ejemplo de buenas prácticas digitales. Compartí este test con amigos y familiares para ayudarlos a protegerse también.`;

      const list = items.map(i => `<li>→ ${i}</li>`).join('');
      return `<strong>📋 Tu lista de acciones prioritarias:</strong>
<ul class="tip-list">${list}</ul>`;
    }
  },

  // 30 — Cierre
  { type: 'bot', html: () => `Gracias por tomarte el tiempo, <strong>${userName}</strong>. 🙏<br><br>
Recordá: la seguridad online no es solo para expertos. <strong>Pequeños hábitos hacen una gran diferencia.</strong><br><br>
Si querés repasar el test, actualizá la página. ¡Hasta la próxima! 🛡️` },

  // 31 — Fin
  { type: 'end' }
];

// ─── MOTOR DEL CHAT ──────────────────────────────────────────────────────────

const chat     = document.getElementById('chat');
const optionsEl = document.getElementById('options');
const textWrap  = document.getElementById('text-input-wrap');
const textInput = document.getElementById('text-input');
const sendBtn   = document.getElementById('send-btn');

let currentStep = 0;

function scrollBottom() {
  chat.scrollTop = chat.scrollHeight;
}

function addBubble(html, who, extraClass = '') {
  const row = document.createElement('div');
  row.className = `bubble-row ${who}`;

  if (who === 'bot') {
    const av = document.createElement('div');
    av.className = 'avatar';
    av.textContent = '🛡️';
    row.appendChild(av);
  }

  const bubble = document.createElement('div');
  bubble.className = `bubble ${extraClass}`;
  bubble.innerHTML = html;
  row.appendChild(bubble);
  chat.appendChild(row);
  scrollBottom();
  return bubble;
}

function showTyping() {
  const row = document.createElement('div');
  row.className = 'bubble-row bot';
  row.id = 'typing-row';

  const av = document.createElement('div');
  av.className = 'avatar';
  av.textContent = '🛡️';
  row.appendChild(av);

  const bubble = document.createElement('div');
  bubble.className = 'bubble typing';
  bubble.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
  row.appendChild(bubble);
  chat.appendChild(row);
  scrollBottom();
}

function removeTyping() {
  const el = document.getElementById('typing-row');
  if (el) el.remove();
}

function clearInput() {
  optionsEl.innerHTML = '';
  optionsEl.style.display = 'flex';
  textWrap.style.display = 'none';
  textInput.value = '';
}

function renderOptions(step) {
  clearInput();
  if (step.inputType === 'text') {
    textWrap.style.display = 'flex';
    optionsEl.style.display = 'none';
    textInput.placeholder = step.placeholder || 'Escribí tu respuesta…';
    textInput.focus();
  } else {
    step.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'opt-btn';
      btn.textContent = opt.label;
      btn.addEventListener('click', () => handleUserAnswer(opt.label, opt.value, step));
      optionsEl.appendChild(btn);
    });
  }
}

function handleUserAnswer(label, value, step) {
  clearInput();
  addBubble(label, 'user');
  const nextIndex = step.next(value);
  currentStep = nextIndex;
  runStep();
}

function runStep() {
  if (currentStep >= flow.length) return;
  const step = flow[currentStep];

  if (step.type === 'end') {
    clearInput();
    return;
  }

  if (step.type === 'input') {
    renderOptions(step);
    return;
  }

  // bot o fn: mostrar "escribiendo…" y luego el mensaje
  showTyping();
  setTimeout(() => {
    removeTyping();

    let html = '';
    if (step.type === 'bot') {
      html = typeof step.html === 'function' ? step.html() : step.html;
    } else if (step.type === 'fn') {
      html = step.fn();
    }

    addBubble(html, 'bot');

    if (step.afterRender) step.afterRender();

    currentStep++;
    // pequeño delay entre mensajes consecutivos del bot
    setTimeout(runStep, step.type === 'fn' ? 400 : 200);
  }, TYPING_DELAY);
}

// Envío por teclado / botón
sendBtn.addEventListener('click', () => submitText());
textInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitText(); });

function submitText() {
  const val = textInput.value.trim();
  if (!val) return;
  const step = flow[currentStep];
  if (!step || step.type !== 'input') return;
  handleUserAnswer(val, val, step);
}

// ─── INICIO ──────────────────────────────────────────────────────────────────
runStep();
