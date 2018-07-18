const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

//Connect to Mongo
mongo.connect('mongodb://127.0.0.1', function(err, mang){
    if(err){
        throw err;
    }
    

    console.log('mongoDB connected...');

    //connect to socket.io
    client.on('connection',function(socket){
        let chat = mang.db('chatsupport');

        //create function to send status
        sendStatus = function(s){
            socket.emit('status', s);
        }

        //get chats from mongo collection
        chat.collection('chats').find({}).limit(100).sort({_id:1}).toArray(function(err,res){
            if(err){
                throw err
            }

            //emit the messages
            socket.emit('output',res);
        });
        
        //Handle input events
        socket.on('input', function(data){
            let name = data.name;
            let message = data.message;

            //Check for the name and message
            if(name == '' || message == ''){
                //Send error status
                sendStatus('Please enter a name and the message');
            }else{
                //insert message
                chat.collection('chats').insert({name: name, message: message}, function(){
                    client.emit('output', [data]);

                    //send status object
                    sendStatus({
                        message: 'message sent',
                        clear: true
                    });
                });
            }
        });

        //handle clear
        socket.on('clear', function(data){
            //remove all chats from collection
            chat.collection('chats').remove({}, function(){
                //Emit cleared
                socket.emit('cleared');
            });
        });
    });
});
