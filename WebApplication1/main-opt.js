define('withLookups',["knockout"], function (ko) {
	return function () {
		ko.bindingHandlers.withLookups = {
			init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
				var lookups = {};
				var arrayOfLookupNames = valueAccessor();
				require(arrayOfLookupNames, function () {
					for (var i = 0; i < arguments.length; i++) {
						var lookupModule = arguments[i];
						console.log(lookupModule.lookupFunctionName);
						lookups[lookupModule.lookupFunctionName] = lookupModule.lookupFunction;
					}
				});

				var innerBindingContext = bindingContext.extend(lookups);
				ko.applyBindingsToDescendants(innerBindingContext, element);

				//ko.virtualElements.allowedBindings.withLookups = true;

				return { controlsDescendantBindings: true };
			}
		};
	}
});
/**
 * @license RequireJS domReady 2.0.1 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/domReady for details
 */
/*jslint */
/*global require: false, define: false, requirejs: false,
  window: false, clearInterval: false, document: false,
  self: false, setInterval: false */


define('domready',[],function () {
    

    var isTop, testDiv, scrollIntervalId,
        isBrowser = typeof window !== "undefined" && window.document,
        isPageLoaded = !isBrowser,
        doc = isBrowser ? document : null,
        readyCalls = [];

    function runCallbacks(callbacks) {
        var i;
        for (i = 0; i < callbacks.length; i += 1) {
            callbacks[i](doc);
        }
    }

    function callReady() {
        var callbacks = readyCalls;

        if (isPageLoaded) {
            //Call the DOM ready callbacks
            if (callbacks.length) {
                readyCalls = [];
                runCallbacks(callbacks);
            }
        }
    }

    /**
     * Sets the page as loaded.
     */
    function pageLoaded() {
        if (!isPageLoaded) {
            isPageLoaded = true;
            if (scrollIntervalId) {
                clearInterval(scrollIntervalId);
            }

            callReady();
        }
    }

    if (isBrowser) {
        if (document.addEventListener) {
            //Standards. Hooray! Assumption here that if standards based,
            //it knows about DOMContentLoaded.
            document.addEventListener("DOMContentLoaded", pageLoaded, false);
            window.addEventListener("load", pageLoaded, false);
        } else if (window.attachEvent) {
            window.attachEvent("onload", pageLoaded);

            testDiv = document.createElement('div');
            try {
                isTop = window.frameElement === null;
            } catch (e) {}

            //DOMContentLoaded approximation that uses a doScroll, as found by
            //Diego Perini: http://javascript.nwbox.com/IEContentLoaded/,
            //but modified by other contributors, including jdalton
            if (testDiv.doScroll && isTop && window.external) {
                scrollIntervalId = setInterval(function () {
                    try {
                        testDiv.doScroll();
                        pageLoaded();
                    } catch (e) {}
                }, 30);
            }
        }

        //Check if document already complete, and if so, just trigger page load
        //listeners. Latest webkit browsers also use "interactive", and
        //will fire the onDOMContentLoaded before "interactive" but not after
        //entering "interactive" or "complete". More details:
        //http://dev.w3.org/html5/spec/the-end.html#the-end
        //http://stackoverflow.com/questions/3665561/document-readystate-of-interactive-vs-ondomcontentloaded
        //Hmm, this is more complicated on further use, see "firing too early"
        //bug: https://github.com/requirejs/domReady/issues/1
        //so removing the || document.readyState === "interactive" test.
        //There is still a window.onload binding that should get fired if
        //DOMContentLoaded is missed.
        if (document.readyState === "complete") {
            pageLoaded();
        }
    }

    /** START OF PUBLIC API **/

    /**
     * Registers a callback for DOM ready. If DOM is already ready, the
     * callback is called immediately.
     * @param {Function} callback
     */
    function domReady(callback) {
        if (isPageLoaded) {
            callback(doc);
        } else {
            readyCalls.push(callback);
        }
        return domReady;
    }

    domReady.version = '2.0.1';

    /**
     * Loader Plugin API method
     */
    domReady.load = function (name, req, onLoad, config) {
        if (config.isBuild) {
            onLoad(null);
        } else {
            domReady(onLoad);
        }
    };

    /** END OF PUBLIC API **/

    return domReady;
});


/*! Knockout projections plugin - version 1.1.0
------------------------------------------------------------------------------
Copyright (c) Microsoft Corporation
All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 
THIS CODE IS PROVIDED *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABLITY OR NON-INFRINGEMENT.
See the Apache Version 2.0 License for specific language governing permissions and limitations under the License.
------------------------------------------------------------------------------
*/

(function(global, undefined) {
    

    var exclusionMarker = {};

    function StateItem(ko, inputItem, initialStateArrayIndex, initialOutputArrayIndex, mappingOptions, arrayOfState, outputObservableArray) {
        // Capture state for later use
        this.inputItem = inputItem;
        this.stateArrayIndex = initialStateArrayIndex;
        this.mappingOptions = mappingOptions;
        this.arrayOfState = arrayOfState;
        this.outputObservableArray = outputObservableArray;
        this.outputArray = this.outputObservableArray.peek();
        this.isIncluded = null; // Means 'not yet determined'
        this.suppressNotification = false; // TODO: Instead of this technique, consider raising a sparse diff with a "mutated" entry when a single item changes, and not having any other change logic inside StateItem

        // Set up observables
        this.outputArrayIndex = ko.observable(initialOutputArrayIndex); // When excluded, it's the position the item would go if it became included
        this.disposeFuncFromMostRecentMapping = null;
        this.mappedValueComputed = ko.computed(this.mappingEvaluator, this);
        this.mappedValueComputed.subscribe(this.onMappingResultChanged, this);
        this.previousMappedValue = this.mappedValueComputed.peek();
    }

    StateItem.prototype.dispose = function() {
        this.mappedValueComputed.dispose();
        this.disposeResultFromMostRecentEvaluation();
    };

    StateItem.prototype.disposeResultFromMostRecentEvaluation = function() {
        if (this.disposeFuncFromMostRecentMapping) {
            this.disposeFuncFromMostRecentMapping();
            this.disposeFuncFromMostRecentMapping = null;
        }

        if (this.mappingOptions.disposeItem) {
            var mappedItem = this.mappedValueComputed();
            this.mappingOptions.disposeItem(mappedItem);
        }
    };

    StateItem.prototype.mappingEvaluator = function() {
        if (this.isIncluded !== null) { // i.e., not first run
            // This is a replace-in-place, so call any dispose callbacks
            // we have for the earlier value
            this.disposeResultFromMostRecentEvaluation();
        }

        var mappedValue;
        if (this.mappingOptions.mapping) {
            mappedValue = this.mappingOptions.mapping(this.inputItem, this.outputArrayIndex);
        } else if (this.mappingOptions.mappingWithDisposeCallback) {
            var mappedValueWithDisposeCallback = this.mappingOptions.mappingWithDisposeCallback(this.inputItem, this.outputArrayIndex);
            if (!('mappedValue' in mappedValueWithDisposeCallback)) {
                throw new Error('Return value from mappingWithDisposeCallback should have a \'mappedItem\' property.');
            }
            mappedValue = mappedValueWithDisposeCallback.mappedValue;
            this.disposeFuncFromMostRecentMapping = mappedValueWithDisposeCallback.dispose;
        } else {
            throw new Error('No mapping callback given.');
        }

        var newInclusionState = mappedValue !== exclusionMarker;

        // Inclusion state changes can *only* happen as a result of changing an individual item.
        // Structural changes to the array can't cause this (because they don't cause any remapping;
        // they only map newly added items which have no earlier inclusion state to change).
        if (this.isIncluded !== newInclusionState) {
            if (this.isIncluded !== null) { // i.e., not first run
                this.moveSubsequentItemsBecauseInclusionStateChanged(newInclusionState);
            }

            this.isIncluded = newInclusionState;
        }

        return mappedValue;
    };

    StateItem.prototype.onMappingResultChanged = function(newValue) {
        if (newValue !== this.previousMappedValue) {
            if (this.isIncluded) {
                this.outputArray.splice(this.outputArrayIndex.peek(), 1, newValue);
            }

            if (!this.suppressNotification) {
                this.outputObservableArray.valueHasMutated();
            }

            this.previousMappedValue = newValue;
        }
    };

    StateItem.prototype.moveSubsequentItemsBecauseInclusionStateChanged = function(newInclusionState) {
        var outputArrayIndex = this.outputArrayIndex.peek(),
            iterationIndex,
            stateItem;

        if (newInclusionState) {
            // Shift all subsequent items along by one space, and increment their indexes.
            // Note that changing their indexes might cause remapping, but won't affect their
            // inclusion status (by definition, inclusion status must not be affected by index,
            // otherwise you get undefined results) so there's no risk of a chain reaction.
            this.outputArray.splice(outputArrayIndex, 0, null);
            for (iterationIndex = this.stateArrayIndex + 1; iterationIndex < this.arrayOfState.length; iterationIndex++) {
                stateItem = this.arrayOfState[iterationIndex];
                stateItem.setOutputArrayIndexSilently(stateItem.outputArrayIndex.peek() + 1);
            }
        } else {
            // Shift all subsequent items back by one space, and decrement their indexes
            this.outputArray.splice(outputArrayIndex, 1);
            for (iterationIndex = this.stateArrayIndex + 1; iterationIndex < this.arrayOfState.length; iterationIndex++) {
                stateItem = this.arrayOfState[iterationIndex];
                stateItem.setOutputArrayIndexSilently(stateItem.outputArrayIndex.peek() - 1);
            }
        }
    };

    StateItem.prototype.setOutputArrayIndexSilently = function(newIndex) {
        // We only want to raise one output array notification per input array change,
        // so during processing, we suppress notifications
        this.suppressNotification = true;
        this.outputArrayIndex(newIndex);
        this.suppressNotification = false;
    };

    function getDiffEntryPostOperationIndex(diffEntry, editOffset) {
        // The diff algorithm's "index" value refers to the output array for additions,
        // but the "input" array for deletions. Get the output array position.
        if (!diffEntry) { return null; }
        switch (diffEntry.status) {
        case 'added':
            return diffEntry.index;
        case 'deleted':
            return diffEntry.index + editOffset;
        default:
            throw new Error('Unknown diff status: ' + diffEntry.status);
        }
    }

    function insertOutputItem(ko, diffEntry, movedStateItems, stateArrayIndex, outputArrayIndex, mappingOptions, arrayOfState, outputObservableArray, outputArray) {
        // Retain the existing mapped value if this is a move, otherwise perform mapping
        var isMoved = typeof diffEntry.moved === 'number',
            stateItem = isMoved ?
                movedStateItems[diffEntry.moved] :
                new StateItem(ko, diffEntry.value, stateArrayIndex, outputArrayIndex, mappingOptions, arrayOfState, outputObservableArray);
        arrayOfState.splice(stateArrayIndex, 0, stateItem);
        if (stateItem.isIncluded) {
            outputArray.splice(outputArrayIndex, 0, stateItem.mappedValueComputed.peek());
        }

        // Update indexes
        if (isMoved) {
            // We don't change the index until *after* updating this item's position in outputObservableArray,
            // because changing the index may trigger re-mapping, which in turn would cause the new
            // value to be written to the 'index' position in the output array
            stateItem.stateArrayIndex = stateArrayIndex;
            stateItem.setOutputArrayIndexSilently(outputArrayIndex);
        }

        return stateItem;
    }

    function deleteOutputItem(diffEntry, arrayOfState, stateArrayIndex, outputArrayIndex, outputArray) {
        var stateItem = arrayOfState.splice(stateArrayIndex, 1)[0];
        if (stateItem.isIncluded) {
            outputArray.splice(outputArrayIndex, 1);
        }
        if (typeof diffEntry.moved !== 'number') {
            // Be careful to dispose only if this item really was deleted and not moved
            stateItem.dispose();
        }
    }

    function updateRetainedOutputItem(stateItem, stateArrayIndex, outputArrayIndex) {
        // Just have to update its indexes
        stateItem.stateArrayIndex = stateArrayIndex;
        stateItem.setOutputArrayIndexSilently(outputArrayIndex);

        // Return the new value for outputArrayIndex
        return outputArrayIndex + (stateItem.isIncluded ? 1 : 0);
    }

    function makeLookupOfMovedStateItems(diff, arrayOfState) {
        // Before we mutate arrayOfComputedMappedValues at all, grab a reference to each moved item
        var movedStateItems = {};
        for (var diffIndex = 0; diffIndex < diff.length; diffIndex++) {
            var diffEntry = diff[diffIndex];
            if (diffEntry.status === 'added' && (typeof diffEntry.moved === 'number')) {
                movedStateItems[diffEntry.moved] = arrayOfState[diffEntry.moved];
            }
        }
        return movedStateItems;
    }

    function getFirstModifiedOutputIndex(firstDiffEntry, arrayOfState, outputArray) {
        // Work out where the first edit will affect the output array
        // Then we can update outputArrayIndex incrementally while walking the diff list
        if (!outputArray.length || !arrayOfState[firstDiffEntry.index]) {
            // The first edit is beyond the end of the output or state array, so we must
            // just be appending items.
            return outputArray.length;
        } else {
            // The first edit corresponds to an existing state array item, so grab
            // the first output array index from it.
            return arrayOfState[firstDiffEntry.index].outputArrayIndex.peek();
        }
    }

    function respondToArrayStructuralChanges(ko, inputObservableArray, arrayOfState, outputArray, outputObservableArray, mappingOptions) {
        return inputObservableArray.subscribe(function(diff) {
            if (!diff.length) {
                return;
            }

            var movedStateItems = makeLookupOfMovedStateItems(diff, arrayOfState),
                diffIndex = 0,
                diffEntry = diff[0],
                editOffset = 0, // A running total of (num(items added) - num(items deleted)) not accounting for filtering
                outputArrayIndex = diffEntry && getFirstModifiedOutputIndex(diffEntry, arrayOfState, outputArray);

            // Now iterate over the state array, at each stage checking whether the current item
            // is the next one to have been edited. We can skip all the state array items whose
            // indexes are less than the first edit index (i.e., diff[0].index).
            for (var stateArrayIndex = diffEntry.index; diffEntry || (stateArrayIndex < arrayOfState.length); stateArrayIndex++) {
                // Does the current diffEntry correspond to this position in the state array?
                if (getDiffEntryPostOperationIndex(diffEntry, editOffset) === stateArrayIndex) {
                    // Yes - insert or delete the corresponding state and output items
                    switch (diffEntry.status) {
                    case 'added':
                        // Add to output, and update indexes
                        var stateItem = insertOutputItem(ko, diffEntry, movedStateItems, stateArrayIndex, outputArrayIndex, mappingOptions, arrayOfState, outputObservableArray, outputArray);
                        if (stateItem.isIncluded) {
                            outputArrayIndex++;
                        }
                        editOffset++;
                        break;
                    case 'deleted':
                        // Just erase from the output, and update indexes
                        deleteOutputItem(diffEntry, arrayOfState, stateArrayIndex, outputArrayIndex, outputArray);
                        editOffset--;
                        stateArrayIndex--; // To compensate for the "for" loop incrementing it
                        break;
                    default:
                        throw new Error('Unknown diff status: ' + diffEntry.status);
                    }

                    // We're done with this diff entry. Move on to the next one.
                    diffIndex++;
                    diffEntry = diff[diffIndex];
                } else if (stateArrayIndex < arrayOfState.length) {
                    // No - the current item was retained. Just update its index.
                    outputArrayIndex = updateRetainedOutputItem(arrayOfState[stateArrayIndex], stateArrayIndex, outputArrayIndex);
                }
            }

            outputObservableArray.valueHasMutated();
        }, null, 'arrayChange');
    }

    // Mapping
    function observableArrayMap(ko, mappingOptions) {
        var inputObservableArray = this,
            arrayOfState = [],
            outputArray = [],
            outputObservableArray = ko.observableArray(outputArray),
            originalInputArrayContents = inputObservableArray.peek();

        // Shorthand syntax - just pass a function instead of an options object
        if (typeof mappingOptions === 'function') {
            mappingOptions = { mapping: mappingOptions };
        }

        // Validate the options
        if (mappingOptions.mappingWithDisposeCallback) {
            if (mappingOptions.mapping || mappingOptions.disposeItem) {
                throw new Error('\'mappingWithDisposeCallback\' cannot be used in conjunction with \'mapping\' or \'disposeItem\'.');
            }
        } else if (!mappingOptions.mapping) {
            throw new Error('Specify either \'mapping\' or \'mappingWithDisposeCallback\'.');
        }

        // Initial state: map each of the inputs
        for (var i = 0; i < originalInputArrayContents.length; i++) {
            var inputItem = originalInputArrayContents[i],
                stateItem = new StateItem(ko, inputItem, i, outputArray.length, mappingOptions, arrayOfState, outputObservableArray),
                mappedValue = stateItem.mappedValueComputed.peek();
            arrayOfState.push(stateItem);

            if (stateItem.isIncluded) {
                outputArray.push(mappedValue);
            }
        }

        // If the input array changes structurally (items added or removed), update the outputs
        var inputArraySubscription = respondToArrayStructuralChanges(ko, inputObservableArray, arrayOfState, outputArray, outputObservableArray, mappingOptions);

        // Return value is a readonly computed which can track its own changes to permit chaining.
        // When disposed, it cleans up everything it created.
        var returnValue = ko.computed(outputObservableArray).extend({ trackArrayChanges: true }),
            originalDispose = returnValue.dispose;
        returnValue.dispose = function() {
            inputArraySubscription.dispose();
            ko.utils.arrayForEach(arrayOfState, function(stateItem) {
                stateItem.dispose();
            });
            originalDispose.call(this, arguments);
        };

        // Make projections chainable
        addProjectionFunctions(ko, returnValue);

        return returnValue;
    }

    // Filtering
    function observableArrayFilter(ko, predicate) {
        return observableArrayMap.call(this, ko, function(item) {
            return predicate(item) ? item : exclusionMarker;
        });
    }

    // Attaching projection functions
    // ------------------------------
    //
    // Builds a collection of projection functions that can quickly be attached to any object.
    // The functions are predefined to retain 'this' and prefix the arguments list with the
    // relevant 'ko' instance.

    var projectionFunctionsCacheName = '_ko.projections.cache';

    function attachProjectionFunctionsCache(ko) {
        // Wraps callback so that, when invoked, its arguments list is prefixed by 'ko' and 'this' 
        function makeCaller(ko, callback) {
            return function() {
                return callback.apply(this, [ko].concat(Array.prototype.slice.call(arguments, 0)));
            };
        }
        ko[projectionFunctionsCacheName] = {
            map: makeCaller(ko, observableArrayMap),
            filter: makeCaller(ko, observableArrayFilter)
        };
    }

    function addProjectionFunctions(ko, target) {
        ko.utils.extend(target, ko[projectionFunctionsCacheName]);
        return target; // Enable chaining
    }

    // Module initialisation
    // ---------------------
    //
    // When this script is first evaluated, it works out what kind of module loading scenario
    // it is in (Node.js or a browser `<script>` tag), and then attaches itself to whichever
    // instance of Knockout.js it can find.

    function attachToKo(ko) {
        ko.projections = {
            _exclusionMarker: exclusionMarker
        };
        attachProjectionFunctionsCache(ko);
        addProjectionFunctions(ko, ko.observableArray.fn); // Make all observable arrays projectable
    }

    // Determines which module loading scenario we're in, grabs dependencies, and attaches to KO
    function prepareExports() {
        if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
            // Node.js case - load KO synchronously
            var ko = require('knockout');
            attachToKo(ko);
            module.exports = ko;
        } else if (typeof define === 'function' && define.amd) {
            define('koprojections',['knockout'], attachToKo);
        } else if ('ko' in global) {
            // Non-module case - attach to the global instance
            attachToKo(global.ko);
        }
    }

    prepareExports();

})(this);

/// Knockout Mapping plugin v2.4.1
/// (c) 2013 Steven Sanderson, Roy Jacobs - http://knockoutjs.com/
/// License: MIT (http://www.opensource.org/licenses/mit-license.php)
(function(e){"function"===typeof require&&"object"===typeof exports&&"object"===typeof module?e(require("knockout"),exports):"function"===typeof define&&define.amd?define('komapping',["knockout","exports"],e):e(ko,ko.mapping={})})(function(e,f){function y(b,c){var a,d;for(d in c)if(c.hasOwnProperty(d)&&c[d])if(a=f.getType(b[d]),d&&b[d]&&"array"!==a&&"string"!==a)y(b[d],c[d]);else if("array"===f.getType(b[d])&&"array"===f.getType(c[d])){a=b;for(var e=d,l=b[d],n=c[d],t={},g=l.length-1;0<=g;--g)t[l[g]]=l[g];for(g=
n.length-1;0<=g;--g)t[n[g]]=n[g];l=[];n=void 0;for(n in t)l.push(t[n]);a[e]=l}else b[d]=c[d]}function E(b,c){var a={};y(a,b);y(a,c);return a}function z(b,c){for(var a=E({},b),e=L.length-1;0<=e;e--){var f=L[e];a[f]&&(a[""]instanceof Object||(a[""]={}),a[""][f]=a[f],delete a[f])}c&&(a.ignore=h(c.ignore,a.ignore),a.include=h(c.include,a.include),a.copy=h(c.copy,a.copy),a.observe=h(c.observe,a.observe));a.ignore=h(a.ignore,j.ignore);a.include=h(a.include,j.include);a.copy=h(a.copy,j.copy);a.observe=h(a.observe,
j.observe);a.mappedProperties=a.mappedProperties||{};a.copiedProperties=a.copiedProperties||{};return a}function h(b,c){"array"!==f.getType(b)&&(b="undefined"===f.getType(b)?[]:[b]);"array"!==f.getType(c)&&(c="undefined"===f.getType(c)?[]:[c]);return e.utils.arrayGetDistinctValues(b.concat(c))}function F(b,c,a,d,k,l,n){var t="array"===f.getType(e.utils.unwrapObservable(c));l=l||"";if(f.isMapped(b)){var g=e.utils.unwrapObservable(b)[p];a=E(g,a)}var j=n||k,h=function(){return a[d]&&a[d].create instanceof
Function},x=function(b){var f=G,g=e.dependentObservable;e.dependentObservable=function(a,b,c){c=c||{};a&&"object"==typeof a&&(c=a);var d=c.deferEvaluation,M=!1;c.deferEvaluation=!0;a=new H(a,b,c);if(!d){var g=a,d=e.dependentObservable;e.dependentObservable=H;a=e.isWriteableObservable(g);e.dependentObservable=d;d=H({read:function(){M||(e.utils.arrayRemoveItem(f,g),M=!0);return g.apply(g,arguments)},write:a&&function(a){return g(a)},deferEvaluation:!0});d.__DO=g;a=d;f.push(a)}return a};e.dependentObservable.fn=
H.fn;e.computed=e.dependentObservable;b=e.utils.unwrapObservable(k)instanceof Array?a[d].create({data:b||c,parent:j,skip:N}):a[d].create({data:b||c,parent:j});e.dependentObservable=g;e.computed=e.dependentObservable;return b},u=function(){return a[d]&&a[d].update instanceof Function},v=function(b,f){var g={data:f||c,parent:j,target:e.utils.unwrapObservable(b)};e.isWriteableObservable(b)&&(g.observable=b);return a[d].update(g)};if(n=I.get(c))return n;d=d||"";if(t){var t=[],s=!1,m=function(a){return a};
a[d]&&a[d].key&&(m=a[d].key,s=!0);e.isObservable(b)||(b=e.observableArray([]),b.mappedRemove=function(a){var c="function"==typeof a?a:function(b){return b===m(a)};return b.remove(function(a){return c(m(a))})},b.mappedRemoveAll=function(a){var c=C(a,m);return b.remove(function(a){return-1!=e.utils.arrayIndexOf(c,m(a))})},b.mappedDestroy=function(a){var c="function"==typeof a?a:function(b){return b===m(a)};return b.destroy(function(a){return c(m(a))})},b.mappedDestroyAll=function(a){var c=C(a,m);return b.destroy(function(a){return-1!=
e.utils.arrayIndexOf(c,m(a))})},b.mappedIndexOf=function(a){var c=C(b(),m);a=m(a);return e.utils.arrayIndexOf(c,a)},b.mappedGet=function(a){return b()[b.mappedIndexOf(a)]},b.mappedCreate=function(a){if(-1!==b.mappedIndexOf(a))throw Error("There already is an object with the key that you specified.");var c=h()?x(a):a;u()&&(a=v(c,a),e.isWriteableObservable(c)?c(a):c=a);b.push(c);return c});n=C(e.utils.unwrapObservable(b),m).sort();g=C(c,m);s&&g.sort();s=e.utils.compareArrays(n,g);n={};var J,A=e.utils.unwrapObservable(c),
y={},z=!0,g=0;for(J=A.length;g<J;g++){var r=m(A[g]);if(void 0===r||r instanceof Object){z=!1;break}y[r]=A[g]}var A=[],B=0,g=0;for(J=s.length;g<J;g++){var r=s[g],q,w=l+"["+g+"]";switch(r.status){case "added":var D=z?y[r.value]:K(e.utils.unwrapObservable(c),r.value,m);q=F(void 0,D,a,d,b,w,k);h()||(q=e.utils.unwrapObservable(q));w=O(e.utils.unwrapObservable(c),D,n);q===N?B++:A[w-B]=q;n[w]=!0;break;case "retained":D=z?y[r.value]:K(e.utils.unwrapObservable(c),r.value,m);q=K(b,r.value,m);F(q,D,a,d,b,w,
k);w=O(e.utils.unwrapObservable(c),D,n);A[w]=q;n[w]=!0;break;case "deleted":q=K(b,r.value,m)}t.push({event:r.status,item:q})}b(A);a[d]&&a[d].arrayChanged&&e.utils.arrayForEach(t,function(b){a[d].arrayChanged(b.event,b.item)})}else if(P(c)){b=e.utils.unwrapObservable(b);if(!b){if(h())return s=x(),u()&&(s=v(s)),s;if(u())return v(s);b={}}u()&&(b=v(b));I.save(c,b);if(u())return b;Q(c,function(d){var f=l.length?l+"."+d:d;if(-1==e.utils.arrayIndexOf(a.ignore,f))if(-1!=e.utils.arrayIndexOf(a.copy,f))b[d]=
c[d];else if("object"!=typeof c[d]&&"array"!=typeof c[d]&&0<a.observe.length&&-1==e.utils.arrayIndexOf(a.observe,f))b[d]=c[d],a.copiedProperties[f]=!0;else{var g=I.get(c[d]),k=F(b[d],c[d],a,d,b,f,b),g=g||k;if(0<a.observe.length&&-1==e.utils.arrayIndexOf(a.observe,f))b[d]=g(),a.copiedProperties[f]=!0;else{if(e.isWriteableObservable(b[d])){if(g=e.utils.unwrapObservable(g),b[d]()!==g)b[d](g)}else g=void 0===b[d]?g:e.utils.unwrapObservable(g),b[d]=g;a.mappedProperties[f]=!0}}})}else switch(f.getType(c)){case "function":u()?
e.isWriteableObservable(c)?(c(v(c)),b=c):b=v(c):b=c;break;default:if(e.isWriteableObservable(b))return q=u()?v(b):e.utils.unwrapObservable(c),b(q),q;h()||u();b=h()?x():e.observable(e.utils.unwrapObservable(c));u()&&b(v(b))}return b}function O(b,c,a){for(var d=0,e=b.length;d<e;d++)if(!0!==a[d]&&b[d]===c)return d;return null}function R(b,c){var a;c&&(a=c(b));"undefined"===f.getType(a)&&(a=b);return e.utils.unwrapObservable(a)}function K(b,c,a){b=e.utils.unwrapObservable(b);for(var d=0,f=b.length;d<
f;d++){var l=b[d];if(R(l,a)===c)return l}throw Error("When calling ko.update*, the key '"+c+"' was not found!");}function C(b,c){return e.utils.arrayMap(e.utils.unwrapObservable(b),function(a){return c?R(a,c):a})}function Q(b,c){if("array"===f.getType(b))for(var a=0;a<b.length;a++)c(a);else for(a in b)c(a)}function P(b){var c=f.getType(b);return("object"===c||"array"===c)&&null!==b}function T(){var b=[],c=[];this.save=function(a,d){var f=e.utils.arrayIndexOf(b,a);0<=f?c[f]=d:(b.push(a),c.push(d))};
this.get=function(a){a=e.utils.arrayIndexOf(b,a);return 0<=a?c[a]:void 0}}function S(){var b={},c=function(a){var c;try{c=a}catch(e){c="$$$"}a=b[c];void 0===a&&(a=new T,b[c]=a);return a};this.save=function(a,b){c(a).save(a,b)};this.get=function(a){return c(a).get(a)}}var p="__ko_mapping__",H=e.dependentObservable,B=0,G,I,L=["create","update","key","arrayChanged"],N={},x={include:["_destroy"],ignore:[],copy:[],observe:[]},j=x;f.isMapped=function(b){return(b=e.utils.unwrapObservable(b))&&b[p]};f.fromJS=
function(b){if(0==arguments.length)throw Error("When calling ko.fromJS, pass the object you want to convert.");try{B++||(G=[],I=new S);var c,a;2==arguments.length&&(arguments[1][p]?a=arguments[1]:c=arguments[1]);3==arguments.length&&(c=arguments[1],a=arguments[2]);a&&(c=E(c,a[p]));c=z(c);var d=F(a,b,c);a&&(d=a);if(!--B)for(;G.length;){var e=G.pop();e&&(e(),e.__DO.throttleEvaluation=e.throttleEvaluation)}d[p]=E(d[p],c);return d}catch(f){throw B=0,f;}};f.fromJSON=function(b){var c=e.utils.parseJson(b);
arguments[0]=c;return f.fromJS.apply(this,arguments)};f.updateFromJS=function(){throw Error("ko.mapping.updateFromJS, use ko.mapping.fromJS instead. Please note that the order of parameters is different!");};f.updateFromJSON=function(){throw Error("ko.mapping.updateFromJSON, use ko.mapping.fromJSON instead. Please note that the order of parameters is different!");};f.toJS=function(b,c){j||f.resetDefaultOptions();if(0==arguments.length)throw Error("When calling ko.mapping.toJS, pass the object you want to convert.");
if("array"!==f.getType(j.ignore))throw Error("ko.mapping.defaultOptions().ignore should be an array.");if("array"!==f.getType(j.include))throw Error("ko.mapping.defaultOptions().include should be an array.");if("array"!==f.getType(j.copy))throw Error("ko.mapping.defaultOptions().copy should be an array.");c=z(c,b[p]);return f.visitModel(b,function(a){return e.utils.unwrapObservable(a)},c)};f.toJSON=function(b,c){var a=f.toJS(b,c);return e.utils.stringifyJson(a)};f.defaultOptions=function(){if(0<arguments.length)j=
arguments[0];else return j};f.resetDefaultOptions=function(){j={include:x.include.slice(0),ignore:x.ignore.slice(0),copy:x.copy.slice(0)}};f.getType=function(b){if(b&&"object"===typeof b){if(b.constructor===Date)return"date";if(b.constructor===Array)return"array"}return typeof b};f.visitModel=function(b,c,a){a=a||{};a.visitedObjects=a.visitedObjects||new S;var d,k=e.utils.unwrapObservable(b);if(P(k))a=z(a,k[p]),c(b,a.parentName),d="array"===f.getType(k)?[]:{};else return c(b,a.parentName);a.visitedObjects.save(b,
d);var l=a.parentName;Q(k,function(b){if(!(a.ignore&&-1!=e.utils.arrayIndexOf(a.ignore,b))){var j=k[b],g=a,h=l||"";"array"===f.getType(k)?l&&(h+="["+b+"]"):(l&&(h+="."),h+=b);g.parentName=h;if(!(-1===e.utils.arrayIndexOf(a.copy,b)&&-1===e.utils.arrayIndexOf(a.include,b)&&k[p]&&k[p].mappedProperties&&!k[p].mappedProperties[b]&&k[p].copiedProperties&&!k[p].copiedProperties[b]&&"array"!==f.getType(k)))switch(f.getType(e.utils.unwrapObservable(j))){case "object":case "array":case "undefined":g=a.visitedObjects.get(j);
d[b]="undefined"!==f.getType(g)?g:f.visitModel(j,c,a);break;default:d[b]=c(j,a.parentName)}}});return d}});

define('MyKoUtils',["knockout", "komapping"], function(ko, komapping) {
	

	var func = function (from, to) {
		var unwrapped = komapping.toJS(from);
		return komapping.fromJS(unwrapped, {}, to);

		//to = to || {};
		//for (var propertyname in from) {
		//	if (from.hasOwnProperty(propertyname) && propertyname.indexOf('__') !== 0) {

		//		// Get value either from normal property, or from observable
		//		var value = ko.isObservable(from[propertyname]) ?
		//			from[propertyname]() : from[propertyname];

		//		// Set value in one of these ways: exisiting observable,
		//		//   existing property or a new observable
		//		if (to[propertyname] === undefined) {
		//			to[propertyname] = ko.observable(value);
		//		} else if (ko.isObservable(to[propertyname])) {
		//			to[propertyname](value);
		//		} else {
		//			to[propertyname] = value;
		//		}
		//	}
		//}
		//return to;
	};

	return {
		copy: func,
		mergeInto: func,
}
});
define('Data/Movies',["jquery", "knockout", "komapping", "MyKoUtils"], function ($, ko, komapping, myKoUtils) {
	

	var isLoaded = false;
	var movies = ko.observableArray();

	var ensureLoaded = function () {
		var deferredObject = $.Deferred();
		if (isLoaded) {
			deferredObject.resolve();
		} else {
			$.ajax({
				url: '/Api/Movie',
				method: 'GET'
			}).then(function (data) {
				data.forEach(function (item) {
					movies.push(komapping.fromJS(item));
				});
				deferredObject.resolve();
			});
			isLoaded = true;
		}

		return deferredObject.promise();
	};


	var getMovies = function () {
		ensureLoaded();
		return movies;
	};

	var getMovie = function (id) {
		var movie = {
			id: ko.observable(),
			title: ko.observable("n/a"),
			productionYear: ko.observable(),
			runningLength: ko.observable(),
			vote: ko.observable()
		};

		$.ajax({
			url: '/Api/Movie/' + id,
			method: 'GET'
		}).then(function (data) {
			myKoUtils.mergeInto(data, movie);
			//komapping.fromJS(data, {}, movie);
		});

		return movie;
	};

	var updateMovie = function (movie) {
		$.ajax({
			url: '/Api/Movie/' + movie.id(),
			method: "PUT",
			data: komapping.toJSON(movie),
			dataType: 'json'
		}).then(function (data1, data2) {
			alert("data1: " + JSON.stringify(data1) + "\ndata2: " + JSON.stringify(data2));
		}, function (err) {
			alert("something went wrong: " + JSON.stringify(err));
		});
	};

	return {
		getMovies: getMovies,
		getMovie: getMovie,
		updateMovie: updateMovie
	};
});
define('Components/MovieIndex',["knockout", "koprojections", "Data/Movies"], function (ko, _, movieSvc) {
	

	var componentName = "MovieIndex";
	ko.components.register(componentName, {
		viewModel: function () {
			var model = movieSvc.getMovies();

			return model;
		},
		template: { require: "text!Templates/MovieIndex.html" }
	});

	return {
		urlTemplate: "index",
		name: componentName
	};
});
define('Components/MovieDetail',["knockout", "MyKoUtils", "Data/Movies", "komapping"], function (ko, myKoUtils, movieSvc) {
	

	var componentName = "MovieDetail";
	ko.components.register(componentName, {
		viewModel: function (params) {

			var isInEditMode = ko.observable(false);
			var storedMovie = movieSvc.getMovie(params.id);
			var editMovie = myKoUtils.copy(storedMovie);

			var model = {
				movie: storedMovie,
				//editMovie: editMovie,
				edit: function () {
					editMovie = myKoUtils.copy(storedMovie);
					isInEditMode(true);
				},
				save: function () {
					movieSvc.updateMovie(editMovie);
					isInEditMode(false);
				},
				cancel: function () {
					myKoUtils.mergeInto(storedMovie, editMovie);
					isInEditMode(false);
				}
			};
			return model;
		},
		template: { require: "text!Templates/MovieDetail.html" }
	});

	return {
		urlTemplate: "movie/:id",
		name: componentName
	};
});
/// <reference path="../bower_components/requirejs/require.js" />
require.config({
	baseUrl: "/scripts",
	paths: {
		domready: "../bower_components/requirejs-domready/domready",
		text: "../bower_components/requirejs-text/text",
		knockout: "../bower_components/knockout/dist/knockout",
		komapping: "../bower_components/knockout-mapping/build/output/knockout.mapping-latest",
		koprojections: "../bower_components/knockout-projections/dist/knockout-projections",
		jquery: "../bower_components/jquery/dist/jquery",
		grapnel: "../bower_components/grapnel/dist/grapnel.min",
		lodash: "../bower_components/lodash/dist/lodash"
	},
	shim: {
		komapping: ["knockout"],
		koprojections: ["knockout"],
		jquery: { exports: "$" },
	}
});



require(["grapnel", "knockout", "withLookups", "domready!"], function (grapnel, ko, setupWithLookups) {
	

	setupWithLookups();

	ko.components.register("NotFound", { template: "Page Not Found!" });

	var currentComponentNameAndParams = ko.observable(null);

	var vm = {
		component: currentComponentNameAndParams
	};
	ko.applyBindings(vm);


	var router = new grapnel.Router();
	router.get("", function () {
		router.anchor.set("/index");
	});


	require([
		"Components/MovieIndex",
		"Components/MovieDetail"
	], function () {
		router.get("*", function () {
			currentComponentNameAndParams({ name: "NotFound", params: {} });
		});

		// This function is there to capture each closure, and not just the last one... (Could be written as an IFEE)
		var fn = (function (component) {
			router.get('/' + component.urlTemplate, function (req) {
				currentComponentNameAndParams({ name: component.name, params: req.params });
			});
		});

		// arguments here is a list of components to load (See the function we're in, inside the require statement)
		for (var i = 0; i < arguments.length; i++) {

			fn(arguments[i]);
		}
	});
});

define("Main", function(){});


//# sourceMappingURL=main-opt.js.map