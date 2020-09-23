"use strict";

class OTP {
    constructor() {
        this.Algorithm = "SHA-1";
        this.Digit = 6;
        this.X = 30;
        this.T0 = 0;
    }

    // https://tools.ietf.org/html/rfc4226
    hotp(secret, count) {
        let hex = count.toString(16);
        while (hex.length < 16) {
            hex = "0" + hex;
        }
        let data = new Uint8Array(8);
        for (let i = 0; i < 8; i++) {
            data[i] = parseInt(hex.substr(i * 2, 2), 16);
        }
        return new Promise((resolve, reject) => {
            // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey
            window.crypto.subtle.importKey(
                "raw", // format
                secret, // keyData
                {
                    name: "HMAC",
                    hash: { name: this.Algorithm }
                }, // algorithm : HmacImportParams
                false, // extractable
                ["sign"] // keyUsages
            ).then(key => {
                // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/sign
                window.crypto.subtle.sign(
                    "HMAC", // algorithm
                    key, // key
                    data, // data
                ).then(sig => {
                    let hash = new Uint8Array(sig);
                    let offset = hash[hash.length - 1] & 0x0F;
                    var binary =
                        ((hash[offset] & 0x7f) << 24) |
                        ((hash[offset + 1] & 0xff) << 16) |
                        ((hash[offset + 2] & 0xff) << 8) |
                        (hash[offset + 3] & 0xff);
                    let otp = binary % (10 ** this.Digit);
                    let result = "" + otp;
                    while (result.length < this.Digit) {
                        result = "0" + result;
                    }
                    resolve(result);
                }).catch(err => reject(err));
            }).catch(err => reject(err));
        });
    }

    // https://tools.ietf.org/html/rfc6238
    totp(secret, time) {
        let count = Math.floor((time - this.T0) / this.X);
        return this.hotp(secret, count);
    }
}

// https://tools.ietf.org/html/rfc4648
class Base32 {
    static Enc(data) {
        let bs = new Uint8Array(data);
        let base32 = "";
        for (let i = 0; i < bs.length; i += 5) {
            let src = bs.slice(i, i + 5);
            let pos = [0, 0, 0, 0, 0, 0, 0, 0];
            switch (src.length) {
                default:
                    pos[7] = src[4] & 0x1f;
                    pos[6] = (src[4] >> 5) & 0x07;
                case 4:
                    pos[6] |= (src[3] << 3) & 0x18;
                    pos[5] = (src[3] >> 2) & 0x1f;
                    pos[4] = (src[3] >> 7) & 0x01;
                case 3:
                    pos[4] |= (src[2] << 1) & 0x1e;
                    pos[3] = (src[2] >> 4) & 0x0f;
                case 2:
                    pos[3] |= (src[1] << 4) & 0x10;
                    pos[2] = (src[1] >> 1) & 0x1f;
                    pos[1] = (src[1] >> 6) & 0x03;
                case 1:
                    pos[1] |= (src[0] << 2) & 0x1c;
                    pos[0] = (src[0] >> 3) & 0x1f;
            }
            let size = Math.ceil(src.length * 8 / 5);
            for (let j = 0; j < size; j++) {
                base32 += "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".charAt(pos[j]);
            }
            for (let j = 0; j < 8 - size; j++) {
                base32 += "=";
            }
        }
        return base32;
    }
    static Dec(base32) {
        let ret = base32.match(/^([A-Z2-7]{8})*([A-Z2-7]{7}=|[A-Z2-7]{5}===|[A-Z2-7]{4}====|[A-Z2-7]{2}======)?$/);
        if (ret == null) {
            return null;
        }
        let pad = base32.match(/=*$/)[0];
        let size = Math.floor((base32.length - pad.length) * 5 / 8);
        let bs = new Uint8Array(size);
        let tmp = [];
        for (let i = 0; i < base32.length - pad.length; i++) {
            tmp.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".indexOf(base32.charAt(i)));
        }
        let round = base32.length / 8;
        for (let i = 0; i < round; i++) {
            let src = tmp.slice(i * 8, i * 8 + 8);
            switch (src.length) {
                case 8:
                    bs[i * 5 + 4] = tmp[i * 8 + 7]
                        | ((tmp[i * 8 + 6] << 5) & 0xe0);
                case 7:
                    bs[i * 5 + 3] = ((tmp[i * 8 + 6] >> 3) & 0x03)
                        | ((tmp[i * 8 + 5] << 2) & 0x7c)
                        | ((tmp[i * 8 + 4] << 7) & 0x80);
                case 5:
                    bs[i * 5 + 2] = ((tmp[i * 8 + 4] >> 1) & 0x0f)
                        | ((tmp[i * 8 + 3] << 4) & 0xf0);
                case 4:
                    bs[i * 5 + 1] = ((tmp[i * 8 + 3] >> 4) & 0x01)
                        | ((tmp[i * 8 + 2] << 1) & 0x3e)
                        | ((tmp[i * 8 + 1] << 6) & 0xc0);
                case 2:
                    bs[i * 5] = ((tmp[i * 8 + 1] >> 2) & 0x07)
                        | ((tmp[i * 8] << 3) & 0xf8);
            }
        }
        return bs;
    }
}