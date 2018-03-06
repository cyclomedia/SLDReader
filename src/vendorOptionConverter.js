/* eslint-disable indent, no-param-reassign, no-use-before-define */

/**
 * @private
 * @param  {Rule[]} rules [description]
 * @return {object}       see leaflet path for inspiration
 */
function vendorOptionConverter(feature, rules, vendorOption) {
    let result;
    let url;
    for (let i = 0; i < rules.length; i += 1) {
        if (rules[i].polygonsymbolizer && rules[i].polygonsymbolizer[vendorOption]) {
            result = rules[i].polygonsymbolizer[vendorOption];
        }
        if (rules[i].polygonsymbolizer && rules[i].polygonsymbolizer[vendorOption]) {
            result = rules[i].polygonsymbolizer[vendorOption];
        }
        if (rules[i].linesymbolizer && rules[i].linesymbolizer[vendorOption]) {
            result = rules[i].linesymbolizer[vendorOption];
        }
        if (rules[i].pointsymbolizer && rules[i].pointsymbolizer[vendorOption]) {
            result = rules[i].pointsymbolizer[vendorOption];
        }
        if (rules[i].textsymbolizer && rules[i].textsymbolizer[vendorOption]) {
            result = rules[i].textsymbolizer[vendorOption];
        }
    }

    if (result) {
        if (vendorOption === 'navigateToURLOnClick') {
            const {
                propertyNames,
                text,
            } = result;

            const featureProperties = feature.getProperties();
            url = text;

            for (let i = 0; i < propertyNames.length; i++) {
                const property = featureProperties[propertyNames[i]];
                const isKeyExist = propertyNames[i] in featureProperties;

                if (isKeyExist) {
                    url = url.replace('{' + i + '}', property);
                }
            }
        } else {
            url = result;
        }
    }
    return url;
}


export default vendorOptionConverter;
