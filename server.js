const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const autoIncrement = require('mongoose-auto-increment')
const http = require('http')
const socketServer = require('socket.io')

const app = express();

const todoModel = require('./models/todoModel')  //todo model

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

// MONGOOSE CONNECT
// ===========================================================================
mongoose.connect('mongodb://localhost:27017/todoApp', {
    useMongoClient: true,
})

var db = mongoose.connection
db.on('error', (err) => {
    console.log('--- Impossible de se connecter à mongoose',err)
})
db.once('open', () => {
    console.log('+++ Connecter à mongoose')
})
var serve = http.createServer(app);
var io = socketServer(serve);
//serve.listen(3010, () => {
serve.listen(3000, () => {
    console.log("+++ Express Server à l'écoute")
})


/***************************************************************************************** */
const connections = [];
io.on('connection', function (socket) {
    console.log("Un client se connecte à la socket - " + socket.id)
    connections.push(socket)
    socket.on('disconnect', function () {
        console.log('Un client se déconnecte de la socket - ' + socket.id);
    });

    var cursor = todoModel.find({}, (err, result) => {
        if (err) {
            console.log("--- GET failed!!")
        } else {
            socket.emit('initialList', result)
            console.log("+++GET worked!! nbr de todos : ", result.length)
        }
    })
    socket.on('addItem', (addData) => {
        var todoItem = new todoModel({
            itemId: addData.id,
            title: addData.title,
            description: addData.description,
            completed: addData.completed
        })

        todoItem.save((err, result) => {
            if (err) {
                console.log("--- ADD NEW ITEM failed!! " + err)
            } else {
                io.emit('itemAdded', addData)

                console.log({message: "+++ ADD NEW ITEM worked!!"})
            }
        })
    })

    socket.on('deleteAll', () => {

        todoModel.deleteMany({}, (err, result) => {
            if (err) {
                console.log("--- DELETE ALL ITEM failed!! " + err)
            } else {
                io.emit('allItemDeleted')

                console.log({message: "+++ DELETE ALL ITEM worked!!"})
            }
        })
    })
    socket.on('markAll', (completedFlag) => {

		var updateValue = {completed: completedFlag.completed}

		todoModel.updateMany({},updateValue, (err, result) => {
			if (err) {
				console.log("--- MARKED ALL  COMPLETE failed!! " + err)
			} else {
				io.emit('allItemMarked', completedFlag)

				console.log({message: "+++ MARKED ALL ITEM worked!!"})

			}
		})



    })

    socket.on('markItem', (markedItem) => {
        var condition = {itemId: markedItem.id},
            updateValue = {completed: markedItem.completed}


        todoModel.update(condition, updateValue, (err, result) => {
            if (err) {
                console.log("--- MARK COMPLETE failed!! " + err)
            } else {
                io.emit('itemMarked', markedItem)

                console.log({message: "+++MARK COMPLETE worked!!"})
            }
        })
    })

});
