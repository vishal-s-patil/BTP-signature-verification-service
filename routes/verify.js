var express = require('express');
var router = express.Router();
var os = require('os');
const multer = require('multer');
// const { verify } = require('crypto');

// storage defination

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
    filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

const upload = multer({ storage: storage });

// verify logic starts here

if (os.platform() == 'win32') {  
    if (os.arch() == 'ia32') {
        var chilkat = require('@chilkat/ck-node11-win-ia32');
    } else {
        var chilkat = require('@chilkat/ck-node11-win64'); 
    }
} else if (os.platform() == 'linux') {
    if (os.arch() == 'arm') {
        var chilkat = require('@chilkat/ck-node11-arm');
    } else if (os.arch() == 'x86') {
        var chilkat = require('@chilkat/ck-node11-linux32');
    } else {
        var chilkat = require('@chilkat/ck-node11-linux64');
    }
} else if (os.platform() == 'darwin') {
    var chilkat = require('@chilkat/ck-node11-macosx');
}

function chilkatExample(filename) {
    var zip = new chilkat.Zip();
    var success = zip.OpenZip(`uploads/${filename}`);
    if (success == false) {
        console.log(zip.LastErrorText);
        return;
    }

    var entry = zip.GetEntryByIndex(0);
    if (zip.LastMethodSuccess == false) {
        console.log(zip.LastErrorText);
        return;
    }

    var sharePhrase = "2580";
    zip.DecryptPassword = sharePhrase;

    var bdXml = new chilkat.BinData();

    success = entry.UnzipToBd(bdXml);
    if (success == false) {
        console.log(entry.LastErrorText);

        return;
    }

    var dsig = new chilkat.XmlDSig();
    success = dsig.LoadSignatureBd(bdXml);
    if (success !== true) {
        console.log(dsig.LastErrorText);
        return;
    }

    var cert = new chilkat.Cert();
    success = cert.LoadFromFile("public/uidai_auth_sign_prod_2023.cer");
    if (success !== true) {
        console.log(cert.LastErrorText);
        return;
    }

    var pubKey = cert.ExportPublicKey();
    success = dsig.SetPublicKey(pubKey);

    var bVerifyReferenceDigests = true;
    var bVerified = dsig.VerifySignature(bVerifyReferenceDigests);
    if (bVerified == false) {
        console.log(dsig.LastErrorText);
        console.log("The signature was not valid.");
        return false;
    }

    console.log("The XML digital signature is valid.");
    return true;
}

// verify logic ends here

router.post('/upload', upload.single('file'), function (req, res) {
    const title = req.body.title;
    const file = req.file;

    // console.log("file uploaded", title);
    // console.log('file', file);

    is_valid = chilkatExample(file.filename)
    if(is_valid) {
        res.status(200).json({msg : "OK"});
    }
    else {
        res.status(200).json({msg : "failed"});
    }
    
});

module.exports = router;


//required node verison : v11.15.0
//required npm version : 6.7.0