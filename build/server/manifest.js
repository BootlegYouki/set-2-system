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
<<<<<<< HEAD
<<<<<<< HEAD
		client: {start:"_app/immutable/entry/start.BVhJRW1W.js",app:"_app/immutable/entry/app.BVViNp5k.js",imports:["_app/immutable/entry/start.BVhJRW1W.js","_app/immutable/chunks/CtgYBX0C.js","_app/immutable/chunks/CzqljEhS.js","_app/immutable/entry/app.BVViNp5k.js","_app/immutable/chunks/D9Z9MdNV.js","_app/immutable/chunks/CzqljEhS.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/ByzzCBZf.js","_app/immutable/chunks/CKS5_Eeq.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-1TJ8oZsW.js')),
			__memo(() => import('./chunks/1-9fjkOKuo.js')),
=======
		client: {start:"_app/immutable/entry/start.DLbfXL9y.js",app:"_app/immutable/entry/app.BtKyNcwI.js",imports:["_app/immutable/entry/start.DLbfXL9y.js","_app/immutable/chunks/TGBNDD1m.js","_app/immutable/chunks/CzqljEhS.js","_app/immutable/entry/app.BtKyNcwI.js","_app/immutable/chunks/D9Z9MdNV.js","_app/immutable/chunks/CzqljEhS.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/ByzzCBZf.js","_app/immutable/chunks/CKS5_Eeq.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-1TJ8oZsW.js')),
			__memo(() => import('./chunks/1-UWNBRgW6.js')),
>>>>>>> parent of c9b2671 (Fix auth endpoint MongoDB connection)
=======
		client: {start:"_app/immutable/entry/start.BcHn8Cv6.js",app:"_app/immutable/entry/app.9MGQFgnS.js",imports:["_app/immutable/entry/start.BcHn8Cv6.js","_app/immutable/chunks/B8zd8TXP.js","_app/immutable/chunks/CzqljEhS.js","_app/immutable/entry/app.9MGQFgnS.js","_app/immutable/chunks/D9Z9MdNV.js","_app/immutable/chunks/CzqljEhS.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/ByzzCBZf.js","_app/immutable/chunks/CKS5_Eeq.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-1TJ8oZsW.js')),
			__memo(() => import('./chunks/1-BnTEhg2s.js')),
>>>>>>> parent of bf4b5c3 (Fix MongoDB SSL/TLS configuration and error handling)
			__memo(() => import('./chunks/2-BkjXd7F2.js'))
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
				endpoint: __memo(() => import('./chunks/_server-Bp-QZagJ.js'))
			},
			{
				id: "/api/accounts/next-number",
				pattern: /^\/api\/accounts\/next-number\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-CSoXP8-W.js'))
			},
			{
				id: "/api/activity-logs",
				pattern: /^\/api\/activity-logs\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-DA2tdThx.js'))
			},
			{
				id: "/api/activity-types",
				pattern: /^\/api\/activity-types\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-BeehkNWZ.js'))
			},
			{
				id: "/api/admin-settings",
				pattern: /^\/api\/admin-settings\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-B4KAEAaD.js'))
			},
			{
				id: "/api/archived-students",
				pattern: /^\/api\/archived-students\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-DUgOikLU.js'))
			},
			{
				id: "/api/auth",
				pattern: /^\/api\/auth\/?$/,
				params: [],
				page: null,
<<<<<<< HEAD
<<<<<<< HEAD
				endpoint: __memo(() => import('./chunks/_server-BDTGGGjq.js'))
=======
				endpoint: __memo(() => import('./chunks/_server-hEnWSObN.js'))
>>>>>>> parent of c9b2671 (Fix auth endpoint MongoDB connection)
=======
				endpoint: __memo(() => import('./chunks/_server-3YiRus9D.js'))
>>>>>>> parent of bf4b5c3 (Fix MongoDB SSL/TLS configuration and error handling)
			},
			{
				id: "/api/change-password",
				pattern: /^\/api\/change-password\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-baJgLcE5.js'))
			},
			{
				id: "/api/class-students",
				pattern: /^\/api\/class-students\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-BUfAzd_N.js'))
			},
			{
				id: "/api/dashboard",
				pattern: /^\/api\/dashboard\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-DifchG9t.js'))
			},
			{
				id: "/api/departments",
				pattern: /^\/api\/departments\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-ClnyUJrs.js'))
			},
			{
				id: "/api/document-requests",
				pattern: /^\/api\/document-requests\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-VM9EwZfd.js'))
			},
			{
				id: "/api/grades",
				pattern: /^\/api\/grades\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-DLa8vdtT.js'))
			},
			{
				id: "/api/grades/grade-items",
				pattern: /^\/api\/grades\/grade-items\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-DQf9VsYg.js'))
			},
			{
				id: "/api/grades/save",
				pattern: /^\/api\/grades\/save\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-CScUBOyP.js'))
			},
			{
				id: "/api/notifications",
				pattern: /^\/api\/notifications\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-PSwl88rO.js'))
			},
			{
				id: "/api/rooms",
				pattern: /^\/api\/rooms\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-BNu-BofQ.js'))
			},
			{
				id: "/api/schedules",
				pattern: /^\/api\/schedules\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-U2red-BM.js'))
			},
			{
				id: "/api/sections",
				pattern: /^\/api\/sections\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-CuJzcXlr.js'))
			},
			{
				id: "/api/student-grades",
				pattern: /^\/api\/student-grades\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-sU-JaWw8.js'))
			},
			{
				id: "/api/student-grades/verified",
				pattern: /^\/api\/student-grades\/verified\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-BxDegv-G.js'))
			},
			{
				id: "/api/student-profile",
				pattern: /^\/api\/student-profile\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-p4_szQ4V.js'))
			},
			{
				id: "/api/student-todos",
				pattern: /^\/api\/student-todos\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-Br22zqWy.js'))
			},
			{
				id: "/api/subjects",
				pattern: /^\/api\/subjects\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-Drb5E3Zl.js'))
			},
			{
				id: "/api/teacher-advisory",
				pattern: /^\/api\/teacher-advisory\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-DKZLuguv.js'))
			},
			{
				id: "/api/teacher-sections",
				pattern: /^\/api\/teacher-sections\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-CUWAQpLD.js'))
			},
			{
				id: "/api/users",
				pattern: /^\/api\/users\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-B7-yR6V3.js'))
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
