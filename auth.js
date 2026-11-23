/* =========================================================================
   Acceso a Gestión Integrada ISO (Gerencia) — inicio de sesión con Google
   23-11-2026. Reemplaza la clave fija que estaba escrita en cada página.
   - Si no hay sesión vigente, cubre la página y pide iniciar sesión.
   - Tras iniciar sesión guarda el "ID token" solo en esta pestaña
     (sessionStorage) y recarga la página.
   - Cada página usa window.ISO_TOKEN como su APP_KEY; el backend lo verifica
     con Google y solo deja pasar los correos permitidos.
   ========================================================================= */
(function () {
  var CLIENT_ID = '72369192874-rgv4vqjl243p39fv0dntkl5a4m13s8k6.apps.googleusercontent.com';
  var CLAVE = 'iso_id_token';

  function datosToken(t) {
    try {
      var b = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(b))));
    } catch (e) { return null; }
  }
  function leer() { try { return sessionStorage.getItem(CLAVE) || ''; } catch (e) { return ''; } }
  function guardar(t) { try { sessionStorage.setItem(CLAVE, t); } catch (e) {} }
  function borrar() { try { sessionStorage.removeItem(CLAVE); } catch (e) {} }

  var token = leer();
  var datos = token ? datosToken(token) : null;
  var vigente = datos && datos.exp * 1000 > Date.now() + 2 * 60 * 1000;
  if (!vigente) { borrar(); token = ''; datos = null; }
  window.ISO_TOKEN = token;

  var estilos =
    '#iso-acceso{position:fixed;inset:0;z-index:99999;background:rgba(0,59,73,.96);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Arial,sans-serif}' +
    '#iso-acceso .caja{background:#fff;border-radius:14px;max-width:380px;width:100%;padding:28px 24px;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.3)}' +
    '#iso-acceso img{height:56px;margin-bottom:10px}' +
    '#iso-acceso h2{margin:0 0 6px;color:#003B49;font-size:20px}' +
    '#iso-acceso p{margin:0 0 18px;color:#4A6068;font-size:14px;line-height:1.4}' +
    '#iso-acceso .aviso{color:#CF4520;font-size:13px;margin-top:14px}' +
    '#iso-acceso .btn{display:flex;justify-content:center;min-height:44px}' +
    '#iso-sesion{position:fixed;right:10px;bottom:10px;z-index:9999;background:#003B49;color:#fff;font:12px Arial,sans-serif;border-radius:999px;padding:6px 12px;opacity:.85}' +
    '#iso-sesion a{color:#fff;margin-left:8px;text-decoration:underline;cursor:pointer}';

  function mostrarAcceso(mensaje) {
    if (document.getElementById('iso-acceso')) return;
    var st = document.createElement('style'); st.textContent = estilos; document.head.appendChild(st);
    var d = document.createElement('div'); d.id = 'iso-acceso';
    d.innerHTML = '<div class="caja"><img src="logo-senercom.png" alt="SENERCOM">' +
      '<h2>Gerencia · Gestión Integrada ISO</h2>' +
      '<p>Acceso restringido. Inicia sesión con tu cuenta de Google autorizada.</p>' +
      '<div class="btn" id="iso-boton"></div>' +
      (mensaje ? '<div class="aviso">' + mensaje + '</div>' : '') + '</div>';
    document.body.appendChild(d);
    var s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
    s.onload = function () {
      google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: function (r) { guardar(r.credential); location.reload(); },
        auto_select: true
      });
      google.accounts.id.renderButton(document.getElementById('iso-boton'),
        { theme: 'filled_blue', size: 'large', text: 'signin_with', shape: 'pill', locale: 'es' });
    };
    s.onerror = function () {
      document.getElementById('iso-boton').innerHTML = '<span class="aviso">No se pudo cargar el inicio de sesión de Google. Revisa tu conexión.</span>';
    };
    document.head.appendChild(s);
  }

  function mostrarSesion() {
    var st = document.createElement('style'); st.textContent = estilos; document.head.appendChild(st);
    var d = document.createElement('div'); d.id = 'iso-sesion';
    d.innerHTML = '🔒 ' + (datos.email || '') + '<a id="iso-salir">Salir</a>';
    document.body.appendChild(d);
    document.getElementById('iso-salir').onclick = function () { borrar(); location.reload(); };
    // Cuando la sesión venza, se vuelve a pedir el inicio de sesión
    var ms = datos.exp * 1000 - Date.now() - 60 * 1000;
    setTimeout(function () { borrar(); window.ISO_TOKEN = ''; mostrarAcceso('Tu sesión expiró. Vuelve a iniciar sesión.'); }, Math.max(ms, 0));
  }

  // Lo llaman las páginas si el backend responde un error de acceso
  window.isoErrorDeAcceso = function (mensaje) {
    borrar(); window.ISO_TOKEN = '';
    mostrarAcceso(String(mensaje || '').replace(/^ACCESO:\s*/, ''));
  };

  // Detecta los errores de acceso en las respuestas POST del backend
  if (window.fetch) {
    var fetchOriginal = window.fetch;
    window.fetch = function () {
      return fetchOriginal.apply(this, arguments).then(function (resp) {
        try {
          resp.clone().text().then(function (txt) {
            if (txt.indexOf('ACCESO:') !== -1) {
              var m = txt.match(/ACCESO:[^"]*/);
              window.isoErrorDeAcceso(m ? m[0] : '');
            }
          }).catch(function () {});
        } catch (e) {}
        return resp;
      });
    };
  }

  function iniciar() { if (token) mostrarSesion(); else mostrarAcceso(''); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
