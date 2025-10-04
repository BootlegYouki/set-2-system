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
		client: {start:"_app/immutable/entry/start.4kGWp2B-.js",app:"_app/immutable/entry/app.BPHEYlZj.js",imports:["_app/immutable/entry/start.4kGWp2B-.js","_app/immutable/chunks/Cm4yQJqn.js","_app/immutable/chunks/CzqljEhS.js","_app/immutable/entry/app.BPHEYlZj.js","_app/immutable/chunks/D9Z9MdNV.js","_app/immutable/chunks/CzqljEhS.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/C8VmeVqX.js","_app/immutable/chunks/CKS5_Eeq.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-7x8PiEwy.js')),
			__memo(() => import('./chunks/1-D3ZQtY-B.js')),
			__memo(() => import('./chunks/2-fr3a5FLR.js'))
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
				endpoint: __memo(() => import('./chunks/_server-CgnM83tM.js'))
			},
			{
				id: "/api/activity-logs",
				pattern: /^\/api\/activity-logs\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-DmwfvnJz.js'))
			},
			{
				id: "/api/activity-types",
				pattern: /^\/api\/activity-types\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-BwUkOvVm.js'))
			},
			{
				id: "/api/admin-settings",
				pattern: /^\/api\/admin-settings\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-RWBBNFYA.js'))
			},
			{
				id: "/api/archived-students",
				pattern: /^\/api\/archived-students\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-BZsJyJJM.js'))
			},
			{
				id: "/api/auth",
				pattern: /^\/api\/auth\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-CIqSM534.js'))
			},
			{
				id: "/api/change-password",
				pattern: /^\/api\/change-password\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-CXbCKD7q.js'))
			},
			{
				id: "/api/class-students",
				pattern: /^\/api\/class-students\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-BmGQi5_f.js'))
			},
			{
				id: "/api/dashboard",
				pattern: /^\/api\/dashboard\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-8GfkWxGm.js'))
			},
			{
				id: "/api/departments",
				pattern: /^\/api\/departments\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-DhnN09tK.js'))
			},
			{
				id: "/api/grades/grade-items",
				pattern: /^\/api\/grades\/grade-items\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-hCxpMZfb.js'))
			},
			{
				id: "/api/grades/save",
				pattern: /^\/api\/grades\/save\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-IItkEPMv.js'))
			},
			{
				id: "/api/rooms",
				pattern: /^\/api\/rooms\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-KBq4LS5O.js'))
			},
			{
				id: "/api/schedules",
				pattern: /^\/api\/schedules\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-Doo2EOXi.js'))
			},
			{
				id: "/api/sections",
				pattern: /^\/api\/sections\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-CVgYDqPJ.js'))
			},
			{
				id: "/api/student-grades",
				pattern: /^\/api\/student-grades\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-DGORe5Xv.js'))
			},
			{
				id: "/api/subjects",
				pattern: /^\/api\/subjects\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-Cemj5Dq0.js'))
			},
			{
				id: "/api/teacher-sections",
				pattern: /^\/api\/teacher-sections\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-qUrdq7YF.js'))
			},
			{
				id: "/api/users",
				pattern: /^\/api\/users\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-l9IC5Sm7.js'))
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
