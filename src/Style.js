import Reader from './Reader';

/* eslint-disable indent, no-param-reassign, no-use-before-define */

const Filters = {
  featureid: (value, props) => {
    for (let i = 0; i < value.length; i += 1) {
      if (value[i] === props.fid) {
        return true;
      }
    }
    return false;
  },
  not: (value, props) => !filterSelector(value, props),
  or: (value, props) => {
    if (value.length === 2) {
      if (filterSelector(value[0], props, 0) || filterSelector(value[1], props, 0)) {
        return true;
      }
      return false;
    }
    throw new Error('or operator should have exactly two operands');
  },
  and: (value, props) => {
    if (value.length === 2) {
        if (filterSelector(value[0], props, 0) && filterSelector(value[1], props, 0)) {
          return true;
        }
        return false;
    }
    throw new Error('and operator should have exactly two operands');
  },
  propertyisequalto: compareProperty,
  propertyisnotequalto: compareProperty,
  propertyislessthan: compareProperty,
  propertyislessthanorequalto: compareProperty,
  propertyisgreaterthan: compareProperty,
  propertyisgreaterthanorequalto: compareProperty,
  propertyisbetween: (value, props) => (props[value.propertyname] && value.lowerboundary && value.upperboundary &&
    compare(props[value.propertyname], value.lowerboundary.literal, 'propertyisgreaterthanorequalto') &&
    compare(props[value.propertyname], value.upperboundary.literal, 'propertyislessthanorequalto')),
};

function compareProperty(value, props, operator) {
    if (!value['0'].propertyname) {
        return false;
    }
    const a = props[value['0'].propertyname];
    const b = value['0'].literal;
    return compare(a, b, operator);
}

function compare(a, b, operator) {
  if (!Number.isNaN(Number(a)) && !Number.isNaN(Number(b))) {
    a = Number(a);
    b = Number(b);
  }
  switch (operator) {
  case 'propertyisequalto':
    return a === b;
  case 'propertyisnotequalto':
    return a !== b;
  case 'propertyislessthan':
    return a < b;
  case 'propertyislessthanorequalto':
    return a <= b;
  case 'propertyisgreaterthan':
    return a > b;
  case 'propertyisgreaterthanorequalto':
    return a >= b;
  default:
    throw new Error(`unknown comparison operator "${operator}"`);
  }
}

/**
 * [filterSelector description]
 * @private
 * @param  {Filter} filter
 * @param  {object} properties feature properties
 * @param {number} key index of property to use
 * @return {boolean}
 */
function filterSelector(filter, properties, key = 0) {
  const type = Object.keys(filter)[key];
  if (Filters[type]) {
    if (Filters[type](filter[type], properties, type)) {
      return true;
    }
  } else {
    throw new Error(`Unkown filter ${type}`);
  }
  return false;
}

/**
 * [scaleSelector description]
 * The "standardized rendering pixel size" is defined to be 0.28mm × 0.28mm
 * @param  {Rule} rule
 * @param  {number} resolution  m/px
 * @return {boolean}
 */
function scaleSelector(rule, resolution) {
  if (rule.maxscaledenominator !== undefined && rule.minscaledenominator !== undefined) {
    if ((resolution / 0.00028) < rule.maxscaledenominator &&
      (resolution / 0.00028) > rule.minscaledenominator) {
      return true;
    }
    return false;
  }
  if (rule.maxscaledenominator !== undefined) {
    return ((resolution / 0.00028) < rule.maxscaledenominator);
  }
  if (rule.minscaledenominator !== undefined) {
    return ((resolution / 0.00028) > rule.minscaledenominator);
  }
  return true;
}


/**
 * Base class for library specific style classes
 * After creating an instance you should call the read method.
 */
class Style {
  constructor() {
    this.getRules = this.getRules.bind(this);
  }

  /**
   * Read xml file
   * @param  {string} sld xml string
   * @param {string} [layername] Select layer matching case insensitive, defaults to first layer
   * @param {string} [stylename] Select style case insensitive, defaults to first style
   * @return {void}
   */
  read(sld, layername, stylename) {
    this.sld = Reader(sld);
    this.setStyle(layername, stylename);
  }

  /**
   * is layer defined in sld?
   * @return {Boolean} [description]
   */
  hasLayer(layername) {
    const index = this.sld.layers.findIndex(l =>
      (l.name.toLowerCase() === layername.toLowerCase()));
    return (index > -1);
  }
  /**
   * Change selected layer and style from sld to use
   * @param {string} [layername]  Select layer matching lowercased layername
   * @param {string} [stylename] style to use
   */
  setStyle(layername, stylename) {
    let filteredlayers;
    if (layername) {
      filteredlayers = this.sld.layers.filter((l) => {
        let name;
        if (l.name) name = l.name.toLowerCase();
        // TODO: improve this!
        // If no name on the NamedLayer/UserLayer, use FeatureTypeName, but assume there is only one... Is this OK? :-\
        if (!name && l.styles && l.styles[0] && l.styles[0].featuretypestyles && l.styles[0].featuretypestyles[0]) {
          name = l.styles[0].featuretypestyles[0].featuretypename.toLowerCase();
        }
        // Use this layer style if it has the name given. If no layer name given in the style, it should always be used
        return (name === layername.toLowerCase() || !name);
      });
      if (!filteredlayers.length) {
        throw Error(`layer ${layername} not found in sld`);
      }
    }
    this.layer = (filteredlayers) ? filteredlayers['0'] : this.sld.layers['0'];
    // Get the style with the requested name (stylename), or if not given, the default style (IsDefault == true)
    this.style = this.layer.styles.filter(s => ((stylename) ? (s.name.toLowerCase() === stylename.toLowerCase()) : s.default))['0'];
    // If no style found, use the first one:
    if (!this.style) this.style = this.layer.styles[0];
  }


    /**
     * get sld rules for feature
     * @param  {Object} properties feature properties
     * @param {number} resolution unit/px
     * @return {Rule} filtered sld rules
     */
    getRules(properties, resolution) {
        if (!this.style) {
            throw new Error('Set a style to use');
        }
        const result = [];
        const FeatureTypeStyleLength = this.style.featuretypestyles.length;
        for (let i = 0; i < FeatureTypeStyleLength; i += 1) {
            const fttypestyle = this.style.featuretypestyles[i];
            for (let j = 0; j < fttypestyle.rules.length; j += 1) {
                const rule = fttypestyle.rules[j];
                if (rule.filter && scaleSelector(rule, resolution) &&
                    filterSelector(rule.filter, properties)) {
                    result.push(rule);
                } else if (rule.elsefilter && result.length === 0) {
                    result.push(rule);
                } else if (!rule.elsefilter && !rule.filter) {
                    result.push(rule);
                }
            }
        }
        return result;
    }


    /**
     * get user style for feature
     * @return {Style}
     */
    getFeatureStyle() {
        if (!this.style) {
            throw new Error('Set a style to use');
        }
        const result = this.style;
        return result;
    }
}


export default Style;
