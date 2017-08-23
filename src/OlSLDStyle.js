import OlStyle from 'ol/style/style';
import OlFill from 'ol/style/fill';
import OlCircle from 'ol/style/circle';
import OlStroke from 'ol/style/stroke';
import OlColor from 'ol/color';
import Style from './Style';
import rulesConverter from './rulesConverter';

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
    // Assume color is in '#rrggbb' format: convert to OL color array and add opacity
    const fillColor = olColor.asArray(style.fillColor).slice();
    fillColor[3] = style.fillOpacity;
    const fill = new OlFill({
      color: fillColor,
    });
    const stroke = new OlStroke({
      color: style.strokeColor,
      width: style.strokeWidth,
    });
    const styles = [
      new OlStyle({
        image: new OlCircle({
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
