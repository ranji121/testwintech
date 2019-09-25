require('dotenv').config();
var express = require('express');
var ibmdb = require('ibm_db');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));
app.get('/',function(req,res){
  res.sendFile("views/index.html", {"root": __dirname});
});
var db2;
var hasConnect = false;

// error handler
if (process.env.VCAP_SERVICES) {
    var env = JSON.parse(process.env.VCAP_SERVICES);
	if (env['dashDB']) {
        hasConnect = true;
		db2 = env['dashDB'][0].credentials;
	}	
}

if (hasConnect == false) {
   db2 = {
        db: process.env.db,
        hostname: process.env.hostname,
        port: process.env.port,
        username: process.env.username,
        password: process.env.password
     };
}

var connString = "DRIVER={DB2};DATABASE=" + db2.db + ";UID=" + db2.username + ";PWD=" + db2.password + ";HOSTNAME=" + db2.hostname + ";port=" + db2.port;

ibmdb.open(connString, function(err, conn) {
			if (err ) {
			 res.send("error occurred " + err.message);
			}
			else {
                conn.query("select tabname from syscat.tables where owner = 'DASH100342' and type = 'T'", function(err,tblresult)
                {if(err){console.log(err);}
                else{
                if(tblresult.tabname!="WINTECH"){
                conn.query("CREATE TABLE WINTECH (UID INT NOT NULL GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1), NAME VARCHAR(500),EMAIL VARCHAR(500),ORG VARCHAR(1000),INTERESTEDHACKATHON VARCHAR(500),GITHUB VARCHAR(1000),TIMESTAMP VARCHAR(1000),PROJECT VARCHAR(1000),PRIMARY KEY (UID))");
                        }
                    }
                });
                }
});
app.post('/degregister', function(req,res){
   var name = req.body.name;
    var email = req.body.email;
    var org = req.body.org;
    var interestedhackathon = req.body.fieldinterested;
    var time = new Date().toISOString();
    if (interestedhackathon=="yes"){
    var github = req.body.github;
    var project = req.body.fieldproject;
    }
    else{
     var github="N.A"
     var project ="N.A"
    }
    ibmdb.open(connString, function(err, conn) {
			if (err ) {
			 res.send("error occurred " + err.message);
			}
			else {
				conn.prepare("INSERT INTO DASH100342.WINTECH(NAME,EMAIL,ORG,INTERESTEDHACKATHON,TIMESTAMP,GITHUB,PROJECT) VALUES (?,?,?,?,?,?,?)", function(err, stmt) {		
				if ( !err ) { 
					console.log("successful"+stmt); 
                    stmt.execute([name,email,org,interestedhackathon,time,github,project],function(err,result){
                        if(err){
                            console.log(err);
                        }
                        else{
                            console.log(result);
                            
                        }
                    })
				} else {
				   res.send("error occurred " + err.message);
                }
				});
			}
		});
	  return res.sendFile(__dirname + "/views/success.html"); 
});

const port = process.env.PORT || process.env.VCAP_APP_PORT || 3001;
app.listen(port, function () {
    console.log("Server running on port: %d", port);
});

module.exports = app;
