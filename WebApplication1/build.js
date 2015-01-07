({
	baseUrl: "Scripts/",
	exclude: ["jquery", "knockout", "grapnel"],
	mainConfigFile: "Scripts/Main.js",
	name: "Main",
	inlineText: true,
	findNestedDependencies: true,
	out: "main-opt.js",
	optimize: "uglify2",
	generateSourceMaps: true,
	preserveLicenseComments: false
})
