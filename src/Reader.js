/* eslint-disable indent, no-param-reassign, no-use-before-define */

function addPropArray(node, obj, prop) {
    const property = prop.toLowerCase();
    obj[property] = obj[property] || [];
    const item = {};
    readNode(node, item);
    obj[property].push(item);
}

function addProp(node, obj, prop) {
    const property = prop.toLowerCase();
    obj[property] = {};
    readNode(node, obj[property]);
}

function addAndOrPropArray(element, obj, prop) {
    if (element.children && element.children.length === 2) {
        const property = prop.toLowerCase();
        obj[property] = [];
        addAndOrProp(element.children[0], obj, property);
        addAndOrProp(element.children[1], obj, property);
    } else {
        throw new Error(prop + ' operator should have exactly two operands');
    }
}

function addAndOrProp(element, obj, prop) {
    const property = prop.toLowerCase();
    const operand = {};
    const name = element.localName.toLowerCase();
    operand[name] = [];
    addPropArray(element, operand, name);
    obj[property].push(operand);
}

function addValue(node, obj, prop) {
    const property = prop.toLowerCase();
    obj[property] = node.textContent;
}

function addValueTrimmed(node, obj, prop) {
    const property = prop.toLowerCase();
    obj[property] = node.textContent.trim();
}

function getText(element, tagName) {
    const collection = element.getElementsByTagName(tagName);
    return (collection.length) ? collection.item(0).textContent : '';
}

function getBool(element, tagName) {
    const collection = element.getElementsByTagName(tagName);
    if (collection.length) {
        return Boolean(collection.item(0).textContent);
    }
    return false;
}

// TODO: treat different SLD versions properly, e.g. create separate parsers
const parsers = {
    NamedLayer: (element, obj) => {
        obj.layers = obj.layers || [];
        const layer = {
            // name: getText(element, 'sld:Name'),
            styles: [],
        };
        readNode(element, layer);
        obj.layers.push(layer);
    },
    UserStyle: (element, obj) => {
        const style = {
            // name: getText(element, 'sld:Name'),
            default: getBool(element, 'sld:IsDefault'),
            featuretypestyles: [],
        };
        readNode(element, style);
        obj.styles.push(style);
    },
    FeatureTypeStyle: (element, obj) => {
        const featuretypestyle = {
            featuretypename: getText(element, 'FeatureTypeName'),
            rules: [],
        };
        readNode(element, featuretypestyle);
        obj.featuretypestyles.push(featuretypestyle);
    },
    Rule: (element, obj) => {
        const rule = {
            linesymbolizers: [],
        }

        readNode(element, rule);
        obj.rules.push(rule);
    },
    Filter: (element, obj) => {
        obj.filter = {};
        readNode(element, obj.filter);
    },
    ElseFilter: (element, obj) => {
        obj.elsefilter = true;
    },
    Or: addAndOrPropArray,
    And: addAndOrPropArray,
    Not: addProp,
    PropertyIsEqualTo: addPropArray,
    PropertyIsNotEqualTo: addPropArray,
    PropertyIsLessThan: addPropArray,
    PropertyIsLessThanOrEqualTo: addPropArray,
    PropertyIsGreaterThan: addPropArray,
    PropertyIsGreaterThanOrEqualTo: addPropArray,
    PropertyIsBetween: addProp,
    PropertyName: (element, obj) => {
        obj.propertyname = element.textContent;
    },
    Literal: addValue,
    LowerBoundary: addProp,
    UpperBoundary: addProp,
    FeatureId: (element, obj) => {
        obj.featureid = obj.featureid || [];
        obj.featureid.push(element.getAttribute('fid'));
    },
    Name: addValue,
    MaxScaleDenominator: addValueTrimmed,
    PolygonSymbolizer: addProp,
    LineSymbolizer: (element, obj) => {
        const lineSymbolizer = {};
        readNode(element, lineSymbolizer);
        obj.linesymbolizers.push(lineSymbolizer);
    },
    PointSymbolizer: addProp,
    TextSymbolizer: addProp,
    Rotation: addValueTrimmed,
    Fill: addProp,
    Stroke: addProp,
    // TODO: add definitions to documentation
    Mark: addProp,
    WellKnownName: addValueTrimmed,
    Graphic: addProp,
    ExternalGraphic: addProp,
    Size: addValueTrimmed,
    OnlineResource: (element, obj) => {
        obj.onlineresource = element.getAttribute('xlink:href');
    },
    Format: addValueTrimmed,
    CssParameter: (element, obj) => {
        obj.css = obj.css || [];
        obj.css.push({
            name: element.getAttribute('name'),
            value: element.textContent.trim(),
        });
    },
    Label: addProp,
    Font: addProp,
    Halo: addProp,
    Radius: addValueTrimmed,
    LabelPlacement: addProp,
    PointPlacement: addProp,
    AnchorPoint: addProp,
    AnchorPointX: addValueTrimmed,
    AnchorPointY: addValueTrimmed,
    Displacement: addProp,
    DisplacementX: addValueTrimmed,
    DisplacementY: addValueTrimmed,
    VendorOption: (element, obj) => {
        const name = element.getAttribute('name');

        if (name === 'tooltipProperties') {
            const value = element.textContent.trim();
            obj.tooltip = obj.tooltip || [];
            obj.tooltip.push(value);
        } else if (name === 'attributeInfo') {
            const value = element.textContent.trim();
            obj.attributeInfo = obj.attributeInfo || [];
            obj.attributeInfo.push(value);
        } else if (name === 'excludeFromCyclorama') {
            obj.excludeFromCyclorama = true;
        } else if (name === 'excludeFromMap') {
            obj.excludeFromMap = true;
        } else if (name === 'dynamicOnlineResource') {
            obj.dynamicOnlineResource = parsePropertyNames(element);
        } else if (name === 'navigateToURLOnClick') {
            obj.navigateToURLOnClick = parsePropertyNames(element);
        }
    },
};

function parsePropertyNames(element) {
    let text = element.textContent.trim();
    const properties = element.childNodes;
    const propertyNames = [];
    let elementNr = 0;

    for (let n = 0; n < properties.length; n++) {
        if (properties[n].tagName === 'ogc:PropertyName') {
            const propertyName = properties[n].textContent;
            propertyNames.push(propertyName);
            text = text.replace(propertyName, '{' + (elementNr++) + '}');
        }
    }

    return {
        text,
        propertyNames,
    };
}

// Layers can be contained in a NamedLayer or in a UserLayer, treat both the same
parsers.UserLayer = parsers.NamedLayer;

// SvgParameter: alias for CssParameter (so also uses property name "css", so parsing later does not depend on
// whether it was a CssParameter or a SvgParameter
parsers.SvgParameter = parsers.CssParameter;

function readNode(node, obj) {
    for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
        if (parsers[n.localName]) {
            parsers[n.localName](n, obj, n.localName);
        }
    }
}

/**
 * Creates a object from an sld xml string, for internal usage
 * @param  {string} sld xml string
 * @return {StyledLayerDescriptor}  object representing sld style
 */
export default function Reader(sld) {
    const result = {};
    const parser = new DOMParser();
    const doc = parser.parseFromString(sld, 'application/xml');

    for (let n = doc.firstChild; n; n = n.nextSibling) {
        result.version = n.getAttribute('version');
        readNode(n, result);
    }
    return result;
}

/**
 * @typedef StyledLayerDescriptor
 * @name StyledLayerDescriptor
 * @description a typedef for StyledLayerDescriptor {@link http://schemas.opengis.net/sld/1.1/StyledLayerDescriptor.xsd xsd}
 * @property {string} version sld version
 * @property {Layer[]} layers info extracted from NamedLayer element
 */

/**
* @typedef Layer
* @name Layer
* @description a typedef for Layer, the actual style object for a single layer
* @property {string} name layer name
* @property {Object[]} styles See explanation at [Geoserver docs](http://docs.geoserver.org/stable/en/user/styling/sld/reference/styles.html)
* @property {Boolean} styles[].default
* @property {FeatureTypeStyle[]} styles[].featuretypestyles
*/

/**
* @typedef FeatureTypeStyle
* @name FeatureTypeStyle
* @description a typedef for FeatureTypeStyle: {@link http://schemas.opengis.net/se/1.1.0/FeatureStyle.xsd xsd}
* @property {Rule[]} rules
*/

/**
* @typedef Rule
* @name Rule
* @description a typedef for Rule to match a feature: {@link http://schemas.opengis.net/se/1.1.0/FeatureStyle.xsd xsd}
* @property {string} name rule name
* @property {Filter} [filter]
* @property {boolean} [elsefilter]
* @property {integer} [minscaledenominator]
* @property {integer} [maxscaledenominator]
* @property {PolygonSymbolizer} [polygonsymbolizer]
* @property {LineSymbolizer}  [linesymbolizer]
* @property {PointSymbolizer} [pointsymbolizer]
* */

/**
* @typedef Filter
* @name Filter
* @description [ogc filters]( http://schemas.opengis.net/filter/1.1.0/filter.xsd) should have only one prop
* @property {array} [featureid] filter
* @property {object} [or]  filter
* @property {object} [and]  filter
* @property {object} [not]  filter
* @property {array} [propertyisequalto]  filter
* */


/**
* @typedef PolygonSymbolizer
* @name PolygonSymbolizer
* @description a typedef for [PolygonSymbolizer](http://schemas.opengis.net/se/1.1.0/Symbolizer.xsd)
* @property {Object} fill
* @property {array} fill.css
* @property {Object} stroke
* @property {array} stroke.css
* */

/**
* @typedef LineSymbolizer
* @name LineSymbolizer
* @description a typedef for [LineSymbolizer](http://schemas.opengis.net/se/1.1.0/Symbolizer.xsd)
* @property {Object} stroke
* @property {array} stroke.css
* */


/**
* @typedef PointSymbolizer
* @name PointSymbolizer
* @description a typedef for [PointSymbolizer](http://schemas.opengis.net/se/1.1.0/Symbolizer.xsd)
* @property {Object} graphic
* @property {Object} graphic.externalgraphic
* @property {string} graphic.externalgraphic.onlineresource
* */
