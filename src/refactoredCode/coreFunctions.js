import utils from './utils';
import renderAwesomeSezzle from './renderSezzle';
import { state } from './sezzleWidgetState';
import Helper from '../helper';
import { addClickEventForModal, renderModals } from './modalHandlers';

const intervalInMs = 2000;
let els = [];

/**
 * This function fetches all the elements that is pointed to by the given xpath
 * @param xindex - Current xpath index value to be resolved [initial value is always 0]
 * @param elements - Array of current elements to be resolved [initial value is the element root(s) 
 * of the search path]
 *
 * @return All the elements which are pointed to by the xpath
 */
export const getElementsByXPath = function (xpath = [], xindex = 0, elements = null) {
	// Break condition
	if (xindex === xpath.length) return elements;
	// If elements are not provided, root the search at the document object
	if (elements === null) elements = [document];

	let children = [];
	let elementArray = Array.prototype.slice.call(elements);

	for (let index = 0; index < elementArray.length; index++) {
		let element = elementArray[index];
		// If parent path
		if (xpath[xindex] === '..') {
			children.push(element.parentElement);
		} else if (xpath[xindex][0] === '#') { // If this is an ID
			children.push(element.getElementById(xpath[xindex].substr(1)));
			// If this is a class
		} else if (xpath[xindex][0] === '.') {
			// If there is only one '.' return the element
			if (xpath[xindex].trim().length === 1) {
				children.push(element);
			}
			Array.prototype.forEach.call(element.getElementsByClassName(xpath[xindex].substr(1)), function (el) {
				children.push(el);
			});
		} else if (xpath[xindex].indexOf('child') === 0) { // If this is a child indicator
			let childNumber = xpath[xindex].split('-')[1];
			let childElement = element.childNodes[childNumber];
			if (typeof (childElement) !== 'undefined') {
				if (childElement.nodeName === '#text') { // if it's a text node we wrap it
					newSpan = document.createElement('span');
					newSpan.appendChild(document.createTextNode(childElement.nodeValue));
					element.replaceChild(newSpan, childElement);
					children.push(newSpan);
				} else {
					children.push(childElement);
				}
			} else {
				children.push(element);
			}
		} else { // If this is a tag
			let indexToTake = 0;
			if (xpath[xindex].split('-').length > 1) {
				if (xpath[xindex].split('-')[1] >= 0) {
					indexToTake = parseInt(xpath[xindex].split('-')[1]);
				}
			}
			Array.prototype.forEach.call(element.getElementsByTagName(xpath[xindex].split('-')[0]), (el, index) => {
				if (index === indexToTake) children.push(el);
			});
		}
	}

	children = children.filter(c => c !== null);
	return getElementsByXPath(xpath, xindex + 1, children);
};

/**
 * This function finds out the element where Sezzle's widget
 * will be rendered. By default it would return the parent element
 * of the given price element. If the over ride path is found and
 * it leads to a valid element then that element will be returned
 * @param element - This is the price element
 * @param index - Index of the config group that element belongs to
 * @return the element where Sezzle's widget will be rendered
 */
const getElementToRender = (element, index = 0) => {
	let toRenderElement = null;
	if (state.configGroups[index].rendertopath !== null) {
		let path = Helper.breakXPath(state.configGroups[index].rendertopath);
		toRenderElement = element;
		for (let i = 0; i < path.length; i++) {
			let p = path[i];
			if (toRenderElement === null) {
				break;
			} else if (p === '.') {
				continue;
			} else if (p === '..') {
				// One level back
				toRenderElement = toRenderElement.parentElement;
			} else if (p[0] === '.') {
				// The class in the element
				toRenderElement =
					toRenderElement.getElementsByClassName(p.substr(1)).length ?
						toRenderElement.getElementsByClassName(p.substr(1))[0] :
						null;
			} else if (p[0] === '#') {
				// The ID in the element
				toRenderElement =
					document.getElementById(p.substr(1));
			} else if (p === '::first-child') {
				//rendered as first child
				toRenderElement =
					toRenderElement.children.length > 0 ?
						toRenderElement.firstElementChild :
						null;
				state.configGroups[index].widgetIsFirstChild = true;
			} else {
				// If this is a tag
				// indexes are 0-indexed (e.g. span-2 means third span)
				let indexToTake = 0;
				if (p.split('-').length > 1) {
					if (p.split('-')[1] >= 0) {
						indexToTake = parseInt(p.split('-')[1]);
					}
				}
				toRenderElement =
					toRenderElement.getElementsByTagName(p.split('-')[0]).length > indexToTake ?
						toRenderElement.getElementsByTagName(p.split('-')[0])[indexToTake] :
						null;
			}
		}
	}
	return toRenderElement ? toRenderElement : element.parentElement; // return the element's parent if toRenderElement is null
};

/**
 * This function start an observation on related elements to the price element
 * for any change and perform an action based on that
 */
const observeRelatedElements = (priceElement, sezzleElement, targets) => {
	if (targets) {
		targets.forEach(target => {
			if (typeof (target.relatedPath) === 'string' &&
				(typeof (target.action) === 'function' || typeof (target.initialAction) === 'function')) {
				let elements = getElementsByXPath(
					Helper.breakXPath(target.relatedPath),
					0,
					[priceElement]
				);
				if (elements.length > 0) {
					if (typeof (target.action) === 'function') {
						utils.startObserve(elements[0], mutation => {
							target.action(mutation, sezzleElement);
						});
					}
					if (typeof (target.initialAction) === 'function') {
						target.initialAction(elements[0], sezzleElement);
					}
				}
			}
		});
	}
};


const sezzleWidgetCheckInterval = () => {
	// Look for newly added price elements
	state.configGroups.forEach((configGroup, index) => {
		if (configGroup.xpath === []) return;
		let elements = getElementsByXPath(configGroup.xpath)
		elements.forEach(e => {
			if (!e.hasAttribute('data-sezzleindex')) {
				els.push({
					element: e,
					toRenderElement: getElementToRender(e, index),
					deleted: false,
					observer: null,
					configGroupIndex: index
				});
			}
		});
	});
	// add the sezzle widget to the price elements
	els.forEach((el, index) => {
		if (!el.element.hasAttribute('data-sezzleindex')) {
			let sz = renderAwesomeSezzle(
				el.element, el.toRenderElement,
				index, el.configGroupIndex
			);
			if (sz) {
				el.observer = utils.startObserve(el.element, mutations => {
					utils.mutationCallBack(mutations, el.configGroupIndex);
				});
				addClickEventForModal(sz, el.configGroupIndex);
				observeRelatedElements(el.element, sz, state.configGroups[el.configGroupIndex].relatedElementActions);
			} else {
				// remove the element from the els array
				delete els[index];
			}
		}
	});
	// refresh the array
	els = els.filter(e => e !== undefined);
	// Find the deleted price elements
	// remove corresponding Sezzle widgets if exists
	els.forEach((el, index) => {
		if (el.element.parentElement === null && !el.deleted) { // element is deleted
			// Stop observing for changes in the element
			if (el.observer !== null) el.observer.disconnect();
			// Mark that element as deleted
			el.deleted = true;
			// Delete the corresponding sezzle widget if exist
			let tmp = document.getElementsByClassName("sezzlewidgetindex-" + index);
			if (tmp.length) {
				let sw = tmp[0];
				sw.parentElement.removeChild(sw);
			}
		}
	});
	// Hide elements ex: afterpay
	for (let index = 0, len = state.configGroups.length; index < len; index++) {
		utils.hideSezzleHideElements(index);
	}
	setTimeout(() => sezzleWidgetCheckInterval(), intervalInMs);
}

export const initWidget = () => {
	let allConfigsUsePriceClassElement = true;

	state.configGroups.forEach((configGroup, index) => {
		if (configGroup.hasPriceClassElement) {
			let sz = renderAwesomeSezzle(configGroup.priceElements[0], configGroup.renderElements[0], 0, index);
			utils.startObserve(configGroup.priceElements[0], mutations => {
				utils.mutationCallBack(mutations, index);
			});
		} else {
			allConfigsUsePriceClassElement = false;
		}
	});

	if (!allConfigsUsePriceClassElement) sezzleWidgetCheckInterval.call(this);
	renderModals.call(this);
};
