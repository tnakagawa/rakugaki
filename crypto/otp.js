
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
                    let otp = binary % Math.pow(10, this.Digit);
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

