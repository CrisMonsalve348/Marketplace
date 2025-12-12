// Manejo interactivo de dropdowns de categorías en headers
document.addEventListener('DOMContentLoaded', () => {
  // Header público
  const btnApp = document.getElementById('categoriasBtnApp');
  const menuApp = document.getElementById('categoriasMenuApp');
  const iconApp = document.getElementById('categoriasIconApp');

  if (btnApp && menuApp) {
    // Toggle al hacer click
    btnApp.addEventListener('click', (e) => {
      e.preventDefault();
      menuApp.classList.toggle('hidden');
      iconApp.style.transform = menuApp.classList.contains('hidden')
        ? 'rotate(0deg)'
        : 'rotate(180deg)';
      btnApp.setAttribute(
        'aria-expanded',
        !menuApp.classList.contains('hidden')
      );
    });

    // Hover para desktop (además del click)
    btnApp.addEventListener('mouseenter', () => {
      menuApp.classList.remove('hidden');
      iconApp.style.transform = 'rotate(180deg)';
    });

    // Cerrar al salir del contenedor
    btnApp.parentElement.addEventListener('mouseleave', () => {
      // Solo cerrar si no estamos navegando en el menú
      setTimeout(() => {
        if (!btnApp.parentElement.querySelector(':hover')) {
          menuApp.classList.add('hidden');
          iconApp.style.transform = 'rotate(0deg)';
          btnApp.setAttribute('aria-expanded', 'false');
        }
      }, 100);
    });

    // Cerrar al hacer click en un enlace
    const links = menuApp.querySelectorAll('a');
    links.forEach((link) => {
      link.addEventListener('click', () => {
        menuApp.classList.add('hidden');
        iconApp.style.transform = 'rotate(0deg)';
        btnApp.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Header admin
  const btnAdmin = document.getElementById('categoriasBtnAdmin');
  const menuAdmin = document.getElementById('categoriasMenuAdmin');
  const iconAdmin = document.getElementById('categoriasIconAdmin');

  if (btnAdmin && menuAdmin) {
    // Toggle al hacer click
    btnAdmin.addEventListener('click', (e) => {
      e.preventDefault();
      menuAdmin.classList.toggle('hidden');
      iconAdmin.style.transform = menuAdmin.classList.contains('hidden')
        ? 'rotate(0deg)'
        : 'rotate(180deg)';
      btnAdmin.setAttribute(
        'aria-expanded',
        !menuAdmin.classList.contains('hidden')
      );
    });

    // Hover para desktop (además del click)
    btnAdmin.addEventListener('mouseenter', () => {
      menuAdmin.classList.remove('hidden');
      iconAdmin.style.transform = 'rotate(180deg)';
    });

    // Cerrar al salir del contenedor
    btnAdmin.parentElement.addEventListener('mouseleave', () => {
      setTimeout(() => {
        if (!btnAdmin.parentElement.querySelector(':hover')) {
          menuAdmin.classList.add('hidden');
          iconAdmin.style.transform = 'rotate(0deg)';
          btnAdmin.setAttribute('aria-expanded', 'false');
        }
      }, 100);
    });

    // Cerrar al hacer click en un enlace
    const linksAdmin = menuAdmin.querySelectorAll('a');
    linksAdmin.forEach((link) => {
      link.addEventListener('click', () => {
        menuAdmin.classList.add('hidden');
        iconAdmin.style.transform = 'rotate(0deg)';
        btnAdmin.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Header admin - Menú de usuario
  const btnUsuarioAdmin = document.getElementById('usuarioBtnAdmin');
  const menuUsuarioAdmin = document.getElementById('usuarioMenuAdmin');
  const iconUsuarioAdmin = document.getElementById('usuarioIconAdmin');

  if (btnUsuarioAdmin && menuUsuarioAdmin) {
    // Toggle al hacer click
    btnUsuarioAdmin.addEventListener('click', (e) => {
      e.preventDefault();
      menuUsuarioAdmin.classList.toggle('hidden');
      iconUsuarioAdmin.style.transform = menuUsuarioAdmin.classList.contains('hidden')
        ? 'rotate(0deg)'
        : 'rotate(180deg)';
      btnUsuarioAdmin.setAttribute(
        'aria-expanded',
        !menuUsuarioAdmin.classList.contains('hidden')
      );
    });

    // Hover para desktop (además del click)
    btnUsuarioAdmin.addEventListener('mouseenter', () => {
      menuUsuarioAdmin.classList.remove('hidden');
      iconUsuarioAdmin.style.transform = 'rotate(180deg)';
    });

    // Cerrar al salir del contenedor
    btnUsuarioAdmin.parentElement.addEventListener('mouseleave', () => {
      setTimeout(() => {
        if (!btnUsuarioAdmin.parentElement.querySelector(':hover')) {
          menuUsuarioAdmin.classList.add('hidden');
          iconUsuarioAdmin.style.transform = 'rotate(0deg)';
          btnUsuarioAdmin.setAttribute('aria-expanded', 'false');
        }
      }, 100);
    });

    // Cerrar al hacer click en un enlace
    const linksUsuarioAdmin = menuUsuarioAdmin.querySelectorAll('a');
    linksUsuarioAdmin.forEach((link) => {
      link.addEventListener('click', () => {
        menuUsuarioAdmin.classList.add('hidden');
        iconUsuarioAdmin.style.transform = 'rotate(0deg)';
        btnUsuarioAdmin.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Cerrar menús al hacer click fuera
  document.addEventListener('click', (e) => {
    if (
      !e.target.closest('#categoriasBtnApp') &&
      !e.target.closest('#categoriasMenuApp')
    ) {
      if (menuApp && !menuApp.classList.contains('hidden')) {
        menuApp.classList.add('hidden');
        if (iconApp) iconApp.style.transform = 'rotate(0deg)';
        if (btnApp) btnApp.setAttribute('aria-expanded', 'false');
      }
    }

    if (
      !e.target.closest('#categoriasBtnAdmin') &&
      !e.target.closest('#categoriasMenuAdmin')
    ) {
      if (menuAdmin && !menuAdmin.classList.contains('hidden')) {
        menuAdmin.classList.add('hidden');
        if (iconAdmin) iconAdmin.style.transform = 'rotate(0deg)';
        if (btnAdmin) btnAdmin.setAttribute('aria-expanded', 'false');
      }
    }

    if (
      !e.target.closest('#usuarioBtnAdmin') &&
      !e.target.closest('#usuarioMenuAdmin')
    ) {
      if (menuUsuarioAdmin && !menuUsuarioAdmin.classList.contains('hidden')) {
        menuUsuarioAdmin.classList.add('hidden');
        if (iconUsuarioAdmin) iconUsuarioAdmin.style.transform = 'rotate(0deg)';
        if (btnUsuarioAdmin) btnUsuarioAdmin.setAttribute('aria-expanded', 'false');
      }
    }
  });
});
