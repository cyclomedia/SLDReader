/* eslint-disable indent, no-param-reassign, no-use-before-define */

/**
 * @private
 * @param  {Rule[]} rules [description]
 * @return {object}       see leaflet path for inspiration
 */
function rulesConverter(rules) {
  const result = {};
  for (let i = 0; i < rules.length; i += 1) {
    if (rules[i].polygonsymbolizer && rules[i].polygonsymbolizer.fill) {
      const fill = rules[i].polygonsymbolizer.fill;
      fillRules(fill, result);
    }
    if (rules[i].polygonsymbolizer && rules[i].polygonsymbolizer.stroke) {
      const stroke = rules[i].polygonsymbolizer.stroke;
      strokeRules(stroke, result);
    }
    if (rules[i].linesymbolizer && rules[i].linesymbolizer.stroke) {
      const stroke = rules[i].linesymbolizer.stroke;
      strokeRules(stroke, result);
    }
    if (rules[i].pointsymbolizer && rules[i].pointsymbolizer.graphic) {
      const graphic = rules[i].pointsymbolizer.graphic;
      graphicRules(graphic, result);
    }
  }
  return result;
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


export default rulesConverter;
