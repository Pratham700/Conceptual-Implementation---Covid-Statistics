const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const port = 8080
const round = require('mongo-round') ;

// Parse JSON bodies (as sent by API clients)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const { connection } = require('./connector') ;

app.get("/totalRecovered" , async (req,res) => {
    const totRecovered = await connection.aggregate([
        {
            $group: {
                _id:"total",
                recovered: {
                    $sum: "$recovered",
                },
            },
        },
    ]);
    res.send({data: totRecovered[0] }) ;
}) ; 

app.get("/totalActive", async (req,res)=>{
    const activeCase = await connection.aggregate([
        {
            $group: {
              _id: "total",
              totalInfected: {
                $sum: "$infected",
              },
              totalRecovered: {
                $sum: "$recovered",
              },
            },
          },
          {
            $addFields: {
              active: { $subtract: ["$totalInfected", "$totalRecovered"] },
            },
          },
          {
            $project: {
              _id: "total",
              active: "$active",
            },
          },
    ])
    res.send({data: activeCase }) ;
}) ; 

app.get("/totalDeath", async (req,res) => {

    const totDeath = await connection.aggregate([
        {
            $group: {
                _id:"total",
                death: {
                    $sum: "$death",
                },
            },
        },
    ])
    res.send({data: totDeath[0] }) ;
}) ; 

app.get("/hotspotStates", async (req,res)=> {
   
    const hotspot = connection.aggregate([
        {
            $group: {
                _id:"$state",
                rate: { $sum: {

                    $division:[ {$substract:["$infected","$recovered"]},"$infected"] 
                }
         
                }
            }
            
        
        },

        {
            $match: {
                $rate: {
                    $gt:0.1
                }
            }
        },
        {
            $project: {
                state: "$_id",
                _id:0,
                rate: round("$rate" , 5), 
            }
        }
        
    ])
    res.send({data: hotspot }) ;
}) ;

app.get("/healthyStates",async (req,res)=> {
    const result = await connection.aggregate([
        {
          $group: {
            _id: "$state",
            mortality: { $sum: { $divide: ["$death", "$infected"] } },
          },
        },
        {
          $match: {
            mortality: {
              $lt: 0.005,
            },
          },
        },
        {
          $project: {
            state: "$_id",
            _id: 0,
            mortality: round("$mortality", 5),
          },
        },
      ]);
      res.send({data: result }) ;
})






app.listen(port, () => console.log(`App listening on port ${port}!`))

module.exports = app;