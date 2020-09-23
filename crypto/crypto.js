"use strict";

async function init() {
    await testGOTP();
    await testTOTP();
    testBase32();
    document.getElementById("issuer").addEventListener("change", createURI);
    document.getElementById("account").addEventListener("change", createURI);
    document.getElementById("secret").addEventListener("change", createURI);
    document.getElementById("algorithm").addEventListener("change", createURI);
    document.getElementById("digits").addEventListener("change", createURI);
    document.getElementById("genkey").addEventListener("click", setSecret);
    setSecret();
    setCode();
}

function createURI() {
    let issuer = encodeURI(document.getElementById("issuer").value);
    let account = encodeURI(document.getElementById("account").value);
    let secret = encodeURI(document.getElementById("secret").value);
    let algorithm = document.getElementById("algorithm").value;
    let digits = document.getElementById("digits").value;
    let uri = "otpauth://totp/" + issuer + ":" + account
        + "?secret=" + secret + "&issuer=" + issuer;
    if (algorithm) {
        uri += "&algorithm=" + algorithm;
    }
    if (digits) {
        uri += "&digits=" + digits;
    }
    // uri += "&period=30";
    document.getElementById("uri").innerText = uri;

    let qr = new QRCode(0, 0, "8bit");
    qr.addData(uri);
    qr.make();
    let size = 5;
    let c = document.getElementById("qr");
    c.width = (qr.modules.length + 8) * size;
    c.height = (qr.modules[0].length + 8) * size;
    let ctx = c.getContext('2d');
    ctx.fillStyle = 'black';
    for (let row = 0; row < qr.modules.length; row++) {
        for (let col = 0; col < qr.modules[row].length; col++) {
            if (qr.modules[row][col]) {
                ctx.fillRect((row + 4) * size, (col + 4) * size, size, size);
            }
        }
    }
    document.getElementById("qr_wrapper").style.width = c.width + "px";
    before = 0;
}

function setSecret() {
    let algorithm = document.getElementById("algorithm").value;
    let size = 20;
    if (algorithm == "SHA256") {
        size = 32;
    } else if (algorithm == "SHA512") {
        size = 64;
    }
    let bs = new Uint8Array(size);
    window.crypto.getRandomValues(bs);
    let base32 = Base32.Enc(bs);
    document.getElementById("secret").value = base32;
    createURI();
}

var before = 0;

function setCode() {
    let time = (new Date()).getTime();
    let now = Math.floor(time / 1000);
    if (before <= now) {
        let otp = new OTP();
        let algorithm = document.getElementById("algorithm").value;
        let digits = document.getElementById("digits").value;
        if (algorithm == "SHA256") {
            otp.Algorithm = "SHA-256";
        } else if (algorithm == "SHA512") {
            otp.Algorithm = "SHA-512";
        }
        if (digits) {
            otp.Digit = parseInt(digits, 10);
        }
        let secret = document.getElementById("secret").value
        otp.totp(Base32.Dec(secret), now).then(otp => {
            let half = otp.length / 2;
            document.getElementById("otp").innerText = otp.slice(0, half) + " " + otp.slice(half);
        });
        before = Math.floor(now / 30) * 30 + 30;
    }
    let val = ((before * 1000 - time) / 1000).toFixed(1);
    document.getElementById("time").innerHTML = val + "s";
    document.getElementById("timebar").value = val;
    setTimeout(setCode, 100);
}

async function testGOTP() {
    let otps = [
        "755224",
        "287082",
        "359152",
        "969429",
        "338314",
        "254676",
        "287922",
        "162583",
        "399871",
        "520489",
    ];
    for (let i = 0; i < otps.length; i++) {
        let otp = new OTP();
        await otp.hotp(hex2bs("3132333435363738393031323334353637383930"), i).then(otp => {
            console.log(otp, otps[i], otp == otps[i]);
        });
    }
}


async function testTOTP() {
    let testTime = [
        59,
        1111111109,
        1111111111,
        1234567890,
        2000000000,
        20000000000
    ];
    let algs = ["SHA-1", "SHA-256", "SHA-512"];
    let seeds = [
        // Seed for HMAC-SHA1 - 20 bytes
        "3132333435363738393031323334353637383930",
        // Seed for HMAC-SHA256 - 32 bytes
        "3132333435363738393031323334353637383930313233343536373839303132",
        // Seed for HMAC-SHA512 - 64 bytes
        "31323334353637383930313233343536373839303132333435363738393031323334353637383930313233343536373839303132333435363738393031323334",
    ]
    let otps = [
        "94287082", "46119246", "90693936",
        "07081804", "68084774", "25091201",
        "14050471", "67062674", "99943326",
        "89005924", "91819424", "93441116",
        "69279037", "90698825", "38618901",
        "65353130", "77737706", "47863826",
    ];
    for (let i = 0; i < testTime.length; i++) {
        let otp = new OTP();
        otp.Digit = 8;
        for (let j = 0; j < algs.length; j++) {
            otp.Algorithm = algs[j];
            await otp.totp(hex2bs(seeds[j]), testTime[i]).then(otp => {
                console.log(otp, otps[i * 3 + j], otp == otps[i * 3 + j]);
            });
        }
    }
}

function testBase32() {
    // BASE32("") = ""
    // BASE32("f") = "MY======"
    // BASE32("fo") = "MZXQ===="
    // BASE32("foo") = "MZXW6==="
    // BASE32("foob") = "MZXW6YQ="
    // BASE32("fooba") = "MZXW6YTB"
    // BASE32("foobar") = "MZXW6YTBOI======"
    var keys = ["", "f", "fo", "foo", "foob", "fooba", "foobar",];
    var vals = ["", "MY======", "MZXQ====", "MZXW6===", "MZXW6YQ=", "MZXW6YTB", "MZXW6YTBOI======",];
    let enc = new TextEncoder();
    for (let i = 0; i < keys.length; i++) {
        let base32 = Base32.Enc(enc.encode(keys[i]));
        console.log(base32, vals[i], base32 == vals[i]);
    }
    for (let i = 0; i < vals.length; i++) {
        let bs = Base32.Dec(vals[i]);
        let key = new TextDecoder().decode(bs);
        console.log(key, keys[i], key == keys[i]);
    }
}

function bs2hex(bs) {
    return Array.prototype.map.call(new Uint8Array(bs), x => ('00' + x.toString(16)).slice(-2)).join('');
}

function hex2bs(hex) {
    var bs = new Uint8Array(Math.ceil(hex.length / 2));
    for (let i = 0; i < bs.length; i++) {
        bs[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bs;
}

window.addEventListener("load", init);