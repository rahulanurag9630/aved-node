import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import * as http from "http";
import * as path from "path";
import morgan from "morgan";
import createIO from "socket.io";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import apiErrorHandler from '../helper/apiErrorHandler';
const app = new express();
const server = http.createServer(app);
const root = path.normalize(`${__dirname}/../..`);

const io = createIO(server, {
  transports: ["websocket"],
  pingInterval: 1000 * 60 * 5,
  pingTimeout: 1000 * 60 * 3,
});

import { userServices } from "../api/v1/services/user";
const { findUser } = userServices;
import { socketServices } from "../api/v1/services/socket";
import status from "../enums/status";
const {
  checkUserChatRoom,
  createChatRoom,
  updateUserChatRoom,
  findUserExistingMessages,
  findUserChatRoom,
  saveUserMessage,
} = socketServices;

class ExpressServer {
  constructor() {
    app.use(express.json({ limit: '1000mb' }));

    app.use(express.urlencoded({ extended: true, limit: '1000mb' }))

    app.use(morgan('dev'))

    app.use(
      cors({
        allowedHeaders: ["Content-Type", "token", "authorization"],
        exposedHeaders: ["token", "authorization"],
        origin: "*",
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        preflightContinue: false,
      })
    );
  }
  router(routes) {
    routes(app);
    return this;
  }

  configureSwagger(swaggerDefinition) {
    const options = {
      // swaggerOptions : { authAction :{JWT :{name:"JWT", schema :{ type:"apiKey", in:"header", name:"Authorization", description:""}, value:"Bearer <JWT>"}}},
      swaggerDefinition,
      apis: [
        path.resolve(`${root}/server/api/v1/controllers/**/*.js`),
        path.resolve(`${root}/api.yaml`),
      ],
    };

    app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerJSDoc(options))
    );
    return this;
  }

  handleError() {
    app.use(apiErrorHandler);

    return this;
  }

  async configureDb(dbUrl) {
    try {
      mongoose.connect(dbUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.log('💾 Database connection established');
      return this;
    } catch (err) {
      console.error(`Error in mongodb connection ${err.message}`);
      throw err;
    }
  }

  // })

  listen(port) {
    server.listen(port, () => {
      console.log(`💻 Secure app is listening @port ${port}`, new Date().toLocaleString());
    });
    return app;
  }
}

io.on("connection", (socket) => {
  console.log(`socket connected @time ${new Date().toLocaleString()}=====>>>`, socket.id);

  // Event: Initiate a chat room (one-to-one chat)
  socket.on("initiateUserChat", async (data) => {
    console.log("initiateUserChat ===>>> ", data);
    try {
      const { senderId, receiverId, page = 1, limit = 50 } = data;
      if(!senderId || receiverId) {
        return io.to(socket.id).emit("error", { message: "senderId or receiverId cannot be empty." });
      }
      let roomId;
      let chatData = { senderId, receiverId };
      console.log("Initiate chat:", chatData);
      const roomExist = await checkUserChatRoom({
        $or: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      });
      const receiverDetails = await findUser({ _id: receiverId, status: status.ACTIVE });
      if (!roomExist) {
        chatData.senderSocketId = socket.id;
        const newRoom = await createChatRoom(chatData);
        roomId = newRoom._id;
        console.log("New chat room created with id:", roomId);
        io.to(socket.id).emit("userChatInitiated", {
          chatRoomId: roomId,
          isOnline: receiverDetails.isActive || false,
          messages: [],
        });
      } else {
        roomId = roomExist._id;
        let updateQuery = {};
        if (roomExist.senderId.equals(senderId)) {
          updateQuery.senderSocketId = socket.id;
          console.log("Updated senderSocketId:", socket.id);
        } else {
          updateQuery.receiverSocketId = socket.id;
          console.log("Updated receiverSocketId:", socket.id);
        }
        await updateUserChatRoom({ _id: roomId }, updateQuery);
        const existingMessages = (await findUserExistingMessages({ roomId }, page, limit)) || [];
        io.to(socket.id).emit("userChatInitiated", {
          chatRoomId: roomId,
          isOnline: receiverDetails.isActive || false,
          messages: existingMessages,
        });
      }
    } catch (err) {
      console.error("🚀 ~ socket.on ~ err:", err);
      io.to(socket.id).emit("error", { message: "Failed to initiate chat. Please try again later." });
    }
  });

  // Event: Sending a chat message
  socket.on("userSendMessage", async (data) => {
    console.log("userSendMessage ===>>> ", data);
    try {
      const { roomId, senderId, messageType, content, caption, thumbnail } = data;
      const chatRoom = await findUserChatRoom({ _id: roomId });
      if (!chatRoom) {
        console.warn(`Chat room not found for roomId: ${roomId}`);
        return io.to(socket.id).emit("error", { message: "Chat room not found with provided roomId." });
      }
      const messageObj = {
        senderId,
        roomId,                              
        content,
        messageType,
        caption,
        thumbnail
      };
      await saveUserMessage(messageObj);
      await updateUserChatRoom({ _id: roomId }, { lastMessage: message, lastMessageAt: new Date() });
      const outgoingMessage = {
        ...messageObj,
        createdAt: new Date(),
      };
      if (chatRoom.senderId.equals(senderId)) {
        io.to(chatRoom.receiverSocketId).emit("receiveUserMessage", outgoingMessage);
        io.to(chatRoom.senderSocketId).emit("getUserMessage", outgoingMessage);
      } else {
        io.to(chatRoom.senderSocketId).emit("receiveUserMessage", outgoingMessage);
        io.to(chatRoom.receiverSocketId).emit("getUserMessage", outgoingMessage);
      }
    } catch (error) {
      console.error("🚀 ~ socket.on ~ err:", error);
      io.to(socket.id).emit("error", { message: "Failed to send message at the moment. Please try again later." });
    }
  });

  // Event: When a user is typing in a chat room
  socket.on("typing", async (data) => {
    console.log("userSendMessage ===>>> ", data);
    try {
      const { roomId, userId, isTyping } = data;
      console.log(`User ${userId} is ${isTyping ? "typing" : "not typing"} in room ${roomId}`);
      const chatRoom = await checkUserChatRoom({ _id: roomId });
      if (!chatRoom) {
        console.warn(`Chat room not found for roomId: ${roomId}`);
        return io.to(socket.id).emit("error", { message: "Chat room not found with provided roomId." });
      }
      const userDetails = await findUser({ _id: req.userId, status: status.ACTIVE });
      if (chatRoom.senderId.equals(userId)) {
        io.to(chatRoom.receiverSocketId).emit("typingStatus", { userId, isTyping, isOnline: userDetails.isActive || false });
      } else {
        io.to(chatRoom.senderSocketId).emit("typingStatus", { userId, isTyping, isOnline: userDetails.isActive || false });
      }
    } catch (error) {
      console.error("🚀 ~ socket.on ~ err:", error);
      io.to(socket.id).emit("error", { message: "Failed to update typing status." });
    }
  });

  socket.on("disconnect", () => {
    console.log("<<<<<<<=======------User Disconnected------=======>>>>>>", socket.id);
  });
});


export default ExpressServer;