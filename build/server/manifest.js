const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["robots.txt"]),
	mimeTypes: {".txt":"text/plain"},
	_: {
		client: {start:"_app/immutable/entry/start.CI4crB-H.js",app:"_app/immutable/entry/app.BOpAA8Or.js",imports:["_app/immutable/entry/start.CI4crB-H.js","_app/immutable/chunks/DFU329Mh.js","_app/immutable/chunks/BYO0ofv7.js","_app/immutable/entry/app.BOpAA8Or.js","_app/immutable/chunks/D9Z9MdNV.js","_app/immutable/chunks/BYO0ofv7.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/DpPKuoqJ.js","_app/immutable/chunks/C56shC0M.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-DePXn4Lu.js')),
			__memo(() => import('./chunks/1-BKuLF0TW.js')),
			__memo(() => import('./chunks/2-CIjEq36Z.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/accounts",
				pattern: /^\/api\/accounts\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-D61YklSQ.js'))
			},
			{
				id: "/api/accounts/check-email",
				pattern: /^\/api\/accounts\/check-email\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-eV4Qfz4T.js'))
			},
			{
				id: "/api/accounts/next-number",
				pattern: /^\/api\/accounts\/next-number\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-BceIwgvS.js'))
			},
			{
				id: "/api/activity-logs",
				pattern: /^\/api\/activity-logs\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-B4MAsIVJ.js'))
			},
			{
				id: "/api/activity-types",
				pattern: /^\/api\/activity-types\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-D_Z4mxTt.js'))
			},
			{
				id: "/api/admin-settings",
				pattern: /^\/api\/admin-settings\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-BjJZx2li.js'))
			},
			{
				id: "/api/ai-grade-analysis",
				pattern: /^\/api\/ai-grade-analysis\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-BXiflOMo.js'))
			},
			{
				id: "/api/archived-students",
				pattern: /^\/api\/archived-students\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-CilEpjLO.js'))
			},
			{
				id: "/api/auth",
				pattern: /^\/api\/auth\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-BM8YRjHD.js'))
			},
			{
				id: "/api/change-password",
				pattern: /^\/api\/change-password\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-BoUv6j_9.js'))
			},
			{
				id: "/api/class-students",
				pattern: /^\/api\/class-students\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-D3eFTdEq.js'))
			},
			{
				id: "/api/current-quarter",
				pattern: /^\/api\/current-quarter\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-Ch7s5C0j.js'))
			},
			{
				id: "/api/dashboard",
				pattern: /^\/api\/dashboard\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-DNIIA2wm.js'))
			},
			{
				id: "/api/departments",
				pattern: /^\/api\/departments\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-CjoaHxgV.js'))
			},
			{
				id: "/api/document-requests",
				pattern: /^\/api\/document-requests\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-DvhxGVIW.js'))
			},
			{
				id: "/api/forgot-password",
				pattern: /^\/api\/forgot-password\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-B7-_0BzL.js'))
			},
			{
				id: "/api/forgot-password/reset-password",
				pattern: /^\/api\/forgot-password\/reset-password\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-j1P8JXDF.js'))
			},
			{
				id: "/api/forgot-password/verify-code",
				pattern: /^\/api\/forgot-password\/verify-code\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-CcSKCUbp.js'))
			},
			{
				id: "/api/grades",
				pattern: /^\/api\/grades\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-CtTAtOHV.js'))
			},
			{
				id: "/api/grades/grade-items",
				pattern: /^\/api\/grades\/grade-items\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-D3kgXl2j.js'))
			},
			{
				id: "/api/grades/save",
				pattern: /^\/api\/grades\/save\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-Ce7uMkOQ.js'))
			},
			{
				id: "/api/notifications",
				pattern: /^\/api\/notifications\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-zzC2gFPt.js'))
			},
			{
				id: "/api/rooms",
				pattern: /^\/api\/rooms\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-ErFBjB4_.js'))
			},
			{
				id: "/api/schedules",
				pattern: /^\/api\/schedules\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-gLKCssQh.js'))
			},
			{
				id: "/api/sections",
				pattern: /^\/api\/sections\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-6jBkGHhk.js'))
			},
			{
				id: "/api/student-grades",
				pattern: /^\/api\/student-grades\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-M5UyPfJM.js'))
			},
			{
				id: "/api/student-profile",
				pattern: /^\/api\/student-profile\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-DmsIf9y1.js'))
			},
			{
				id: "/api/student-todos",
				pattern: /^\/api\/student-todos\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-MWHlX0Gv.js'))
			},
			{
				id: "/api/students-bulk",
				pattern: /^\/api\/students-bulk\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-Ce92v-pC.js'))
			},
			{
				id: "/api/subjects",
				pattern: /^\/api\/subjects\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-C3RrOqgr.js'))
			},
			{
				id: "/api/teacher-advisory",
				pattern: /^\/api\/teacher-advisory\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-Cn0v0hjx.js'))
			},
			{
				id: "/api/teacher-profile",
				pattern: /^\/api\/teacher-profile\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-Bsd-SyVb.js'))
			},
			{
				id: "/api/teacher-sections",
				pattern: /^\/api\/teacher-sections\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-CnOcz2pp.js'))
			},
			{
				id: "/api/users",
				pattern: /^\/api\/users\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-DEqWHbFq.js'))
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

const prerendered = new Set([]);

const base = "";

export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map
