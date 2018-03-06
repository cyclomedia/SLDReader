/* eslint-disable indent, no-param-reassign, no-use-before-define */

// types rules
export const RulesForViewer = {
    // panorama viewer
    PANORAMA_VIEWER: 'panorama_viewer',
    // map viewer
    MAP_VIEWER: 'map_viewer',
    // oblique viewer
    OBLIQUE_VIEWER: 'oblique_viewer',
    // undefined viewer
    UNDEFINED_VIEWER: 'undefined_viewer',
};

/**
 * @private
 * @param  {Rule[]} rules [description]
 * @return {object}       see leaflet path for inspiration
 */
function rulesConverter(rules, typeViewer = RulesForViewer.UNDEFINED_VIEWER) {
    const results = [];

    for (let i = 0; i < rules.length; i += 1) {
        if (((typeViewer !== RulesForViewer.PANORAMA_VIEWER) || (rules[i].excludeFromCyclorama === undefined) || (!rules[i].excludeFromCyclorama)) &&
            ((typeViewer !== RulesForViewer.MAP_VIEWER) || (rules[i].excludeFromMap === undefined) || (!rules[i].excludeFromMap))) {
            if (rules[i].polygonsymbolizer) {
                const result = {};

                if (rules[i].polygonsymbolizer.fill) {
                    const fill = rules[i].polygonsymbolizer.fill;
                    fillRules(fill, result);
                }
                if (rules[i].polygonsymbolizer.stroke) {
                    const stroke = rules[i].polygonsymbolizer.stroke;
                    strokeRules(stroke, result);
                }

                results.push(result);
            }

            rules[i].linesymbolizers.forEach((linesymbolizer) => {
                if (linesymbolizer && linesymbolizer.stroke) {
                    const result = {};
                    const stroke = linesymbolizer.stroke;
                    strokeRules(stroke, result);
                    results.push(result);
                }
            });

            if (rules[i].pointsymbolizer && rules[i].pointsymbolizer.graphic) {
                const result = {};
                const graphic = rules[i].pointsymbolizer.graphic;
                graphicRules(graphic, result);
                results.push(result);
            }

            if (rules[i].textsymbolizer && rules[i].textsymbolizer.label) {
                const result = {};
                const textsymbolizer = rules[i].textsymbolizer;
                textSymbolizerRules(textsymbolizer, result);
                results.push(result);
            }
        }
    }

    return results;
}

function graphicRules(graphic, result) {
    if (graphic.mark && graphic.mark.fill) {
        fillRules(graphic.mark.fill, result);
    }
    if (graphic.mark && graphic.mark.stroke) {
        strokeRules(graphic.mark.stroke, result);
    }
    if (graphic.size) {
        result.size = graphic.size;
    }
    if (graphic.mark && graphic.mark.wellknownname) {
        result.symbol = graphic.mark.wellknownname;
    }
    if (graphic.externalgraphic) {
        result.externalgraphic = {};

        if (graphic.externalgraphic.onlineresource) {
            result.externalgraphic.onlineresource = graphic.externalgraphic.onlineresource;
        }
        if (graphic.externalgraphic.dynamicOnlineResource) {
            result.externalgraphic.dynamicOnlineResource = graphic.externalgraphic.dynamicOnlineResource;
        }

        if (graphic.externalgraphic.format) {
            result.externalgraphic.format = graphic.externalgraphic.format;
        }
    }
}

function strokeRules(stroke, result) {
    for (let j = 0; j < stroke.css.length; j += 1) {
        switch (stroke.css[j].name) {
            case 'stroke':
                result.strokeColor = stroke.css[j].value;
                break;
            case 'stroke-opacity':
                result.strokeOpacity = stroke.css[j].value;
                break;
            case 'stroke-width':
                result.strokeWidth = stroke.css[j].value;
                break;
            default:
        }
    }
}

/**
 * [fill description]
 * @private
 * @param  {object} fill [description]
 * @param {object} result props will be added to
 * @return {void}      [description]
 */
function fillRules(fill, result) {
    for (let j = 0; j < fill.css.length; j += 1) {
        switch (fill.css[j].name) {
            case 'fill':
                result.fillColor = fill.css[j].value;
                break;
            case 'fill-opacity':
                result.fillOpacity = fill.css[j].value;
                break;
            default:
        }
    }
}

function textSymbolizerRules(textsymbolizer, result) {
    const label = {};
    if (textsymbolizer.label && textsymbolizer.label.propertyname) {
        label.fieldname = textsymbolizer.label.propertyname.toLowerCase();
    }
    if (textsymbolizer.fill) {
        fillRules(textsymbolizer.fill, label);
    }
    if (textsymbolizer.font && textsymbolizer.font.css) {
        const css = textsymbolizer.font.css;
        for (let j = 0; j < css.length; j += 1) {
            switch (css[j].name) {
                case 'font-family':
                    label.fontFamily = css[j].value;
                    break;
                case 'font-size':
                    label.fontSize = css[j].value;
                    break;
                default:
            }
        }
    }
    if (textsymbolizer.halo) {
        if (textsymbolizer.halo.fill && textsymbolizer.halo.fill.css) {
            const css = textsymbolizer.halo.fill.css;
            for (let j = 0; j < css.length; j += 1) {
                if (css[j].name === 'fill') {
                    label.haloFill = css[j].value;
                }
            }
        }
        if (textsymbolizer.halo.radius) {
            label.haloRadius = textsymbolizer.halo.radius;
        }
    }
    if (textsymbolizer.labelplacement && textsymbolizer.labelplacement.pointplacement) {
        const pointplacement = textsymbolizer.labelplacement.pointplacement;
        if (pointplacement.anchorpoint) {
            label.anchorpointx = pointplacement.anchorpoint.anchorpointx;
            label.anchorpointy = pointplacement.anchorpoint.anchorpointy;
        }
        if (pointplacement.displacement) {
            label.displacementx = pointplacement.displacement.displacementx;
            label.displacementy = pointplacement.displacement.displacementy;
        }
        if (pointplacement.rotation) {
            label.rotation = pointplacement.rotation;
        }
    }
    result.label = label;
}

export default rulesConverter;
