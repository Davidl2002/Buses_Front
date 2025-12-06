import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'MoviPass - Docs',
  description: 'Documentación del frontend de MoviPass',
  base: '/',
  themeConfig: {
    siteTitle: 'MoviPass Frontend',
    nav: [
      { text: 'Inicio', link: '/' },
      { text: 'Guía', link: '/getting-started' },
      { text: 'Componentes', link: '/components' }
    ],
    sidebar: [
      { text: 'Inicio', link: '/' },
      { text: 'Guía de inicio', link: '/getting-started' },
      { text: 'Componentes', link: '/components' },
      { text: 'Rutas', link: '/routes' },
      { text: 'Visión general (Frontend)', link: '/full-front' }
    ]
  }
})
