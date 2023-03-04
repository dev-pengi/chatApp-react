const asyncHandler = require('express-async-handler');
const user = require('../models/user');
const chat = require('../models/chat');
const message = require('../models/message');
const socket = require('../utilities/socket')


const sendMessage = asyncHandler(async (req, res) => {
    const { chatID } = req.params;
    const { content, socketID } = req.body;

    const findChat = {
        $and: [
            { _id: chatID },
            { users: { $elemMatch: { $eq: req.user._id } } }
        ]
    }
    try {

        let isChat = await chat.findOne(findChat)
            .populate("users", "-password")
            .populate("groupAdmin", "-password")
            .populate('lastMessage')

        if (!isChat) {
            res.status(404);
            throw new Error('Chat not found')
        }
        if (!content || !content.trim().length) {
            res.status(400);
            throw new Error('Message can\'t be empty')
        }

        const newMessage = {
            sender: req.user._id,
            content: content,
            chat: chatID,
        }

        var sendedMessage = await message.create(newMessage);
        await chat.findOneAndUpdate(findChat, { lastMessage: sendedMessage._id });

        sendedMessage = await sendedMessage
            .populate({ path: 'sender', select: '-password' })

        sendedMessage = await sendedMessage
            .populate({ path: 'chat' })

        sendedMessage = await user.populate(sendedMessage, {
            path: 'chat.users',
            select: '-password'
        });

        sendedMessage = await message.populate(sendedMessage, {
            path: 'chat.lastMessage',
        });

        sendedMessage = await user.populate(sendedMessage, {
            path: "chat.lastMessage.sender",
            select: '-password'
        })

        res.json(sendedMessage);

        const sendedMessageObj = sendedMessage.toObject();
        sendedMessageObj.socket = socketID;

        socket.message(sendedMessageObj);
        socket.chatUpdate(sendedMessageObj.chat);

    } catch (err) {
        console.log(err)
        res.status(405)
        throw new Error(err.message)
    }
})






const fetchMessages = asyncHandler(async (req, res) => {
    const { chatID } = req.params;
    const { limit } = req.query;

    const findChat = {
        $and: [
            { _id: chatID },
            { users: { $elemMatch: { $eq: req.user._id } } }
        ]
    }
    try {

        let isChat = await chat.findOne(findChat)

        if (!isChat) {
            res.status(404);
            throw new Error('Chat not found')
        }
        const query = message.find({ chat: chatID }).populate({ path: 'sender', select: 'name avatar email' }).populate({ path: 'chat', select: '-lastMessage' });
        if (!isNaN(limit) && limit > 0) {
            query.limit(limit);
        }
        const messages = await query.exec();
        res.json(messages)

    } catch (err) {
        console.log(err)
        res.status(405)
        throw new Error(err.message)
    }
})




module.exports = {
    sendMessage,
    fetchMessages
}