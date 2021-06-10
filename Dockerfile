FROM node:16-slim
#set working directory inside the image to be /usr/src/app
WORKDIR /usr/src/app

#copy and build the dependencies first
#lets us take advantage of cached Docker layers
#So it won't have to download the dependencies over and over again
COPY package*.json ./
RUN npm install

#this copies everything
COPY . .

CMD [ "node", "app.js" ]