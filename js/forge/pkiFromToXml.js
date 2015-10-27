var pki = forge.pki = forge.pki || {};

var BigInteger = forge.jsbn.BigInteger;
function parseBigInteger(b64) {
    return new BigInteger(new forge.util.createBuffer(forge.util.decode64(b64)).toHex(), 16);
}

pki.publicKeyFromXML = function (xml) {
    
    var oParser = new DOMParser();
    var oDOM = oParser.parseFromString(xml, "text/xml");

    // print the name of the root element or error message
    if (oDOM.documentElement.nodeName == "parsererror") {
        throw new Error('Could not parse public key XML.');
    }

    var rsaKeyValue = {
        Modulus: oDOM.getElementsByTagName("Modulus")[0].childNodes[0].nodeValue,
        Exponent: oDOM.getElementsByTagName("Exponent")[0].childNodes[0].nodeValue
    };

    var publicKey = forge.pki.setRsaPublicKey(
          parseBigInteger(rsaKeyValue.Modulus), // n
        parseBigInteger(rsaKeyValue.Exponent)); // e

    return publicKey;
};

pki.privateKeyFromXML = function (xml) {

    var oParser = new DOMParser();
    var oDOM = oParser.parseFromString(xml, "text/xml");

    // print the name of the root element or error message
    if (oDOM.documentElement.nodeName == "parsererror") {
        throw new Error('Could not parse public key XML.');
    }

    var rsaKeyValue = {
        Modulus: oDOM.getElementsByTagName("Modulus")[0].childNodes[0].nodeValue,
        Exponent: oDOM.getElementsByTagName("Exponent")[0].childNodes[0].nodeValue,
        D: oDOM.getElementsByTagName("D")[0].childNodes[0].nodeValue,
        P: oDOM.getElementsByTagName("P")[0].childNodes[0].nodeValue,
        Q: oDOM.getElementsByTagName("Q")[0].childNodes[0].nodeValue,
        DP: oDOM.getElementsByTagName("DP")[0].childNodes[0].nodeValue,
        DQ: oDOM.getElementsByTagName("DQ")[0].childNodes[0].nodeValue,
        InverseQ: oDOM.getElementsByTagName("InverseQ")[0].childNodes[0].nodeValue
    };

    var privateKey = forge.pki.setRsaPrivateKey(
      parseBigInteger(rsaKeyValue.Modulus), // n
      parseBigInteger(rsaKeyValue.Exponent), // e
      parseBigInteger(rsaKeyValue.D),
      parseBigInteger(rsaKeyValue.P),
      parseBigInteger(rsaKeyValue.Q),
      parseBigInteger(rsaKeyValue.DP),
      parseBigInteger(rsaKeyValue.DQ),
      parseBigInteger(rsaKeyValue.InverseQ)); // qInv

    return privateKey;
};

pki.publicKeyToXML = function (publicKey) {
    console.log(publicKey);

    var doc = document.implementation.createDocument("", "", null);
    var RSAKeyValue = doc.createElement("RSAKeyValue");

    var Modulus = doc.createElement("Modulus");
    Modulus.textContent = forge.util.encode64(forge.util.hexToBytes(publicKey.n.toString(16)));
    RSAKeyValue.appendChild(Modulus);

    var Exponent = doc.createElement("Exponent");
    Exponent.textContent = forge.util.encode64(forge.util.hexToBytes(publicKey.e.toString(16)));
    RSAKeyValue.appendChild(Exponent);

    doc.appendChild(RSAKeyValue);

    var oSerializer = new XMLSerializer();
    var sXML = oSerializer.serializeToString(doc)

    console.log(sXML);


    return "";
};