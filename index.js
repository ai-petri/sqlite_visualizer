const sqlite3 = require("sqlite3");
const http = require("http");
const fs = require("fs");


 
getStructure("database.db").then(o=>
{
 
    let server = http.createServer((req,res)=>
    {
        switch(req.url)
        {
            case "/":
                fs.createReadStream("index.html").pipe(res);
                break;
            case "/data":
                res.setHeader("Content-Type","application/json");
                res.end(JSON.stringify(o));
                break;
            default:
                res.statusCode = 404;
                res.end();
                break;
        }
    })
 
    server.listen(3000,"localhost");
    process.stdin.setRawMode(true);
    process.stdin.on("data",_=>{
        server.close();
        process.exit(0);
    })
});




 
async function getStructure(filename)
{
    const db = new sqlite3.Database(filename);
    
    let allTables = await all("pragma table_list");
    
    let tables = allTables.filter(o=>!o.name.startsWith("sqlite_"));
 
    let obj = {};
 
    for(let table of tables)
    {
        obj[table.name] = {}
        let info = await all("select * from pragma_table_info(?)",table.name);
        for(let column of info)
        {
            let {cid, type, notnull, dflt_value, pk} = column;
            obj[table.name][column.name] = {cid, type, notnull, dflt_value, pk}
        }
    }
 
    for(let table of tables)
    {
        let keys = await all("select * from pragma_foreign_key_list(?)",table.name);
        for(let key of keys)
        {
            obj[table.name][key.from].references = {table:key.table, column:key.to};
        }
    }
    
    db.close();
 
    return obj;
 
    
    function all(sql, params)
    {
        return new Promise(resolve=>
        {
            db.all(sql, params, (err,rows)=>
            {
                if(err)console.log(err);
    
                resolve(rows);
            })
        })
    }
}