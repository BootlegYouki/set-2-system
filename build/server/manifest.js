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
				endpoint: __memo(() => import('./chunks/_server-ClWOY2Rb.js'))
			},
			{
				id: "/api/accounts/next-number",
				pattern: /^\/api\/accounts\/next-number\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-C0IL--j-.js'))
			},
			{
				id: "/api/activity-logs",
				pattern: /^\/api\/activity-logs\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-C-sgWUJJ.js'))
			},
			{
				id: "/api/activity-types",
				pattern: /^\/api\/activity-types\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-BUrFCjmj.js'))
			},
			{
				id: "/api/admin-settings",
				pattern: /^\/api\/admin-settings\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-uop2RpOS.js'))
			},
			{
				id: "/api/archived-students",
				pattern: /^\/api\/archived-students\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-By8gFSqj.js'))
			},
			{
				id: "/api/auth",
				pattern: /^\/api\/auth\/?$/,
				params: [],
				page: null,
<<<<<<< HEAD
				endpoint: __memo(() => import('./chunks/_server-BDTGGGjq.js'))
=======
				endpoint: __memo(() => import('./chunks/_server-hEnWSObN.js'))
>>>>>>> parent of c9b2671 (Fix auth endpoint MongoDB connection)
			},
			{
				id: "/api/change-password",
				pattern: /^\/api\/change-password\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-BCUsgEIT.js'))
			},
			{
				id: "/api/class-students",
				pattern: /^\/api\/class-students\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-BxOr6owC.js'))
			},
			{
				id: "/api/dashboard",
				pattern: /^\/api\/dashboard\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-DXDL72BJ.js'))
			},
			{
				id: "/api/departments",
				pattern: /^\/api\/departments\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-DhyG-liP.js'))
			},
			{
				id: "/api/document-requests",
				pattern: /^\/api\/document-requests\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-D4FhWVqy.js'))
			},
			{
				id: "/api/grades",
				pattern: /^\/api\/grades\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-z3jwboDX.js'))
			},
			{
				id: "/api/grades/grade-items",
				pattern: /^\/api\/grades\/grade-items\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-Dagf0-X0.js'))
			},
			{
				id: "/api/grades/save",
				pattern: /^\/api\/grades\/save\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-D4skhckW.js'))
			},
			{
				id: "/api/notifications",
				pattern: /^\/api\/notifications\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-Dt2b7EXR.js'))
			},
			{
				id: "/api/rooms",
				pattern: /^\/api\/rooms\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-CydLJnia.js'))
			},
			{
				id: "/api/schedules",
				pattern: /^\/api\/schedules\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-Dc_eL-X6.js'))
			},
			{
				id: "/api/sections",
				pattern: /^\/api\/sections\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-DMfYXixH.js'))
			},
			{
				id: "/api/student-grades",
				pattern: /^\/api\/student-grades\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-HA8WZ3G1.js'))
			},
			{
				id: "/api/student-grades/verified",
				pattern: /^\/api\/student-grades\/verified\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-BkDusiOP.js'))
			},
			{
				id: "/api/student-profile",
				pattern: /^\/api\/student-profile\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-CN0lWx-H.js'))
			},
			{
				id: "/api/student-todos",
				pattern: /^\/api\/student-todos\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-DeGLERlJ.js'))
			},
			{
				id: "/api/subjects",
				pattern: /^\/api\/subjects\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-mKmT9RY7.js'))
			},
			{
				id: "/api/teacher-advisory",
				pattern: /^\/api\/teacher-advisory\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-W-sFYYLt.js'))
			},
			{
				id: "/api/teacher-sections",
				pattern: /^\/api\/teacher-sections\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-u0ERJCLL.js'))
			},
			{
				id: "/api/users",
				pattern: /^\/api\/users\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-edvqIbiG.js'))
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
