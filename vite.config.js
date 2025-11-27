import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		sveltekit(),
		VitePWA({
			disable: false,
			registerType: 'prompt',
			injectRegister: null, // Don't auto-register any SW - we use our custom one
			workbox: {
				// Completely disable workbox - we use custom sw.js
				globPatterns: []
			},
			includeAssets: ['favicon.svg', 'favicon-admin.svg', 'favicon-student.svg', 'favicon-teacher.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
			manifest: {
				name: 'SET-2 System',
				short_name: 'SET-2',
				description: 'Student Enrollment and Tracking System',
				theme_color: '#FFFFFF',
				background_color: '#ffffff',
				display: 'standalone',
				display_override: ['window-controls-overlay', 'standalone'],
				orientation: 'portrait-primary',
				scope: '/',
				start_url: '/',
				categories: ['education', 'productivity'],
				prefer_related_applications: false,
				icons: [
					{
						src: 'pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: 'pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'maskable'
					},
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			devOptions: {
				enabled: true,
				type: 'module',
				navigateFallback: '/'
			}
		})
	],
	server: {
		allowedHosts: [
			'.ngrok-free.app',
			'.ngrok.io',
			'.ngrok.app'
		]
	}
});
