import ol from 'openlayers';
import Style from './Style';
import rulesConverter, { RulesForViewer } from './rulesConverter';
import vendorOptionConverter from './vendorOptionConverter';

/* eslint-disable indent */

/**
 * The OlSLDStyle class is the entry point for openlayers users.
 */
class OlSLDStyle extends Style {
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
        const drawStyles = rulesConverter(rules, RulesForViewer.MAP_VIEWER);
        const navigateToURLOnClick = vendorOptionConverter(feature, rules, 'navigateToURLOnClick');
        if (navigateToURLOnClick) {
            feature.setProperties({ navigateToURLOnClick });
        }

        const styles = [];

        drawStyles.forEach((style) => {
            // If the rules result in an empty style, no styles apply at all, so the feature should NOT be rendered.
            // Return null; OL does not render features wit a "null style".
            if (Object.keys(style).length === 0) {
                return null;
            }

            // Assume color is in '#rrggbb' format: convert to OL color array and add opacity
            // Only create a fill style if the fillColor is defined; otherwise we would define a fill style with default OL color,
            // instead of no fill style. Same for stroke below.

            let fill;
            let stroke;
            let strokeColor;
            let fillColor;

            if (style.fillColor) {
                fillColor = style.fillColor;
                const olFillColor = ol.color.asArray(fillColor).slice();

                if (style.fillOpacity) {
                    olFillColor[3] = style.fillOpacity;
                }

                fill = new ol.style.Fill({
                    color: olFillColor,
                });
            }

            if (style.strokeColor || style.fillColor) {
                strokeColor = style.strokeColor ? style.strokeColor : style.fillColor;
                const olStrokeColor = ol.color.asArray(strokeColor).slice();

                if (style.strokeOpacity) {
                    olStrokeColor[3] = style.strokeOpacity;
                }

                stroke = new ol.style.Stroke({
                    color: strokeColor,
                    width: style.strokeWidth ? style.strokeWidth : 0,
                });
            }

            // label renderer
            if (style.label) {
                let font;
                let textStroke;

                if (style.label.fontSize) {
                    font = style.label.fontSize + 'px';
                }

                if (style.label.fontFamily) {
                    font = font ? `${font} ${style.label.fontFamily}` : style.label.fontFamily;
                }

                let textFillColor = '#000000';
                if (style.label.fillColor) {
                    textFillColor = style.label.fillColor;
                }

                const textFill = new ol.style.Fill({
                    color: textFillColor,
                });

                if (style.label.haloFill) {
                    textStroke = new ol.style.Stroke({
                        color: style.label.haloFill,
                        width: style.label.haloRadius || 2,
                    });
                }

                const options = {};

                // The SLD specs allows anchor point values between 0 and 1. However, OpenLayers styling only allows textAlign
                // values 'left', 'center' and 'right', corresponding to anchor point X values 0, 0.5 and 1. Similar for Y values.
                if (style.label.anchorpointx >= 0.75) {
                    options.textAlign = 'right';
                } else if (style.label.anchorpointx < 0.75 && style.label.anchorpointx >= 0.25) {
                    options.textAlign = 'center';
                } else {
                    options.textAlign = 'left';
                }

                if (style.label.anchorpointy >= 0.75) {
                    options.textBaseline = 'top';
                } else if (style.label.anchorpointy < 0.75 && style.label.anchorpointy >= 0.25) {
                    options.textBaseline = 'middle';
                } else {
                    options.textBaseline = 'bottom';
                }

                // Label offset in pixels:
                if (style.label.displacementx) {
                    options.offsetX = style.label.displacementx;
                }

                if (style.label.displacementy) {
                    options.offsetY = style.label.displacementy;
                }

                if (style.label.rotation) {
                    options.rotation = style.label.rotation;
                }

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

                styles.push(new ol.style.Style({
                    text: new ol.style.Text({
                        text: textConcat,
                        font,
                        fill: textFill,
                        stroke: textStroke,
                        ...options,
                    }),
                }));
            } else {
                const size = style.size || 5;

                if (style.symbol) {
                    switch (style.symbol) {
                        case 'square':
                            styles.push(new ol.style.Style({
                                image: new ol.style.RegularShape({
                                    fill,
                                    stroke,
                                    points: 4,
                                    radius: size,
                                    angle: Math.PI / 4,
                                }),
                            }));
                            break;
                        case 'cross':
                            styles.push(new ol.style.Style({
                                image: new ol.style.RegularShape({
                                    stroke: new ol.style.Stroke({
                                        color: strokeColor,
                                        width: size / 3,
                                    }),
                                    points: 4,
                                    radius1: size,
                                    radius2: 0,
                                    angle: 0,
                                }),
                            }));
                            styles.push(new ol.style.Style({
                                image: new ol.style.RegularShape({
                                    stroke: new ol.style.Stroke({
                                        color: fillColor,
                                        width: Math.max(((size / 3) - style.strokeWidth), 0),
                                    }),
                                    points: 4,
                                    radius1: size,
                                    radius2: 0,
                                    angle: 0,
                                }),
                            }));
                            break;
                        case 'circle':
                            styles.push(new ol.style.Style({
                                image: new ol.style.Circle({
                                    fill,
                                    stroke,
                                    radius: size,
                                }),
                            }));
                            break;
                        default:
                            styles.push(new ol.style.Style({
                                image: new ol.style.Circle({
                                    fill,
                                    stroke,
                                    radius: size,
                                }),
                                fill,
                                stroke,
                            }));
                            break;
                    }
                } else if (style.externalgraphic && style.externalgraphic.onlineresource) {
                    styles.push(new ol.style.Style({
                        image: new ol.style.Icon({
                            scale: size / 20,
                            src: style.externalgraphic.onlineresource,
                        }),
                        fill,
                        stroke,
                    }));
                } else if (style.externalgraphic && style.externalgraphic.dynamicOnlineResource) {
                    const {
                        propertyNames,
                        text: orText,
                    } = style.externalgraphic.dynamicOnlineResource;

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
                        styles.push(new ol.style.Style({
                            image: new ol.style.Icon({
                                scale: size / 20,
                                src: url,
                            }),
                            fill,
                            stroke,
                        }));
                    }
                } else {
                    styles.push(new ol.style.Style({
                        image: new ol.style.Circle({
                            fill,
                            stroke,
                            radius: size,
                        }),
                        fill,
                        stroke,
                    }));
                }
            }
        });

        return styles;
    }
}

export default OlSLDStyle;

 /**
  * Openlayers stylefunction
  * @external ol.StyleFunction
  * @see {@link http://openlayers.org/en/latest/apidoc/ol.html#.StyleFunction}
  */
