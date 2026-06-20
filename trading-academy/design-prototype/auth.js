/* ============ AUREON — Authentification (login / inscription) ============
   Auth côté client pour le prototype : les comptes sont stockés localement
   (localStorage) avec un mot de passe haché en SHA-256 (jamais en clair).
   Remplaçable plus tard par l'API Django (apps/accounts).                  */

const AUREON_AUTH = (() => {
  const USERS_KEY = 'aureon_users';
  const SESSION_KEY = 'aureon_session';

  async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const getUsers = () => {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch { return []; }
  };
  const saveUsers = (u) => localStorage.setItem(USERS_KEY, JSON.stringify(u));

  const getSession = () => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
    catch { return null; }
  };
  const setSession = (s) => localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  const logout = () => { localStorage.removeItem(SESSION_KEY); location.href = 'login.html'; };

  const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  async function register({ name, email, password }) {
    name = (name || '').trim();
    email = (email || '').trim().toLowerCase();
    if (name.length < 2) throw new Error('Veuillez saisir votre nom complet.');
    if (!validEmail(email)) throw new Error('Adresse e-mail invalide.');
    if (!password || password.length < 6) throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
    const users = getUsers();
    if (users.some(u => u.email === email)) throw new Error('Un compte existe déjà avec cet e-mail.');
    const passHash = await sha256(password);
    const user = { name, email, passHash, createdAt: new Date().toISOString() };
    users.push(user);
    saveUsers(users);
    setSession({ name, email });
    return user;
  }

  async function login({ email, password }) {
    email = (email || '').trim().toLowerCase();
    if (!validEmail(email)) throw new Error('Adresse e-mail invalide.');
    if (!password) throw new Error('Veuillez saisir votre mot de passe.');
    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user) throw new Error('Aucun compte trouvé avec cet e-mail.');
    const passHash = await sha256(password);
    if (passHash !== user.passHash) throw new Error('Mot de passe incorrect.');
    setSession({ name: user.name, email: user.email });
    return user;
  }

  function renderAuthZone() {
    const zone = document.getElementById('authZone');
    if (!zone) return;
    const s = getSession();
    if (s) {
      const initials = s.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
      zone.innerHTML = `
        <div class="pro-badge">
          <span class="user-name">${s.name}</span>
          <span class="vip">MEMBRE</span>
          <div class="avatar avatar-initials">${initials}</div>
        </div>
        <button class="btn btn-ghost btn-sm" id="logoutBtn"><i data-lucide="log-out" style="width:14px"></i>Déconnexion</button>`;
      const lb = zone.querySelector('#logoutBtn');
      if (lb) lb.onclick = logout;
    } else {
      zone.innerHTML = `
        <a class="btn btn-ghost btn-sm" href="login.html"><i data-lucide="user" style="width:14px"></i>CONNEXION</a>
        <a class="btn btn-primary btn-sm" href="register.html"><i data-lucide="user-plus" style="width:14px"></i>INSCRIPTION</a>`;
    }
    if (window.lucide) lucide.createIcons();
  }

  return { register, login, logout, getSession, renderAuthZone };
})();

document.addEventListener('DOMContentLoaded', () => AUREON_AUTH.renderAuthZone());
