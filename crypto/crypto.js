"use strict";

async function init() {
    await testGOTP();
    await testTOTP();
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