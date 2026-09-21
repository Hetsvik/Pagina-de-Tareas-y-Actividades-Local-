import { authenticate, getCurrentUser, setSession } from './storage.js';

if (getCurrentUser()) window.location.replace('pages/dashboard.html');
const form = document.querySelector('#login-form');
const message = document.querySelector('#login-message');

// 1. Añadimos 'async' antes de la variable event
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = new FormData(form); 
  
  if (message) {
    message.textContent = 'Verificando credenciales...';
    message.className = 'form-message is-loading';
  }

  // 2. Añadimos 'await' antes de ejecutar la autenticación real
  const user = await authenticate(values.get('code'), values.get('pin'), values.get('role'));
  
  if (!user) { 
    if (message) {
      message.textContent = 'No encontramos una cuenta con esas credenciales y perfil.'; 
      message.className = 'form-message is-error'; 
    }
    return; 
  }
  
  setSession(user); 
  window.location.assign(user.role === 'admin' ? 'pages/admin.html' : 'pages/dashboard.html');
});
