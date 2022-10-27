let express = require("express");
let app = express();
const RedisCache = require("./cacheHandler");
const jwt_decode = require("jwt-decode");
var bodyParser = require('body-parser');
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

RedisCache.initializeRedis();

const getRealm = (req) => {
    let token = req.headers.authorization;
    var decoded = jwt_decode(token);
    let {realm} = decoded;
    return realm ? realm : null;
}
app.get("/:key", async(req, res)=>{
     console.log("req.params.id",req.params.key)
     let {key} = req.params;
    let realm = getRealm(req);
    if(!realm){
        let message = "Invalid access";
        res.status(401).send({ message });
    } 
    try {
        let cacheData = await RedisCache.getHashCache(realm, key);
        if (cacheData == null) {
            return res.send({
                status:"OK",
                data: null 
            });
        }else{
            return res.send({
                status:"OK",
                data: JSON.parse(cacheData)
            });
        } 
    } catch (error) {
        return res.send({
            status:"error",
            data: error.message
        });
    }
})

app.post("/", async(req, res)=>{
    let realm = getRealm(req);
    if(!realm){
        let message = "Invalid access";
        res.status(401).send({ message });
    }
    let {key, value} = req.body;
    let cacheSetResp, code = 200, _res = {"message":""};
    console.log(`"set key as ${key} for realm: ${realm}`);
    try {
        cacheSetResp =  await RedisCache.setHashCache(realm, key, JSON.stringify(value));   
        _res.message = cacheSetResp;
    } catch (error) {
        code = 500;
        _res.message = error.message;
    }
    console.log(_res, code)
    res.send(_res).status(code);
});

app.listen(7722, ()=>console.log(`app running 7722`));