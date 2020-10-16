const { json } = require('body-parser');
const express = require('express')
const axios = require('axios').default; 
const app = express()
const port = 3000
    

app.get('/say', async (req,res)=>{
      await axios.get('https://k1zipe68zk.execute-api.us-east-2.amazonaws.com/test/say?keyword=' + req.query.keyword)
.then(function (result) {
	 if (!req.query || !req.query.keyword){
          res.status(400).send("Provide valid parameters");
	 }
	 else {
     	  res.send(result.data);
	}
   })
   .catch(function (error) {
      console.log(error);   
   })   
})   

app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`)
   })
