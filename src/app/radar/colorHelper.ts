export class ColorHelper {

    contrastColor(color) {
        var d = 0;
        if (this.isBright(color))
            d = 0; // bright colors - black font
        else
            d = 255; // dark colors - white font
        return this.rgbToHex(d, d, d);
    }

    hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    componentToHex(c) {
        var hex = parseInt(c).toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    rgbToHex(r :Number, g:Number, b:Number) {
        return "#" + this.componentToHex(<number>r) + this.componentToHex(<number>g) + this.componentToHex(<number>b);
    }

    rgbStrToHex(str) {

        var m = str.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
        if (m) {
            return this.rgbToHex(m[1], m[2], m[3]);
        }
    }

    isBright(color) {
        color = this.hexToRgb(color);

        // Counting the perceptive luminance - human eye favors green color... 
        var a = 1 - (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255;

        return a < 0.5;
    }
}