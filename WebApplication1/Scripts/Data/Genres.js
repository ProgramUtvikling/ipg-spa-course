define(["knockout"], function (ko) {
	var lookupFunction = function (genreId) {
		if (ko.utils.unwrapObservable(genreId)) {
			genreId = genreId();
		}
		return 'x2-genre no. ' + genreId;
	}

	return {
		lookupFunctionName: "genre",
		lookupFunction: lookupFunction
	};
});