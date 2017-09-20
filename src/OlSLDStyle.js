import OlStyle from 'ol/style/style';
import OlFill from 'ol/style/fill';
import OlCircle from 'ol/style/circle';
import OlStroke from 'ol/style/stroke';
import OlColor from 'ol/color';
import Style from './Style';
import rulesConverter from './rulesConverter';

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
    const style = rulesConverter(rules);

    // If the rules result in an empty style, no styles apply at all, so the feature should NOT be rendered.
    // Return null; OL does not render features wit a "null style".
    if (Object.keys(style).length === 0) {
      return null;
    }

    // Assume color is in '#rrggbb' format: convert to OL color array and add opacity
    // Only create a fill style if the fillColor is defined; otherwise we would define a fill style with default OL color,
    // instead of no fill style. Same for stroke below.
    let fill;
    if (style.fillColor) {
        const fillColor = ol.color.asArray(style.fillColor).slice();
        if (style.fillOpacity) fillColor[3] = style.fillOpacity;
        fill = new ol.style.Fill({
            color: fillColor,
        });
    }

    let stroke;
    if (style.strokeColor) {
        const strokeColor = ol.color.asArray(style.strokeColor).slice();
        if (style.strokeOpacity) strokeColor[3] = style.strokeOpacity;
        stroke = new ol.style.Stroke({
            color: strokeColor,
            width: style.strokeWidth,
        });
    }

    const styles = [
      new ol.style.Style({
        image: new ol.style.Circle({
          fill,
          stroke,
          radius: style.size || 5,
        }),
        fill,
        stroke,
      }),
    ];
    return styles;
  }
}

export default OlSLDStyle;

 /**
  * Openlayers stylefunction
  * @external ol.StyleFunction
  * @see {@link http://openlayers.org/en/latest/apidoc/ol.html#.StyleFunction}
  */
