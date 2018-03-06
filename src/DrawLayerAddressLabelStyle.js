import Style from './Style';

/**
 * The DrawLayerAddressLabelStyle class contains the styling of the address labels in the cyclorama.
 */
class DrawLayerAddressLabelStyle extends Style {
    constructor() {
        super();
        this.styleFunction = this.styleFunction.bind(this);
    }

    styleFunction(feature) {
        const props = feature.getProperties();
        props.fid = feature.getId();
        const address = feature.get('AddressString');

        const dlstyle = {
            type: 'text2D',
            text: address.split(';')[2],
            fontface: 'Arial',
            fontsize: 12,
            padding: 0.1,
            borderThickness: 1,
            borderColor: { r: 255, g: 153, b: 0, a: 1.0 },
            backgroundColor: { r: 255, g: 204, b: 0, a: 1.0 },
            textColor: { r: 0, g: 0, b: 0, a: 1.0 },
            straight: true,
        };

        return dlstyle;
    }
}

export default DrawLayerAddressLabelStyle;
