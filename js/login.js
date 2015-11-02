function login()
{
    $(".login-error").html("").hide();

    if(!checkInputData())
    {
        return;
    }

	username  = $("#username").val();
	password  = $("#password").val();
	host = $("#host").val();

	//richiedo la chiave pubblica
	var asxpublicKey = "";
	var publickeysApi = host + '/api/publickeys?asxcallback=?';

	$.ajax({
	  url: publickeysApi,
	  type: 'GET',
	  dataType: 'jsonp',
	  success: function (data, status) {
		asxpublicKey = "<RSAKeyValue>" + data + "</RSAKeyValue>";
		console.log( "asxpublicKey = " + asxpublicKey);
		logInASX(asxpublicKey,host,username,password);
	  },
	  error: function (e) {
	    console.log(e);
	    errMsg = e.status + "-" + e.statusText;
        $(".login-error").html(errMsg).show();
	  }
	});
}

function checkInputData()
{
    $(".login-error").html("").hide();

    var errorMessage = "";
    var emptyFields = [];
    if($.trim($("#host").val()) == "")
    {
        emptyFields.push("host name");
    }      
    if($.trim($("#username").val()) == "")
    {
        emptyFields.push("username");
    }
    if($.trim($("#password").val()) == "")
    {
        emptyFields.push("password");
    }    

    if(emptyFields.length > 0)
    {
        if(emptyFields.length == 1)
        {
            errorMessage = "Occorre specificare il campo " + emptyFields[0] + "."
        }
        else
        {
            errorMessage = "Occorre specificare i campi: ";
            for (var i = 0; i < emptyFields.length; i++) {
                errorMessage += emptyFields[i];
                if(i==emptyFields.length-1)
                {
                    errorMessage += ".";
                }
                else if(i==emptyFields.length-2)
                {
                    errorMessage += " e ";
                }
                else
                {
                    errorMessage += ", ";                    
                }
            };
        }

        $(".login-error").html("Attenzione: " + errorMessage).show();
        return false;
    }
    else
    {
        $(".login-error").html("").hide();
        return true;
    }
}

function logInASX(asxpublicKey,host,username,password)
{
    $(".login-error").html("").hide();

	// init data 
    var d = new Date();
    //ASX accepted date format "YYYY-MM-dd HH:mm:ssZ")
    var Timestamp = ((d.toISOString()).replace("T", " ")).split(".")[0] + "Z";

    console.log( "Timestamp = " + Timestamp);

    var method = "GET";
    var loginApiPath = "/api/logins";
    var bodyContent = "";

    // CALCULATE SIGNATURE ({signature}: HMACSHA256 di {basestring} usando come chiave {md5(password.ToUpper)} )
	var absPath = getAbsolutePath(host + loginApiPath);

    var basestring = method + "\n" + Timestamp + "\n" +  absPath + "\n" + bodyContent;

    console.log("basestring=" + basestring);

    var md = forge.md.md5.create();
    md.update(password.toUpperCase());
    var md5pw = md.digest().toHex()
    console.log("hashedpassword=" + md5pw);

    var signature = encodeSignature(basestring, md5pw);

    console.log("signature=" + signature);

    // ENCRYPT USER CREDENTIAL ({cryptedUserLogin} = Encrypt RSA di {datatoencrypt} con {“<RSAKeyValue>" + {publicKey} + "</RSAKeyValue>})

    var datatoencrypt = forge.util.encode64(forge.util.encodeUtf8(username)) + ":" + forge.util.encode64(forge.util.encodeUtf8(password));

    console.log( "datatoencrypt:" + datatoencrypt );

    // create forge publickey
    var pubKey = pki.publicKeyFromXML(asxpublicKey);

    // encrypt and encode
    var inputBuffer = forge.util.createBuffer(forge.util.encodeUtf8(datatoencrypt.toString()));

    var crypted = pubKey.encrypt(inputBuffer.getBytes());

    var cryptedBuffer = forge.util.createBuffer(crypted);

    var cryptedCredentials = forge.util.encode64(cryptedBuffer.getBytes());

    console.log("cryptedCredentials=" + cryptedCredentials);

    //Authentication:  {cryptedUserLogin}:{signature}
    var Authentication = cryptedCredentials + ":" + signature;
    console.log("Authentication=" + Authentication);
    
    var loginApi = host + loginApiPath + "?asxcallback=?";

    $.ajax({
        url: loginApi,
        type: 'GET',
        headers: {'Timestamp':Timestamp, 'Authentication':Authentication},
        crossDomain:false,
        dataType: 'jsonp',
        success: function (data) {
            console.log(data);
            if(data.IsAuthenticated == true && data.userCanSearch == true)
            {
                // save user profile
                saveUserData(host,username,cryptedCredentials,md5pw);
                // go to search page (simple search)
                $.mobile.changePage("#search_page");
            }
        },
        error: function (e) {
            console.log(e);
            errMsg = e.status + "-" + e.statusText;
            $(".login-error").html(errMsg).show();
        }
    });
}

function encodeSignature(basestring, passwordHash)
{
    // define key for HMACSHA256
    ashKey = forge.util.createBuffer(forge.util.encodeUtf8(passwordHash.toUpperCase())).getBytes();

    hmac = forge.hmac.create();
    hmac.start('sha256', ashKey);
    hmac.update(forge.util.createBuffer(forge.util.encodeUtf8(basestring)).getBytes());

    signature = forge.util.encode64(hmac.digest().getBytes());

    console.log("signature=" + signature);

    return signature;
}

function saveUserData(host,username,cryptedCredential, passwordHash)
{
    now = new Date();
    currentProfile = new Profile(usedProfileName,host,username,cryptedCredential, passwordHash, now);
    loginProfiles.addProfile(currentProfile);
}


function logout()
{
    currentProfile.clearAuthenticationProperty();
    currentProfile.save();
    $.mobile.changePage("#login_page");
}