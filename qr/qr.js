const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64URL_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// const TEST_VECTOR = [
//     ['', '', ''],
//     ['f', 'Zg==', 'MY======'],
//     ['fo', 'Zm8=', 'MZXQ===='],
//     ['foo', 'Zm9v', 'MZXW6==='],
//     ['foob', 'Zm9vYg==', 'MZXW6YQ='],
//     ['fooba', 'Zm9vYmE=', 'MZXW6YTB'],
//     ['foobar', 'Zm9vYmFy', 'MZXW6YTBOI======'],
// ];

function init() {
    document.getElementById('bytelength').addEventListener('change', changeData);
    document.getElementById('reload').addEventListener('click', changeData);
    changeData();
    // test();
}

function changeData() {
    let bl = document.getElementById('bytelength').value;
    let bs = [];
    for (let i = 0; i < bl; i++) {
        bs.push(Math.floor(Math.random() * 256));
    }
    let hex = toHex(bs);
    let b64 = convertbits(bs, 8, 6, true);
    let base64 = toBase64(b64);
    let b32 = convertbits(bs, 8, 5, true);
    let base32 = toBase32(b32);
    document.getElementById('thex').innerText = hex;
    document.getElementById('t64').innerText = base64;
    document.getElementById('t32').innerText = base32;
    document.getElementById('lhex').innerText = hex.length;
    document.getElementById('l64').innerText = base64.length;
    document.getElementById('l32').innerText = base32.length;
    let width = 0;
    for (let i = 0; i < 4; i++) {
        let qr = null;
        let size = null;
        qr = createQR(hex, i);
        size = drawQR(document.getElementById("c" + i + "h"), qr.qr);
        if (width < size.width) {
            width = size.width;
        }
        document.getElementById("t" + i + "h").innerText = '' + qr.size + ' / ' + qr.mode;
        console.log(hex, i, qr);
        qr = createQR(base64, i);
        size = drawQR(document.getElementById("c" + i + "64"), qr.qr);
        if (width < size.width) {
            width = size.width;
        }
        document.getElementById("t" + i + "64").innerText = '' + qr.size + ' / ' + qr.mode;
        console.log(base64, i, qr);
        qr = createQR(base32, i);
        size = drawQR(document.getElementById("c" + i + "32"), qr.qr);
        if (width < size.width) {
            width = size.width;
        }
        document.getElementById("t" + i + "32").innerText = '' + qr.size + ' / ' + qr.mode;
        console.log(base32, i, qr);
    }
    document.getElementById('hh').style.width = width + 'px';
    document.getElementById('h64').style.width = width + 'px';
    document.getElementById('h32').style.width = width + 'px';
}

function toHex(bs) {
    let hex = '';
    for (let i = 0; i < bs.length; i++) {
        let tmp = bs[i].toString(16);
        if (tmp.length == 1) {
            hex += '0' + tmp;
        } else {
            hex += tmp;
        }
    }
    return hex.toUpperCase();
}

// function test() {
//     for (let i = 0; i < TEST_VECTOR.length; i++) {
//         let t = TEST_VECTOR[i];
//         let bs = toUTF8Array(t[0]);
//         let b64 = convertbits(bs, 8, 6, true);
//         let base64 = toBase64URL(b64, false);
//         let b32 = convertbits(bs, 8, 5, true);
//         let base32 = toBase32(b32, false);
//         console.log(t[0], toHex(bs), base64, base64 == t[1], base32, base32 == t[2]);
//         console.log(t[0], toHex(Base64toBytes(base64)));
//     }
// }

function toBase64(b64, isPad) {
    let base64 = '';
    for (let i = 0; i < b64.length; i++) {
        base64 += BASE64_CHARS[b64[i]];
    }
    if (isPad) {
        while ((base64.length % 4) != 0) {
            base64 += '=';
        }
    }
    return base64;
}

function Base64toBytes(base64) {
    let b64 = [];
    for (let i = 0; i < base64.length; i++) {
        let p = BASE64_CHARS.indexOf(base64[i]);
        if (p < 0) {
            break;
        }
        b64.push(p);
    }
    return convertbits(b64, 6, 8, false);
}

function toBase64URL(b64, isPad) {
    let base64 = '';
    for (let i = 0; i < b64.length; i++) {
        base64 += BASE64URL_CHARS[b64[i]];
    }
    if (isPad) {
        while ((base64.length % 4) != 0) {
            base64 += '=';
        }
    }
    return base64;
}

function toBase32(b32, isPad) {
    let base32 = '';
    for (let i = 0; i < b32.length; i++) {
        base32 += BASE32_CHARS[b32[i]];
    }
    if (isPad) {
        while ((base32.length % 8) != 0) {
            base32 += '=';
        }
    }
    return base32;
}

// https://gist.github.com/joni/3760795
function toUTF8Array(str) {
    var utf8 = [];
    for (var i = 0; i < str.length; i++) {
        var charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
            utf8.push(0xc0 | (charcode >> 6),
                0x80 | (charcode & 0x3f));
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
            utf8.push(0xe0 | (charcode >> 12),
                0x80 | ((charcode >> 6) & 0x3f),
                0x80 | (charcode & 0x3f));
        }
        // surrogate pair
        else {
            i++;
            // UTF-16 encodes 0x10000-0x10FFFF by
            // subtracting 0x10000 and splitting the
            // 20 bits of 0x0-0xFFFFF into two halves
            charcode = 0x10000 + (((charcode & 0x3ff) << 10)
                | (str.charCodeAt(i) & 0x3ff));
            utf8.push(0xf0 | (charcode >> 18),
                0x80 | ((charcode >> 12) & 0x3f),
                0x80 | ((charcode >> 6) & 0x3f),
                0x80 | (charcode & 0x3f));
        }
    }
    return utf8;
}

// https://github.com/sipa/bech32
// https://github.com/sipa/bech32/blob/master/ref/javascript/segwit_addr.js
function convertbits(data, frombits, tobits, pad) {
    var acc = 0;
    var bits = 0;
    var ret = [];
    var maxv = (1 << tobits) - 1;
    for (var p = 0; p < data.length; ++p) {
        var value = data[p];
        if (value < 0 || (value >> frombits) !== 0) {
            return null;
        }
        acc = (acc << frombits) | value;
        bits += frombits;
        while (bits >= tobits) {
            bits -= tobits;
            ret.push((acc >> bits) & maxv);
        }
    }
    if (pad) {
        if (bits > 0) {
            ret.push((acc << (tobits - bits)) & maxv);
        }
    } else if (bits >= frombits || ((acc << (tobits - bits)) & maxv)) {
        return null;
    }
    return ret;
}

function createQR(text, correction) {
    let modes = ['NUMBER', 'ALPHA_NUM', '8bit'];
    let qr = null;
    // type number
    // - supported are all levels 1-40
    // - use 0 for the lowest complexity
    let typeNumber = 0;
    // correction
    // - Integer 1 - Level L (Low)
    // - Integer 0 - Level M (Medium)
    // - Integer 3 - Level Q (Quartile)
    // - Integer 2 - Level H (High)
    // let correction = 1;
    // input mode
    // - NUMBER: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
    // - ALPHA_NUM: *0–9, A–Z (upper-case only), space, $, %, , +, -, ., /, :
    // - 8bit (default): ISO 8859-1
    // https://github.com/janantala/qrcode.js
    for (let i = 0; i < modes.length; i++) {
        try {
            inputMode = modes[i];
            qr = new QRCode(typeNumber, correction, inputMode);
            qr.addData(text);
            qr.make();
            break;
        } catch (e) {
            if (i + 1 != modes.length) {
                continue;
            }
            throw e;
        }
    }
    let size = '' + qr.modules.length + 'x' + qr.modules[0].length;
    return { qr: qr, mode: inputMode, size: size };
}

function drawQR(c, qr) {
    let size = 5;
    // let c = document.getElementById('c');
    width = (qr.modules.length + 8) * size;
    height = (qr.modules[0].length + 8) * size;
    c.width = width;
    c.height = height;
    let ctx = c.getContext('2d');
    ctx.fillStyle = 'black';
    for (let row = 0; row < qr.modules.length; row++) {
        for (let col = 0; col < qr.modules[row].length; col++) {
            // console.log(row, col);
            if (qr.modules[row][col]) {
                ctx.fillRect((row + 4) * size, (col + 4) * size, size, size);
            }
        }
    }
    return { width: width, height: height };
}

window.addEventListener("load", init);
