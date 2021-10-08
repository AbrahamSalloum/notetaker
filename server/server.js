const mongoose = require("mongoose")
const Document = require('./document')

mongoose.connect('mongodb://localhost/reactdocs');
const defaultValue = "";
const io = require('socket.io')(3001, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})


io.on('connection', async (socket) => {

    socket.on('get-document',  async (documentID) => {
        const document  = await findOrCreateDocument(documentID)
        socket.join(documentID)
        socket.emit('load-document', document.data)
   
        socket.on('send-changes', (delta) => {
            socket.broadcast.to(documentID).emit("receive-changes", delta)
        })

        socket.on('save-document', async (data) => {
            console.log("server saved")
            await Document.findByIdAndUpdate(documentID, {data})
        })

    })


    
})

async function findOrCreateDocument(id) {
    if(id === null) return
    const document = await Document.findById(id)
    if(document) return document
    return await Document.create({_id:id, data: defaultValue })
}