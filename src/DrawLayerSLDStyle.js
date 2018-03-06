import Style from './Style';
import rulesConverter, { RulesForViewer } from './rulesConverter';
import vendorOptionConverter from './vendorOptionConverter';

/* eslint-disable indent */

// Factors to apply to line width and symbol size (pixels to world coordinates)
// TODO: works if viewer SRS is RD, Mercator, UTM. Doesn't work for WGS84. Check for other SRS's/units.
const STROKE_WIDTH_FACTOR = 0.0125;
const POINT_SIZE_FACTOR = 0.05;

/**
 * The DrawLayerSLDStyle class is the entry point for DrawLayer users.
 * For styling overlays in the Cyclomedia cyclorama viewer.
 */
class DrawLayerSLDStyle extends Style {
    constructor() {
        super();
        this.styleFunction = this.styleFunction.bind(this);
    }

    /**
     * An ol.styleFunction
     * @param {ol.Feature} feature openlayers feature to style
     * @param {number} resolution views resolution in meters/px, recalculate if your
     * layer use different units!
     * @return {ol.style.Style} openlayers style
     */
    styleFunction(feature, resolution) {
        const props = feature.getProperties();
        props.fid = feature.getId();
        const rules = this.getRules(props, resolution);
        const styles = rulesConverter(rules, RulesForViewer.PANORAMA_VIEWER);

        const navigateToURLOnClick = vendorOptionConverter(feature, rules, 'navigateToURLOnClick');
        if (navigateToURLOnClick) {
            feature.setProperties({ navigateToURLOnClick });
        }

        let style = {};

        styles.forEach((stylePart) => {
            style = {
                ...style,
                ...stylePart,
            };
        });

        const dlstyle = {};

        // If the rules result in an empty style, no styles apply at all, and the feature should NOT be rendered.
        if (Object.keys(style).length === 0) {
            return null;
        }

        const {
            strokeColor,
            strokeOpacity,
            strokeWidth,
            fillColor,
            fillOpacity,
            size,
            symbol,
            externalgraphic,
        } = style;

        // If it's a polygon with only an outline we want to have only an outlineColor:
        // dlstyle.outlineColor = strokeColor. But we don't know the geometry type here,
        // so there is no way to determine this case unambiguously.
        // If there is no fillColor, we now set both color and outlineColor to strokeColor.
        // That means we cannot draw unfilled polygons right now, unless fillColor is set
        // with opacity = 0.
        // TODO: DrawLayer polygonstyle needs color and fillColor instead of outlineColor
        // and color, i.e. color always means outline/stroke color.

        if (fillColor) {
            dlstyle.color = fillColor;
        } else if (strokeColor) {
            dlstyle.color = strokeColor;
        } else {
            dlstyle.color = '#000000';
        }

        if (strokeColor) {
            dlstyle.outlineColor = strokeColor;
        } else {
            dlstyle.outlineColor = '#000000';
        }

        if (strokeWidth) {
            dlstyle.lineWidth = strokeWidth;
        } else {
            dlstyle.lineWidth = '0';
        }
        // * STROKE_WIDTH_FACTOR; // TODO: re-add for perspective lines

        if (strokeOpacity) {
            dlstyle.opacity = strokeOpacity;
        } else {
            dlstyle.opacity = '1.0';
        }

        if (fillOpacity) {
            dlstyle.fillOpacity = fillOpacity;
        } else {
            dlstyle.fillOpacity = '1.0';
        }

        if (size) {
            dlstyle.radius = size * POINT_SIZE_FACTOR;
            dlstyle.size = size;
        } else {
            dlstyle.radius = 0;
            dlstyle.size = '0';
        }

        if (externalgraphic && externalgraphic.onlineresource) {
            dlstyle.type = 'billboard';
            dlstyle.skin = externalgraphic.onlineresource;
            dlstyle.uniformScale = false;
        }

        if (externalgraphic && externalgraphic.dynamicOnlineResource) {
            const {
                propertyNames,
                text: orText,
            } = externalgraphic.dynamicOnlineResource;

            let existsUrl = true;
            let url = orText;

            for (let i = 0; i < propertyNames.length; i++) {
                const property = props[propertyNames[i]];
                const isKeyExist = propertyNames[i] in props;
                existsUrl = existsUrl && isKeyExist;

                if (isKeyExist) {
                    url = url.replace('{' + i + '}', property);
                }
            }

            if (existsUrl) {
                dlstyle.type = 'billboard';
                dlstyle.skin = url;
                dlstyle.uniformScale = false;
            }
        }

        if (symbol) {
            dlstyle.type = symbol;
        }

        if (style.label) {
            const field = style.label.fieldname.split(',');

            let textConcat = '';
            for (let i = 0; i < field.length; i++) {
                if (props[field[i]] !== undefined) {
                    if (i === field.length) {
                        textConcat += props[field[i]];
                    } else {
                        textConcat += props[field[i]] + ' ';
                    }
                }
            }
            dlstyle.text = textConcat;
            dlstyle.label = style.label;
        }

        return dlstyle;
    }
}

export default DrawLayerSLDStyle;
